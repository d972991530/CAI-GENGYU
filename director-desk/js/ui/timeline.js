/* 时间轴画布：标尺 / 幕 / 剧本各线（参照）/ V1 输出 / A1 波形 / 能量曲线 / 伏笔链。
 * 交互：标尺点击拖动定位；V1 拖动排序、拖边修剪；剧本段落点击跳转；Ctrl+滚轮缩放。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});
  const LABEL_W = 84, EDGE = 6;

  SC.Timeline = class {
    constructor(scrollEl, canvas, spacer, cb) {
      this.el = scrollEl; this.cv = canvas; this.spacer = spacer; this.cb = cb;
      this.ctx = canvas.getContext('2d');
      this.zoom = 0.3;
      this.d = { items: [], script: null, playhead: 0, sel: -1 };
      this.imgs = new Map();
      this.drag = null;
      this.lanes = [];
      scrollEl.addEventListener('scroll', () => this.draw());
      new ResizeObserver(() => this.draw()).observe(scrollEl);
      canvas.addEventListener('mousedown', (e) => this.down(e));
      g.addEventListener('mousemove', (e) => this.move(e));
      g.addEventListener('mouseup', (e) => this.up(e));
      canvas.addEventListener('mousemove', (e) => this.hover(e));
      scrollEl.addEventListener('wheel', (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        const x = this.localX(e);
        const t = this.xToT(x);
        this.setZoom(SC.clamp(this.zoom - e.deltaY * 0.0012, 0, 1), t, x);
        if (this.cb.onZoom) this.cb.onZoom(this.zoom);
      }, { passive: false });
    }

    get pps() { return 2 * Math.pow(400, this.zoom); } // 2 ~ 800 px/秒
    get extent() {
      const out = this.d.total || 0;
      const sc = this.d.script ? this.d.script.duration : 0;
      return Math.max(out, sc, 10);
    }
    setZoom(z, anchorT, anchorX) {
      this.zoom = z;
      this.resize();
      if (anchorT != null) this.el.scrollLeft = Math.max(0, anchorT * this.pps - (anchorX - LABEL_W));
      this.draw();
    }
    setData(d) { this.d = d; this.resize(); this.draw(); }
    resize() { this.spacer.style.width = LABEL_W + this.extent * this.pps + 240 + 'px'; }
    tToX(t) { return LABEL_W + t * this.pps - this.el.scrollLeft; }
    xToT(x) { return (x - LABEL_W + this.el.scrollLeft) / this.pps; }
    localX(e) { return e.clientX - this.cv.getBoundingClientRect().left; }
    localY(e) { return e.clientY - this.cv.getBoundingClientRect().top; }
    ensureVisible(t) {
      const x = this.tToX(t), w = this.el.clientWidth;
      if (x < LABEL_W + 20 || x > w - 40) this.el.scrollLeft = Math.max(0, t * this.pps - (w - LABEL_W) * 0.3);
    }

    img(src) {
      if (!src) return null;
      let im = this.imgs.get(src);
      if (!im) { im = new Image(); im.onload = () => this.draw(); im.src = src; this.imgs.set(src, im); }
      return im.complete && im.naturalWidth ? im : null;
    }

    buildLanes() {
      const L = [];
      let y = 0;
      const add = (key, label, h, extra) => { L.push(Object.assign({ key, label, y, h }, extra || {})); y += h; };
      add('ruler', '', 24);
      add('acts', '结构', 16);
      const sc = this.d.script;
      if (sc) for (const l of sc.lines) add('line', l.id + ' ' + l.name.replace(/（.*$/, '').slice(0, 4), 20, { line: l });
      add('v1', 'V1 画面', 50);
      add('a1', 'A1 原声', 28);
      add('energy', '能量/强度', 34);
      if (sc && this.d.mode === 'linear') for (const c of sc.chains) add('chain', c.name.slice(0, 7), 15, { chain: c });
      this.lanes = L;
      return y + 4;
    }

    draw() {
      const H = this.buildLanes();
      const dpr = g.devicePixelRatio || 1;
      const W = this.el.clientWidth;
      if (this.cv.width !== W * dpr || this.cv.height !== H * dpr) {
        this.cv.width = W * dpr; this.cv.height = H * dpr;
        this.cv.style.width = W + 'px'; this.cv.style.height = H + 'px';
      }
      const c = this.ctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#101b28'; c.fillRect(0, 0, W, H);
      c.font = '11px -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      c.textBaseline = 'middle';
      for (const ln of this.lanes) {
        if (ln.key !== 'ruler') { c.fillStyle = '#1a283a'; c.fillRect(0, ln.y + ln.h - 1, W, 1); }
      }
      c.save();
      c.beginPath(); c.rect(LABEL_W, 0, W - LABEL_W, H); c.clip();
      for (const ln of this.lanes) this['draw_' + ln.key](c, ln, W);
      // 播放头
      const px = this.tToX(this.d.playhead || 0);
      c.fillStyle = '#f0a030'; c.fillRect(px - 0.5, 0, 2, H);
      c.beginPath(); c.moveTo(px - 6, 0); c.lineTo(px + 7, 0); c.lineTo(px + 0.5, 9); c.fill();
      if (this.drag && this.drag.mode === 'move' && this.drag.moved) {
        const it = this.d.items[this.drag.insert] || null;
        const x = it ? this.tToX(it.rec) : this.tToX(this.d.total);
        const v1 = this.lanes.find((l) => l.key === 'v1');
        c.fillStyle = '#8fe3d1'; c.fillRect(x - 1.5, v1.y, 3, v1.h);
      }
      c.restore();
      c.fillStyle = '#132131'; c.fillRect(0, 0, LABEL_W, H);
      c.fillStyle = '#7d90a6';
      for (const ln of this.lanes) {
        if (!ln.label) continue;
        c.font = (ln.key === 'chain' ? '10px' : '11px') + ' -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        c.fillText(ln.label, 8, ln.y + ln.h / 2);
      }
    }

    draw_ruler(c, ln, W) {
      const pps = this.pps;
      const steps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
      const step = steps.find((s) => s * pps >= 70) || 600;
      const t0 = Math.max(0, Math.floor(this.xToT(LABEL_W) / step) * step);
      const t1 = this.xToT(W);
      c.fillStyle = '#7d90a6';
      for (let t = t0; t <= t1; t += step) {
        const x = this.tToX(t);
        c.fillRect(x, ln.y + 14, 1, 10);
        c.fillText(step < 1 ? SC.fmtTime(t, true).slice(0, -2) : SC.fmtTime(t), x + 3, ln.y + 8);
        for (let k = 1; k < 5; k++) c.fillRect(x + (k * step * pps) / 5, ln.y + 19, 1, 5);
      }
    }

    draw_acts(c, ln) {
      let acts = [];
      if (this.d.script && this.d.script.acts.length) acts = this.d.script.acts;
      else if (this.d.P && this.d.total) {
        const sp = this.d.P.actSplit, tot = SC.sum(sp) || 1, names = ['建置', '发展', '转折', '高潮'];
        let a = 0;
        acts = sp.map((w, i) => { const s = (a / tot) * this.d.total; a += w; return { name: names[i], start: s, end: (a / tot) * this.d.total }; });
      }
      const cols = ['#24384f', '#2b3f58', '#3a3550', '#4a3030'];
      acts.forEach((a, i) => {
        const x0 = this.tToX(a.start), x1 = this.tToX(a.end);
        c.fillStyle = cols[i % 4]; c.fillRect(x0, ln.y + 1, x1 - x0 - 1, ln.h - 2);
        c.fillStyle = '#c8d6e5'; c.fillText(a.name, x0 + 4, ln.y + ln.h / 2);
      });
    }

    draw_line(c, ln) {
      const sc = this.d.script, rows = this.d.segFill || {};
      for (const s of sc.segments) {
        if (s.line !== ln.line.id) continue;
        const x0 = this.tToX(s.start), x1 = this.tToX(s.end);
        const w = Math.max(2, x1 - x0 - 1);
        const fill = rows[s.id] == null ? 1 : rows[s.id];
        c.globalAlpha = 0.35 + 0.55 * fill;
        c.fillStyle = ln.line.color; c.fillRect(x0, ln.y + 3, w, ln.h - 6);
        c.globalAlpha = 1;
        if (fill < 0.5) { c.strokeStyle = '#e2574c'; c.lineWidth = 1; c.strokeRect(x0 + 0.5, ln.y + 3.5, w - 1, ln.h - 7); }
        if (this.d.selSeg === s.id) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x0, ln.y + 2, w, ln.h - 4); }
        if (w > 26) { c.fillStyle = '#fff'; c.fillText((w > 80 ? s.id + ' ' + s.title : s.id).slice(0, Math.floor(w / 7)), x0 + 3, ln.y + ln.h / 2); }
      }
    }

    lineColor(id) {
      const sc = this.d.script;
      const l = sc && sc.lines.find((x) => x.id === id);
      if (l) return l.color;
      const pal = ['#3a6fd8', '#e0622b', '#1e8c5a', '#b04fc9', '#c9a227', '#2aa3b8'];
      const k = String(id || '?').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
      return pal[k % pal.length];
    }

    draw_v1(c, ln, W) {
      const items = this.d.items;
      items.forEach((it, i) => {
        const x0 = this.tToX(it.rec), x1 = this.tToX(it.rec + it.len);
        if (x1 < LABEL_W || x0 > W) return;
        const w = Math.max(1, x1 - x0 - 1), y = ln.y + 3, h = ln.h - 6;
        if (it.type === 'gap') {
          c.fillStyle = it.why === 'missing' ? '#3a1f24' : '#1b2533';
          c.fillRect(x0, y, w, h);
          c.strokeStyle = it.why === 'missing' ? '#a8433c' : '#2b3a4d';
          c.save(); c.beginPath(); c.rect(x0, y, w, h); c.clip();
          c.lineWidth = 1;
          for (let k = -h; k < w; k += 8) { c.beginPath(); c.moveTo(x0 + k, y + h); c.lineTo(x0 + k + h, y); c.stroke(); }
          c.restore();
          if (w > 40) { c.fillStyle = '#e8a09a'; c.fillText((it.why === 'missing' ? '缺素材 ' + (it.seg || '') : '无剧本覆盖').slice(0, Math.floor(w / 7)), x0 + 4, y + h / 2); }
        } else {
          const col = this.lineColor(it.line);
          c.fillStyle = '#1f3550'; c.fillRect(x0, y, w, h);
          const m = this.d.mediaById && this.d.mediaById.get(it.mediaId);
          const thW = h * 16 / 9;
          if (m && w > 30) {
            for (let tx = 0; tx < w; tx += thW) {
              const tt = it.srcIn + (tx / Math.max(1, w)) * (it.srcOut - it.srcIn);
              const im = this.img(SC.thumbAt(m, tt));
              if (im) { c.save(); c.beginPath(); c.rect(x0, y, w, h); c.clip(); c.globalAlpha = 0.55; c.drawImage(im, x0 + tx, y, thW, h); c.restore(); }
              if (w < thW * 2) break;
            }
          }
          c.fillStyle = col; c.globalAlpha = 0.85; c.fillRect(x0, y, w, 4); c.globalAlpha = 0.25; c.fillRect(x0, y + 4, w, h - 4); c.globalAlpha = 1;
          c.strokeStyle = i === this.d.sel ? '#8fe3d1' : '#36577a'; c.lineWidth = i === this.d.sel ? 2 : 1;
          c.strokeRect(x0 + 0.5, y + 0.5, w - 1, h - 1);
          if (w > 30) {
            c.fillStyle = '#fff';
            c.fillText(((it.seg ? it.seg + ' · ' : '') + it.name).slice(0, Math.floor(w / 6.5)), x0 + 5, y + 14);
            c.fillStyle = '#c3d3e3';
            if (w > 60) c.fillText((it.len.toFixed(2) + 's' + (it.score != null ? ' · 置信 ' + Math.round(it.score * 100) : '')).slice(0, Math.floor(w / 6.5)), x0 + 5, y + h - 10);
          }
        }
      });
    }

    draw_a1(c, ln, W) {
      const mid = ln.y + ln.h / 2;
      c.fillStyle = '#173a33';
      for (const it of this.d.items) {
        if (it.type !== 'clip') continue;
        const x0 = this.tToX(it.rec), x1 = this.tToX(it.rec + it.len);
        if (x1 < LABEL_W || x0 > W) continue;
        c.fillStyle = '#173a33'; c.fillRect(x0, ln.y + 3, Math.max(1, x1 - x0 - 1), ln.h - 6);
        const m = this.d.mediaById && this.d.mediaById.get(it.mediaId);
        const a = m && m.audio;
        if (!a || !a.rms.length) continue;
        c.fillStyle = '#3fc1a5';
        const peak = m._peak || (m._peak = Math.max(0.02, ...a.rms));
        for (let x = Math.max(LABEL_W, Math.floor(x0)); x < Math.min(W, x1); x += 2) {
          const st = it.srcIn + ((x - x0) / (x1 - x0)) * it.len;
          const v = a.rms[SC.clamp(Math.round(st * a.rate), 0, a.rms.length - 1)] / peak;
          const hh = v * (ln.h / 2 - 4);
          c.fillRect(x, mid - hh, 1.5, hh * 2);
          if (a.speech[SC.clamp(Math.round(st * a.rate), 0, a.speech.length - 1)]) { c.fillStyle = '#e0a43a'; c.fillRect(x, ln.y + ln.h - 5, 2, 2); c.fillStyle = '#3fc1a5'; }
        }
      }
    }

    draw_energy(c, ln, W) {
      const y0 = ln.y + ln.h - 3, hh = ln.h - 6;
      const sb = this.d.shotsById;
      for (const it of this.d.items) {
        if (it.type !== 'clip') continue;
        const sh = sb && sb.get(it.shotId);
        if (!sh) continue;
        const x0 = this.tToX(it.rec), x1 = this.tToX(it.rec + it.len);
        c.fillStyle = '#2d4f73'; c.fillRect(x0, y0 - sh.energy * hh, Math.max(1, x1 - x0 - 1), sh.energy * hh);
      }
      c.strokeStyle = '#f0a030'; c.lineWidth = 1.5; c.setLineDash([4, 3]); c.beginPath();
      let first = true;
      const sc = this.d.script;
      for (const it of this.d.items) {
        let tv;
        if (this.d.mode === 'linear' && sc && it.seg) tv = sc.segments[sc.segIndex.get(it.seg)].estIntensity;
        else if (this.d.mode !== 'linear' && this.d.P) tv = SC.curveAt(this.d.P, this.d.total ? (it.rec + it.len / 2) / this.d.total : 0);
        else continue;
        const x0 = this.tToX(it.rec), x1 = this.tToX(it.rec + it.len), y = y0 - tv * hh;
        if (first) { c.moveTo(x0, y); first = false; } else c.lineTo(x0, y);
        c.lineTo(x1, y);
      }
      c.stroke(); c.setLineDash([]);
    }

    draw_chain(c, ln) {
      const ch = ln.chain;
      const st = (this.d.chainStatus || {})[ch.name] || {};
      const sc = this.d.script;
      const pts = ch.nodes.map((n) => {
        const at = this.d.firstRec && this.d.firstRec.has(n.seg) ? this.d.firstRec.get(n.seg) : null;
        const seg = sc.segments[sc.segIndex.get(n.seg)];
        return { n, x: this.tToX(at != null ? at : seg.start), placed: at != null, col: this.lineColor(seg.line) };
      });
      const ym = ln.y + ln.h / 2;
      c.strokeStyle = st === 'broken' ? '#a8433c' : '#45607e'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(Math.min(...pts.map((p) => p.x)), ym); c.lineTo(Math.max(...pts.map((p) => p.x)), ym); c.stroke();
      for (const p of pts) {
        c.beginPath(); c.arc(p.x, ym, 3.5, 0, Math.PI * 2);
        c.globalAlpha = p.placed ? 1 : 0.4;
        if (p.n.kind === 'payoff') { c.fillStyle = p.col; c.fill(); }
        else { c.fillStyle = '#101b28'; c.fill(); c.strokeStyle = p.col; c.lineWidth = 1.5; c.stroke(); }
        c.globalAlpha = 1;
      }
    }

    laneAt(y) { return this.lanes.find((l) => y >= l.y && y < l.y + l.h); }
    itemAt(t) { return this.d.items.findIndex((it) => t >= it.rec && t < it.rec + it.len); }

    hover(e) {
      if (this.drag) return;
      const x = this.localX(e), y = this.localY(e), ln = this.laneAt(y);
      let cur = 'default';
      if (ln && ln.key === 'v1' && x > LABEL_W) {
        const i = this.itemAt(this.xToT(x));
        if (i >= 0) {
          const it = this.d.items[i];
          const x0 = this.tToX(it.rec), x1 = this.tToX(it.rec + it.len);
          cur = x - x0 < EDGE || x1 - x < EDGE ? 'ew-resize' : 'grab';
        }
      } else if (ln && (ln.key === 'ruler' || ln.key === 'line')) cur = 'pointer';
      this.cv.style.cursor = cur;
    }

    down(e) {
      const x = this.localX(e), y = this.localY(e), ln = this.laneAt(y);
      if (!ln || x < LABEL_W) return;
      const t = this.xToT(x);
      if (ln.key === 'ruler' || ln.key === 'acts' || ln.key === 'a1' || ln.key === 'energy') {
        this.drag = { mode: 'scrub' };
        this.cb.onSeek(SC.clamp(t, 0, this.d.total || 0));
        return;
      }
      if (ln.key === 'line') {
        const s = this.d.script.segments.find((s2) => s2.line === ln.line.id && t >= s2.start && t < s2.end);
        if (s) this.cb.onSegClick(s.id);
        return;
      }
      if (ln.key === 'chain') { this.cb.onChainClick && this.cb.onChainClick(ln.chain); return; }
      if (ln.key === 'v1') {
        const i = this.itemAt(t);
        if (i < 0) { this.cb.onSeek(SC.clamp(t, 0, this.d.total || 0)); return; }
        const it = this.d.items[i];
        const x0 = this.tToX(it.rec), x1 = this.tToX(it.rec + it.len);
        this.cb.onSelect(i);
        if (x - x0 < EDGE) this.drag = { mode: 'trim', edge: 'in', i, x0: x, started: false };
        else if (x1 - x < EDGE) this.drag = { mode: 'trim', edge: 'out', i, x0: x, started: false };
        else this.drag = { mode: 'move', i, x0: x, moved: false, insert: i };
      }
    }

    move(e) {
      if (!this.drag) return;
      const x = this.localX(e);
      if (this.drag.mode === 'scrub') { this.cb.onSeek(SC.clamp(this.xToT(x), 0, this.d.total || 0)); return; }
      if (this.drag.mode === 'trim') {
        if (!this.drag.started) { if (Math.abs(x - this.drag.x0) < 3) return; this.drag.started = true; this.cb.onTrim(this.drag.i, this.drag.edge, 0, 'start'); }
        this.cb.onTrim(this.drag.i, this.drag.edge, (x - this.drag.x0) / this.pps, 'move');
        return;
      }
      if (this.drag.mode === 'move') {
        if (!this.drag.moved && Math.abs(x - this.drag.x0) < 5) return;
        this.drag.moved = true;
        const t = this.xToT(x);
        let ins = this.d.items.length;
        for (let k = 0; k < this.d.items.length; k++) { const it = this.d.items[k]; if (t < it.rec + it.len / 2) { ins = k; break; } }
        this.drag.insert = ins;
        this.cv.style.cursor = 'grabbing';
        this.draw();
      }
    }

    up() {
      const d = this.drag;
      this.drag = null;
      if (!d) return;
      if (d.mode === 'trim' && d.started) this.cb.onTrim(d.i, d.edge, 0, 'end');
      if (d.mode === 'move') {
        if (d.moved && d.insert !== d.i && d.insert !== d.i + 1) this.cb.onMove(d.i, d.insert);
        else if (!d.moved) this.cb.onSeek(this.d.items[d.i].rec);
        this.draw();
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
