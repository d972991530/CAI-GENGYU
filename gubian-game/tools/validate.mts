// 关卡校验：入口 / 出口 / 钥匙门 / 剧情门 / 物品与刷怪点是否可达
// 用法：npm run validate
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '../src/chapters/data');
const WALLS = new Set(['#', '%', '&', '|', '$']);
const SOLID = new Set(['#', '%', '&', '|', 'R', 'T', 'P', 'c', 'p', 'b', 'k', 'x', 't', 'm', 'd', 'o', 'w', 'h']);
const isDoor = (ch: string) => ch >= '1' && ch <= '9';

let failures = 0;
const files = readdirSync(dataDir).filter((f) => f.endsWith('.ts')).sort();
for (const f of files) {
  const mod = await import(pathToFileURL(join(dataDir, f)).href);
  const data = Object.values(mod)[0] as any;
  let script = '';
  try { script = readFileSync(join(here, `../src/chapters/${data.side ?? `ch${data.id}`}.ts`), 'utf8'); } catch { script = '*'; }
  const errs: string[] = [];
  const warn: string[] = [];
  const W = Math.max(...data.map.map((r: string) => r.length));
  const map: string[] = data.map.map((r: string) => r.padEnd(W, '#'));
  const H = map.length;
  data.map.forEach((r: string, i: number) => { if (r.length !== W) warn.push(`第 ${i} 行长度 ${r.length} ≠ ${W}`); });
  const at = (c: number, r: number) => (r < 0 || r >= H || c < 0 || c >= W ? '#' : map[r][c]);
  // 外圈必须封闭
  for (let c = 0; c < W; c++) for (const r of [0, H - 1]) if (!WALLS.has(at(c, r)) && at(c, r) !== 'R' && at(c, r) !== 't' && at(c, r) !== 'h') errs.push(`地图边缘开口 (${c},${r})`);
  for (let r = 0; r < H; r++) for (const c of [0, W - 1]) if (!WALLS.has(at(c, r)) && at(c, r) !== 'R' && at(c, r) !== 't' && at(c, r) !== 'h') errs.push(`地图边缘开口 (${c},${r})`);

  let start: [number, number] | null = null;
  const doorsInMap = new Map<string, [number, number]>();
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = map[r][c];
    if (ch === '@') { if (start) errs.push('起点 @ 不唯一'); start = [c, r]; }
    if (isDoor(ch)) {
      if (doorsInMap.has(ch)) errs.push(`门 ${ch} 在地图里出现了多次`);
      doorsInMap.set(ch, [c, r]);
      // 门框：一个方向两侧是墙，另一个方向两侧可通行
      const wallH = WALLS.has(at(c - 1, r)) && WALLS.has(at(c + 1, r));
      const wallV = WALLS.has(at(c, r - 1)) && WALLS.has(at(c, r + 1));
      const openH = !SOLID.has(at(c - 1, r)) && !WALLS.has(at(c - 1, r)) && !SOLID.has(at(c + 1, r));
      const openV = !SOLID.has(at(c, r - 1)) && !SOLID.has(at(c, r + 1));
      if (!((wallH && openV) || (wallV && openH))) errs.push(`门 ${ch} (${c},${r}) 门框不正确（两侧不是墙或前后被堵）`);
    }
  }
  if (!start) errs.push('缺少起点 @');
  for (const d of data.doors) {
    if (!doorsInMap.has(d.id)) errs.push(`门 ${d.id} 已声明但地图中不存在`);
    if (d.flag) {
      if (!d.trigger) errs.push(`剧情门 ${d.id} 缺少 trigger`);
      if (script !== '*' && !script.includes(`setFlag('${d.flag}')`) && !script.includes(`openDoor('${d.id}')`)) errs.push(`剧情门 ${d.id} 的条件 ${d.flag} 在剧本里从未被触发 → 会卡关`);
    }
  }
  for (const id of doorsInMap.keys()) if (!data.doors.find((d: any) => d.id === id)) warn.push(`门 ${id} 未声明（视为普通门）`);

  const passable = (c: number, r: number, open: Set<string>, secrets: boolean) => {
    const ch = at(c, r);
    if (ch === '$') return secrets;
    if (SOLID.has(ch)) return false;
    if (isDoor(ch)) {
      const d = data.doors.find((x: any) => x.id === ch);
      return !d || (!d.key && !d.flag) || open.has(ch);
    }
    return true;
  };
  const bfs = (open: Set<string>, secrets: boolean) => {
    const seen = new Set<number>();
    if (!start) return seen;
    const q: [number, number][] = [start];
    seen.add(start[1] * W + start[0]);
    while (q.length) {
      const [c, r] = q.shift()!;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (seen.has(nr * W + nc) || !passable(nc, nr, open, secrets)) continue;
        seen.add(nr * W + nc);
        q.push([nc, nr]);
      }
    }
    return seen;
  };
  const reachNear = (seen: Set<number>, c: number, r: number) => {
    if (seen.has(r * W + c)) return true;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => seen.has((r + dr) * W + c + dc));
  };
  // 按剧情推进模拟：拿钥匙 → 开钥匙门；到达触发点 → 剧情门打开
  const open = new Set<string>();
  const keys = new Set<string>();
  let seen = bfs(open, false);
  for (let iter = 0; iter < 30; iter++) {
    let changed = false;
    for (const it of data.items) if (it.type.startsWith('key_') && reachNear(seen, it.at[0], it.at[1]) && !keys.has(it.type.slice(4))) { keys.add(it.type.slice(4)); changed = true; }
    for (const d of data.doors) {
      if (open.has(d.id)) continue;
      if (d.key && keys.has(d.key)) { open.add(d.id); changed = true; }
      if (d.flag && d.trigger) {
        const m = data.marks[d.trigger];
        if (!m) errs.push(`剧情门 ${d.id} 的触发点 ${d.trigger} 不存在`);
        else if (reachNear(seen, m[0], m[1])) { open.add(d.id); changed = true; }
      }
    }
    if (!changed) break;
    seen = bfs(open, false);
  }
  for (const d of data.doors) if (!open.has(d.id) && (d.key || d.flag)) errs.push(`门 ${d.id} 永远打不开（${d.key ? `${d.key} 钥匙拿不到` : `触发点 ${d.trigger} 到不了`}）`);
  // 出口
  let exits = 0;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (map[r][c] === 'X') { exits++; if (!seen.has(r * W + c)) errs.push(`出口 (${c},${r}) 到达不了`); }
  if (!exits) errs.push('没有出口 X');
  // 剧情路线
  for (const name of data.route) {
    const m = data.marks[name];
    if (!m) { errs.push(`路线点 ${name} 未定义`); continue; }
    if (!reachNear(seen, m[0], m[1])) errs.push(`路线点 ${name} (${m}) 到达不了`);
  }
  // 标记点不能嵌在墙里
  for (const [name, m] of Object.entries(data.marks) as [string, [number, number]][]) {
    if (name === 'startYaw') continue;
    const ch = at(m[0], m[1]);
    if (WALLS.has(ch) && ch !== '$') errs.push(`标记 ${name} (${m}) 在墙体里`);
    else if (!reachNear(seen, m[0], m[1]) && !reachNear(bfs(open, true), m[0], m[1])) warn.push(`标记 ${name} (${m}) 玩家到不了（只能用于远处刷怪）`);
  }
  // 物品
  const all = bfs(open, true);
  for (const it of data.items) {
    const ch = at(it.at[0], it.at[1]);
    if (SOLID.has(ch) || WALLS.has(ch)) errs.push(`物品 ${it.type} (${it.at}) 放在实心格子里`);
    const ok = it.secret ? all.has(it.at[1] * W + it.at[0]) : seen.has(it.at[1] * W + it.at[0]);
    if (!ok) errs.push(`物品 ${it.type} (${it.at}) 拿不到${it.secret ? '（含暗门）' : ''}`);
  }
  // 剧本引用的标记点与敌人种类必须存在
  if (script !== '*') {
    const kinds = readFileSync(join(here, '../src/entities/enemy.ts'), 'utf8');
    const refRe = /(?:\.at|\.near|\.spawn\([^,()]+,|\.npc\([^,()]+,|\.interact\([^,()]+,|\.addInteract\([^,()]+,|\.prop\([^,()]+,)\s*\(?\s*'(\w+)'/g;
    for (const m of script.matchAll(refRe)) if (!data.marks[m[1]]) errs.push(`剧本引用了不存在的位置点 '${m[1]}'`);
    for (const m of script.matchAll(/\.spawn\(\s*'(\w+)'/g)) if (!new RegExp(`\\b${m[1]}: \\{ name`).test(kinds)) errs.push(`剧本使用了不存在的敌人种类 '${m[1]}'`);
    for (const m of script.matchAll(/\.spawn\([^,()]+,\s*\[(\d+),\s*(\d+)\]/g)) {
      const c = +m[1], r = +m[2];
      if (SOLID.has(at(c, r)) || WALLS.has(at(c, r))) errs.push(`剧本刷怪点 (${c},${r}) 在实心格子里`);
    }
    for (const m of script.matchAll(/\.addPickup\('(\w+)',\s*(\d+),\s*(\d+)/g)) {
      const c = +m[2], r = +m[3];
      if (SOLID.has(at(c, r)) || WALLS.has(at(c, r))) errs.push(`剧本补给 ${m[1]} (${c},${r}) 在实心格子里`);
      else if (!all.has(r * W + c)) errs.push(`剧本补给 ${m[1]} (${c},${r}) 拿不到`);
    }
  }
  // 灯光
  for (const l of data.lights) if (l.at[0] >= W || l.at[1] >= H) errs.push(`灯光 (${l.at}) 越界`);
  const name = `第${data.id}章 ${data.title}`;
  if (errs.length) { failures++; console.log(`✗ ${name}`); errs.forEach((e) => console.log('   错误：' + e)); }
  else console.log(`✓ ${name}：${W}×${H}，门 ${data.doors.length}，物品 ${data.items.length}，出口 ${exits}，路线 ${data.route.length} 点全部可达`);
  warn.forEach((w) => console.log('   提示：' + w));
}
process.exit(failures ? 1 : 0);
