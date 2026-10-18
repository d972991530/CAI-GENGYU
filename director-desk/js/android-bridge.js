/* Android 外壳适配：在 APK 内运行时，把网页里的下载（<a download> 指向 blob:/data:）
 * 分块交给原生层保存到“下载/DirectorDesk”。普通浏览器中不生效。 */
(function () {
  'use strict';
  if (!window.AndroidBridge) return;
  document.documentElement.classList.add('in-android');
  const CHUNK = 768 * 1024; // 3 的倍数，分块 base64 拼接无填充问题

  function toB64(buf) {
    const u8 = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }

  async function save(href, name) {
    try {
      const blob = await (await fetch(href)).blob();
      const id = window.AndroidBridge.begin(name || 'download', blob.type || 'application/octet-stream');
      if (!id) return;
      for (let o = 0; o < blob.size; o += CHUNK) {
        const buf = await blob.slice(o, o + CHUNK).arrayBuffer();
        if (!window.AndroidBridge.append(id, toB64(buf))) return;
      }
      window.AndroidBridge.end(id);
    } catch (e) {
      alert('保存失败：' + e.message);
    }
  }

  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    const name = this.getAttribute('download');
    if (name != null && /^(blob:|data:)/.test(this.href)) { save(this.href, name); return; }
    return click.call(this);
  };
})();
