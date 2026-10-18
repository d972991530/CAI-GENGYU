/* 核心算法单元测试：node director-desk/test/core.test.js */
'use strict';
const assert = require('assert');
const path = require('path');
for (const f of ['util', 'text', 'script', 'hungarian', 'features', 'grammar', 'solver', 'export'])
  require(path.join(__dirname, '../js/core', f + '.js'));
require(path.join(__dirname, '../js/media/analyzer.js')); // 只用到其中的纯函数 audioFeatures
const SC = globalThis.SC;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + (e.stack || e)); process.exitCode = 1; }
}

// 合成素材：给定色调/运动，生成采样序列，可在中间插入硬切
function synthMedia(name, dur, looks, opts) {
  opts = opts || {};
  const fps = 6, n = Math.round(dur * fps) + 1;
  const s = { t: [], hist: [], luma: [], lstd: [], sat: [], warm: [], motion: [] };
  for (let i = 0; i < n; i++) {
    const t = i / fps;
    const look = looks.find((l) => t >= l.from && t < (l.to == null ? Infinity : l.to)) || looks[looks.length - 1];
    const h = new Array(20).fill(0);
    h[look.hue] = 0.8; h[(look.hue + 1) % 12] = 0.2;
    h[12 + look.lum] = 1;
    s.t.push(t); s.hist.push(h); s.luma.push(look.lum / 8 + 0.05); s.lstd.push(0.2); s.sat.push(look.sat || 0.4); s.warm.push(look.warm || 0);
    s.motion.push(look.motion + (i % 3) * 0.002);
  }
  const audio = opts.audio ? { rate: 20, rms: new Array(Math.ceil(dur * 20)).fill(opts.audio), speech: new Array(Math.ceil(dur * 20)).fill(opts.speech || 0) } : null;
  const m = { id: 'm_' + name, name, duration: dur, samples: s, audio, note: opts.note || '' };
  m.shots = SC.buildShots(m, 0.3, 0.6);
  return m;
}

console.log('剧本解析');
const script = SC.parseScript(SC.SAMPLE_SCRIPT);
test('示例剧本：46 段、3 线、4 幕、12 条伏笔', () => {
  assert.strictEqual(script.segments.length, 46);
  assert.strictEqual(script.lines.length, 3);
  assert.strictEqual(script.acts.length, 4);
  assert.strictEqual(script.chains.length, 12);
  assert.strictEqual(script.warnings.length, 0, script.warnings.join('\n'));
  assert.strictEqual(Math.round(script.duration), 888);
});
test('序列化后再解析保持一致', () => {
  const again = SC.parseScript(SC.serializeScript(script));
  assert.deepStrictEqual(again.segments.map((s) => [s.id, s.start, s.end]), script.segments.map((s) => [s.id, s.start, s.end]));
  assert.strictEqual(again.chains.length, 12);
});
test('空格分隔、时间在前、带括号编号的写法也能识别', () => {
  const sc = SC.parseScript('(A1) 开场 00:00-00:10 描述\nB2 00:10-00:20 | 追逐 | 打斗 @0.9');
  assert.deepStrictEqual(sc.segments.map((s) => [s.id, s.title]), [['A1', '开场'], ['B2', '追逐']]);
  assert.strictEqual(sc.segments[1].intensity, 0.9);
});
test('展平：插入段打断外层段落（B12 被 A13、C16 切开）', () => {
  const pieces = SC.flattenScript(script);
  const b12 = pieces.filter((p) => p.seg === 'B12');
  assert.ok(b12.length >= 3, 'B12 应被切成多块，实际 ' + b12.length);
  let t = 0;
  for (const p of pieces) { assert.ok(Math.abs(p.start - t) < 1e-6); t = p.end; }
  assert.ok(Math.abs(t - script.duration) < 1e-6);
});

