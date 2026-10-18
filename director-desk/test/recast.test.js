/* 换角预览台算法测试：node director-desk/test/recast.test.js */
'use strict';
const assert = require('assert');
const path = require('path');
for (const f of ['core/util', 'recast/track']) require(path.join(__dirname, '../js', f + '.js'));
const SC = globalThis.SC, RC = SC.recast;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + (e.stack || e)); process.exitCode = 1; }
}

const W = 160, H = 90;
/** 纹理背景（可整体平移 = 镜头横摇）+ 若干矩形“人物” */
function frame(actors, pan) {
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const X = x + (pan || 0);
    const p = (y * W + x) * 4;
    const v = 40 + ((Math.floor(X / 7) + Math.floor(y / 5)) % 2) * 50 + ((X * 13 + y * 7) % 11);
    d[p] = v * 0.6; d[p + 1] = v * 0.9; d[p + 2] = v; d[p + 3] = 255; // 偏冷青的砖墙
  }
  for (const a of actors) {
    for (let y = Math.max(0, a.y); y < Math.min(H, a.y + a.h); y++) for (let x = Math.max(0, a.x); x < Math.min(W, a.x + a.w); x++) {
      const p = (y * W + x) * 4;
      const shade = 0.8 + 0.2 * ((x + y) % 3) / 2;
      d[p] = a.c[0] * shade; d[p + 1] = a.c[1] * shade; d[p + 2] = a.c[2] * shade;
    }
  }
  return { w: W, h: H, data: d };
}
const iou = (a, b) => {
  const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y), x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.h, b.y + b.h);
  const i = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  return i / (a.w * a.h + b.w * b.h - i);
};

console.log('追踪');
const N = 30;
const actA = (k) => ({ x: 20 + k * 3, y: 25, w: 18, h: 50, c: [200, 40, 30] }); // 红衣，向右
const actB = (k) => ({ x: 120 - k * 2, y: 20, w: 16, h: 55, c: [235, 225, 210] }); // 白衣，向左
const frames = [];
for (let k = 0; k < N; k++) frames.push(frame([actA(k), actB(k)]));

test('CAMShift 双人追踪：未遮挡帧中心误差 < 4px、IoU > 0.5；遮挡期间不跑飞，结束后恢复', () => {
  const tr = RC.trackShot(frames, {
    A: { keyframes: [{ fi: 0, box: { x: 18, y: 22, w: 22, h: 56 } }] },
    B: { keyframes: [{ fi: 0, box: { x: 118, y: 18, w: 20, h: 60 } }] },
  });
  const overlap = (k) => { const a = actA(k), b = actB(k); return b.x < a.x + a.w + 2 && b.x + b.w + 2 > a.x; };
  for (const [r, act] of [['A', actA], ['B', actB]]) {
    for (let k = 0; k < N; k++) {
      const b = tr.roles[r].boxes[k], t = act(k);
      const err = Math.hypot(b.x + b.w / 2 - (t.x + t.w / 2), b.y + b.h / 2 - (t.y + t.h / 2));
      if (overlap(k)) { assert.ok(err < 9, r + ' 遮挡帧 ' + k + ' 误差 ' + err.toFixed(1)); continue; }
      assert.ok(err < 4, r + ' 第 ' + k + ' 帧误差 ' + err.toFixed(1));
      assert.ok(iou(b, t) > 0.5, r + ' 第 ' + k + ' 帧 IoU ' + iou(b, t).toFixed(2));
    }
  }
  assert.ok(tr.static, '背景不动应判为固定机位');
});

