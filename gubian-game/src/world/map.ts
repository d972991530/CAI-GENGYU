// 网格地图（每格 CELL 米），支持多章节切换。
// 墙：# 主墙  % 副墙  & 壁画墙  | 培养舱墙  $ 暗门（看起来是墙，互动可打开）
// 地面：. 室内  , 露天  ~ 积水（减速、耗氧）  = 铁轨（可通电）  X 出口
// 家具（实心）：R 护栏  T 长桌  P 立柱  c 操作台  p 冷凝管  b 货箱  k 培养舱  x 祭坛  t 枯树  m 矿车  d 床  o 衣柜  w 舵台  h 房屋
// 门：数字 1-9（在章节数据里声明钥匙/剧情条件）
// @ 玩家起点（载入后视为地面）
export const CELL = 3;
export const WALL_H = 3.6;

export let MAP: string[] = [];
export let ROWS = 0;
export let COLS = 0;

const WALLS = new Set(['#', '%', '&', '|', '$']);
const FURNITURE = new Set(['R', 'T', 'P', 'c', 'p', 'b', 'k', 'x', 't', 'm', 'd', 'o', 'w', 'h']);
// 家具碰撞半宽（米）；未列出的占满整格
export const HALF: Record<string, number> = {
  T: 1.3, P: 0.55, c: 1.0, p: 0.55, b: 0.85, k: 0.9, x: 1.1, t: 0.45, m: 1.1, d: 1.1, o: 0.9, w: 0.8, h: 1.5,
};

const openDoors = new Set<string>();
const openSecrets = new Set<number>();

export function loadMap(rows: string[]) {
  const w = Math.max(...rows.map((r) => r.length));
  MAP = rows.map((r) => r.padEnd(w, '#'));
  ROWS = MAP.length;
  COLS = w;
  openDoors.clear();
  openSecrets.clear();
}

export function charAt(col: number, row: number): string {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return '#';
  return MAP[row][col];
}

export const isDoorChar = (ch: string) => ch >= '1' && ch <= '9';
export const isWallChar = (ch: string) => WALLS.has(ch);
export const isFurniture = (ch: string) => FURNITURE.has(ch);

export function setDoorOpen(id: string, open: boolean) {
  if (open) openDoors.add(id);
  else openDoors.delete(id);
}
export const isDoorOpen = (id: string) => openDoors.has(id);

export function openSecret(col: number, row: number) {
  openSecrets.add(row * COLS + col);
}
export const isSecretOpen = (col: number, row: number) => openSecrets.has(row * COLS + col);

export function blocked(col: number, row: number): boolean {
  const ch = charAt(col, row);
  if (ch === '$') return !isSecretOpen(col, row);
  if (WALLS.has(ch) || FURNITURE.has(ch)) return true;
  if (isDoorChar(ch)) return !openDoors.has(ch);
  return false;
}

// 视线/子弹是否被挡（矮家具不挡）
export function opaque(col: number, row: number): boolean {
  const ch = charAt(col, row);
  if (ch === '$') return !isSecretOpen(col, row);
  if (WALLS.has(ch) || ch === 'P' || ch === 'p' || ch === 'k' || ch === 'h' || ch === 'o') return true;
  if (isDoorChar(ch)) return !openDoors.has(ch);
  return false;
}

export const isExterior = (col: number, row: number) => {
  const ch = charAt(col, row);
  return ch === ',' || ch === 'R' || ch === 't' || ch === 'h';
};

export function cellCenter(col: number, row: number) {
  return { x: (col + 0.5) * CELL, z: (row + 0.5) * CELL };
}

export function toCell(x: number, z: number) {
  return { col: Math.floor(x / CELL), row: Math.floor(z / CELL) };
}

export function findChar(ch: string): { col: number; row: number } | null {
  for (let r = 0; r < ROWS; r++) {
    const c = MAP[r].indexOf(ch);
    if (c >= 0) return { col: c, row: r };
  }
  return null;
}