console.log('文本与编号');
test('文件名编号识别', () => {
  const ids = new Set(['A3', 'B12', 'C17']);
  assert.strictEqual(SC.idFromName('A3_流落街头.mp4', ids), 'A3');
  assert.strictEqual(SC.idFromName('shot-b-12 v2.mov', ids), 'B12');
  assert.strictEqual(SC.idFromName('xie_c17.mp4', ids), 'C17');
  assert.strictEqual(SC.idFromName('1.mp4', ids), null);
});
test('中文相似度：相关文本高于无关文本', () => {
  const idx = new SC.TextIndex(['女娃在仓库里拔出蒙尘的剑', '申春喝醉讲那一票', '月下练剑']);
  const q = idx.vec('仓库 拔剑 蒙尘');
  assert.ok(SC.cosine(q, idx.vec('女娃在仓库里拔出蒙尘的剑')) > SC.cosine(q, idx.vec('申春喝醉讲那一票')));
});

console.log('匈牙利算法');
test('3×4 最优指派', () => {
  const r = SC.hungarian([[4, 1, 3, 9], [2, 0, 5, 9], [3, 2, 2, 9]]);
  const total = r.reduce((s, c, i) => s + [[4, 1, 3, 9], [2, 0, 5, 9], [3, 2, 2, 9]][i][c], 0);
  assert.strictEqual(total, 5);
});
test('与暴力枚举一致（随机 6×8）', () => {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let rep = 0; rep < 20; rep++) {
    const C = Array.from({ length: 6 }, () => Array.from({ length: 8 }, () => Math.round(rnd() * 50)));
    const r = SC.hungarian(C);
    const got = r.reduce((s, c, i) => s + C[i][c], 0);
    let best = Infinity;
    const used = new Array(8).fill(false);
    (function rec(i, acc) { if (acc >= best) return; if (i === 6) { best = acc; return; } for (let j = 0; j < 8; j++) if (!used[j]) { used[j] = true; rec(i + 1, acc + C[i][j]); used[j] = false; } })(0, 0);
    assert.strictEqual(got, best);
  }
});

console.log('镜头切分');
test('硬切检测：两种色调在 4s 处切换 → 2 个镜头', () => {
  const m = synthMedia('cut.mp4', 8, [{ from: 0, to: 4, hue: 1, lum: 6, motion: 0.02 }, { from: 4, hue: 7, lum: 2, motion: 0.1 }]);
  assert.strictEqual(m.shots.length, 2);
  assert.ok(Math.abs(m.shots[0].out - 4) < 0.2, '切点 ' + m.shots[0].out);
});
test('短于最小镜头长度的碎片被合并', () => {
  const m = synthMedia('flash.mp4', 6, [{ from: 0, to: 3, hue: 1, lum: 6, motion: 0.02 }, { from: 3, to: 3.2, hue: 6, lum: 7, motion: 0.02 }, { from: 3.2, hue: 1, lum: 6, motion: 0.02 }]);
  assert.ok(m.shots.every((s) => s.out - s.in >= 0.6 - 1e-6));
});
test('阈值越低切得越碎（单调）', () => {
  const m = synthMedia('grad.mp4', 10, [0, 1, 2, 3, 4].map((k) => ({ from: k * 2, to: k * 2 + 2, hue: k * 2, lum: 2 + (k % 3), motion: 0.03 })));
  const a = SC.cutsToShots(SC.detectCuts(m.samples, 0.15), 10, 0.6).length;
  const b = SC.cutsToShots(SC.detectCuts(m.samples, 0.9), 10, 0.6).length;
  assert.ok(a >= b && a === 5, a + ' vs ' + b);
});

