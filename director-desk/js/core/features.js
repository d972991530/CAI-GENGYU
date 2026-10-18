/* 镜头切分与镜头特征聚合（纯计算，不碰 DOM）。
 * 输入是 analyzer 采样得到的逐帧低层统计：
 *   samples = { t[], hist[][20](12 色相 + 8 亮度直方图), luma[], lstd[], sat[], warm[], motion[] }
 *   audio   = { rate(Hz), rms[], speech[] } | null
 * 输出 shots[{in,out,feat,prof}]，供求解器使用。全部是像素/波形统计，不做语义识别。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});
  const HUE = 12, LUM = 8;

  /** 两帧直方图距离 ∈ [0,1]：色相、亮度分布各占一半 */
  SC.histDist = function (a, b) {
    let dh = 0, dl = 0;
    for (let i = 0; i < HUE; i++) dh += Math.abs(a[i] - b[i]);
    for (let i = HUE; i < HUE + LUM; i++) dl += Math.abs(a[i] - b[i]);
    return 0.25 * dh + 0.25 * dl;
  };

  function localMedian(arr, i, r) {
    const w = [];
    for (let k = Math.max(1, i - r); k <= Math.min(arr.length - 1, i + r); k++) if (k !== i) w.push(arr[k]);
    return SC.median(w);
  }

  /** 镜头边界检测：硬切（相邻帧突变 + 自适应局部中值）与渐变（窗口累积变化）。
   *  threshold 即界面上的“分镜阈值”，越小切得越碎。 */
  SC.detectCuts = function (samples, threshold, opts) {
    opts = opts || {};
    const t = samples.t, H = samples.hist, n = t.length;
    if (n < 2) return [];
    const dist = opts.dist || SC.histDist;
    const diff = new Array(n).fill(0);
    for (let i = 1; i < n; i++) diff[i] = dist(H[i - 1], H[i]);
    const k = opts.adaptiveK || 2.2;
    const cuts = [];
    for (let i = 1; i < n; i++) {
      const lm = localMedian(diff, i, 6);
      if (diff[i] >= threshold && diff[i] >= k * lm + 0.02) cuts.push({ time: (t[i - 1] + t[i]) / 2, strength: diff[i], kind: 'cut' });
    }
    // 渐变（叠化/淡入淡出）：4 帧跨度上的直接距离超过阈值，且中间没有硬切
    const W = 4;
    for (let i = W; opts.dissolve !== false && i < n; i++) {
      const span = dist(H[i - W], H[i]);
      let maxStep = 0;
      for (let j = i - W + 1; j <= i; j++) maxStep = Math.max(maxStep, diff[j]);
      if (span >= threshold * 1.3 && maxStep < threshold && maxStep < span * 0.6) {
        const time = (t[i - W] + t[i]) / 2;
        if (!cuts.some((c) => Math.abs(c.time - time) < (t[i] - t[i - W]))) cuts.push({ time, strength: span * 0.8, kind: 'dissolve' });
      }
    }
    cuts.sort((a, b) => a.time - b.time);
    return cuts;
  };

  /** 依据切点生成镜头区间，并把短于 minShot 的碎片并入相邻镜头（并向较弱的边界） */
  SC.cutsToShots = function (cuts, duration, minShot) {
    let bounds = [{ time: 0, strength: Infinity }].concat(cuts, [{ time: duration, strength: Infinity }]);
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i + 1 < bounds.length; i++) {
        if (bounds[i + 1].time - bounds[i].time < minShot && bounds.length > 2) {
          // 删掉这段两侧较弱的那个边界（首尾不可删）
          const left = bounds[i], right = bounds[i + 1];
          const drop = left.strength <= right.strength ? i : i + 1;
          if (!isFinite(bounds[drop].strength)) {
            const other = drop === i ? i + 1 : i;
            if (!isFinite(bounds[other].strength)) continue;
            bounds.splice(other, 1);
          } else bounds.splice(drop, 1);
          changed = true;
          break;
        }
      }
    }
    const shots = [];
    for (let i = 0; i + 1 < bounds.length; i++) shots.push({ in: bounds[i].time, out: bounds[i + 1].time, cutIn: bounds[i].kind || 'start' });
    return shots;
  };

  function interp(ts, vs, x) {
    if (!ts.length) return 0;
    if (x <= ts[0]) return vs[0];
    if (x >= ts[ts.length - 1]) return vs[vs.length - 1];
    let lo = 0, hi = ts.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ts[mid] <= x) lo = mid; else hi = mid; }
    const f = (x - ts[lo]) / (ts[hi] - ts[lo] || 1);
    return vs[lo] + (vs[hi] - vs[lo]) * f;
  }
  SC.interp = interp;

  function audioAt(audio, x) {
    if (!audio || !audio.rms.length) return 0;
    const i = SC.clamp(Math.round(x * audio.rate), 0, audio.rms.length - 1);
    return audio.rms[i];
  }
  function audioMean(audio, key, a, b) {
    if (!audio || !audio[key].length) return 0;
    const i0 = SC.clamp(Math.floor(a * audio.rate), 0, audio[key].length - 1);
    const i1 = SC.clamp(Math.ceil(b * audio.rate), i0 + 1, audio[key].length);
    let s = 0;
    for (let i = i0; i < i1; i++) s += audio[key][i];
    return s / (i1 - i0);
  }

  /** 聚合单个镜头的特征 + 10Hz 能量/响度轮廓（用于智能裁剪取窗） */
  SC.shotFeatures = function (samples, audio, a, b) {
    const idx = [];
    for (let i = 0; i < samples.t.length; i++) if (samples.t[i] >= a - 1e-6 && samples.t[i] <= b + 1e-6) idx.push(i);
    if (!idx.length) {
      let best = 0, bd = Infinity;
      for (let i = 0; i < samples.t.length; i++) { const d = Math.abs(samples.t[i] - (a + b) / 2); if (d < bd) { bd = d; best = i; } }
      idx.push(best);
    }
    const hist = new Array(HUE + LUM).fill(0);
    let luma = 0, lstd = 0, sat = 0, warm = 0, motion = 0, dark = 0, mc = 0;
    for (const i of idx) {
      for (let k = 0; k < hist.length; k++) hist[k] += samples.hist[i][k] / idx.length;
      luma += samples.luma[i] / idx.length;
      lstd += samples.lstd[i] / idx.length;
      sat += samples.sat[i] / idx.length;
      warm += samples.warm[i] / idx.length;
      if (samples.luma[i] < 0.07) dark += 1 / idx.length;
      // 镜头首帧的 motion 是跨切点的差值，不计入
      if (i !== idx[0] || idx.length === 1) { motion += samples.motion[i]; mc++; }
    }
    motion = mc ? motion / mc : 0;
    const rms = audioMean(audio, 'rms', a, b);
    const speech = audio ? audioMean(audio, 'speech', a, b) : 0;
    const prof = { dt: 0.1, m: [], a: [] };
    for (let x = a; x < b - 1e-6; x += 0.1) {
      prof.m.push(+interp(samples.t, samples.motion, x).toFixed(4));
      prof.a.push(+audioAt(audio, x).toFixed(4));
    }
    return {
      feat: {
        hue: hist.slice(0, HUE).map((v) => +v.toFixed(4)),
        lumHist: hist.slice(HUE).map((v) => +v.toFixed(4)),
        luma: +luma.toFixed(4), lstd: +lstd.toFixed(4), sat: +sat.toFixed(4), warm: +warm.toFixed(4),
        motion: +motion.toFixed(4), rms: +rms.toFixed(4), speech: +speech.toFixed(3), dark: +dark.toFixed(3),
        hasAudio: !!audio,
      },
      prof,
    };
  };

  /** 对一个已采样素材做完整切分 + 特征聚合 */
  SC.buildShots = function (media, threshold, minShot) {
    const s = media.samples;
    if (!s || !s.t.length) return [{ in: 0, out: media.duration, feat: null, prof: null }];
    const cuts = SC.detectCuts(s, threshold);
    const shots = SC.cutsToShots(cuts, media.duration, minShot);
    return shots.map((sh) => Object.assign(sh, SC.shotFeatures(s, media.audio, sh.in, sh.out)));
  };

  /** 视觉签名向量：色调分布 + 影调（亮度/反差/饱和/冷暖）。用于线索归属推断与镜头衔接距离 */
  SC.visVector = function (f) {
    if (!f) return null;
    return f.hue.map((v) => v * 1.6).concat([f.luma * 2, f.lstd * 3, f.sat * 2, (f.warm + 0.5) * 1.5]);
  };
})(typeof window !== 'undefined' ? window : globalThis);
