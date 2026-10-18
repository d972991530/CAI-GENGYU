/* 换角预览台 · 合成器：在原片帧上实时合成（场景替换 → 角色替换 → 调色），并绘制追踪检查叠层。
 * 追踪数据坐标为工作分辨率（track.W × track.H），绘制时按输出尺寸缩放。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});
  const RC = (SC.recast = SC.recast || {});
  const ROLE_COL = { A: '#ff6f61', B: '#7cc8ff' };
  RC.ROLE_COL = ROLE_COL;

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };

  /** 调色：CSS filter 串 + 冷暖叠色 */
  RC.gradeFilter = function (gr) {
    if (!gr || !gr.on) return 'none';
    return 'brightness(' + (1 + gr.exposure) + ') contrast(' + gr.contrast + ') saturate(' + gr.saturation + ') hue-rotate(' + gr.hue + 'deg)';
  };
  function gradeTint(ctx, gr, W, H) {
    if (!gr || !gr.on || !gr.temp) return;
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = Math.min(0.6, Math.abs(gr.temp) * 0.6);
    ctx.fillStyle = gr.temp > 0 ? '#ff9a3c' : '#2f7dff';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  RC.Compositor = class {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d', { willReadFrequently: true });
      this.tmp = mk(4, 4); this.tctx = this.tmp.getContext('2d', { willReadFrequently: true });
      this.fg = mk(4, 4); this.fctx = this.fg.getContext('2d');
      this.cache = new Map(); // 遮罩画布、背景板、调色映射、替身贴图
    }
    invalidate(prefix) { for (const k of Array.from(this.cache.keys())) if (!prefix || k.startsWith(prefix)) this.cache.delete(k); }

    maskCanvas(shot, r, k) {
      const key = shot.id + '|m|' + r + '|' + k;
      let c = this.cache.get(key);
      if (c) return c;
      const m = shot.track.roles[r].masks[k];
      if (!m) return null;
      const bits = m.bits || (m.bits = RC.unrle(m.rle, m.w * m.h));
      c = mk(m.w, m.h);
      const x = c.getContext('2d'), id = x.createImageData(m.w, m.h);
      for (let i = 0; i < bits.length; i++) if (bits[i]) { id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = 255; }
      x.putImageData(id, 0, 0);
      this.cache.set(key, c);
      return c;
    }

    plateImage(shot) {
      if (!shot.track.plate) return null;
      const key = shot.id + '|plate';
      let im = this.cache.get(key);
      if (!im) { im = new Image(); im.src = shot.track.plate; this.cache.set(key, im); }
      return im.complete && im.naturalWidth ? im : null;
    }

    /** 采样序号与插值框（工作分辨率） */
    sampleAt(shot, r, t) {
      const tr = shot.track, times = tr.times;
      let k = 0;
      while (k + 1 < times.length && times[k + 1] <= t) k++;
      const rt = tr.roles[r];
      if (!rt) return null;
      const box = RC.boxAt(rt, times, t);
      if (!box) return null;
      const nearest = k + 1 < times.length && times[k + 1] - t < t - times[k] ? k + 1 : k;
      return { k: nearest, box, ref: rt.boxes[nearest], lost: rt.lost[nearest], conf: rt.conf[nearest] };
    }

    /** 把某角色当前时刻的遮罩画到 dctx（输出坐标），可选膨胀/羽化 */
    drawMask(dctx, shot, r, s, sx, sy, blur) {
      const c = this.maskCanvas(shot, r, s.k);
      if (!c || !s.ref) return false;
      const m = shot.track.roles[r].masks[s.k];
      // 遮罩随插值框平移缩放：从采样时刻的框映射到当前框
      const fx = s.box.w / s.ref.w, fy = s.box.h / s.ref.h;
      const x = (s.box.x + (m.x - s.ref.x) * fx) * sx, y = (s.box.y + (m.y - s.ref.y) * fy) * sy;
      dctx.save();
      dctx.imageSmoothingEnabled = true;
      if (blur) dctx.filter = 'blur(' + blur + 'px)';
      dctx.drawImage(c, x, y, m.w * fx * sx, m.h * fy * sy);
      dctx.restore();
      return true;
    }

    /** 替身贴图：抠像后的参考图，按镜头统计做颜色融合（每镜每角色缓存） */
    standIn(shot, r, cast) {
      if (!cast.cut) return null;
      const key = shot.id + '|stand|' + r + '|' + cast.ver;
      let c = this.cache.get(key);
      if (c) return c;
      const cut = cast.cut;
      const data = Uint8ClampedArray.from(cut.data);
      const st = shot.track.roles[r] && shot.track.roles[r].srcStats;
      if (st && cast.refStats && cast.matchLight) RC.matchTo(data, cut.alpha, cast.refStats, st, cast.matchLight);
      for (let i = 0; i < cut.alpha.length; i++) data[i * 4 + 3] = cut.alpha[i];
      const full = mk(cut.w, cut.h);
      full.getContext('2d').putImageData(new ImageData(data, cut.w, cut.h), 0, 0);
      const b = cut.bbox;
      c = mk(b.w, b.h);
      c.getContext('2d').drawImage(full, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
      this.cache.set(key, c);
      return c;
    }

    recolorMap(shot, r, cast) {
      const key = shot.id + '|map|' + r + '|' + cast.ver;
      let m = this.cache.get(key);
      if (m !== undefined) return m;
      const st = shot.track.roles[r] && shot.track.roles[r].srcStats;
      m = st && cast.refStats ? RC.recolorMap(st, cast.refStats) : null;
      this.cache.set(key, m);
      return m;
    }

    /**
     * 渲染一帧。
     * o = { video, shot, t(镜内秒), view: 'orig'|'track'|'final'|'compare', P(工程), split(0..1), tool }
     */
    render(o) {
      const { video, shot, P } = o;
      const W = this.cv.width, H = this.cv.height, ctx = this.ctx;
      const grade = P.grade && P.grade.on && o.view !== 'orig';
      ctx.save();
      ctx.filter = grade ? RC.gradeFilter(P.grade) : 'none';
      ctx.drawImage(video, 0, 0, W, H);
      ctx.restore();
      if (o.view === 'orig') return;
      const tr = shot && shot.track;
      const active = shot && !shot.keep && tr ? Object.keys(tr.roles).filter((r) => shot.roles[r] && shot.roles[r].on) : [];
      const sx = tr ? W / tr.W : 1, sy = tr ? H / tr.H : 1;
      const samples = {};
      for (const r of active) samples[r] = this.sampleAt(shot, r, o.t);

      if (o.view === 'final' || o.view === 'compare') {
        this.composite(o, active, samples, sx, sy, grade);
        if (grade) gradeTint(ctx, P.grade, W, H);
        if (o.view === 'compare') {
          const xs = Math.round(W * (o.split == null ? 0.5 : o.split));
          ctx.save();
          ctx.beginPath(); ctx.rect(0, 0, xs, H); ctx.clip();
          ctx.drawImage(video, 0, 0, W, H);
          ctx.restore();
          ctx.fillStyle = '#f2a541'; ctx.fillRect(xs - 1, 0, 2, H);
          ctx.font = '12px sans-serif'; ctx.fillStyle = '#fff';
          ctx.fillText('原片', 8, H - 10); ctx.fillText('替换', xs + 8, H - 10);
        }
      }
      if (o.view === 'track' && tr) this.overlay(shot, samples, sx, sy);
    }

    composite(o, active, samples, sx, sy, grade) {
      const { video, shot, P } = o;
      const W = this.cv.width, H = this.cv.height, ctx = this.ctx;
      const tr = shot && shot.track;
      // 1) 场景替换：人物层（所有角色遮罩并集）叠在新场景上
      const sceneOn = P.scene && P.scene.on && P.scene.el && shot && !shot.keep && shot.sceneOn !== false;
      if (sceneOn && tr) {
        if (this.fg.width !== W || this.fg.height !== H) { this.fg.width = W; this.fg.height = H; }
        const f = this.fctx;
        f.clearRect(0, 0, W, H);
        const roles = Object.keys(tr.roles);
        let any = false;
        for (const r of roles) { const s = this.sampleAt(shot, r, o.t); if (s && this.drawMask(f, shot, r, s, sx, sy, 1.5)) any = true; }
        if (any) {
          f.save(); f.globalCompositeOperation = 'source-in'; f.filter = grade ? RC.gradeFilter(P.grade) : 'none'; f.drawImage(video, 0, 0, W, H); f.restore();
        }
        // 镜头平移补偿：累计全局运动（只取到当前采样）
        let k = 0;
        while (k + 1 < tr.times.length && tr.times[k + 1] <= o.t) k++;
        let cx = 0, cy = 0;
        for (let i = 1; i <= k; i++) { cx += tr.gm[i].dx; cy += tr.gm[i].dy; }
        const par = P.scene.parallax == null ? 0.6 : P.scene.parallax;
        const im = P.scene.el, over = 1.18;
        const s = Math.max((W * over) / im.naturalWidth, (H * over) / im.naturalHeight);
        const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
        ctx.save();
        ctx.filter = grade ? RC.gradeFilter(P.grade) : 'none';
        ctx.drawImage(im, (W - dw) / 2 + cx * sx * par, (H - dh) / 2 + cy * sy * par, dw, dh);
        ctx.restore();
        if (any) ctx.drawImage(this.fg, 0, 0);
      }
      // 2) 角色替换
      for (const r of active) {
        const s = samples[r];
        if (!s) continue;
        const role = shot.roles[r], cast = P.cast[r];
        const mode = role.mode && role.mode !== 'inherit' ? role.mode : cast.mode;
        if (mode === 'none') continue;
        if (mode === 'recolor') this.recolor(shot, r, s, cast, sx, sy);
        else if (mode === 'standin') this.drawStandIn(shot, r, s, cast, role, sx, sy, sceneOn);
      }
    }

    recolor(shot, r, s, cast, sx, sy) {
      const map = this.recolorMap(shot, r, cast);
      if (!map) return;
      const W = this.cv.width, H = this.cv.height;
      const pad = 0.15;
      const x0 = Math.max(0, Math.floor((s.box.x - s.box.w * pad) * sx)), y0 = Math.max(0, Math.floor((s.box.y - s.box.h * pad) * sy));
      const x1 = Math.min(W, Math.ceil((s.box.x + s.box.w * (1 + pad)) * sx)), y1 = Math.min(H, Math.ceil((s.box.y + s.box.h * (1 + pad)) * sy));
      const rw = x1 - x0, rh = y1 - y0;
      if (rw < 2 || rh < 2) return;
      if (this.tmp.width !== rw || this.tmp.height !== rh) { this.tmp.width = rw; this.tmp.height = rh; }
      const t = this.tctx;
      t.clearRect(0, 0, rw, rh);
      t.save(); t.translate(-x0, -y0);
      const ok = this.drawMask(t, shot, r, s, sx, sy, 1);
      t.restore();
      if (!ok) return;
      const md = t.getImageData(0, 0, rw, rh).data;
      const alpha = new Uint8Array(rw * rh);
      for (let i = 0; i < alpha.length; i++) alpha[i] = md[i * 4 + 3];
      const img = this.ctx.getImageData(x0, y0, rw, rh);
      RC.applyRecolor(img.data, alpha, map, cast.strength == null ? 0.85 : cast.strength, cast.keepShade == null ? 0.35 : cast.keepShade);
      this.ctx.putImageData(img, x0, y0);
    }

    drawStandIn(shot, r, s, cast, role, sx, sy, sceneOn) {
      const ctx = this.ctx;
      // 擦除原演员：固定机位有干净背景板时用背景板填回遮罩区域（场景替换已开启时新背景已在下面，不必擦）
      const plate = !sceneOn && this.plateImage(shot);
      if (plate) {
        const W = this.cv.width, H = this.cv.height;
        if (this.fg.width !== W || this.fg.height !== H) { this.fg.width = W; this.fg.height = H; }
        const f = this.fctx;
        f.clearRect(0, 0, W, H);
        this.drawMask(f, shot, r, s, sx, sy, 3);
        this.drawMask(f, shot, r, s, sx, sy, 0);
        f.save(); f.globalCompositeOperation = 'source-in'; f.drawImage(plate, 0, 0, W, H); f.restore();
        ctx.drawImage(this.fg, 0, 0);
      }
      const c = this.standIn(shot, r, cast);
      if (!c) return;
      const scale = role.scale || 1;
      const bh = s.box.h * sy * scale;
      const bw = (bh * c.width) / c.height;
      const cx = (s.box.x + s.box.w / 2) * sx + (role.dx || 0) * s.box.w * sx;
      const bottom = (s.box.y + s.box.h) * sy + (role.dy || 0) * s.box.h * sy;
      ctx.save();
      if (role.mirror) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
      ctx.drawImage(c, cx - bw / 2, bottom - bh, bw, bh);
      ctx.restore();
    }

    overlay(shot, samples, sx, sy) {
      const ctx = this.ctx;
      for (const r of Object.keys(samples)) {
        const s = samples[r];
        if (!s) continue;
        // 遮罩着色
        const W = this.cv.width, H = this.cv.height;
        if (this.fg.width !== W || this.fg.height !== H) { this.fg.width = W; this.fg.height = H; }
        const f = this.fctx;
        f.clearRect(0, 0, W, H);
        if (this.drawMask(f, shot, r, s, sx, sy, 0)) {
          f.save(); f.globalCompositeOperation = 'source-in'; f.fillStyle = ROLE_COL[r]; f.fillRect(0, 0, W, H); f.restore();
          ctx.save(); ctx.globalAlpha = 0.45; ctx.drawImage(this.fg, 0, 0); ctx.restore();
        }
        ctx.save();
        ctx.strokeStyle = s.lost ? '#f2c94c' : ROLE_COL[r];
        ctx.setLineDash(s.lost ? [6, 4] : []);
        ctx.lineWidth = 2;
        ctx.strokeRect(s.box.x * sx, s.box.y * sy, s.box.w * sx, s.box.h * sy);
        ctx.fillStyle = s.lost ? '#f2c94c' : ROLE_COL[r];
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(r + (s.lost ? ' 丢失/遮挡' : ' ' + Math.round(Math.min(1, s.conf) * 100) + '%'), s.box.x * sx + 3, s.box.y * sy - 4);
        ctx.restore();
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