test('两人交错穿过时不串号（B 的框不跳到 A 身上）', () => {
  const fr = [];
  const a = (k) => ({ x: 10 + k * 4, y: 25, w: 16, h: 50, c: [30, 30, 30] }); // 黑衣
  const b = (k) => ({ x: 130 - k * 4, y: 22, w: 16, h: 52, c: [230, 200, 60] }); // 金黄
  for (let k = 0; k < 30; k++) fr.push(frame([a(k), b(k)]));
  const tr = RC.trackShot(fr, {
    A: { keyframes: [{ fi: 0, box: { x: 8, y: 22, w: 20, h: 56 } }] },
    B: { keyframes: [{ fi: 0, box: { x: 128, y: 19, w: 20, h: 58 } }] },
  });
  for (const k of [10, 20, 29]) {
    const bb = tr.roles.B.boxes[k], ba = tr.roles.A.boxes[k];
    assert.ok(Math.abs(bb.x + bb.w / 2 - (b(k).x + 8)) < 6, 'B 第 ' + k + ' 帧 x=' + (bb.x + bb.w / 2).toFixed(1));
    assert.ok(Math.abs(ba.x + ba.w / 2 - (a(k).x + 8)) < 6, 'A 第 ' + k + ' 帧 x=' + (ba.x + ba.w / 2).toFixed(1));
  }
});

test('关键帧修正：从中间关键帧向前、向后都能追', () => {
  const tr = RC.trackShot(frames, { A: { keyframes: [{ fi: 15, box: { x: 63, y: 22, w: 22, h: 56 } }] } });
  const b0 = tr.roles.A.boxes[0], b29 = tr.roles.A.boxes[29];
  assert.ok(Math.abs(b0.x + b0.w / 2 - 29) < 4, 'fi0 ' + (b0.x + b0.w / 2));
  assert.ok(Math.abs(b29.x + b29.w / 2 - (20 + 87 + 9)) < 4, 'fi29 ' + (b29.x + b29.w / 2));
});

console.log('遮罩');
test('遮罩贴合人物轮廓：IoU > 0.75', () => {
  const tr = RC.trackShot(frames, { A: { keyframes: [{ fi: 0, box: { x: 18, y: 22, w: 22, h: 56 } }] } });
  for (const k of [0, 12, 29]) {
    const mk = tr.roles.A.masks[k], t = actA(k);
    let inter = 0, area = 0;
    for (let y = 0; y < mk.h; y++) for (let x = 0; x < mk.w; x++) {
      if (!mk.m[y * mk.w + x]) continue;
      area++;
      const X = mk.x + x, Y = mk.y + y;
      if (X >= t.x && X < t.x + t.w && Y >= t.y && Y < t.y + t.h) inter++;
    }
    const u = area + t.w * t.h - inter;
    assert.ok(inter / u > 0.75, '第 ' + k + ' 帧遮罩 IoU ' + (inter / u).toFixed(2));
  }
});
test('负点能把相近背景色排除出遮罩', () => {
  // 人物是灰色，背景右侧也有一块同色灰板贴着人物
  const fr = [frame([{ x: 40, y: 20, w: 18, h: 50, c: [120, 120, 120] }, { x: 58, y: 20, w: 20, h: 50, c: [125, 125, 125] }])];
  const box = { x: 36, y: 17, w: 26, h: 56 };
  const without = RC.trackShot(fr, { A: { keyframes: [{ fi: 0, box }] } }).roles.A.masks[0];
  const withNeg = RC.trackShot(fr, { A: { keyframes: [{ fi: 0, box }], neg: [[68, 45], [70, 30], [70, 60]] } }).roles.A.masks[0];
  assert.ok(withNeg.area < without.area, withNeg.area + ' vs ' + without.area);
});
test('RLE 编解码往返', () => {
  const m = new Uint8Array([0, 0, 1, 1, 1, 0, 1, 0, 0, 1]);
  assert.deepStrictEqual(Array.from(RC.unrle(RC.rle(m), m.length)), Array.from(m));
  const m2 = new Uint8Array([1, 1, 0]);
  assert.deepStrictEqual(Array.from(RC.unrle(RC.rle(m2), 3)), [1, 1, 0]);
});

