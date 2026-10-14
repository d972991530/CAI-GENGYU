import * as THREE from 'three';
import { sprite, SpriteInfo } from '../core/assets';
import { iconTexture } from '../core/textures';
import { collide, FlowField, lineOfSight, toCell } from '../world/map';
import { audio } from '../core/audio';

export type HitPart = 'head' | 'body' | 'weak';
export type EnemyState = 'dormant' | 'idle' | 'awaken' | 'chase' | 'attack' | 'stunned' | 'flee' | 'windup' | 'charge' | 'frozen' | 'dead';

export interface Kind {
  name: string;
  sprites: string[];
  h: number;
  hp: number;
  speed: number;
  dmg: number;
  reach: number;
  windup: number;
  cd: number;
  headFrac: number;
  headMult: number;
  armor: number; // 非弱点部位的伤害倍率
  weak?: [number, number, number, number][]; // uv 矩形（v 从脚底算起）
  weakMult?: number;
  ranged?: { proj: string; dmg: number; speed: number; cd: number; range: number; keep?: number };
  tint?: number;
  bright?: number;
  radius: number;
  boss?: boolean;
  passive?: boolean;
  charge?: boolean;
  score: number;
}

export const KINDS: Record<string, Kind> = {
  guest: { name: '宾客蛊化者', sprites: ['infected'], h: 1.82, hp: 70, speed: 2.0, dmg: 10, reach: 1.5, windup: 0.5, cd: 1.1, headFrac: 0.14, headMult: 3, armor: 1, bright: 1.15, radius: 0.4, score: 100 },
  gu: { name: '蛊化者', sprites: ['infected', 'infected', 'water_gu'], h: 1.9, hp: 90, speed: 2.3, dmg: 12, reach: 1.5, windup: 0.5, cd: 1.1, headFrac: 0.15, headMult: 3, armor: 1, bright: 1.3, radius: 0.4, score: 100 },
  water: { name: '水蛊', sprites: ['water_gu'], h: 1.8, hp: 80, speed: 3.0, dmg: 10, reach: 1.6, windup: 0.4, cd: 1.0, headFrac: 0.15, headMult: 3, armor: 1, tint: 0x9fe8ff, bright: 1.2, radius: 0.4, score: 120 },
  ore: { name: '矿蛊', sprites: ['miner'], h: 2.0, hp: 160, speed: 1.9, dmg: 18, reach: 1.6, windup: 0.6, cd: 1.3, headFrac: 0.14, headMult: 1.5, armor: 0.08, bright: 1.3, radius: 0.5, score: 250 },
  nuo: { name: '傩面者', sprites: ['nuo_mask'], h: 1.85, hp: 80, speed: 1.2, dmg: 14, reach: 1.5, windup: 0.4, cd: 0.9, headFrac: 0.18, headMult: 3, armor: 1, bright: 1.3, radius: 0.4, passive: true, score: 150 },
  cultist: { name: '无名会武装', sprites: ['zhong'], h: 1.8, hp: 60, speed: 2.4, dmg: 8, reach: 1.4, windup: 0.4, cd: 1.0, headFrac: 0.14, headMult: 3, armor: 1, tint: 0xb07070, bright: 1.1, radius: 0.35, ranged: { proj: 'proj_red', dmg: 8, speed: 16, cd: 1.6, range: 20, keep: 7 }, score: 150 },
  guard: { name: '百慧保安', sprites: ['zhong'], h: 1.8, hp: 60, speed: 2.4, dmg: 8, reach: 1.4, windup: 0.4, cd: 1.0, headFrac: 0.14, headMult: 3, armor: 1, tint: 0x8a9aaa, bright: 0.9, radius: 0.35, ranged: { proj: 'proj_red', dmg: 7, speed: 16, cd: 1.8, range: 18, keep: 6 }, score: 120 },
  butcher: { name: '屠夫 · 蛊化厨师', sprites: ['butcher'], h: 2.9, hp: 1200, speed: 2.4, dmg: 26, reach: 2.4, windup: 0.8, cd: 1.4, headFrac: 0.14, headMult: 1, armor: 0.2, weak: [[0.35, 0.45, 0.75, 0.75]], weakMult: 1.2, bright: 1.25, radius: 0.85, boss: true, charge: true, score: 3000 },
  bride: { name: '腐妆新娘', sprites: ['bride2'], h: 2.9, hp: 1100, speed: 2.6, dmg: 22, reach: 2.6, windup: 0.9, cd: 1.3, headFrac: 0.15, headMult: 1, armor: 0.15, weak: [[0.42, 0.66, 0.62, 0.8]], weakMult: 3, bright: 1.2, radius: 0.7, boss: true, ranged: { proj: 'proj_bug', dmg: 10, speed: 9, cd: 2.6, range: 25 }, score: 3500 },
  mandrill: { name: '山魈', sprites: ['mandrill'], h: 3.1, hp: 1400, speed: 3.2, dmg: 28, reach: 2.6, windup: 0.7, cd: 1.3, headFrac: 0.15, headMult: 1, armor: 0.3, weak: [[0.15, 0, 0.85, 0.16]], weakMult: 2.5, bright: 1.25, radius: 0.9, boss: true, charge: true, ranged: { proj: 'proj_rock', dmg: 18, speed: 13, cd: 3.2, range: 30 }, score: 4000 },
  steelbone: { name: '钢骨', sprites: ['steelbone'], h: 2.9, hp: 1500, speed: 2.2, dmg: 30, reach: 2.6, windup: 0.9, cd: 1.6, headFrac: 0.12, headMult: 1, armor: 0.1, weak: [[0.3, 0.42, 0.6, 0.72]], weakMult: 2.5, bright: 1.25, radius: 1.0, boss: true, charge: true, score: 4500 },
  xu: { name: '异化许怀远', sprites: ['xu'], h: 2.3, hp: 1300, speed: 2.8, dmg: 20, reach: 2.2, windup: 0.6, cd: 1.1, headFrac: 0.15, headMult: 1.5, armor: 0.35, weak: [[0.55, 0.45, 0.95, 0.85]], weakMult: 2.2, bright: 1.2, radius: 0.6, boss: true, ranged: { proj: 'proj_red', dmg: 12, speed: 18, cd: 1.4, range: 26, keep: 6 }, score: 5000 },
  mother: { name: '蛊母 · 苏明远', sprites: ['coffin'], h: 3.6, hp: 2200, speed: 0, dmg: 20, reach: 4.5, windup: 1.0, cd: 2.2, headFrac: 0, headMult: 1, armor: 0.05, weak: [[0.35, 0.35, 0.65, 0.7]], weakMult: 4, bright: 1.3, radius: 2.4, boss: true, ranged: { proj: 'proj_bug', dmg: 12, speed: 10, cd: 2.0, range: 30 }, score: 8000 },
  anchor: { name: '菌丝锚点', sprites: ['coffin'], h: 2.2, hp: 260, speed: 0, dmg: 0, reach: 0, windup: 1, cd: 9, headFrac: 0, headMult: 1, armor: 1, tint: 0xff6060, bright: 1.6, radius: 0.8, score: 300 },
};