console.log('线性求解');
// 三条线三种画面风格：A 暖橙皮影、B 冷蓝夜景、C 绿调回忆
const LOOK = { A: { hue: 1, lum: 5, warm: 0.3, sat: 0.7 }, B: { hue: 8, lum: 1, warm: -0.2, sat: 0.3 }, C: { hue: 4, lum: 4, warm: 0, sat: 0.2 } };
function lineClip(name, line, dur, motion, extra) {
  return synthMedia(name, dur, [Object.assign({ from: 0 }, LOOK[line], { motion })], extra);
}
test('按文件名编号精确对位，且交叉剪辑按剧本时间排布', () => {
  const sc = SC.parseScript('# 线: A | 影 \n# 线: B | 实\nB1 | 夜袭 | 00:00-00:20 | 打斗\nA1 | 影戏 | 00:08-00:12 | 皮影');
  const media = [lineClip('B1_夜袭.mp4', 'B', 25, 0.1), lineClip('A1_皮影.mp4', 'A', 6, 0.02)];
  const r = SC.solve({ script: sc, media });
  const seq = r.items.map((i) => (i.type === 'clip' ? i.seg : '-') + ':' + i.len.toFixed(1));
  assert.deepStrictEqual(seq, ['B1:8.0', 'A1:4.0', 'B1:8.0']);
  // B1 两块在源素材上是连续的（被插入镜头打断后接着播）
  const b = r.items.filter((i) => i.seg === 'B1');
  assert.ok(Math.abs(b[0].srcOut - b[1].srcIn) < 1e-6);
  assert.strictEqual(r.report.coverage, 1);
});
test('无编号时靠备注文字 + 视觉签名归位', () => {
  const sc = SC.parseScript('# 线: A | 影\n# 线: B | 实\n# 线: C | 忆\nA1 | 妖猴屠船 | 00:00-00:05 | 皮影 妖猴 屠船\nB1 | 从天而降 | 00:05-00:10 | 黑影 房梁 落下\nC1 | 江边 | 00:10-00:15 | 江边 少女 睁眼\nA2 | 女娃斩猴 | 00:15-00:20 | 女娃 举刀 小猴');
  const media = [
    lineClip('a_ref.mp4', 'A', 5, 0.05), lineClip('x1.mp4', 'B', 5, 0.08), lineClip('x2.mp4', 'C', 5, 0.03), lineClip('x3.mp4', 'A', 5, 0.06),
  ];
  media[0].line = 'A'; // 手动标注一个 A 线样本
  media[1].note = '黑影从房梁落下';
  media[2].note = '江边少女睁开眼';
  media[3].note = '皮影女娃举刀斩小猴';
  const r = SC.solve({ script: sc, media });
  const bySeg = Object.fromEntries(r.report && r.items.filter((i) => i.type === 'clip').map((i) => [i.seg, i.name]));
  assert.strictEqual(bySeg.B1, 'x1.mp4');
  assert.strictEqual(bySeg.C1, 'x2.mp4');
  assert.strictEqual(bySeg.A2, 'x3.mp4');
});
test('开放集线索归属：远离所有已知质心的镜头归到无样本线索', () => {
  const sc = SC.parseScript('# 线: A | 影\n# 线: B | 实\n# 线: C | 忆\nA1 | 一 | 00:00-00:05 | x\nB1 | 二 | 00:05-00:10 | y\nC1 | 三 | 00:10-00:15 | z');
  const media = [lineClip('A1.mp4', 'A', 5, 0.05), lineClip('B1.mp4', 'B', 5, 0.05), lineClip('unknown.mp4', 'C', 5, 0.05)];
  const r = SC.solve({ script: sc, media });
  const u = r.shots.find((s) => s.name === 'unknown.mp4');
  assert.strictEqual(u.lineGuess, 'C', JSON.stringify(u.lineProb));
  assert.strictEqual(r.items.find((i) => i.name === 'unknown.mp4').seg, 'C1');
});
test('置信度不足的镜头不硬塞，段落留空并报告伏笔断链', () => {
  const sc = SC.parseScript('# 线: A | 影\nA1 | 开场 | 00:00-00:05 | x\nA2 | 收尾 | 00:05-00:10 | y\n# 伏笔: 链 | ○A1 ●A2');
  const media = [lineClip('A1.mp4', 'A', 5, 0.05)];
  const r = SC.solve({ script: sc, media, params: { minScore: 0.9 } });
  assert.ok(r.items.some((i) => i.type === 'gap' && i.seg === 'A2'));
  assert.strictEqual(r.report.chains[0].status, 'broken');
});
test('锁定（pin）强制指派、排除生效', () => {
  const sc = SC.parseScript('# 线: A | 影\nA1 | 一 | 00:00-00:05 | x\nA2 | 二 | 00:05-00:10 | y');
  const media = [lineClip('A1.mp4', 'A', 5, 0.05), lineClip('other.mp4', 'A', 5, 0.05)];
  const r = SC.solve({ script: sc, media, overrides: { 'm_other.mp4#0': { pin: 'A1' }, 'm_A1.mp4#0': { exclude: true } } });
  const a1 = r.items.find((i) => i.seg === 'A1' && i.type === 'clip');
  assert.strictEqual(a1.name, 'other.mp4');
  assert.ok(!r.items.some((i) => i.name === 'A1.mp4'));
});
test('超长素材被裁到段落时长，高强度段落取运动峰值窗口', () => {
  const sc = SC.parseScript('# 线: B | 实\nB1 | 激战 | 00:00-00:03 | 打斗 @0.95');
  const m = synthMedia('B1.mp4', 9, [{ from: 0, to: 6, hue: 8, lum: 1, motion: 0.01 }, { from: 6, hue: 8, lum: 1, motion: 0.3 }]);
  m.shots = SC.cutsToShots([], 9, 0.6).map((sh) => Object.assign(sh, SC.shotFeatures(m.samples, null, sh.in, sh.out)));
  const r = SC.solve({ script: sc, media: [m] });
  const c = r.items[0];
  assert.ok(Math.abs(c.len - 3) < 1e-6);
  assert.ok(c.srcIn >= 5.5, '应取后段高运动窗口，实际 ' + c.srcIn);
});

