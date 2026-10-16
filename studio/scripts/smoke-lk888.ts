// 七七八AI 即梦真实验收：生成 1 张 1K 图（不带参考图），再生成 1 张带 1 张参考图的图（验证平台是否接受 data URI）
// 用法：LK888_API_KEY=sk-xxx npx tsx scripts/smoke-lk888.ts
import fs from 'node:fs';
import { seedreamImage } from '../server/providers/lk888.ts';

const key = process.env.LK888_API_KEY ?? '';
if (!key) { console.error('请设置环境变量 LK888_API_KEY'); process.exit(1); }
const model = process.env.LK888_MODEL ?? 'doubao-seedream-5-0-pro-260628';

const base = await fetch(`${process.env.LK888_BASE_URL ?? 'https://api.lk888.ai'}/v1/models`, { headers: { Authorization: `Bearer ${key}` } });
console.log(`模型清单：HTTP ${base.status}`);

console.log('① 文生图（1K, 9:16）…');
const t0 = Date.now();
const a = await seedreamImage(key, model, '国漫厚涂风格，雨夜霓虹街头，一位穿米色风衣的年轻女子回头，电影感光影', '9:16', [], '1K');
fs.writeFileSync('smoke-1.png', a.data);
console.log(`   成功：smoke-1.png ${(a.data.length / 1024).toFixed(0)}KB  ${a.mimeType}  费用 ${a.cost}  用时 ${((Date.now() - t0) / 1000).toFixed(0)}s`);

console.log('② 图生图（把 ① 作为参考图，data URI 方式）…');
try {
  const b = await seedreamImage(key, model, '同一位女子坐在咖啡馆窗边看书，保持脸和服装一致', '9:16',
    [{ data: a.data.toString('base64'), mimeType: a.mimeType, label: 'character 女主' }], '1K');
  fs.writeFileSync('smoke-2.png', b.data);
  console.log(`   成功：smoke-2.png，平台接受 data URI 参考图，费用 ${b.cost}`);
} catch (e) {
  console.log(`   失败：${(e as Error).message}\n   → 平台可能不接受 data URI，请在服务器设置 PUBLIC_BASE_URL 后再试`);
}