export interface EnemyHost {
  playerPos: THREE.Vector3;
  camPos: THREE.Vector3;
  flow: FlowField;
  scanning: boolean;
  damagePlayer(amount: number, from: THREE.Vector3, kind?: string): void;
  spawnProjectile(from: THREE.Vector3, to: THREE.Vector3, kind: string, dmg: number, speed: number, owner: Enemy): void;
  isElectrified(x: number, z: number): boolean;
  onChargeHit(e: Enemy): boolean;
}

const PLANE = (() => {
  const g = new THREE.PlaneGeometry(1, 1);
  g.translate(0, 0.5, 0);
  return g;
})();

export class Enemy {
  kind: Kind;
  group = new THREE.Group();
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  shadow: THREE.Mesh;
  info: SpriteInfo;
  pos: THREE.Vector3;
  spawn: THREE.Vector3;
  yaw = 0;
  hp: number;
  maxHp: number;
  state: EnemyState;
  stateT = 0;
  speed: number;
  height: number;
  tag = '';
  justDied = false;
  invulnerable = false;
  vulnerable = false; // 由剧情/机制打开时忽略护甲
  weakVisible = false;
  enraged = false;
  frozenT = 0;
  freezeBuild = 0;
  charmT = 0; // 被铜铃反向驱使（攻击人类）
  behavior: ((e: Enemy, dt: number) => boolean) | null = null;
  onDamaged: ((e: Enemy, dmg: number, part: HitPart) => void) | null = null;
  private walkT = Math.random() * 10;
  private attackCd = 0;
  private rangedCd = 2 + Math.random() * 2;
  private chargeCd = 5;
  private chargeDir = new THREE.Vector3();
  private flashT = 0;
  private groanT = 2 + Math.random() * 5;
  private deathT = 0;
  private flip = 1;
  private lastX = 0;
  awakeRadius = 14;
  stuck = 0;

