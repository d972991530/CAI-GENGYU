// 云梦号 关卡网格。每格 CELL 米。
// # 舱壁  R 甲板护栏  , 甲板(露天)  . 室内地面
// T 宴会长桌  P 立柱  c 厨房操作台  p 冷凝管  b 货箱  w 舵台  d 床  o 衣柜
// 大写字母为门：A 主舱门  B 走廊门  C/D/E 客房门  K 后厨门  F 冷库门  L 驾驶舱门
export const CELL = 3;
export const WALL_H = 3.6;

export const MAP: string[] = [
  'RRRRRRRRRRRRRRRRRRRR##########',
  'R,,,,,,,,,,,,,,,,,,R##########',
  'R,,,,,,,,,,,,,,,,,,R##########',
  'R,,,,,,,,,,,,,,,,,,R##########',
  'R,,,,,,,,,,,,,,,,,,R##########',
  '#########A####################',
  '#..................#..#......#',
  '#..T..T..P..T..T...#..#.....d#',
  '#..T..T.....T..T...#..C......#',
  '#..................#..#......#',
  '#..P...........P...B..########',
  '#..................#..#......#',
  '#..T..T.....T..T...#..D.....d#',
  '#..T..T..P..T..T...#..#......#',
  '#..................#..#......#',
  '####################..########',
  '#......#...........#..#.....d#',
  '#..w...#..c..c..c..#..E......#',
  '#......#...........K..#......#',
  '#......#..c..c..c..#..#.....o#',
  '#......#...........#..########',
  '###L#########F################',
  '#..................###########',
  '#..p....b.....p....###########',
  '#..................###########',
  '#..p.....b....p....###########',
  '#..................###########',
  '##############################',
];

export const ROWS = MAP.length;
export const COLS = MAP[0].length;

export type DoorId = 'A' | 'B' | 'C' | 'D' | 'E' | 'K' | 'F' | 'L';
export const DOOR_IDS: DoorId[] = ['A', 'B', 'C', 'D', 'E', 'K', 'F', 'L'];

const SOLID = new Set(['#', 'R', 'T', 'P', 'c', 'p', 'b', 'w', 'd', 'o']);
// 家具类格子的碰撞半宽（米）；未列出的占满整格
export const HALF: Record<string, number> = { T: 1.3, P: 0.55, c: 1.0, p: 0.55, b: 0.8, w: 0.7, d: 1.1, o: 0.9 };
const openDoors = new Set<string>();

export function charAt(col: number, row: number): string {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return '#';
  return MAP[row][col];
}

export function isDoor(ch: string): ch is DoorId {
  return (DOOR_IDS as string[]).includes(ch);
}

export function setDoorOpen(id: DoorId, open: boolean) {
  if (open) openDoors.add(id);
  else openDoors.delete(id);
}

export function isDoorOpen(id: DoorId) {
  return openDoors.has(id);
}

export function resetDoors() {
  openDoors.clear();
}

export function blocked(col: number, row: number): boolean {
  const ch = charAt(col, row);
  if (SOLID.has(ch)) return true;
  if (isDoor(ch)) return !openDoors.has(ch);
  return false;
}

export const isExterior = (col: number, row: number) => charAt(col, row) === ',';

export function cellCenter(col: number, row: number): { x: number; z: number } {
  return { x: (col + 0.5) * CELL, z: (row + 0.5) * CELL };
}

export function toCell(x: number, z: number): { col: number; row: number } {
  return { col: Math.floor(x / CELL), row: Math.floor(z / CELL) };
}

export function findDoor(id: DoorId): { col: number; row: number } {
  for (let r = 0; r < ROWS; r++) {
    const c = MAP[r].indexOf(id);
    if (c >= 0) return { col: c, row: r };
  }
  throw new Error(`door ${id} missing`);
}

// 圆形与网格碰撞：把 (x,z) 半径 rad 的圆推出所有实心格。
export function collide(pos: { x: number; z: number }, rad: number) {
  const { col, row } = toCell(pos.x, pos.z);
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (!blocked(c, r)) continue;
      const inset = (CELL / 2) - (HALF[charAt(c, r)] ?? CELL / 2);
      const minX = c * CELL + inset, maxX = (c + 1) * CELL - inset;
      const minZ = r * CELL + inset, maxZ = (r + 1) * CELL - inset;
      const nx = Math.max(minX, Math.min(pos.x, maxX));
      const nz = Math.max(minZ, Math.min(pos.z, maxZ));
      const dx = pos.x - nx, dz = pos.z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 < rad * rad) {
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          pos.x += (dx / d) * (rad - d);
          pos.z += (dz / d) * (rad - d);
        } else {
          // 圆心在格子内部：沿最短轴推出
          const pushL = pos.x - minX, pushR = maxX - pos.x;
          const pushU = pos.z - minZ, pushD = maxZ - pos.z;
          const m = Math.min(pushL, pushR, pushU, pushD);
          if (m === pushL) pos.x = minX - rad;
          else if (m === pushR) pos.x = maxX + rad;
          else if (m === pushU) pos.z = minZ - rad;
          else pos.z = maxZ + rad;
        }
      }
    }
  }
}

// 以玩家所在格为源的 BFS 距离场，敌人与同伴沿梯度下降寻路。
export class FlowField {
  dist = new Int16Array(ROWS * COLS);
  private srcCol = -1;
  private srcRow = -1;
  private dirty = true;

  invalidate() {
    this.dirty = true;
  }

  update(col: number, row: number) {
    if (!this.dirty && col === this.srcCol && row === this.srcRow) return;
    this.dirty = false;
    this.srcCol = col;
    this.srcRow = row;
    this.dist.fill(-1);
    if (blocked(col, row)) return;
    const q: number[] = [row * COLS + col];
    this.dist[q[0]] = 0;
    for (let i = 0; i < q.length; i++) {
      const idx = q[i];
      const r = (idx / COLS) | 0, c = idx % COLS;
      const d = this.dist[idx] + 1;
      const nb = [idx - 1, idx + 1, idx - COLS, idx + COLS];
      const nc = [c - 1, c + 1, c, c];
      const nr = [r, r, r - 1, r + 1];
      for (let k = 0; k < 4; k++) {
        if (nr[k] < 0 || nr[k] >= ROWS || nc[k] < 0 || nc[k] >= COLS) continue;
        if (this.dist[nb[k]] !== -1 || blocked(nc[k], nr[k])) continue;
        this.dist[nb[k]] = d;
        q.push(nb[k]);
      }
    }
  }

  distAt(col: number, row: number): number {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return -1;
    return this.dist[row * COLS + col];
  }

  // 返回下一步应前往的格中心；无路可走返回 null
  next(x: number, z: number): { x: number; z: number } | null {
    const { col, row } = toCell(x, z);
    const here = this.distAt(col, row);
    if (here <= 0) return null;
    let best = here, bc = col, br = row;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const d = this.distAt(col + dc, row + dr);
      if (d >= 0 && d < best) {
        best = d;
        bc = col + dc;
        br = row + dr;
      }
    }
    return bc === col && br === row ? null : cellCenter(bc, br);
  }
}

// 两点之间是否被网格遮挡（步进采样）
export function lineOfSight(ax: number, az: number, bx: number, bz: number): boolean {
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  const steps = Math.ceil(len / (CELL * 0.25));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const { col, row } = toCell(ax + dx * t, az + dz * t);
    const ch = charAt(col, row);
    if (ch === '#' || ch === 'R' || ch === 'P' || ch === 'p' || (isDoor(ch) && !isDoorOpen(ch))) return false;
  }
  return true;
}
