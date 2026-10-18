/* 通用工具：时间码、统计、向量、聚类。浏览器与 Node 共用（挂在全局 SC 命名空间）。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});

  SC.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  SC.lerp = (a, b, t) => a + (b - a) * t;

  let uidSeq = 0;
  SC.uid = (p) => (p || 'id') + '_' + (++uidSeq).toString(36) + Math.floor(Math.random() * 1e6).toString(36);

  /** "83" | "1:23" | "01:23.5" | "1:02:03" | "00:01:02:12"(帧, 需 fps) → 秒 */
  SC.parseTime = function (s, fps) {
    if (typeof s === 'number') return s;
    s = String(s).trim().replace(/[：]/g, ':');
    if (!s) return NaN;
    const parts = s.split(':');
    if (parts.length === 4) {
      const [h, m, sec, f] = parts.map(Number);
      return h * 3600 + m * 60 + sec + f / (fps || 25);
    }
    let t = 0;
    for (const p of parts) t = t * 60 + parseFloat(p);
    return t;
  };

  /** 秒 → "MM:SS" / "H:MM:SS"，ms=true 时带毫秒 */
  SC.fmtTime = function (sec, ms) {
    if (!isFinite(sec)) return '--:--';
    const neg = sec < 0;
    sec = Math.abs(sec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const ss = ms ? s.toFixed(3).padStart(6, '0') : String(Math.floor(s)).padStart(2, '0');
    const core = (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + ss;
    return (neg ? '-' : '') + core;
  };

  /** 秒 → SMPTE "HH:MM:SS:FF"（非丢帧） */
  SC.toTC = function (sec, fps) {
    fps = fps || 25;
    const total = Math.round(sec * fps);
    const f = total % fps;
    const s = Math.floor(total / fps) % 60;
    const m = Math.floor(total / fps / 60) % 60;
    const h = Math.floor(total / fps / 3600);
    return [h, m, s, f].map((v) => String(v).padStart(2, '0')).join(':');
  };

  SC.sum = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
  SC.mean = (a) => (a.length ? SC.sum(a) / a.length : 0);
  SC.std = function (a) {
    if (a.length < 2) return 0;
    const m = SC.mean(a);
    let v = 0;
    for (let i = 0; i < a.length; i++) v += (a[i] - m) * (a[i] - m);
    return Math.sqrt(v / a.length);
  };
  SC.median = function (a) {
    if (!a.length) return 0;
    const b = Array.from(a).sort((x, y) => x - y);
    const k = b.length >> 1;
    return b.length % 2 ? b[k] : (b[k - 1] + b[k]) / 2;
  };

  /** 百分位排名归一化到 [0,1]，对异常值稳健（用于跨素材比较运动量/响度） */
  SC.rankNorm = function (a) {
    const n = a.length;
    if (n === 0) return [];
    if (n === 1) return [0.5];
    const idx = a.map((v, i) => i).sort((i, j) => a[i] - a[j]);
    const out = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j + 1 < n && a[idx[j + 1]] === a[idx[i]]) j++;
      const r = (i + j) / 2 / (n - 1);
      for (let k = i; k <= j; k++) out[idx[k]] = r;
      i = j + 1;
    }
    return out;
  };

  SC.dist = function (a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
    return Math.sqrt(s);
  };
  SC.l1 = function (a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
    return s;
  };

  /** 确定性 k-means（最远点初始化），返回 {labels, centroids} */
  SC.kmeans = function (vecs, k, iters) {
    const n = vecs.length;
    if (!n) return { labels: [], centroids: [] };
    k = Math.max(1, Math.min(k, n));
    const cents = [vecs[0].slice()];
    while (cents.length < k) {
      let best = -1, bestD = -1;
      for (let i = 0; i < n; i++) {
        let d = Infinity;
        for (const c of cents) d = Math.min(d, SC.dist(vecs[i], c));
        if (d > bestD) { bestD = d; best = i; }
      }
      cents.push(vecs[best].slice());
    }
    const labels = new Array(n).fill(0);
    for (let it = 0; it < (iters || 20); it++) {
      let changed = false;
      for (let i = 0; i < n; i++) {
        let bl = 0, bd = Infinity;
        for (let c = 0; c < k; c++) { const d = SC.dist(vecs[i], cents[c]); if (d < bd) { bd = d; bl = c; } }
        if (labels[i] !== bl) { labels[i] = bl; changed = true; }
      }
      for (let c = 0; c < k; c++) {
        const members = [];
        for (let i = 0; i < n; i++) if (labels[i] === c) members.push(vecs[i]);
        if (!members.length) continue;
        const m = new Array(members[0].length).fill(0);
        for (const v of members) for (let d = 0; d < m.length; d++) m[d] += v[d] / members.length;
        cents[c] = m;
      }
      if (!changed && it > 0) break;
    }
    return { labels, centroids: cents };
  };

  /** 自然排序：1.mp4 < 2.mp4 < 10.mp4 */
  SC.naturalCompare = function (a, b) {
    const ax = String(a).match(/(\d+|\D+)/g) || [];
    const bx = String(b).match(/(\d+|\D+)/g) || [];
    for (let i = 0; i < Math.min(ax.length, bx.length); i++) {
      const x = ax[i], y = bx[i];
      if (x === y) continue;
      const nx = /^\d+$/.test(x), ny = /^\d+$/.test(y);
      if (nx && ny) return Number(x) - Number(y);
      return x < y ? -1 : 1;
    }
    return ax.length - bx.length;
  };

  SC.baseName = (name) => String(name).replace(/\\/g, '/').split('/').pop().replace(/\.[^.]+$/, '');

  SC.deepClone = (o) => JSON.parse(JSON.stringify(o));
})(typeof window !== 'undefined' ? window : globalThis);