console.log('非线性求解');
test('穿插参数：crossCut=1 时两组交替，=0 时成块', () => {
  const media = [];
  for (let i = 0; i < 4; i++) media.push(lineClip('a' + i + '.mp4', 'A', 3, 0.05));
  for (let i = 0; i < 4; i++) media.push(lineClip('b' + i + '.mp4', 'B', 3, 0.05));
  const run = (cc) => {
    const r = SC.solve({ media, params: { crossCut: cc, continuity: 0, clusters: 2 } });
    return r.report.switches;
  };
  assert.ok(run(1) >= 5, 'alternate ' + run(1));
  assert.ok(run(0) <= 2, 'blocks ' + run(0));
});
test('目标时长收敛', () => {
  const media = [];
  for (let i = 0; i < 10; i++) media.push(lineClip('c' + i + '.mp4', i % 2 ? 'A' : 'C', 6, 0.02 + i * 0.02));
  const r = SC.solve({ media, params: { target: 20, asl: 2 } });
  assert.ok(Math.abs(r.report.total - 20) < 1.0, 'total ' + r.report.total);
});
test('情绪曲线：高潮段平均能量高于建置段', () => {
  const media = [];
  for (let i = 0; i < 12; i++) media.push(lineClip('e' + String(i).padStart(2, '0') + '.mp4', 'A', 3, 0.01 + ((i * 7) % 12) * 0.02));
  const r = SC.solve({ media, params: { orderKeep: 0, continuity: 0, crossCut: 0, clusters: 1, curve: [0.1, 0.3, 0.7, 1] } });
  const clips = r.items;
  const sh = new Map(r.shots.map((s) => [s.id, s]));
  const e = clips.map((c) => sh.get(c.shotId).energy);
  const third = Math.floor(e.length / 3);
  assert.ok(SC.mean(e.slice(-third)) > SC.mean(e.slice(0, third)));
});