export function findAll(ch: string) {
  const out: { col: number; row: number }[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (MAP[r][c] === ch) out.push({ col: c, row: r });
  return out;
}

// 圆与网格碰撞：把圆推出所有实心格
export function collide(pos: { x: number; z: number }, rad: number) {
  const { col, row } = toCell(pos.x, pos.z);
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (!blocked(c, r)) continue;
      const inset = CELL / 2 - (HALF[charAt(c, r)] ?? CELL / 2);
      const minX = c * CELL + inset, maxX = (c + 1) * CELL - inset;
      const minZ = r * CELL + inset, maxZ = (r + 1) * CELL - inset;
      const nx = Math.max(minX, Math.min(pos.x, maxX));
      const nz = Math.max(minZ, Math.min(pos.z, maxZ));
      const dx = pos.x - nx, dz = pos.z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= rad * rad) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        pos.x += (dx / d) * (rad - d);
        pos.z += (dz / d) * (rad - d);
      } else {
        const l = pos.x - minX, rr = maxX - pos.x, u = pos.z - minZ, dd = maxZ - pos.z;
        const m = Math.min(l, rr, u, dd);
        if (m === l) pos.x = minX - rad;
        else if (m === rr) pos.x = maxX + rad;
        else if (m === u) pos.z = minZ - rad;
        else pos.z = maxZ + rad;
      }
    }
  }
}

// BFS 距离场：敌人与同伴沿梯度寻路
export class FlowField {
  dist = new Int16Array(0);
  private sc = -1;
  private sr = -1;
  private dirty = true;

  invalidate() {
    this.dirty = true;
  }

  update(col: number, row: number) {
    if (this.dist.length !== ROWS * COLS) {
      this.dist = new Int16Array(ROWS * COLS);
      this.dirty = true;
    }
    if (!this.dirty && col === this.sc && row === this.sr) return;
    this.dirty = false;
    this.sc = col;
    this.sr = row;
    this.dist.fill(-1);
    if (blocked(col, row)) return;
    const q = [row * COLS + col];
    this.dist[q[0]] = 0;
    for (let i = 0; i < q.length; i++) {
      const idx = q[i];
      const r = (idx / COLS) | 0, c = idx % COLS;
      const d = this.dist[idx] + 1;
      if (c > 0 && this.dist[idx - 1] === -1 && !blocked(c - 1, r)) { this.dist[idx - 1] = d; q.push(idx - 1); }
      if (c < COLS - 1 && this.dist[idx + 1] === -1 && !blocked(c + 1, r)) { this.dist[idx + 1] = d; q.push(idx + 1); }
      if (r > 0 && this.dist[idx - COLS] === -1 && !blocked(c, r - 1)) { this.dist[idx - COLS] = d; q.push(idx - COLS); }
      if (r < ROWS - 1 && this.dist[idx + COLS] === -1 && !blocked(c, r + 1)) { this.dist[idx + COLS] = d; q.push(idx + COLS); }
    }
  }

  distAt(col: number, row: number) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return -1;
    return this.dist[row * COLS + col];
  }

  next(x: number, z: number) {
    const { col, row } = toCell(x, z);
    const here = this.distAt(col, row);
    if (here <= 0) return null;
    let best = here, bc = col, br = row;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const d = this.distAt(col + dc, row + dr);
      if (d >= 0 && d < best) { best = d; bc = col + dc; br = row + dr; }
    }
    return bc === col && br === row ? null : cellCenter(bc, br);
  }
}

export function lineOfSight(ax: number, az: number, bx: number, bz: number): boolean {
  const dx = bx - ax, dz = bz - az;
  const steps = Math.ceil(Math.hypot(dx, dz) / (CELL * 0.2));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const { col, row } = toCell(ax + dx * t, az + dz * t);
    if (opaque(col, row)) return false;
  }
  return true;
}
