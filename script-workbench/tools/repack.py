"""把 www/ 下的网页代码打进安卓外壳 APK（不签名）。

用法：python3 repack.py <外壳.apk> <www 目录> <输出.apk>

外壳 APK 里 assets/public/ 下的文件以 www/ 为准：同名替换、www 里没有的删除、新增的追加；
其余文件（原生代码、资源）原样保留，旧签名文件去掉。之后再用 zipalign + apksigner 签名。
"""
import os
import sys
import zipfile

PREFIX = "assets/public/"
FIXED_TIME = (2026, 1, 1, 0, 0, 0)  # 固定时间戳，同样的输入得到同样的包


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