console.log('镜头语言');
test('线性：剧本写“特写”的段落优先匹配标注为特写的镜头', () => {
  const sc = SC.parseScript('# 线: A | 影\nA1 | 怒视 | 00:00-00:03 | 特写，眼神锁定\nA2 | 对峙 | 00:03-00:06 | 远景，两人对峙');
  const media = [lineClip('take_1.mp4', 'A', 3, 0.05), lineClip('take_2.mp4', 'A', 3, 0.05)];
  media[0].note = '远景'; media[1].note = '特写';
  const r = SC.solve({ script: sc, media });
  const bySeg = Object.fromEntries(r.items.filter((i) => i.type === 'clip').map((i) => [i.seg, i.name]));
  assert.strictEqual(bySeg.A1, 'take_2.mp4'); assert.strictEqual(bySeg.A2, 'take_1.mp4');
});
test('非线性：镜头语法权重让同景别同主体的镜头不相邻（防跳切）', () => {
  const media = [];
  const sizes = ['中景', '中景', '中景', '远景', '远景', '特写'];
  sizes.forEach((z, i) => { const m = lineClip('g' + i + '.mp4', 'A', 3, 0.05); m.note = z; media.push(m); });
  // 源顺序是 中中中远远特：只按源顺序会连出 3 处跳切
  const run = (w) => SC.solve({ media, params: { wGrammar: w, wSizeArc: 0, orderKeep: 0.6, continuity: 0, crossCut: 0, clusters: 1, curve: [0.5, 0.5, 0.5, 0.5] } }).report.grammar.filter((g) => g.kind === 'jump').length;
  assert.ok(run(0) >= 2, 'baseline ' + run(0));
  assert.ok(run(4) < run(0), 'with ' + run(4) + ' vs without ' + run(0));
});

console.log('音频');
test('对白检测：浊音谐波信号判为对白，白噪声与静音不是', () => {
  const sr = 16000, sec = 2;
  const voiced = new Float32Array(sr * sec), noise = new Float32Array(sr * sec);
  let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < voiced.length; i++) {
    const t = i / sr, env = 0.5 + 0.5 * Math.sin(2 * Math.PI * 4 * t);
    let v = 0;
    for (let k = 3; k <= 20; k++) v += Math.sin(2 * Math.PI * 150 * k * t) / k;
    voiced[i] = 0.3 * env * v;
    noise[i] = 0.3 * rnd();
  }
  const pad = (x) => { const y = new Float32Array(x.length + sr); y.set(x, sr); return y; }; // 前 1 秒静音作底噪
  const a = SC.audioFeatures(pad(voiced), sr), b = SC.audioFeatures(pad(noise), sr);
  const frac = (f) => SC.mean(f.speech.slice(20));
  assert.ok(frac(a) > 0.5, 'voiced ' + frac(a));
  assert.ok(frac(b) < 0.2, 'noise ' + frac(b));
  assert.ok(SC.mean(a.speech.slice(0, 18)) === 0, '静音段不应判为对白');
});

console.log('导出');
test('EDL / FCPXML / ffmpeg 脚本生成', () => {
  const sc = SC.parseScript('# 线: A | 影\nA1 | 一 | 00:00-00:05 | x\nA2 | 二 | 00:05-00:10 | y');
  const media = [lineClip('A1.mp4', 'A', 5, 0.05)];
  const r = SC.solve({ script: sc, media });
  SC.layout(r.items);
  const ctx = { items: r.items, media, title: 'T', fps: 25, width: 1920, height: 1080 };
  const edl = SC.exportEDL(ctx);
  assert.ok(/^TITLE: T/m.test(edl) && /001  AX/.test(edl) && /FROM CLIP NAME: A1.mp4/.test(edl));
  const x = SC.exportFCPXML(ctx);
  assert.ok(x.includes('<fcpxml version="1.9">') && x.includes('<gap') && x.includes('<asset-clip'));
  const sh = SC.exportFFmpeg(ctx, 'sh');
  assert.ok(sh.includes('concat') && sh.includes('A1.mp4'));
});

console.log('\n' + passed + ' 项通过' + (process.exitCode ? '，存在失败' : ''));
