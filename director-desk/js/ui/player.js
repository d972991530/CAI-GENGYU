/* 序列播放器：两个 <video> 交替（当前段 / 预载下一段），播放中以视频自身时钟为准，空缺段用系统时钟走黑场。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});

  SC.Player = class {
    constructor(vA, vB, overlay, host) {
      this.v = [vA, vB];
      this.ov = overlay;
      this.host = host; // { items(), media(id), script(), burnIn(), onTime(t) }
      this.active = 0;
      this.t = 0;
      this.playing = false;
      this.last = 0;
      this.v.forEach((v) => { v.preload = 'auto'; v.muted = false; });
      const loop = (now) => { this.tick(now); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      new ResizeObserver(() => this.paintOverlay(this.itemAt(this.t))).observe(overlay);
    }

    get total() { const it = this.host.items(); const l = it[it.length - 1]; return l ? l.rec + l.len : 0; }
    itemAt(t) {
      const items = this.host.items();
      for (let i = 0; i < items.length; i++) if (t >= items[i].rec && t < items[i].rec + items[i].len) return items[i];
      return null;
    }
    setVolume(x) { this.v.forEach((v) => (v.volume = x)); }

    play() {
      if (!this.host.items().length) return;
      if (this.t >= this.total - 0.02) this.t = 0;
      this.playing = true;
      this.last = performance.now();
    }
    pause() { this.playing = false; this.v.forEach((v) => v.pause()); }
    toggle() { this.playing ? this.pause() : this.play(); }
    seek(t) { this.t = SC.clamp(t, 0, this.total); this.sync(true); this.host.onTime(this.t); }

    elFor(it) {
      const m = this.host.media(it.mediaId);
      if (!m || !m.url) return null;
      if (this.v[this.active].dataset.media === it.mediaId) return this.v[this.active];
      if (this.v[1 - this.active].dataset.media === it.mediaId) { this.active = 1 - this.active; return this.v[this.active]; }
      const el = this.v[this.active];
      el.dataset.media = it.mediaId;
      el.src = m.url;
      return el;
    }

    tick(now) {
      if (this.playing) {
        const it = this.itemAt(this.t);
        const el = it && it.type === 'clip' ? this.v[this.active] : null;
        if (el && el.dataset.media === it.mediaId && !el.paused && !el.seeking && el.readyState >= 2) {
          const vt = it.rec + (el.currentTime - it.srcIn);
          this.t = vt >= this.t - 0.05 ? Math.max(this.t, vt) : this.t + (now - this.last) / 1000;
        } else this.t += (now - this.last) / 1000;
        if (this.t >= this.total) { this.t = this.total; this.pause(); }
        this.sync(false);
        this.host.onTime(this.t);
      }
      this.last = now;
    }

    sync(force) {
      const it = this.itemAt(Math.min(this.t, Math.max(0, this.total - 1e-3)));
      if (!it || it.type === 'gap') {
        this.v.forEach((v) => { v.classList.remove('on'); v.pause(); });
      } else {
        const el = this.elFor(it);
        if (el) {
          const want = it.srcIn + (this.t - it.rec);
          if (force || Math.abs(el.currentTime - want) > 0.25) { try { el.currentTime = want; } catch (e) { /* 元数据未就绪 */ } }
          if (this.playing && el.paused) el.play().catch(() => {});
          if (!this.playing && !el.paused) el.pause();
          el.classList.add('on');
          const other = this.v[1 - this.active];
          other.classList.remove('on');
          other.pause();
          this.preloadNext(it, other);
        }
      }
      if (it !== this._painted || force) { this._painted = it; this.paintOverlay(it); }
    }

    preloadNext(cur, el) {
      const items = this.host.items();
      const k = items.indexOf(cur);
      const nx = items.slice(k + 1).find((x) => x.type === 'clip');
      if (!nx || nx.mediaId === cur.mediaId) return;
      const m = this.host.media(nx.mediaId);
      if (!m || !m.url) return;
      if (el.dataset.media !== nx.mediaId) { el.dataset.media = nx.mediaId; el.src = m.url; }
      if (Math.abs(el.currentTime - nx.srcIn) > 0.3 && el.readyState >= 1) { try { el.currentTime = nx.srcIn; } catch (e) { /* ignore */ } }
    }

    paintOverlay(it) {
      const c = this.ov, r = c.getBoundingClientRect(), dpr = g.devicePixelRatio || 1;
      c.width = r.width * dpr; c.height = r.height * dpr;
      const x = c.getContext('2d');
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, r.width, r.height);
      x.font = '13px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
      x.textBaseline = 'top';
      const sc = this.host.script();
      const seg = it && it.seg && sc ? sc.segments[sc.segIndex.get(it.seg)] : null;
      if (!it || it.type === 'gap') {
        x.fillStyle = '#7d90a6';
        x.textAlign = 'center';
        const msg = !it ? '无内容' : it.why === 'missing' ? '缺素材 · ' + (seg ? seg.id + ' ' + seg.title : '') : '剧本此处无段落';
        x.fillText(msg, r.width / 2, r.height / 2 - 8);
        if (seg && seg.desc) { x.font = '12px sans-serif'; wrap(x, seg.desc, r.width / 2, r.height / 2 + 14, r.width * 0.7, 16); }
        x.textAlign = 'left';
        return;
      }
      if (!this.host.burnIn()) return;
      const label = (seg ? seg.id + ' ' + seg.title : it.line ? '组 ' + it.line : '') + '  ·  ' + it.name + ' ' + SC.fmtTime(it.srcIn, true) + '–' + SC.fmtTime(it.srcOut, true);
      const w = x.measureText(label).width + 16;
      x.fillStyle = '#000a'; x.fillRect(10, 10, w, 24);
      x.fillStyle = '#fff'; x.fillText(label, 18, 15);
    }
  };

  function wrap(x, text, cx, y, maxW, lh) {
    let line = '';
    for (const ch of text) {
      if (x.measureText(line + ch).width > maxW) { x.fillText(line, cx, y); y += lh; line = ch; }
      else line += ch;
    }
    if (line) x.fillText(line, cx, y);
  }
})(typeof window !== 'undefined' ? window : globalThis);
