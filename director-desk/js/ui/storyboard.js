/* 分镜板渲染（两种画风）：
 *  - sketch：铅笔线稿风（纸张底、火柴人、运动箭头、推拉镜头的角箭头、IMPACT 爆点），参照 Fight Beat 分镜表
 *  - frame ：实拍帧去色 + 叠加主体框、运动箭头与镜头运动标记
 * panels: [{ n, caption, sub, frame(Image|null), figures:[{x,y,h,col,from:[x,y],to:[x,y]}](归一化，y 为脚底), camMove, camDir, impact }] */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});
  const SB = (SC.storyboard = {});
  const HAND = '"Segoe Print", "Bradley Hand", "Comic Sans MS", "Kaiti SC", "STKaiti", "KaiTi", cursive';

  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  /** 手绘感线段：两遍略有偏移的折线 */
  function sketchLine(c, x0, y0, x1, y1, r, w) {
    c.lineWidth = w || 1.6;
    for (let pass = 0; pass < 2; pass++) {
      const j = pass ? 0.9 : 0.5;
      c.beginPath();
      const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 40));
      c.moveTo(x0 + (r() - 0.5) * j, y0 + (r() - 0.5) * j);
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        c.lineTo(x0 + (x1 - x0) * t + (r() - 0.5) * j * 1.4, y0 + (y1 - y0) * t + (r() - 0.5) * j * 1.4);
      }
      c.globalAlpha = pass ? 0.55 : 0.95;
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  function arrow(c, x0, y0, x1, y1, r, size, sketch) {
    if (sketch) sketchLine(c, x0, y0, x1, y1, r, 1.8); else { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    const a = Math.atan2(y1 - y0, x1 - x0), s = size || 10;
    for (const d of [-0.45, 0.45]) {
      const hx = x1 - Math.cos(a + d) * s, hy = y1 - Math.sin(a + d) * s;
      if (sketch) sketchLine(c, x1, y1, hx, hy, r, 1.8); else { c.beginPath(); c.moveTo(x1, y1); c.lineTo(hx, hy); c.stroke(); }
    }
  }

  /** 火柴人：根据运动方向摆跑动/站立姿态 */
  function stickFigure(c, x, foot, h, dir, moving, r, col) {
    const head = h * 0.13, neck = foot - h + head * 2, hip = foot - h * 0.45;
    const lean = moving ? dir * h * 0.12 : 0;
    c.strokeStyle = col || '#2a2724';
    c.beginPath(); c.lineWidth = 1.8; c.arc(x + lean, foot - h + head, head, 0, Math.PI * 2); c.stroke();
    sketchLine(c, x + lean, neck, x, hip, r, 1.8);
    if (moving) {
      sketchLine(c, x, hip, x + dir * h * 0.25, foot - h * 0.08, r); sketchLine(c, x + dir * h * 0.25, foot - h * 0.08, x + dir * h * 0.3, foot, r);
      sketchLine(c, x, hip, x - dir * h * 0.18, foot - h * 0.2, r); sketchLine(c, x - dir * h * 0.18, foot - h * 0.2, x - dir * h * 0.32, foot - h * 0.05, r);
      sketchLine(c, x + lean * 0.8, neck + h * 0.08, x + lean + dir * h * 0.3, neck + h * 0.02, r);
      sketchLine(c, x + lean * 0.8, neck + h * 0.08, x - dir * h * 0.22, neck + h * 0.22, r);
    } else {
      sketchLine(c, x, hip, x - h * 0.14, foot, r); sketchLine(c, x, hip, x + h * 0.14, foot, r);
      sketchLine(c, x, neck + h * 0.08, x - h * 0.2, neck + h * 0.3, r); sketchLine(c, x, neck + h * 0.08, x + h * 0.2, neck + h * 0.3, r);
    }
  }

  function impactStar(c, x, y, s, r) {
    c.strokeStyle = '#a8432f';
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + r() * 0.3, l = s * (0.6 + r() * 0.6);
      sketchLine(c, x + Math.cos(a) * s * 0.25, y + Math.sin(a) * s * 0.25, x + Math.cos(a) * l, y + Math.sin(a) * l, r, 1.4);
    }
    c.fillStyle = '#a8432f'; c.font = '700 ' + Math.round(s * 0.5) + 'px ' + HAND; c.fillText('IMPACT', x + s * 0.5, y - s * 0.6);
  }

  /** 推 / 拉镜头：四角箭头（推 = 向内，拉 = 向外） */
  function cornerArrows(c, x, y, w, h, out, r) {
    const m = Math.min(w, h) * 0.12, L = Math.min(w, h) * 0.16;
    const corners = [[x + m, y + m, 1, 1], [x + w - m, y + m, -1, 1], [x + m, y + h - m, 1, -1], [x + w - m, y + h - m, -1, -1]];
    for (const [cx, cy, sx, sy] of corners) {
      if (out) arrow(c, cx + sx * L, cy + sy * L, cx, cy, r, 9, true);
      else arrow(c, cx, cy, cx + sx * L, cy + sy * L, r, 9, true);
    }
  }

  /** 镜头运动：摇/跟拍 → 画面底部的方向箭头；俯仰 → 侧边竖箭头 */
  function cameraMoveMark(c, x, y, w, h, p, r) {
    const G = SC.grammar, dir = p.camDir || 'N';
    if (p.camMove === 'push') return cornerArrows(c, x, y, w, h, false, r);
    if (p.camMove === 'pull') return cornerArrows(c, x, y, w, h, true, r);
    if (!dir || dir === 'N' || !G) return;
    const v = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1], UR: [0.8, -0.6], UL: [-0.8, -0.6], DR: [0.8, 0.6], DL: [-0.8, 0.6] }[dir];
    if (!v) return;
    const cx = x + w * 0.5 + v[0] * w * 0.32, cy = y + h * 0.9 + v[1] * h * 0.2;
    arrow(c, cx - v[0] * w * 0.12, cy - v[1] * h * 0.12, cx + v[0] * w * 0.12, cy + v[1] * h * 0.12, r, 10, true);
  }

  SB.render = function (opts) {
    const panels = opts.panels || [];
    const cols = opts.cols || 4, style = opts.style || 'sketch';
    const PW = opts.panelW || 360, PH = Math.round(PW * (opts.aspect || 9 / 16)), gapX = 36, capH = 54, top = 96, side = 40;
    const rows = Math.max(1, Math.ceil(panels.length / cols));
    const W = side * 2 + cols * PW + (cols - 1) * gapX, H = top + rows * (PH + capH + 26) + 50;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const r = rng(opts.seed || 7);
    c.fillStyle = style === 'sketch' ? '#f3efe6' : '#f7f6f2'; c.fillRect(0, 0, W, H);
    // 纸张纤维
    if (style === 'sketch') { c.fillStyle = 'rgba(120,100,70,0.05)'; for (let i = 0; i < 1600; i++) c.fillRect(r() * W, r() * H, 1 + r() * 2, 1); }
    c.fillStyle = '#2a2724'; c.strokeStyle = '#2a2724';
    c.font = '600 30px ' + HAND; c.textBaseline = 'alphabetic';
    c.fillText(opts.title || 'SEQ. 01 – SCENE', side, 52);
    const tw = c.measureText(opts.title || 'SEQ. 01 – SCENE').width;
    sketchLine(c, side, 60, side + tw, 60, r, 1.6);
    if (opts.subtitle) { c.font = '14px ' + HAND; c.fillStyle = '#6b655c'; c.fillText(opts.subtitle, side + tw + 24, 52); }

    panels.forEach((p, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = side + col * (PW + gapX), y = top + row * (PH + capH + 26);
      c.save();
      c.beginPath(); c.rect(x, y, PW, PH); c.clip();
      if (style === 'frame' && p.frame) {
        c.filter = 'grayscale(1) contrast(1.15) brightness(1.08)';
        const im = p.frame, s = Math.max(PW / im.width, PH / im.height);
        c.drawImage(im, x + (PW - im.width * s) / 2, y + (PH - im.height * s) / 2, im.width * s, im.height * s);
        c.filter = 'none';
        c.fillStyle = 'rgba(247,246,242,0.18)'; c.fillRect(x, y, PW, PH);
      } else {
        // 线稿场景：地面与透视线
        c.fillStyle = '#d8d1c3'; c.fillRect(x, y + PH * 0.68, PW, PH * 0.32);
        c.strokeStyle = 'rgba(42,39,36,0.25)';
        sketchLine(c, x, y + PH * 0.68, x + PW, y + PH * 0.68, r, 1);
        if (p.size === 'EWS' || p.size === 'LS') { // 远景加几栋楼的剪影交代空间
          c.fillStyle = 'rgba(160,150,135,0.55)';
          for (let k = 0; k < 4; k++) { const bw = PW * (0.06 + r() * 0.05), bh = PH * (0.18 + r() * 0.2), bx = x + PW * (0.08 + k * 0.24 + r() * 0.05); c.fillRect(bx, y + PH * 0.68 - bh, bw, bh); }
        }
      }
      // 人物与主体运动箭头
      for (const f of p.figures || []) {
        const fx = x + f.x * PW, foot = y + Math.min(f.y, 1.05) * PH, fh = Math.min(f.h, 1.4) * PH;
        const mv = f.from && f.to ? [(f.to[0] - f.from[0]) * PW, (f.to[1] - f.from[1]) * PH] : [0, 0];
        const moving = Math.hypot(mv[0], mv[1]) > PW * 0.05;
        if (style === 'sketch') stickFigure(c, fx, foot, Math.min(fh, PH * 0.9), mv[0] >= 0 ? 1 : -1, moving, r, f.col);
        else { c.strokeStyle = f.col || '#2a2724'; c.lineWidth = 2; c.strokeRect(fx - fh * 0.2, foot - fh, fh * 0.4, fh); }
        if (moving) {
          c.strokeStyle = f.col && style === 'frame' ? f.col : '#2a2724';
          const ay = Math.min(y + PH * 0.88, foot + 10);
          arrow(c, fx - mv[0] * 0.15, ay, fx + mv[0] * 0.6, ay + mv[1] * 0.3, r, 10, true);
        }
      }
      if (p.impact) impactStar(c, x + PW * 0.7, y + PH * 0.35, Math.min(PW, PH) * 0.18, r);
      c.strokeStyle = '#2a2724';
      cameraMoveMark(c, x, y, PW, PH, p, r);
      c.restore();
      // 画框（手绘双线）
      c.strokeStyle = '#2a2724';
      sketchLine(c, x, y, x + PW, y, r, 2.2); sketchLine(c, x + PW, y, x + PW, y + PH, r, 2.2);
      sketchLine(c, x + PW, y + PH, x, y + PH, r, 2.2); sketchLine(c, x, y + PH, x, y, r, 2.2);
      // 编号圈
      c.beginPath(); c.fillStyle = style === 'sketch' ? '#f3efe6' : '#fff'; c.arc(x + 20, y + 20, 13, 0, Math.PI * 2); c.fill(); c.lineWidth = 1.6; c.stroke();
      c.fillStyle = '#2a2724'; c.font = '600 15px ' + HAND; c.textAlign = 'center'; c.fillText(String(p.n), x + 20, y + 25); c.textAlign = 'left';
      // 标题行
      c.font = '600 17px ' + HAND; c.fillStyle = '#2a2724';
      c.fillText(String(p.caption || '').toUpperCase(), x + 4, y + PH + 26);
      if (p.sub) { c.font = '13px ' + HAND; c.fillStyle = '#6b655c'; c.fillText(String(p.sub).slice(0, Math.floor(PW / 13)), x + 4, y + PH + 46); }
    });
    if (opts.footer) { c.font = '15px ' + HAND; c.fillStyle = '#2a2724'; const fw = c.measureText(opts.footer).width; c.fillText(opts.footer, W - side - fw - 60, H - 22); arrow(c, W - side - 54, H - 27, W - side, H - 27, r, 9, true); }
    return cv;
  };

  /** 下载为 PNG */
  SB.download = function (canvas, name) {
    canvas.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = name || 'storyboard.png';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  };
})(typeof window !== 'undefined' ? window : globalThis);