  constructor(kindName: string, x: number, z: number, yaw: number, state: EnemyState = 'idle', scale = 1) {
    this.kind = KINDS[kindName];
    const k = this.kind;
    this.info = sprite(k.sprites[(Math.random() * k.sprites.length) | 0]);
    this.height = k.h * scale * (k.boss ? 1 : 0.94 + Math.random() * 0.12);
    this.maxHp = this.hp = k.hp;
    this.speed = k.speed * (k.boss ? 1 : 0.85 + Math.random() * 0.3);
    this.state = state;
    this.pos = new THREE.Vector3(x, 0, z);
    this.spawn = this.pos.clone();
    this.yaw = yaw;
    this.mat = new THREE.MeshStandardMaterial({
      map: this.info.tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85, metalness: 0,
      emissive: 0x000000,
    });
    const b = k.bright ?? 1;
    const tint = new THREE.Color(k.tint ?? 0xffffff);
    this.mat.color.setRGB(tint.r * b, tint.g * b, tint.b * b);
    this.mesh = new THREE.Mesh(PLANE, this.mat);
    this.mesh.scale.set(this.height * this.info.aspect, this.height, 1);
    this.mesh.userData.enemy = this;
    this.group.add(this.mesh);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: iconTexture('shadow'), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
    this.shadow.scale.set(this.height * 0.5, this.height * 0.3, 1);
    this.group.add(this.shadow);
    this.group.position.copy(this.pos);
    this.lastX = x;
  }

  get alive() {
    return this.state !== 'dead';
  }

  get name() {
    return this.kind.name;
  }

  setSprite(name: string) {
    this.info = sprite(name);
    this.mat.map = this.info.tex;
    this.mat.needsUpdate = true;
    this.mesh.scale.set(this.height * this.info.aspect * Math.sign(this.mesh.scale.x || 1), this.height, 1);
  }

  center() {
    return new THREE.Vector3(this.pos.x, this.height * 0.6, this.pos.z);
  }

  headPos() {
    return new THREE.Vector3(this.pos.x, this.height * (1 - this.kind.headFrac / 2), this.pos.z);
  }

  // 射线与立绘的像素级命中判定
  hitTest(origin: THREE.Vector3, dir: THREE.Vector3): { dist: number; part: HitPart; point: THREE.Vector3 } | null {
    if (!this.alive) return null;
    this.mesh.updateMatrixWorld();
    const inv = this.mesh.matrixWorld.clone().invert();
    const o = origin.clone().applyMatrix4(inv);
    const o2 = origin.clone().add(dir).applyMatrix4(inv);
    const d = o2.sub(o);
    if (Math.abs(d.z) < 1e-6) return null;
    const t = -o.z / d.z;
    if (t <= 0) return null;
    const px = o.x + d.x * t, py = o.y + d.y * t;
    const u = px + 0.5, v = py;
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    const m = this.info.mask;
    const mx = Math.min(m.w - 1, Math.floor(u * m.w));
    const my = Math.min(m.h - 1, Math.floor((1 - v) * m.h));
    // 容错：检查周围一圈像素，避免细小部位打不中
    let hit = false;
    for (let oy = -1; oy <= 1 && !hit; oy++) for (let ox = -1; ox <= 1 && !hit; ox++) {
      const xx = mx + ox, yy = my + oy;
      if (xx >= 0 && yy >= 0 && xx < m.w && yy < m.h && m.data[yy * m.w + xx] > 90) hit = true;
    }
    if (!hit) return null;
    let part: HitPart = 'body';
    const uu = this.mesh.scale.x < 0 ? 1 - u : u;
    if (this.kind.weak?.some(([u0, v0, u1, v1]) => uu >= u0 && uu <= u1 && v >= v0 && v <= v1)) part = 'weak';
    else if (v > 1 - this.kind.headFrac) part = 'head';
    return { dist: t, part, point: origin.clone().addScaledVector(dir, t) };
  }