console.log('镜头运动与背景板');
test('全局运动：横摇 3px/帧被检出，且不受人物运动干扰', () => {
  const fr = [];
  for (let k = 0; k < 10; k++) fr.push(frame([{ x: 60 + k * 5, y: 25, w: 18, h: 50, c: [200, 40, 30] }], k * 4));
  const tr = RC.trackShot(fr, { A: { keyframes: [{ fi: 0, box: { x: 58, y: 22, w: 22, h: 56 } }] } });
  const dx = tr.gm.slice(1).map((m) => m.dx);
  assert.ok(dx.every((v) => v === -4), JSON.stringify(dx));
  assert.ok(!tr.static);
});
test('干净背景板：人物移走后的位置还原出背景', () => {
  const tr = RC.trackShot(frames, { A: { keyframes: [{ fi: 0, box: { x: 18, y: 22, w: 22, h: 56 } }] } });
  const plate = RC.cleanPlate(frames, frames.map((f, i) => [tr.roles.A.masks[i]]));
  const clean = frame([]);
  let err = 0, cnt = 0;
  for (let y = 25; y < 75; y++) for (let x = 20; x < 38; x++) { // 第 0 帧人物所在位置
    const p = (y * W + x) * 4;
    err += Math.abs(plate.data[p] - clean.data[p]) + Math.abs(plate.data[p + 2] - clean.data[p + 2]); cnt++;
  }
  assert.ok(err / cnt < 12, '平均误差 ' + (err / cnt).toFixed(1));
});

console.log('换装调色与抠像');
test('换装调色：黑衣演员 → 红衣参考，遮罩内变红、遮罩外不变', () => {
  const img = frame([{ x: 40, y: 20, w: 20, h: 50, c: [30, 30, 34] }]);
  const ref = frame([{ x: 0, y: 0, w: W, h: H, c: [190, 30, 25] }]);
  const inA = (x, y) => x >= 40 && x < 60 && y >= 20 && y < 70;
  const src = RC.colorStats(img, inA), dst = RC.colorStats(ref, () => true);
  const map = RC.recolorMap(src, dst);
  const alpha = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inA(x, y)) alpha[y * W + x] = 255;
  const before = Uint8ClampedArray.from(img.data);
  RC.applyRecolor(img.data, alpha, map, 1, 0);
  const p = (45 * W + 50) * 4;
  assert.ok(img.data[p] > img.data[p + 1] + 60, '应偏红：' + Array.from(img.data.slice(p, p + 3)));
  const q = (45 * W + 100) * 4;
  assert.deepStrictEqual(Array.from(img.data.slice(q, q + 4)), Array.from(before.slice(q, q + 4)));
});
test('参考图抠像：白底人物 → 主体保留、背景透明', () => {
  const d = new Uint8ClampedArray(100 * 120 * 4);
  for (let y = 0; y < 120; y++) for (let x = 0; x < 100; x++) {
    const p = (y * 100 + x) * 4;
    const inside = (x - 50) ** 2 / 400 + (y - 60) ** 2 / 2500 < 1;
    const c = inside ? [150, 30, 30] : [245, 245, 242];
    d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
  }
  const r = RC.cutout({ w: 100, h: 120, data: d });
  const expect = Math.PI * 20 * 50 / (100 * 120);
  assert.ok(Math.abs(r.coverage - expect) < 0.03, r.coverage.toFixed(3) + ' vs ' + expect.toFixed(3));
  assert.ok(Math.abs(r.bbox.w - 40) <= 2 && Math.abs(r.bbox.h - 100) <= 2, JSON.stringify(r.bbox));
});
test('旧版点选数据 → 按景别估计初始框', () => {
  const near = RC.boxFromPoint([0.5, 0.4], '近景', 320, 180), far = RC.boxFromPoint([0.5, 0.4], '全景', 320, 180);
  assert.ok(near.w > far.w * 2 && near.h > far.h);
});
test('采样之间插值框', () => {
  const b = RC.boxAt({ boxes: [{ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 20, h: 10 }] }, [0, 1], 0.5);
  assert.strictEqual(b.x, 5); assert.strictEqual(b.w, 15);
});

console.log('\n' + passed + ' 项通过' + (process.exitCode ? '，存在失败' : ''));
