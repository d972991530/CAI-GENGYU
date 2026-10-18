/* 换角预览台 · 纯算法核心（不碰 DOM，浏览器与 Node 共用）
 *
 * 图像约定：img = { w, h, data: Uint8ClampedArray(RGBA) }，框 box = { x, y, w, h }（像素）
 *
 *  - 颜色模型：200 档 HSV 直方图（彩色 16 色相 × 3 饱和 × 4 明度 + 8 档灰阶），
 *    前景 = 框内（中心加权），背景 = 框外环带 + 负点 + 另一角色所在区域，
 *    每档颜色的前景后验 P = q / (q + o)。
 *  - 追踪：CAMShift —— 后验反投影上做均值漂移定位，二阶矩估计尺寸，恒速预测，低置信时保持惯性。
 *  - 遮罩：反投影 → 平滑 → 阈值 → 形态学 → 连通域（保留与框中心相连的部分）。
 *  - 全局运动：降采样灰度块匹配，得到每帧镜头平移（判断固定机位、背景板随镜头移动）。
 *  - 干净背景板：固定机位镜头里，对未被人物遮挡的像素取时间中值，用来擦除原演员。
 *  - 换装调色：YCbCr 空间亮度直方图匹配 + 色度均值方差迁移，生成 LUT。
 *  - 参考图抠像：从边缘向内的颜色泛洪去背景（已有透明通道则直接使用）。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});
  const RC = (SC.recast = SC.recast || {});
  const NB = (RC.NBINS = 200);

  /* ------------------------------------------------------------ 颜色量化 */
  function binOf(r, gg, b) {
    const max = r > gg ? (r > b ? r : b) : gg > b ? gg : b;
    const min = r < gg ? (r < b ? r : b) : gg < b ? gg : b;
    const v = max / 255;
    const d = max - min;
    const s = max ? d / max : 0;
    if (s < 0.1 || v < 0.12) return 192 + Math.min(7, (v * 8) | 0);
    let h;
    if (max === r) h = ((gg - b) / d + 6) % 6;
    else if (max === gg) h = (b - r) / d + 2;
    else h = (r - gg) / d + 4;
    const hb = Math.min(15, ((h / 6) * 16) | 0);
    const sb = s < 0.22 ? 0 : s < 0.45 ? 1 : 2; // 低饱和档单独分出：白衣 vs 淡青墙面
    const vb = Math.min(3, (v * 4) | 0);
    return hb * 12 + sb * 4 + vb;
  }
  RC.binOf = binOf;

  RC.binImage = function (img) {
    const n = img.w * img.h, out = new Uint8Array(n), d = img.data;
    for (let i = 0, p = 0; i < n; i++, p += 4) out[i] = binOf(d[p], d[p + 1], d[p + 2]);
    return out;
  };

  const clampBox = (b, w, h) => {
    const x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y));
    const x1 = Math.min(w, Math.ceil(b.x + b.w)), y1 = Math.min(h, Math.ceil(b.y + b.h));
    return { x0, y0, x1, y1 };
  };
  RC.clampBox = clampBox;
  const inBox = (b, x, y) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;

  /* ------------------------------------------------------------ 颜色模型 */
  /** 前景直方图（Epanechnikov 中心加权），背景直方图（环带 + 负点 + 排除区域） */
  RC.colorModel = function (bins, w, h, box, opts) {
    opts = opts || {};
    const fg = new Float64Array(NB), bg = new Float64Array(NB);
    const r = clampBox(box, w, h);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    for (let y = r.y0; y < r.y1; y++) {
      for (let x = r.x0; x < r.x1; x++) {
        const dx = (x - cx) / (box.w / 2), dy = (y - cy) / (box.h / 2);
        const k = 1 - (dx * dx + dy * dy);
        if (k > 0) fg[bins[y * w + x]] += k;
      }
    }
    const m = opts.ring == null ? 0.6 : opts.ring;
    const mg = Math.max(4, Math.max(box.w, box.h) * m);
    const R = clampBox({ x: box.x - mg, y: box.y - mg, w: box.w + 2 * mg, h: box.h + 2 * mg }, w, h);
    for (let y = R.y0; y < R.y1; y += 1) {
      for (let x = R.x0; x < R.x1; x += 1) {
        if (inBox(box, x, y)) continue;
        bg[bins[y * w + x]] += 1;
      }
    }
    for (const ex of opts.exclude || []) {
      const E = clampBox(ex, w, h);
      for (let y = E.y0; y < E.y1; y++) for (let x = E.x0; x < E.x1; x++) bg[bins[y * w + x]] += 0.5;
    }
    for (const p of opts.neg || []) {
      const px = Math.round(p[0]), py = Math.round(p[1]);
      for (let y = py - 3; y <= py + 3; y++) for (let x = px - 3; x <= px + 3; x++) {
        if (x >= 0 && y >= 0 && x < w && y < h) bg[bins[y * w + x]] += 40;
      }
    }
    for (const p of opts.pos || []) {
      const px = Math.round(p[0]), py = Math.round(p[1]);
      for (let y = py - 2; y <= py + 2; y++) for (let x = px - 2; x <= px + 2; x++) {
        if (x >= 0 && y >= 0 && x < w && y < h) fg[bins[y * w + x]] += 6;
      }
    }
    const sf = fg.reduce((a, b) => a + b, 0) || 1, sb = bg.reduce((a, b) => a + b, 0) || 1;
    const P = new Float32Array(NB);
    for (let i = 0; i < NB; i++) {
      const q = fg[i] / sf, o = bg[i] / sb;
      P[i] = (q + 1e-4) / (q + o + 2e-4);
    }
    return { P, fg, bg, sf, sb };
  };

  /** 低速更新颜色模型（只在高置信时），抑制漂移 */
  RC.blendModel = function (a, b, rate) {
    const P = new Float32Array(NB);
    for (let i = 0; i < NB; i++) P[i] = a.P[i] * (1 - rate) + b.P[i] * rate;
    return Object.assign({}, a, { P });
  };

  /** 均值漂移权重：后验高于 0.5 的部分，线性拉伸到 [0,1] */
  const weightOf = (P, b) => { const v = P[b] - 0.5; return v > 0 ? v * 2 : 0; };

  /* ------------------------------------------------------------ CAMShift */
  RC.camshift = function (bins, w, h, P, box, opts) {
    opts = opts || {};
    const vel = opts.vel || { x: 0, y: 0 };
    let cx = box.x + box.w / 2 + vel.x, cy = box.y + box.h / 2 + vel.y;
    let bw = box.w, bh = box.h;
    const sup = opts.suppress || null; // 另一角色的框：权重减半
    const wt = (x, y) => {
      const v = weightOf(P, bins[y * w + x]);
      return sup && inBox(sup, x, y) ? v * 0.5 : v;
    };
    for (let it = 0; it < 12; it++) {
      const r = clampBox({ x: cx - bw * 0.6, y: cy - bh * 0.6, w: bw * 1.2, h: bh * 1.2 }, w, h);
      let m00 = 0, m10 = 0, m01 = 0;
      for (let y = r.y0; y < r.y1; y++) for (let x = r.x0; x < r.x1; x++) {
        const v = wt(x, y);
        if (v) { m00 += v; m10 += v * x; m01 += v * y; }
      }
      if (m00 < 1e-6) break;
      const nx = m10 / m00, ny = m01 / m00;
      const moved = Math.hypot(nx - cx, ny - cy);
      cx = nx; cy = ny;
      if (moved < 0.5) break;
    }
    // 尺寸：放大窗口里的二阶矩。均匀分布宽 W 的方差 = W²/12
    const r = clampBox({ x: cx - bw * 0.85, y: cy - bh * 0.85, w: bw * 1.7, h: bh * 1.7 }, w, h);
    let m00 = 0, sx = 0, sy = 0, sxx = 0, syy = 0, inner = 0;
    for (let y = r.y0; y < r.y1; y++) for (let x = r.x0; x < r.x1; x++) {
      const v = wt(x, y);
      if (!v) continue;
      m00 += v; sx += v * x; sy += v * y; sxx += v * x * x; syy += v * y * y;
      if (Math.abs(x - cx) < bw / 2 && Math.abs(y - cy) < bh / 2) inner += v;
    }
    const conf = inner / Math.max(1, bw * bh);
    if (m00 > 1e-6 && opts.adaptSize !== false) {
      const mx = sx / m00, my = sy / m00;
      const W = Math.sqrt(Math.max(1, 12 * (sxx / m00 - mx * mx)));
      const H = Math.sqrt(Math.max(1, 12 * (syy / m00 - my * my)));
      const lim = opts.sizeStep || 0.12, a = opts.sizeSmooth || 0.3;
      bw = bw + a * (SC.clamp(W, bw * (1 - lim), bw * (1 + lim)) - bw);
      bh = bh + a * (SC.clamp(H, bh * (1 - lim), bh * (1 + lim)) - bh);
      const minS = opts.minSize || 6;
      bw = SC.clamp(bw, minS, w * 1.2); bh = SC.clamp(bh, minS, h * 1.2);
    }
    return { box: { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh }, conf };
  };

  /** 框内中心加权颜色直方图（归一化） */
  RC.boxHist = function (bins, w, h, box) {
    const hst = new Float64Array(NB);
    const r = clampBox(box, w, h);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    let s = 0;
    for (let y = r.y0; y < r.y1; y += 1) for (let x = r.x0; x < r.x1; x += 1) {
      const dx = (x - cx) / (box.w / 2), dy = (y - cy) / (box.h / 2);
      const k = 1 - (dx * dx + dy * dy);
      if (k > 0) { hst[bins[y * w + x]] += k; s += k; }
    }
    if (s) for (let i = 0; i < NB; i++) hst[i] /= s;
    return hst;
  };
  /** Bhattacharyya 系数：两个颜色分布的相似度 0..1 */
  RC.bhatta = function (p, q) { let s = 0; for (let i = 0; i < NB; i++) s += Math.sqrt(p[i] * q[i]); return s; };

  /** 全画面重新检测：积分图上滑动当前尺寸的框取若干候选（非极大抑制），
   *  再用颜色分布相似度（而非单纯“目标色多”）+ 与预测位置的距离挑选。 */
  RC.redetect = function (bins, w, h, P, size, suppress, refHist, predict) {
    const step = 2, bw = Math.max(4, Math.round(Math.min(size.w, w))), bh = Math.max(4, Math.round(Math.min(size.h, h)));
    const I = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        let v = weightOf(P, bins[y * w + x]);
        if (suppress && inBox(suppress, x, y)) v *= 0.3;
        row += v;
        I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row;
      }
    }
    const S = (x0, y0, x1, y1) => I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
    const cand = [];
    for (let y = 0; y + bh <= h; y += step) for (let x = 0; x + bw <= w; x += step) cand.push({ x, y, v: S(x, y, x + bw, y + bh) / (bw * bh) });
    cand.sort((a, b) => b.v - a.v);
    const picks = [];
    for (const c of cand) {
      if (picks.length >= 8 || c.v < 0.05) break;
      if (picks.some((p) => Math.abs(p.x - c.x) < bw * 0.6 && Math.abs(p.y - c.y) < bh * 0.6)) continue;
      picks.push(c);
    }
    if (!picks.length) return null;
    const diag = Math.hypot(w, h);
    let best = null;
    for (const c of picks) {
      const box = { x: c.x, y: c.y, w: size.w, h: size.h };
      const bc = refHist ? RC.bhatta(RC.boxHist(bins, w, h, box), refHist) : c.v;
      const d = predict ? Math.hypot(c.x + bw / 2 - predict.x, c.y + bh / 2 - predict.y) / diag : 0;
      const score = bc - 0.35 * d;
      if (!best || score > best.score) best = { box, conf: c.v, bc, score };
    }
    return best;
  };

  /* ------------------------------------------------------------ 遮罩 */
  function blur3(src, W, H) {
    const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0, c = 0;
      for (let k = -1; k <= 1; k++) { const xx = x + k; if (xx >= 0 && xx < W) { s += src[y * W + xx]; c++; } }
      tmp[y * W + x] = s / c;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0, c = 0;
      for (let k = -1; k <= 1; k++) { const yy = y + k; if (yy >= 0 && yy < H) { s += tmp[yy * W + x]; c++; } }
      out[y * W + x] = s / c;
    }
    return out;
  }
  function morph(m, W, H, dilate) {
    const out = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = dilate ? 0 : 1;
      for (let dy = -1; dy <= 1 && (dilate ? !v : v); dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        const s = xx >= 0 && yy >= 0 && xx < W && yy < H ? m[yy * W + xx] : 0;
        if (dilate && s) { v = 1; break; }
        if (!dilate && !s) { v = 0; break; }
      }
      out[y * W + x] = v;
    }
    return out;
  }

  /** 由颜色后验得到人物遮罩。返回 { x, y, w, h, m: Uint8Array(0/1) }（工作分辨率坐标） */
  RC.extractMask = function (bins, w, h, P, box, opts) {
    opts = opts || {};
    const pad = 0.12;
    const r = clampBox({ x: box.x - box.w * pad, y: box.y - box.h * pad, w: box.w * (1 + 2 * pad), h: box.h * (1 + 2 * pad) }, w, h);
    const W = r.x1 - r.x0, H = r.y1 - r.y0;
    if (W < 2 || H < 2) return null;
    let prob = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) prob[y * W + x] = P[bins[(y + r.y0) * w + x + r.x0]];
    prob = blur3(blur3(prob, W, H), W, H);
    const th = opts.threshold == null ? 0.55 : opts.threshold;
    let m = new Uint8Array(W * H);
    for (let i = 0; i < m.length; i++) m[i] = prob[i] > th ? 1 : 0;
    m = morph(morph(m, W, H, true), W, H, false); // 闭运算补洞
    m = morph(morph(m, W, H, false), W, H, true); // 开运算去噪点
    // 连通域：保留与框中心区域相交的，及面积 ≥ 最大连通域 15% 的
    const lab = new Int32Array(W * H);
    const comps = [];
    const icx0 = box.x + box.w * 0.25 - r.x0, icx1 = box.x + box.w * 0.75 - r.x0;
    const icy0 = box.y + box.h * 0.2 - r.y0, icy1 = box.y + box.h * 0.8 - r.y0;
    const stack = [];
    for (let i = 0; i < m.length; i++) {
      if (!m[i] || lab[i]) continue;
      const id = comps.length + 1;
      let area = 0, central = 0;
      stack.push(i); lab[i] = id;
      while (stack.length) {
        const p = stack.pop();
        area++;
        const px = p % W, py = (p / W) | 0;
        if (px >= icx0 && px <= icx1 && py >= icy0 && py <= icy1) central++;
        const nb = [p - 1, p + 1, p - W, p + W];
        for (let k = 0; k < 4; k++) {
          const q = nb[k];
          if (q < 0 || q >= m.length) continue;
          if ((k === 0 && px === 0) || (k === 1 && px === W - 1)) continue;
          if (m[q] && !lab[q]) { lab[q] = id; stack.push(q); }
        }
      }
      comps.push({ id, area, central });
    }
    const maxA = Math.max(0, ...comps.map((c) => c.area));
    const keep = new Set(comps.filter((c) => c.central > 0 || c.area >= maxA * 0.15).filter((c) => c.area >= 4).map((c) => c.id));
    for (let i = 0; i < m.length; i++) m[i] = keep.has(lab[i]) ? 1 : 0;
    let area = 0;
    for (let i = 0; i < m.length; i++) area += m[i];
    return { x: r.x0, y: r.y0, w: W, h: H, m, area };
  };

  /** 二值遮罩行程编码（存工程用） */
  RC.rle = function (m) {
    const out = [];
    let cur = 0, run = 0;
    for (let i = 0; i < m.length; i++) {
      if (m[i] === cur) run++;
      else { out.push(run); cur = m[i]; run = 1; }
    }
    out.push(run);
    return out;
  };
  RC.unrle = function (runs, n) {
    const m = new Uint8Array(n);
    let p = 0, v = 0;
    for (const r of runs) { if (v) m.fill(1, p, p + r); p += r; v ^= 1; }
    return m;
  };

  /* ------------------------------------------------------------ 全局运动 */
  RC.gray = function (img, factor) {
    const f = factor || 4, W = Math.floor(img.w / f), H = Math.floor(img.h / f);
    const out = new Float32Array(W * H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0;
      for (let yy = 0; yy < f; yy++) for (let xx = 0; xx < f; xx++) {
        const p = ((y * f + yy) * img.w + x * f + xx) * 4;
        s += 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
      }
      out[y * W + x] = s / (f * f);
    }
    return { w: W, h: H, d: out, f };
  };

  /** 两帧之间的镜头平移（工作分辨率像素）。排除人物框，避免把人物运动当成镜头运动 */
  RC.globalMotion = function (a, b, R, exclude, prev) {
    R = R || 6;
    // 先验：偏向静止、偏向与上一帧相同的运动（防止瓷砖墙、百叶等周期纹理造成的跳变）
    const pdx = prev ? prev.dx / a.f : 0, pdy = prev ? prev.dy / a.f : 0;
    const W = a.w, H = a.h, mx = Math.floor(W * 0.1) + R, my = Math.floor(H * 0.1) + R;
    // 人物框外扩 25%（挥舞的手臂、甩动的衣襟常常出框）
    const ex = (exclude || []).map((e) => ({ x: e.x - e.w * 0.25, y: e.y - e.h * 0.25, w: e.w * 1.5, h: e.h * 1.5 }));
    const skip = (x, y) => ex.some((e) => x * a.f >= e.x && x * a.f < e.x + e.w && y * a.f >= e.y && y * a.f < e.y + e.h);
    const valid = [];
    let total = 0;
    for (let y = my; y < H - my; y += 1) for (let x = mx; x < W - mx; x += 1) { total++; if (!skip(x, y)) valid.push(y * W + x); }
    // 可用背景太少（人物占满画面）：判不出，返回 0 并标记
    if (valid.length < 20 || valid.length < total * 0.2) return { dx: 0, dy: 0, err: 0, unknown: true };
    let best = { dx: 0, dy: 0, err: Infinity };
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      let s = 0;
      for (let k = 0; k < valid.length; k++) {
        const p = valid[k];
        s += Math.abs(a.d[p] - b.d[p + dy * W + dx]);
        if (s > best.err * valid.length) break;
      }
      s /= valid.length;
      const pen = s + 0.15 * (Math.abs(dx) + Math.abs(dy)) + 0.25 * (Math.abs(dx - pdx) + Math.abs(dy - pdy));
      if (pen < best.err) best = { dx, dy, err: pen };
    }
    // 内容在 b 中位于 p + d，即镜头朝 -d 方向移动；返回内容位移（工作分辨率）
    return { dx: best.dx * a.f, dy: best.dy * a.f, err: best.err };
  };

  /* ------------------------------------------------------------ 整镜追踪 */
  /** frames: [img]，roles: { A: { keyframes: [{ fi, box }], neg: [[x,y]], pos: [[x,y]] } } (像素坐标)
   *  返回 { gm: [{dx,dy}], roles: { A: { boxes:[box|null], conf:[], masks:[mask|null], lost:[] } }, static } */
  RC.trackShot = function (frames, roles, opts) {
    opts = opts || {};
    const n = frames.length;
    if (!n) return null;
    const w = frames[0].w, h = frames[0].h;
    const binsArr = frames.map((f) => RC.binImage(f));
    const grays = frames.map((f) => RC.gray(f, 2));
    const ids = Object.keys(roles).filter((r) => roles[r] && roles[r].keyframes && roles[r].keyframes.length);
    const out = { gm: [{ dx: 0, dy: 0 }], roles: {} };
    for (const r of ids) out.roles[r] = { boxes: new Array(n).fill(null), conf: new Array(n).fill(0), masks: new Array(n).fill(null), lost: new Array(n).fill(false) };

    // 镜头运动预测：第一遍不补偿，第二遍用“排除人物框”后估出的镜头运动（打戏近景里人物会污染估计）
    let camPre = [];
    const runDir = (r, startFi, endFi, step, kfBox) => {
      const role = roles[r];
      let box = Object.assign({}, kfBox);
      const others = (fi) => ids.filter((o) => o !== r).map((o) => out.roles[o].boxes[fi]).filter(Boolean);
      let model = RC.colorModel(binsArr[startFi], w, h, box, { neg: role.neg, pos: role.pos, exclude: others(startFi) });
      const base = model;
      const refHist = RC.boxHist(binsArr[startFi], w, h, box); // 关键帧外观，用于重新检测比对
      let vel = { x: 0, y: 0 };
      let confAvg = null, coast = 0;
      for (let fi = startFi; step > 0 ? fi <= endFi : fi >= endFi; fi += step) {
        let conf;
        if (fi === startFi) conf = 1;
        else {
          // 镜头运动补偿：人物在画面中的位移 = 自身运动 + 镜头带来的内容位移
          const cam = camPre[step > 0 ? fi : fi + 1] || { dx: 0, dy: 0 };
          const cdx = step > 0 ? cam.dx : -cam.dx, cdy = step > 0 ? cam.dy : -cam.dy;
          box = { x: box.x + cdx, y: box.y + cdy, w: box.w, h: box.h };
          let res = RC.camshift(binsArr[fi], w, h, model.P, box, { vel, suppress: others(fi)[0], minSize: 6 });
          // 丢失后（或置信骤降时）全画面重新检测，明显更好就跳过去
          if (confAvg != null && (coast > 0 || res.conf < 0.45 * confAvg)) {
            const pred = { x: box.x + box.w / 2 + vel.x, y: box.y + box.h / 2 + vel.y };
            const rd = RC.redetect(binsArr[fi], w, h, model.P, box, others(fi)[0], refHist, pred);
            const curBc = RC.bhatta(RC.boxHist(binsArr[fi], w, h, res.box), refHist);
            if (rd && rd.bc > Math.max(0.55, curBc + 0.08) && rd.conf > 0.5 * confAvg) {
              const re = RC.camshift(binsArr[fi], w, h, model.P, rd.box, { suppress: others(fi)[0], minSize: 6 });
              if (re.conf > res.conf) { res = re; vel = { x: 0, y: 0 }; coast = 0; box = rd.box; }
            }
          }
          // 遮挡 / 丢失：置信度绝对过低，或相对近期均值骤降（被另一人挡住时只剩一条边，均值漂移会被拖过去）
          const occluded = res.conf < (opts.lostConf || 0.06) || (confAvg != null && res.conf < 0.45 * confAvg && coast < 12);
          if (occluded) {
            box = { x: box.x + vel.x, y: box.y + vel.y, w: box.w, h: box.h };
            vel = { x: vel.x * 0.9, y: vel.y * 0.9 };
            out.roles[r].lost[fi] = true;
            conf = res.conf;
            coast++;
          } else {
            const ratio = confAvg == null ? 1 : res.conf / confAvg;
            const pred = { x: box.x + box.w / 2 + vel.x, y: box.y + box.h / 2 + vel.y };
            const meas = { x: res.box.x + res.box.w / 2, y: res.box.y + res.box.h / 2 };
            if (ratio < 0.85) {
              // 部分遮挡：按置信度在预测与测量之间插值，尺寸与速度都不更新
              const f = SC.clamp((ratio - 0.45) / 0.4, 0, 1);
              const c = { x: pred.x + (meas.x - pred.x) * f, y: pred.y + (meas.y - pred.y) * f };
              box = { x: c.x - box.w / 2, y: c.y - box.h / 2, w: box.w, h: box.h };
            } else {
              const nv = { x: meas.x - (box.x + box.w / 2), y: meas.y - (box.y + box.h / 2) };
              vel = coast ? vel : { x: 0.6 * nv.x + 0.4 * vel.x, y: 0.6 * nv.y + 0.4 * vel.y };
              box = res.box;
              confAvg = confAvg == null ? res.conf : 0.8 * confAvg + 0.2 * res.conf;
            }
            conf = res.conf;
            coast = 0;
            if (conf > 0.3) model = RC.blendModel(model, RC.colorModel(binsArr[fi], w, h, box, { neg: role.neg, exclude: others(fi) }), 0.04);
            model = RC.blendModel(model, base, 0.05); // 向关键帧模型回拉，防止漂移
          }
        }
        out.roles[r].boxes[fi] = Object.assign({}, box);
        out.roles[r].conf[fi] = +conf.toFixed(3);
        out.roles[r].masks[fi] = opts.masks === false ? null : RC.extractMask(binsArr[fi], w, h, model.P, box, { threshold: opts.maskThreshold });
      }
    };

    const trackAll = () => {
    for (const r of ids) {
        const kfs = roles[r].keyframes.slice().sort((a, b) => a.fi - b.fi);
        // 第一个关键帧之前：向前（倒放）追踪
        if (kfs[0].fi > 0) runDir(r, kfs[0].fi, 0, -1, kfs[0].box);
        for (let k = 0; k < kfs.length; k++) {
          const end = k + 1 < kfs.length ? kfs[k + 1].fi - 1 : n - 1;
          if (end >= kfs[k].fi) runDir(r, kfs[k].fi, end, 1, kfs[k].box);
        }
      }
    };
    const camOf = (prior) => {
      const gm = [{ dx: 0, dy: 0 }];
      for (let fi = 1; fi < n; fi++) {
        const ex = ids.map((r) => out.roles[r].boxes[fi]).filter(Boolean);
        gm.push(RC.globalMotion(grays[fi - 1], grays[fi], 8, ex, gm[fi - 1]));
      }
      return gm;
    };
    trackAll();
    if (n > 2 && opts.twoPass !== false) {
      camPre = camOf();
      const moving = camPre.some((m) => m.dx || m.dy);
      if (moving) {
        for (const r of ids) out.roles[r] = { boxes: new Array(n).fill(null), conf: new Array(n).fill(0), masks: new Array(n).fill(null), lost: new Array(n).fill(false) };
        trackAll();
      }
    }
    // 全局运动（排除人物框）
    let cx = 0, cy = 0, drift = 0;
    const mags = [];
    for (let fi = 1; fi < n; fi++) {
      const ex = ids.map((r) => out.roles[r].boxes[fi]).filter(Boolean);
      const m = RC.globalMotion(grays[fi - 1], grays[fi], 8, ex, out.gm[fi - 1]);
      out.gm.push({ dx: m.dx, dy: m.dy });
      cx += m.dx; cy += m.dy;
      drift = Math.max(drift, Math.hypot(cx, cy));
      mags.push(Math.abs(m.dx) + Math.abs(m.dy));
    }
    // 固定机位：多数帧不动，且累计漂移小于画宽 4%（容忍轻微抖动与偶发误判）
    out.static = n < 2 || (SC.median(mags) === 0 && drift < w * 0.04);
    return out;
  };

  /* ------------------------------------------------------------ 干净背景板 */
  /** 固定机位：对每个像素，取未被任何人物遮罩覆盖的帧的中值 */
  RC.cleanPlate = function (frames, maskSets, maxSamples) {
    const n = frames.length, w = frames[0].w, h = frames[0].h;
    const K = Math.min(n, maxSamples || 21);
    const idx = [];
    for (let k = 0; k < K; k++) idx.push(Math.round((k * (n - 1)) / Math.max(1, K - 1)));
    const covered = idx.map((fi) => {
      const c = new Uint8Array(w * h);
      for (const mk of maskSets[fi] || []) {
        if (!mk) continue;
        // 膨胀 2 像素，避开边缘残影
        for (let y = -2; y < mk.h + 2; y++) for (let x = -2; x < mk.w + 2; x++) {
          const sx = SC.clamp(x, 0, mk.w - 1), sy = SC.clamp(y, 0, mk.h - 1);
          if (!mk.m[sy * mk.w + sx]) continue;
          const X = mk.x + x, Y = mk.y + y;
          if (X >= 0 && Y >= 0 && X < w && Y < h) c[Y * w + X] = 1;
        }
      }
      return c;
    });
    const out = new Uint8ClampedArray(w * h * 4);
    const hole = new Uint8Array(w * h);
    const vr = [], vg = [], vb = [];
    for (let p = 0; p < w * h; p++) {
      vr.length = vg.length = vb.length = 0;
      for (let k = 0; k < K; k++) {
        if (covered[k][p]) continue;
        const d = frames[idx[k]].data;
        vr.push(d[p * 4]); vg.push(d[p * 4 + 1]); vb.push(d[p * 4 + 2]);
      }
      if (!vr.length) {
        hole[p] = 1;
        for (let k = 0; k < K; k++) { const d = frames[idx[k]].data; vr.push(d[p * 4]); vg.push(d[p * 4 + 1]); vb.push(d[p * 4 + 2]); }
      }
      out[p * 4] = SC.median(vr); out[p * 4 + 1] = SC.median(vg); out[p * 4 + 2] = SC.median(vb); out[p * 4 + 3] = 255;
    }
    let holes = 0;
    for (let p = 0; p < hole.length; p++) holes += hole[p];
    return { w, h, data: out, holeRatio: holes / (w * h) };
  };

  /* ------------------------------------------------------------ 换装调色 */
  const toY = (r, gg, b) => 0.299 * r + 0.587 * gg + 0.114 * b;
  const toCb = (r, gg, b) => 128 - 0.168736 * r - 0.331264 * gg + 0.5 * b;
  const toCr = (r, gg, b) => 128 + 0.5 * r - 0.418688 * gg - 0.081312 * b;

  /** 统计遮罩内（或 alpha>128）像素的 Y 直方图与 Cb/Cr 均值方差 */
  RC.colorStats = function (img, maskFn) {
    const hy = new Float64Array(256);
    let n = 0, sb = 0, sr = 0, sbb = 0, srr = 0;
    const d = img.data;
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      if (!maskFn(x, y)) continue;
      const p = (y * img.w + x) * 4;
      const r = d[p], gg = d[p + 1], b = d[p + 2];
      hy[Math.round(toY(r, gg, b))]++;
      const cb = toCb(r, gg, b), cr = toCr(r, gg, b);
      sb += cb; sr += cr; sbb += cb * cb; srr += cr * cr; n++;
    }
    if (!n) return null;
    const mb = sb / n, mr = sr / n;
    return { n, hy, mb, mr, sdb: Math.sqrt(Math.max(1, sbb / n - mb * mb)), sdr: Math.sqrt(Math.max(1, srr / n - mr * mr)) };
  };

  /** 源（原演员）→ 目标（新角色参考图）的调色映射：亮度直方图匹配 + 色度迁移 */
  RC.recolorMap = function (src, ref) {
    const cdf = (hist) => { const c = new Float64Array(256); let s = 0; const t = hist.reduce((a, b) => a + b, 0) || 1; for (let i = 0; i < 256; i++) { s += hist[i]; c[i] = s / t; } return c; };
    const cs = cdf(src.hy), cr = cdf(ref.hy);
    const lutY = new Uint8Array(256);
    let j = 0;
    for (let i = 0; i < 256; i++) { while (j < 255 && cr[j] < cs[i]) j++; lutY[i] = j; }
    return {
      lutY,
      kb: SC.clamp(ref.sdb / src.sdb, 0.4, 2.5), mbS: src.mb, mbR: ref.mb,
      kr: SC.clamp(ref.sdr / src.sdr, 0.4, 2.5), mrS: src.mr, mrR: ref.mr,
    };
  };

  /** 对 RGBA 数据按 alpha（0..255 数组）应用调色映射；keepShade ∈ [0,1] 保留原明暗的比例 */
  RC.applyRecolor = function (data, alpha, map, strength, keepShade) {
    const s = strength == null ? 1 : strength, ks = keepShade == null ? 0.35 : keepShade;
    for (let i = 0, p = 0; i < alpha.length; i++, p += 4) {
      const a = (alpha[i] / 255) * s;
      if (a <= 0.004) continue;
      const r = data[p], gg = data[p + 1], b = data[p + 2];
      const y0 = toY(r, gg, b);
      const y = map.lutY[Math.round(y0)] * (1 - ks) + y0 * ks;
      const cb = (toCb(r, gg, b) - map.mbS) * map.kb + map.mbR - 128;
      const cr = (toCr(r, gg, b) - map.mrS) * map.kr + map.mrR - 128;
      const R = y + 1.402 * cr, G = y - 0.344136 * cb - 0.714136 * cr, B = y + 1.772 * cb;
      data[p] = r + (R - r) * a; data[p + 1] = gg + (G - gg) * a; data[p + 2] = b + (B - b) * a;
    }
  };

  /** Reinhard 式整体迁移：把参考图的颜色统计拉向镜头里的统计（贴图替身融入光线） */
  RC.matchTo = function (data, alpha, from, to, strength) {
    const s = strength == null ? 0.7 : strength;
    const map = {
      lutY: (() => { const l = new Uint8Array(256); const cdf = (hst) => { const c = new Float64Array(256); let a = 0; const t = hst.reduce((x, y) => x + y, 0) || 1; for (let i = 0; i < 256; i++) { a += hst[i]; c[i] = a / t; } return c; }; const cf = cdf(from.hy), ct = cdf(to.hy); let j = 0; for (let i = 0; i < 256; i++) { while (j < 255 && ct[j] < cf[i]) j++; l[i] = j; } return l; })(),
      kb: SC.clamp(to.sdb / from.sdb, 0.5, 2), mbS: from.mb, mbR: to.mb,
      kr: SC.clamp(to.sdr / from.sdr, 0.5, 2), mrS: from.mr, mrR: to.mr,
    };
    RC.applyRecolor(data, alpha, map, s, 0.4);
  };

  /* ------------------------------------------------------------ 参考图抠像 */
  /** 返回 alpha(Uint8Array) 与主体包围盒。若图片自带透明（边缘 alpha<250 占比高）则直接使用 */
  RC.cutout = function (img, tol) {
    const { w, h, data } = img;
    const n = w * h;
    let transparentEdge = 0, edge = 0;
    const edgeIdx = [];
    for (let x = 0; x < w; x++) { edgeIdx.push(x, (h - 1) * w + x); }
    for (let y = 1; y < h - 1; y++) { edgeIdx.push(y * w, y * w + w - 1); }
    for (const p of edgeIdx) { edge++; if (data[p * 4 + 3] < 250) transparentEdge++; }
    const alpha = new Uint8Array(n);
    if (transparentEdge / edge > 0.5) {
      for (let p = 0; p < n; p++) alpha[p] = data[p * 4 + 3];
    } else {
      tol = tol || 38;
      const bgMask = new Uint8Array(n);
      const q = [];
      // 边缘平均色（用于全局约束）
      let mr = 0, mg = 0, mb = 0;
      for (const p of edgeIdx) { mr += data[p * 4]; mg += data[p * 4 + 1]; mb += data[p * 4 + 2]; }
      mr /= edgeIdx.length; mg /= edgeIdx.length; mb /= edgeIdx.length;
      const dist = (p, r, gg, b) => Math.abs(data[p * 4] - r) + Math.abs(data[p * 4 + 1] - gg) + Math.abs(data[p * 4 + 2] - b);
      for (const p of edgeIdx) if (dist(p, mr, mg, mb) < tol * 3) { bgMask[p] = 1; q.push(p); }
      while (q.length) {
        const p = q.pop();
        const x = p % w, y = (p / w) | 0;
        const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
        for (const nq of nb) {
          if (nq < 0 || bgMask[nq]) continue;
          if (dist(nq, data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) < tol && dist(nq, mr, mg, mb) < tol * 3) { bgMask[nq] = 1; q.push(nq); }
        }
      }
      for (let p = 0; p < n; p++) alpha[p] = bgMask[p] ? 0 : 255;
      // 边缘 1 像素羽化
      const soft = new Uint8Array(alpha);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        if (!alpha[p]) continue;
        const s = alpha[p - 1] + alpha[p + 1] + alpha[p - w] + alpha[p + w];
        if (s < 1020) soft[p] = Math.round((alpha[p] * 2 + s) / 6);
      }
      alpha.set(soft);
    }
    let x0 = w, y0 = h, x1 = -1, y1 = -1, cnt = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] > 128) { cnt++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const bbox = cnt ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : { x: 0, y: 0, w, h };
    return { alpha, bbox, coverage: cnt / n };
  };

  /* ------------------------------------------------------------ 时间插值 */
  /** 在追踪采样之间线性插值框（t 为镜内秒，times 为采样时刻） */
  RC.boxAt = function (track, times, t) {
    if (!track || !times.length) return null;
    let k = 0;
    while (k + 1 < times.length && times[k + 1] <= t) k++;
    const a = track.boxes[k];
    const b = track.boxes[Math.min(times.length - 1, k + 1)];
    if (!a) return b || null;
    if (!b || k + 1 >= times.length || times[k + 1] === times[k]) return Object.assign({}, a);
    const f = SC.clamp((t - times[k]) / (times[k + 1] - times[k]), 0, 1);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, w: a.w + (b.w - a.w) * f, h: a.h + (b.h - a.h) * f, k, f };
  };

  /** 镜头类型 → 由单个点估计初始框（沿用旧版点选数据） */
  RC.boxFromPoint = function (pt, shotType, w, h) {
    const t = String(shotType || '');
    let bw = 0.2, bh = 0.62;
    if (/特写/.test(t)) { bw = 0.45; bh = 0.95; }
    else if (/近景/.test(t)) { bw = 0.36; bh = 0.85; }
    else if (/中全/.test(t)) { bw = 0.2; bh = 0.65; }
    else if (/中景|中近/.test(t)) { bw = 0.26; bh = 0.75; }
    else if (/全景|远/.test(t)) { bw = 0.12; bh = 0.45; }
    const W = bw * w, H = bh * h;
    return { x: SC.clamp(pt[0] * w - W / 2, -W * 0.3, w - W * 0.7), y: SC.clamp(pt[1] * h - H / 2, -H * 0.3, h - H * 0.7), w: W, h: H };
  };
})(typeof window !== 'undefined' ? window : globalThis);
