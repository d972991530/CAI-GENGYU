/* 镜头语言层测试：node director-desk/test/grammar.test.js */
'use strict';
const assert = require('assert');
const path = require('path');
for (const f of ['util', 'grammar']) require(path.join(__dirname, '../js/core', f + '.js'));
const G = globalThis.SC.grammar;
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + (e.stack || e)); process.exitCode = 1; }
}
const W = 320, H = 180;
const still = (n) => Array.from({ length: n }, () => ({ dx: 0, dy: 0 }));
const box = (cx, cy, h) => ({ x: cx - h * 0.2, y: cy - h / 2, w: h * 0.4, h });

test('景别：主体高度占比 → 远/全/中/特', () => {
  assert.strictEqual(G.sizeFromHeight(null), 'EWS');
  assert.strictEqual(G.sizeFromHeight(0.3), 'LS');
  assert.strictEqual(G.sizeFromHeight(0.6), 'FS');
  assert.strictEqual(G.sizeFromHeight(0.85), 'MS');
  assert.strictEqual(G.sizeFromHeight(1.2, true), 'CU');
});
test('景别：遮罩面积占比优先于框高', () => {
  assert.strictEqual(G.sizeFromArea(0.2), 'MS');
  assert.strictEqual(G.sizeFromArea(0.45), 'CU');
  const r = G.analyze({ dur: 1, W, H, gm: still(10), subjects: [{ boxes: Array.from({ length: 10 }, () => box(160, 100, 200)), areas: Array(10).fill(0.22) }] });
  assert.strictEqual(r.size, 'MS', '腰部被裁但只占 22% 画面 → 中景');
});
test('运动：固定机位 + 主体右移 → static，主体方向 →', () => {
  const r = G.analyze({ dur: 2, W, H, gm: still(30), subjects: [{ boxes: Array.from({ length: 30 }, (_, k) => box(60 + k * 6, 90, 100)) }] });
  assert.strictEqual(r.move, 'static'); assert.strictEqual(r.subjDir, 'R'); assert.strictEqual(r.size, 'FS');
});
test('运动：镜头右摇且主体被跟住 → track RIGHT', () => {
  // 内容每帧左移 4px（镜头右移），主体在画面里基本不动
  const gm = still(30).map((m, i) => (i ? { dx: -4, dy: 0 } : m));
  const r = G.analyze({ dur: 2, W, H, gm, subjects: [{ boxes: Array.from({ length: 30 }, () => box(160, 90, 100)) }] });
  assert.strictEqual(r.move, 'track'); assert.strictEqual(r.camDir, 'R');
  assert.strictEqual(G.caption(r), 'FULL – TRACK RIGHT →');
});
test('主体变大：背景不缩放 → 主体逼近镜头（不是推镜）；背景也缩放 → PUSH IN', () => {
  const grow = { dur: 2, W, H, gm: still(30), subjects: [{ boxes: Array.from({ length: 30 }, (_, k) => box(160, 90, 80 + k * 3)) }] };
  const a = G.analyze(grow);
  assert.strictEqual(a.move, 'static'); assert.strictEqual(a.subjDir, 'IN');
  assert.strictEqual(G.analyze(Object.assign({ bgScale: 0.2 }, grow)).move, 'push');
  const shrink = { dur: 2, W, H, gm: still(30), bgScale: -0.2, subjects: [{ boxes: Array.from({ length: 30 }, (_, k) => box(160, 90, 170 - k * 3)) }] };
  assert.strictEqual(G.analyze(shrink).move, 'pull');
});
test('固定机位里偶发的误判帧不影响结论（中值）', () => {
  const gm = still(40); gm[10] = { dx: -24, dy: -16 }; gm[11] = { dx: -12, dy: -8 }; gm[25] = { dx: 4, dy: -20 };
  assert.strictEqual(G.analyze({ dur: 2.6, W, H, gm, subjects: [] }).move, 'static');
});
test('运动：抖动的不规则全局运动 → 手持', () => {
  const gm = still(30).map((m, i) => (i ? { dx: i % 2 ? 4 : -4, dy: i % 4 < 2 ? 4 : -4 } : m));
  const r = G.analyze({ dur: 2, W, H, gm, subjects: [] });
  assert.ok(r.handheld); assert.strictEqual(r.move, 'handheld'); assert.strictEqual(r.size, 'EWS');
});
test('文字标签：中英文术语', () => {
  assert.deepStrictEqual(G.parseTags('近景 · 缓慢推近'), { size: 'MS', move: 'push' });
  assert.deepStrictEqual(G.parseTags('Wide - Track Right'), { size: 'LS', move: 'track', dir: 'R' });
  assert.strictEqual(G.parseTags('低角度中景').angle, 'low');
  assert.strictEqual(G.parseTags('特写→中景').size, 'CU');
  assert.strictEqual(G.parseTags('极特写 眼睛').size, 'ECU');
});
test('剪辑语法：跳切、越轴、景别跨度、方向连贯', () => {
  const jump = G.transition({ size: 'MS', group: 'A' }, { size: 'MS', group: 'A' });
  assert.ok(jump.notes.some((n) => n.kind === 'jump') && jump.cost > 0);
  const axis = G.transition({ size: 'FS', dir: 'R', group: 'A' }, { size: 'MS', dir: 'L', group: 'A' });
  assert.ok(axis.notes.some((n) => n.kind === 'axis'));
  const leap = G.transition({ size: 'EWS' }, { size: 'CU' });
  assert.ok(leap.notes.some((n) => n.kind === 'leap'));
  const flow = G.transition({ size: 'LS', dir: 'R', group: 'A' }, { size: 'MS', dir: 'R', group: 'A' });
  assert.ok(flow.cost < 0);
  assert.strictEqual(G.check([{ size: 'MS', group: 'A' }, { size: 'MS', group: 'A' }, { size: 'CU', group: 'A' }]).length, 1);
});
console.log('\n' + passed + ' 项通过' + (process.exitCode ? '，存在失败' : ''));