  awaken() {
    if (this.state === 'dormant' || this.state === 'idle') {
      this.state = 'awaken';
      this.stateT = 0;
      audio.groan({ x: this.pos.x, y: 1.6, z: this.pos.z }, this.kind.boss ? 0.5 : 1, 0.7);
    }
  }

  damage(amount: number, part: HitPart, opts: { electric?: boolean; cryo?: boolean } = {}): number {
    if (!this.alive || this.invulnerable) return 0;
    const k = this.kind;
    let mult = part === 'head' ? k.headMult : part === 'weak' ? (k.weakMult ?? 2) : 1;
    let armor = k.armor;
    if (this.vulnerable || this.state === 'frozen' || (opts.electric && k.name === '矿蛊') || this.state === 'stunned' && k.boss) armor = Math.max(armor, k.boss ? 0.8 : 1);
    if (k.name === '矿蛊' && (opts.cryo || opts.electric)) armor = 1.2;
    if (part !== 'weak') mult *= armor;
    else if (k.boss && !this.weakVisible && !this.vulnerable && this.state !== 'stunned' && this.state !== 'frozen') mult *= 0.5;
    const dmg = amount * mult;
    this.hp -= dmg;
    this.flashT = 0.09;
    audio.hitFlesh({ x: this.pos.x, y: 1.4, z: this.pos.z });
    if (this.kind.passive && !this.enraged) {
      this.enraged = true;
      this.speed = 3.6;
      audio.roar({ x: this.pos.x, y: 1.6, z: this.pos.z });
    }
    if (this.state === 'dormant' || this.state === 'idle') this.awaken();
    if (!k.boss && this.state === 'chase' && Math.random() < 0.25) { this.state = 'stunned'; this.stateT = 0.4; }
    if (opts.cryo) {
      this.freezeBuild += k.boss ? 0.2 : 0.45;
      if (this.freezeBuild >= 1) { this.freeze(k.boss ? 2.5 : 4); this.freezeBuild = 0; }
    }
    this.onDamaged?.(this, dmg, part);
    if (this.hp <= 0) this.die();
    return dmg;
  }

  freeze(sec: number) {
    if (!this.alive) return;
    this.state = 'frozen';
    this.frozenT = sec;
  }

