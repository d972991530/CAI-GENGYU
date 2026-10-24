"""把 www/ 下的网页代码打进安卓外壳 APK（不签名）。

用法：python3 repack.py <外壳.apk> <www 目录> <输出.apk>

外壳 APK 里 assets/public/ 下的文件以 www/ 为准：同名替换、www 里没有的删除、新增的追加；
其余文件（原生代码、资源）原样保留，旧签名文件去掉。之后再用 zipalign + apksigner 签名。

同时把清单里的 debuggable、allowBackup 改为 false：用户的 API Key 存在 App 数据里，
不能让别人连上电脑用 adb 或备份把它导出来。
"""
import os
import struct
import sys
import zipfile

PREFIX = "assets/public/"
FIXED_TIME = (2026, 1, 1, 0, 0, 0)  # 固定时间戳，同样的输入得到同样的包

# android:debuggable、android:allowBackup 的资源 id
FORCE_FALSE = {0x0101000F: "debuggable", 0x01010280: "allowBackup"}
TYPE_INT_BOOLEAN = 0x12


def harden_manifest(axml):
    """在二进制 AndroidManifest.xml 里把 FORCE_FALSE 中的布尔属性原地改为 false。"""
    buf = bytearray(axml)
    res_ids = []
    changed = set()
    pos = struct.unpack_from("<H", buf, 2)[0]  # 跳过文件头
    while pos < len(buf):
        ctype, hsize, csize = struct.unpack_from("<HHI", buf, pos)
        if ctype == 0x0180:  # 资源 id 表：第 i 个字符串对应的属性 id
            res_ids = list(struct.unpack_from("<%dI" % ((csize - hsize) // 4), buf, pos + hsize))
        elif ctype == 0x0102:  # 元素开始
            ext = pos + hsize
            attr_start, attr_size, attr_count = struct.unpack_from("<HHH", buf, ext + 8)
            for i in range(attr_count):
                a = ext + attr_start + i * attr_size
                name = struct.unpack_from("<I", buf, a + 4)[0]
                if name < len(res_ids) and res_ids[name] in FORCE_FALSE and buf[a + 15] == TYPE_INT_BOOLEAN:
                    struct.pack_into("<I", buf, a + 16, 0)
                    changed.add(FORCE_FALSE[res_ids[name]])
        pos += csize
    return bytes(buf), changed


def main(src, www, dst):
    web = {}
    for root, _, files in os.walk(www):
        for f in files:
            path = os.path.join(root, f)
            web[PREFIX + os.path.relpath(path, www).replace(os.sep, "/")] = path

    with zipfile.ZipFile(src) as zi, zipfile.ZipFile(dst, "w") as zo:
        for info in zi.infolist():
            name = info.filename
            if name.startswith("META-INF/") and name.rsplit(".", 1)[-1] in ("SF", "RSA", "DSA", "EC", "MF"):
                continue
            if name.startswith(PREFIX) and name not in web:
                continue
            out = zipfile.ZipInfo(name, info.date_time)
            out.compress_type = info.compress_type
            out.external_attr = info.external_attr
            data = open(web.pop(name), "rb").read() if name in web else zi.read(info)
            if name == "AndroidManifest.xml":
                data, changed = harden_manifest(data)
                print("manifest: set false ->", ", ".join(sorted(changed)) or "nothing to change")
            zo.writestr(out, data)
        for name in sorted(web):
            out = zipfile.ZipInfo(name, FIXED_TIME)
            out.compress_type = zipfile.ZIP_DEFLATED
            out.external_attr = 0o644 << 16
            zo.writestr(out, open(web[name], "rb").read())


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
