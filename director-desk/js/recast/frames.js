/* 换角预览台 · 浏览器端取帧：按时间段抓工作分辨率帧、整片逐帧精确分镜、估计帧率、读图片像素。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});
  const RC = (SC.recast = SC.recast || {});

  function waitEv(el, ev, ms) {
    return new Promise((res, rej) => {
      let to;
      const ok = () => { clearTimeout(to); el.removeEventListener('error', bad); res(true); };
      const bad = () => { clearTimeout(to); el.removeEventListener(ev, ok); rej(new Error('视频解码失败')); };
      el.addEventListener(ev, ok, { once: true });
      el.addEventListener('error', bad, { once: true });
      to = setTimeout(() => { el.removeEventListener(ev, ok); el.removeEventListener('error', bad); res(false); }, ms || 5000);
    });
  }

  /** 专用于抽帧的隐藏 video（与播放用的分开，互不干扰） */
  RC.FrameSource = class {
    constructor(url) {
      this.v = document.createElement('video');
      this.v.muted = true; this.v.preload = 'auto'; this.v.playsInline = true; this.v.src = url;
      this.c = document.createElement('canvas');
      this.ctx = this.c.getContext('2d', { willReadFrequently: true });
      this.ready = waitEv(this.v, 'loadedmetadata', 20000).then(() => this);
    }
    get duration() { return this.v.duration; }
    async seek(t) {
      t = SC.clamp(t, 0, Math.max(0, this.v.duration - 0.001));
      if (Math.abs(this.v.currentTime - t) < 1e-4 && this.v.readyState >= 2) return;
      this.v.currentTime = t;
      await waitEv(this.v, 'seeked', 5000);
    }
    /** 当前帧 → { w, h, data } */
    grab(W, H) {
      if (this.c.width !== W || this.c.height !== H) { this.c.width = W; this.c.height = H; }
      this.ctx.drawImage(this.v, 0, 0, W, H);
      const d = this.ctx.getImageData(0, 0, W, H);
      return { w: W, h: H, data: d.data };
    }
    async frameAt(t, W, H) { await this.seek(t); return this.grab(W, H); }
    thumb(W, H, q) {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      c.getContext('2d').drawImage(this.v, 0, 0, W, H);
      return c.toDataURL('image/jpeg', q || 0.72);
    }
    /** 抓取 [t0, t1) 内按 fps 采样的帧 */
    async grabRange(t0, t1, fps, W, H, onProg, signal) {
      const frames = [], times = [];
      const step = 1 / fps;
      const n = Math.max(1, Math.round((t1 - t0) / step));
      for (let k = 0; k < n; k++) {
        if (signal && signal.cancelled) throw new Error('已取消');
        // 采样点取在帧间隔中部之前一点，避免恰好落在切点上取到下一镜
        const t = Math.min(t0 + k * step + 0.002, t1 - 0.004);
        frames.push(await this.frameAt(t, W, H));
        times.push(+(t - t0).toFixed(4));
        if (onProg && k % 3 === 0) onProg(k / n);
      }
      return { frames, times };
    }
    dispose() { this.v.removeAttribute('src'); this.v.load(); }
  };

  /** 用 requestVideoFrameCallback 测帧率（取相邻帧 mediaTime 差的中值）；不支持时返回 null */
  RC.estimateFps = async function (url) {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.src = url;
    await waitEv(v, 'loadedmetadata', 10000);
    if (!v.requestVideoFrameCallback) return null;
    const ts = [];
    await new Promise((res) => {
      const cb = (now, meta) => {
        ts.push(meta.mediaTime);
        if (ts.length < 24) v.requestVideoFrameCallback(cb); else res();
      };
      v.requestVideoFrameCallback(cb);
      v.currentTime = Math.min(1, v.duration / 3);
      v.play().catch(res);
      setTimeout(res, 3000);
    });
    v.pause(); v.removeAttribute('src'); v.load();
    const d = [];
    for (let i = 1; i < ts.length; i++) if (ts[i] > ts[i - 1]) d.push(ts[i] - ts[i - 1]);
    if (d.length < 5) return null;
    const fps = 1 / SC.median(d);
    const common = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60];
    return common.reduce((a, b) => (Math.abs(b - fps) < Math.abs(a - fps) ? b : a));
  };

  /** 帧直方图（与主程序同一套 12 色相 + 8 亮度），用于分镜 */
  function histOf(img) {
    const hue = new Float64Array(12), lum = new Float64Array(8), d = img.data, n = img.w * img.h;
    for (let p = 0, i = 0; p < n; p++, i += 4) {
      const r = d[i], gg = d[i + 1], b = d[i + 2];
      const max = Math.max(r, gg, b), min = Math.min(r, gg, b);
      const l = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255;
      lum[Math.min(7, (l * 8) | 0)]++;
      if (max - min > 8) {
        const dd = max - min;
        let h;
        if (max === r) h = ((gg - b) / dd + 6) % 6; else if (max === gg) h = (b - r) / dd + 2; else h = (r - gg) / dd + 4;
        hue[Math.min(11, (h * 2) | 0)] += (dd / max) * (max / 255);
      }
    }
    const out = new Array(20);
    for (let k = 0; k < 12; k++) out[k] = hue[k] / n;
    for (let k = 0; k < 8; k++) out[12 + k] = lum[k] / n;
    return out;
  }
  RC.histOf = histOf;

  /** 整片分镜：6fps 粗扫找候选切点 → 每个候选二分到单帧精度。返回 [{start,end}] */
  RC.detectShots = async function (src, opts) {
    opts = opts || {};
    const fps = opts.fps || 30, scan = opts.scanFps || 6, th = opts.threshold || 0.3, minShot = opts.minShot || 0.25;
    const W = 64, H = 36, dur = src.duration;
    const samples = { t: [], hist: [] };
    const n = Math.floor(dur * scan);
    for (let k = 0; k <= n; k++) {
      if (opts.signal && opts.signal.cancelled) throw new Error('已取消');
      const t = Math.min(k / scan, dur - 0.01);
      samples.t.push(t);
      samples.hist.push(histOf(await src.frameAt(t, W, H)));
      if (opts.onProgress && k % 6 === 0) opts.onProgress(0.75 * k / n);
    }
    const cuts = SC.detectCuts(samples, th, { adaptiveK: 2.0 });
    const refined = [];
    for (let i = 0; i < cuts.length; i++) {
      if (opts.signal && opts.signal.cancelled) throw new Error('已取消');
      const c = cuts[i];
      let a = Math.max(0, c.time - 0.5 / scan), b = Math.min(dur, c.time + 0.5 / scan);
      let ha = histOf(await src.frameAt(a, W, H)), hb = histOf(await src.frameAt(b, W, H));
      if (c.kind === 'cut') {
        while (b - a > 1 / fps + 1e-4) {
          const m = (a + b) / 2;
          const hm = histOf(await src.frameAt(m, W, H));
          if (SC.histDist(ha, hm) > SC.histDist(hm, hb)) { b = m; hb = hm; } else { a = m; ha = hm; }
        }
        // 切点对齐到帧边界
        refined.push(Math.round(b * fps) / fps);
      } else refined.push(Math.round(c.time * fps) / fps);
      if (opts.onProgress) opts.onProgress(0.75 + 0.25 * (i + 1) / cuts.length);
    }
    const bounds = [0].concat(refined.filter((t, i, arr) => t > minShot && (i === 0 || t - arr[i - 1] >= minShot) && dur - t > minShot), [dur]);
    const shots = [];
    for (let i = 0; i + 1 < bounds.length; i++) shots.push({ start: +bounds[i].toFixed(3), end: +bounds[i + 1].toFixed(3) });
    return shots;
  };

  /** dataURL / Blob URL → { w, h, data }，最长边限制 maxSide */
  RC.loadImageData = function (url, maxSide) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, (maxSide || 512) / Math.max(im.naturalWidth, im.naturalHeight));
        const w = Math.max(1, Math.round(im.naturalWidth * s)), h = Math.max(1, Math.round(im.naturalHeight * s));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(im, 0, 0, w, h);
        res({ w, h, data: ctx.getImageData(0, 0, w, h).data, img: im });
      };
      im.onerror = () => rej(new Error('图片读取失败'));
      im.src = url;
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