  die() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.deathT = 0;
    this.justDied = true;
    this.mat.transparent = true;
    audio.groan({ x: this.pos.x, y: 1.2, z: this.pos.z }, this.kind.boss ? 0.4 : 0.8, 0.6);
  }

  stun(sec: number) {
    if (!this.alive || this.state === 'dormant' || this.state === 'frozen') return;
    this.state = 'stunned';
    this.stateT = sec;
  }

  flee(sec: number) {
    if (!this.alive || this.kind.boss || this.state === 'dormant') return;
    this.state = 'flee';
    this.stateT = sec;
  }

  reset() {
    if (!this.alive) return;
    this.pos.copy(this.spawn);
    this.hp = this.maxHp;
    if (this.state !== 'dormant') this.state = 'idle';
    this.enraged = false;
    this.frozenT = 0;
  }

  update(dt: number, host: EnemyHost) {
    const k = this.kind;
    // 面向镜头
    this.group.rotation.y = Math.atan2(host.camPos.x - this.pos.x, host.camPos.z - this.pos.z);

    // 受击闪光 / 勘察高亮
    this.flashT -= dt;
    if (this.flashT > 0) this.mat.emissive.setRGB(0.7, 0.1, 0.05);
    else if (this.state === 'frozen') this.mat.emissive.setRGB(0.15, 0.35, 0.5);
    else if (host.scanning) this.mat.emissive.setRGB(k.boss ? 0.45 : 0.3, 0.04, 0.02);
    else if (this.charmT > 0) this.mat.emissive.setRGB(0.25, 0.2, 0.02);
    else this.mat.emissive.setRGB(0, 0, 0);

    if (this.state === 'dead') {
      this.deathT += dt;
      const t = Math.min(1, this.deathT * 1.6);
      this.mesh.rotation.x = -t * 1.35;
      this.mesh.position.y = -t * 0.1;
      if (this.deathT > 3) this.mat.opacity = Math.max(0, 1 - (this.deathT - 3) * 0.5);
      this.shadow.visible = false;
      this.group.position.set(this.pos.x, 0, this.pos.z);
      return;
    }

    const tgt = host.playerPos;
    const dx = tgt.x - this.pos.x, dz = tgt.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    this.attackCd -= dt;
    this.rangedCd -= dt;
    this.stateT -= dt;
    if (this.charmT > 0) this.charmT -= dt;

    // 通电轨道
    if (host.isElectrified(this.pos.x, this.pos.z) && this.state !== 'stunned') {
      this.damage(k.boss ? 15 : 60 * dt + 2, 'body', { electric: true });
      this.stun(k.boss ? 1.5 : 2.5);
    }

    let move = 0;
    let target: { x: number; z: number } | null = null;

    if (this.behavior && this.behavior(this, dt)) {
      // 剧情自定义行为接管
    } else switch (this.state) {
      case 'dormant':
        if (dist < 1.8) this.awaken();
        break;
      case 'idle':
        if (dist < this.awakeRadius && lineOfSight(this.pos.x, this.pos.z, tgt.x, tgt.z)) this.awaken();
        break;
      case 'awaken':
        this.stateT += dt * 2;
        if (this.stateT > 1.1) { this.state = 'chase'; this.stateT = 0; }
        break;
      case 'frozen':
        this.frozenT -= dt;
        if (this.frozenT <= 0) this.state = 'chase';
        break;
      case 'stunned':
        if (this.stateT <= 0) this.state = 'chase';
        break;
      case 'flee':
        target = { x: this.pos.x - dx, z: this.pos.z - dz };
        move = this.speed;
        if (this.stateT <= 0) this.state = 'chase';
        break;
      case 'chase': {
        if (k.passive && !this.enraged) {
          // 傩面者：缓慢游荡，不主动攻击
          this.walkT += dt * 0.3;
          target = { x: this.spawn.x + Math.sin(this.walkT) * 2, z: this.spawn.z + Math.cos(this.walkT * 0.7) * 2 };
          move = this.speed * 0.5;
          break;
        }
        const los = lineOfSight(this.pos.x, this.pos.z, tgt.x, tgt.z);
        if (dist < k.reach && this.attackCd <= 0 && k.dmg > 0) {
          this.state = 'attack';
          this.stateT = k.windup;
          break;
        }
        if (k.charge) {
          this.chargeCd -= dt;
          if (this.chargeCd <= 0 && dist > 5 && dist < 24 && los) {
            this.state = 'windup';
            this.stateT = 1.0;
            audio.roar({ x: this.pos.x, y: 2, z: this.pos.z });
            break;
          }
        }
        if (k.ranged && this.rangedCd <= 0 && los && dist < k.ranged.range && dist > 2.5) {
          this.rangedCd = k.ranged.cd * (0.8 + Math.random() * 0.5);
          const from = new THREE.Vector3(this.pos.x, this.height * 0.65, this.pos.z);
          host.spawnProjectile(from, new THREE.Vector3(tgt.x, 1.2, tgt.z), k.ranged.proj, k.ranged.dmg, k.ranged.speed, this);
          this.flashT = 0.05;
        }
        const keep = k.ranged?.keep ?? 0;
        if (keep && los && dist < keep) {
          target = { x: this.pos.x - dx + dz * 0.5, z: this.pos.z - dz - dx * 0.5 };
          move = this.speed * 0.7;
        } else if (dist > k.reach * 0.8 && k.speed > 0) {
          move = this.speed;
          target = dist < 4 && los ? { x: tgt.x, z: tgt.z } : host.flow.next(this.pos.x, this.pos.z) ?? { x: tgt.x, z: tgt.z };
        }
        break;
      }
      case 'attack':
        if (this.stateT <= 0) {
          if (dist < k.reach + 0.4) host.damagePlayer(k.dmg, this.pos, k.name);
          this.state = 'chase';
          this.attackCd = k.cd;
        }
        break;
      case 'windup':
        if (this.stateT <= 0) {
          this.state = 'charge';
          this.stateT = 2.0;
          this.chargeDir.set(dx, 0, dz).normalize();
        }
        break;
      case 'charge': {
        const before = this.pos.clone();
        this.pos.addScaledVector(this.chargeDir, 11 * dt);
        collide(this.pos, k.radius);
        if (dist < k.radius + 1.0) {
          host.damagePlayer(k.dmg + 8, this.pos, k.name);
          this.state = 'chase';
          this.chargeCd = 7;
          break;
        }
        if (host.onChargeHit(this)) { this.chargeCd = 8; break; }
        if (before.distanceTo(this.pos) < 11 * dt * 0.4 || this.stateT <= 0) {
          this.state = 'stunned';
          this.stateT = 1.6;
          this.chargeCd = 7;
          audio.impact();
        }
        break;
      }
    }

    if (target && move > 0) {
      const tx = target.x - this.pos.x, tz = target.z - this.pos.z;
      const tl = Math.hypot(tx, tz) || 1;
      const before = this.pos.clone();
      this.pos.x += (tx / tl) * move * dt;
      this.pos.z += (tz / tl) * move * dt;
      collide(this.pos, k.radius);
      if (before.distanceTo(this.pos) < move * dt * 0.2) this.stuck += dt;
      else this.stuck = 0;
    }

    this.animate(dt, move, host);

    this.groanT -= dt;
    if (this.groanT <= 0 && dist < 22 && this.state !== 'dormant' && !(k.passive && !this.enraged)) {
      this.groanT = 3 + Math.random() * 6;
      audio.groan({ x: this.pos.x, y: 1.6, z: this.pos.z }, k.boss ? 0.55 : 0.9 + Math.random() * 0.3, k.boss ? 0.8 : 0.4);
    }
    this.group.position.set(this.pos.x, 0, this.pos.z);
  }

  private animate(dt: number, move: number, host: EnemyHost) {
    const k = this.kind;
    // 根据相对镜头的横向移动翻转立绘
    const camRightX = Math.cos(this.group.rotation.y), camRightZ = -Math.sin(this.group.rotation.y);
    const vx = this.pos.x - this.lastX;
    this.lastX = this.pos.x;
    void camRightZ;
    if (Math.abs(vx * camRightX) > 0.001) this.flip = vx * camRightX < 0 ? -1 : 1;
    const w = this.height * this.info.aspect;
    let sx = w * this.flip, sy = this.height, lean = 0, lift = 0, fwd = 0;
    if (this.state === 'frozen') {
      // 冻结：静止
    } else if (this.state === 'dormant') {
      sy *= 1 + Math.sin(this.walkT) * 0.005;
      this.walkT += dt;
    } else {
      this.walkT += dt * (move > 0 ? 2 + move * 2.2 : 1.2);
      const s = Math.sin(this.walkT);
      lift = move > 0 ? Math.abs(s) * 0.05 * this.height : 0;
      lean = s * (move > 0 ? 0.05 : 0.02);
      sy *= 1 + Math.cos(this.walkT * 2) * (move > 0 ? 0.02 : 0.01);
      if (this.state === 'attack') {
        const p = 1 - Math.max(0, this.stateT) / k.windup;
        fwd = Math.sin(p * Math.PI) * 0.5;
        sy *= 1 + Math.sin(p * Math.PI) * 0.06;
        lean = -0.08;
      } else if (this.state === 'windup') {
        sy *= 1.06;
        lean = Math.sin(this.walkT * 8) * 0.04;
      } else if (this.state === 'charge') {
        lean = 0.15;
        fwd = 0.3;
      } else if (this.state === 'stunned') {
        lean = Math.sin(this.walkT * 7) * 0.12;
      } else if (this.state === 'awaken') {
        lean = Math.sin(this.walkT * 9) * 0.08;
      }
    }
    void host;
    this.mesh.scale.set(sx, sy, 1);
    this.mesh.rotation.set(0, 0, lean);
    this.mesh.position.set(0, lift, fwd);
  }

  cell() {
    return toCell(this.pos.x, this.pos.z);
  }
}
