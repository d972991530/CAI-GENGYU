import * as THREE from 'three';
import { audio } from '../core/audio';
import { createInput, Input } from '../core/input';
import { iconTexture } from '../core/textures';
import { Level } from '../world/level';
import {
  WALL_H, cellCenter, collide, FlowField, toCell, lineOfSight, loadMap, charAt, isDoorChar, isDoorOpen,
  blocked, findChar, MAP, ROWS, COLS,
} from '../world/map';
import { Enemy, EnemyHost, EnemyState, HitPart } from '../entities/enemy';
import { Npc } from '../entities/npc';
import { sprite as spriteInfo, imageTexture } from '../core/assets';
import { WEAPONS, WeaponId, WeaponView, AmmoType, WeaponDef, setArsenal, arsenal } from './weapons';
import { Hud } from '../ui/hud';
import { Cinematic, Shot } from '../ui/cinematic';
import { Minigames } from '../ui/minigames';
import { IS_MOBILE } from '../platform';
import type { ChapterData, ItemType, KeyColor } from '../chapters/types';

export type Quality = 'low' | 'mid' | 'high';
export interface Settings {
  quality: Quality;
  sensitivity: number;
  volume: number;
  aimAssist: boolean;
  easyQte: boolean;
  subtitleSize: number;
}

interface Interactable {
  id: string;
  pos: THREE.Vector3;
  label: string;
  active: boolean;
  icon?: THREE.Sprite;
  onUse: () => void;
}

interface Pickup {
  type: ItemType;
  sprite: THREE.Sprite;
  taken: boolean;
  counted: boolean;
  respawn: number;
  timer: number;
}

interface Projectile {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  dmg: number;
  life: number;
  owner: Enemy | null;
  falling?: boolean;
  warn?: THREE.Mesh;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  gravity: number;
}

type GameState = 'menu' | 'playing' | 'paused' | 'dead' | 'cine' | 'inter';
const EYE = 1.62;

export interface ChapterStats {
  kills: number;
  totalKills: number;
  items: number;
  totalItems: number;
  secrets: number;
  totalSecrets: number;
  time: number;
  par: number;
  headshots: number;
  shots: number;
  hits: number;
}

export class Game implements EnemyHost {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  input: Input;
  hud = new Hud();
  weapon = new WeaponView();
  cineP = new Cinematic();
  mg = new Minigames();
  flow = new FlowField();
  level: Level | null = null;
  chapter: ChapterData | null = null;
  enemies: Enemy[] = [];
  npcs = new Map<string, Npc>();
  interactables: Interactable[] = [];
  pickups: Pickup[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private decals: THREE.Mesh[] = [];
  private props: THREE.Mesh[] = [];
  private waiters: { cond: () => boolean; resolve: () => void }[] = [];
  private flashlight: THREE.SpotLight;
  private hemi: THREE.HemisphereLight;
  private raycaster = new THREE.Raycaster();
  private world = new THREE.Group();

  state: GameState = 'menu';
  time = 0;
  playerPos = new THREE.Vector3();
  camPos = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  hp = 100;
  armor = 0;
  herbs = 1;
  stamina = 1;
  oxygen = 100;
  keys = new Set<KeyColor>();
  owned = new Set<WeaponId>(['pistol']);
  current: WeaponId = 'pistol';
  mags: Record<WeaponId, number> = { pistol: 12, mg: 60, cryo: 6 };
  reserve: Record<AmmoType, number> = { ammo: 24, mg_ammo: 0, cryo_ammo: 0 };
  face = 'lin';
  flags = new Set<string>();
  choices: Record<string, number> = {};
  exitEnabled = true;
  cutscene = false;
  frozen = false;
  lookTarget: THREE.Vector3 | null = null;
  scanning = false;
  scanUnlocked = false;
  flashUnlocked = true;
  bellUnlocked = false;
  bellOwn = false; // 玩家自己持铃（联动支线：镇魂铜铃），不需要小满
  zhenyinUnlocked = false;
  scanCd = 0;
  scanT = 0;
  flashCd = 0;
  bellCd = 0;
  zhenyinCd = 0;
  private healCd = 0;
  private dashT = 0;
  private dashCd = 0;
  private dashDir = new THREE.Vector3();
  private fireCd = 0;
  private triggerHeld = false;
  private shake = 0;
  private stepDist = 0;
  private bobT = 0;
  private vel = new THREE.Vector3();
  private flashBurst = 0;
  private menuT = 0;
  private scareCd = 15;
  private mapOpen = false;
  private electrified = new Map<number, number>();
  private exitPads: { x: number; z: number }[] = [];
  private exitResolve: (() => void) | null = null;
  private checkpoint = { x: 0, z: 0, yaw: 0, hp: 100 };
  stats: ChapterStats = this.freshStats();
  totalTime = 0;
  boss: Enemy | null = null;
  bossName = '';
  onScan: (() => void) | null = null;
  onKill: ((e: Enemy) => void) | null = null;
  onShot: (() => void) | null = null;
  onStateChange: ((s: GameState) => void) | null = null;
  water = false;
  flashlightWeak = false;

  constructor(canvas: HTMLCanvasElement, public settings: Settings) {
    const q = settings.quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: q !== 'low', powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = q === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 220);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera, this.world);
    this.scene.background = new THREE.Color(0x040607);
    this.scene.fog = new THREE.FogExp2(0x040607, 0.06);
    this.hemi = new THREE.HemisphereLight(0x51667a, 0x2a1a10, 0.7);
    this.scene.add(this.hemi);
    this.flashlight = new THREE.SpotLight(0xfff2dc, 70, 30, 0.48, 0.5, 1.3);
    this.flashlight.position.set(0.25, -0.2, 0);
    this.flashlight.target.position.set(0, 0, -1);
    this.flashlight.castShadow = q === 'high';
    this.flashlight.shadow.mapSize.set(1024, 1024);
    this.camera.add(this.flashlight, this.flashlight.target);
    this.mg.easy = settings.easyQte;

    this.input = createInput(canvas);
    this.input.sensitivity = settings.sensitivity;
    this.input.onPointerLockLost = () => {
      if (this.state === 'playing' && !this.hud.documentOpen && !this.mg.active) this.pause();
    };
    this.hud.onDocOpen = () => this.input.unlock();
    this.mg.onOpen = () => this.input.unlock();
    this.mg.onClose = () => { this.input.clear(); if (this.state === 'playing') this.input.lock(); };
    this.hud.onDocClose = () => { this.input.clear(); if (this.state === 'playing') this.input.lock(); };
    window.addEventListener('resize', () => this.resize());
    this.hud.show(false);
    this.input.show(false);
    this.weapon.update(0, 0, false);
  }

  private freshStats(): ChapterStats {
    return { kills: 0, totalKills: 0, items: 0, totalItems: 0, secrets: 0, totalSecrets: 0, time: 0, par: 600, headshots: 0, shots: 0, hits: 0 };
  }

  private pixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const q = this.settings.quality;
    return q === 'low' ? Math.min(dpr, 2) * 0.55 : q === 'mid' ? Math.min(dpr, 1.5) * 0.85 : Math.min(dpr, 2);
  }

  applySettings() {
    this.renderer.setPixelRatio(this.pixelRatio());
    this.input.sensitivity = this.settings.sensitivity;
    audio.setVolume(this.settings.volume);
    this.mg.easy = this.settings.easyQte;
    document.documentElement.style.setProperty('--sub-size', `${this.settings.subtitleSize}`);
  }

  private resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  setState(s: GameState) {
    this.state = s;
    const playing = s === 'playing';
    this.hud.show(s === 'playing' || s === 'paused' || s === 'dead');
    this.input.enabled = playing;
    this.input.show(playing && !this.cutscene);
    if (playing) this.input.lock();
    else this.input.unlock();
    this.onStateChange?.(s);
  }

  pause() {
    if (this.state === 'playing') this.setState('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.input.clear();
    this.setState('playing');
  }

  // ======================= 章节载入 =======================
  loadChapter(data: ChapterData) {
    this.clearWorld();
    this.chapter = data;
    loadMap(data.map);
    this.level = new Level(data, this.settings.quality === 'high' ? 6 : this.settings.quality === 'mid' ? 4 : 3);
    this.world.add(this.level.group);
    const th = data.theme;
    (this.scene.fog as THREE.FogExp2).color.setHex(th.fog);
    (this.scene.fog as THREE.FogExp2).density = th.fogDensity;
    (this.scene.background as THREE.Color).setHex(th.fog);
    this.hemi.color.setHex(th.hemi[0]);
    this.hemi.groundColor.setHex(th.hemi[1]);
    this.hemi.intensity = th.hemi[2];
    this.flow.invalidate();
    this.hud.resetExplored();
    const start = findChar('@') ?? { col: data.marks.start?.[0] ?? 1, row: data.marks.start?.[1] ?? 1 };
    const sp = cellCenter(start.col, start.row);
    this.setPlayer(sp.x, sp.z, data.marks.startYaw ? (data.marks.startYaw[0] * Math.PI) / 2 : 0);
    this.exitPads = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (MAP[r][c] === 'X') this.exitPads.push(cellCenter(c, r));
    this.stats = this.freshStats();
    this.stats.par = data.par;
    this.stats.totalSecrets = this.level.secrets.size;
    for (const it of data.items) this.addPickup(it.type, it.at[0], it.at[1]);
    this.keys.clear();
    this.flags.clear();
    this.exitEnabled = false;
    this.face = data.pov;
    this.hud.setFace(this.face);
    setArsenal(data.pov === 'tang' ? 'tang' : 'default');
    this.weapon.refresh(WEAPONS[this.current]);
    this.bellOwn = false;
    this.scanUnlocked = this.flashUnlocked = true;
    this.bellUnlocked = this.zhenyinUnlocked = false;
    this.scanCd = this.flashCd = this.bellCd = this.zhenyinCd = 0;
    this.oxygen = 100;
    this.flashlightWeak = false;
    this.boss = null;
    this.hud.setBoss(null);
    this.hud.setObjective('');
    this.hud.reset();
    this.scanning = false;
    this.scanT = 0;
    this.cutscene = false;
    this.frozen = false;
    this.mapOpen = false;
    this.onShot = null;
    this.onScan = null;
    this.saveCheckpoint();
  }

  private clearWorld() {
    if (this.level) {
      this.world.remove(this.level.group);
      this.level.dispose();
      this.level = null;
    }
    for (const e of this.enemies) this.world.remove(e.group);
    for (const n of this.npcs.values()) this.world.remove(n.group);
    for (const i of this.interactables) if (i.icon) this.world.remove(i.icon);
    for (const p of this.pickups) this.world.remove(p.sprite);
    for (const p of this.projectiles) { this.world.remove(p.sprite); if (p.warn) this.world.remove(p.warn); }
    for (const p of this.particles) this.world.remove(p.mesh);
    for (const d of this.decals) this.world.remove(d);
    for (const p of this.props) this.world.remove(p);
    this.props = [];
    this.enemies = [];
    this.npcs.clear();
    this.interactables = [];
    this.pickups = [];
    this.projectiles = [];
    this.particles = [];
    this.decals = [];
    this.waiters = [];
    this.electrified.clear();
    this.exitResolve = null;
  }

  // ======================= 剧情接口 =======================
  until(cond: () => boolean): Promise<void> {
    if (cond()) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push({ cond, resolve }));
  }

  wait(sec: number) {
    const t = this.time + sec;
    return this.until(() => this.time >= t);
  }

  async say(speaker: string, text: string, dur?: number) {
    if (/陈砚|广播|许怀远（电话|许怀远（耳麦/.test(speaker)) audio.radio();
    this.hud.say(speaker, text);
    await this.wait(dur ?? 1.5 + text.length * 0.12);
    this.hud.say('', '');
  }

  sayAsync(lines: [string, string][]) {
    (async () => { for (const [s, t] of lines) await this.say(s, t); })();
  }

  objective(t: string) {
    this.hud.setObjective(t);
  }

  hint(desktop: string, mobile: string, sec = 7) {
    this.hud.showHint(IS_MOBILE ? mobile : desktop, sec);
  }

  setCutscene(on: boolean) {
    this.cutscene = on;
    this.frozen = on;
    this.hud.setLetterbox(on);
    this.input.show(!on && this.state === 'playing');
    if (!on) this.lookTarget = null;
  }

  // 全屏过场动画（暂停游戏）
  async cine(shots: Shot[]) {
    const prev = this.state;
    this.setState('cine');
    audio.setAmbientLevel(0.2);
    await this.cineP.play(shots);
    audio.setAmbientLevel(0.55);
    this.input.clear();
    if (prev === 'playing' || prev === 'cine') this.setState('playing');
  }

  at(mark: string, y = 0) {
    const m = this.chapter!.marks[mark];
    if (!m) throw new Error(`mark ${mark} missing`);
    const { x, z } = cellCenter(m[0], m[1]);
    return new THREE.Vector3(x, y, z);
  }

  near(mark: string, d: number) {
    const p = this.at(mark);
    return Math.hypot(p.x - this.playerPos.x, p.z - this.playerPos.z) < d;
  }

  inRect(c0: number, r0: number, c1: number, r1: number) {
    const { col, row } = toCell(this.playerPos.x, this.playerPos.z);
    return col >= c0 && col <= c1 && row >= r0 && row <= r1;
  }

  setPlayer(x: number, z: number, yaw: number) {
    this.playerPos.set(x, 0, z);
    this.yaw = yaw;
    this.pitch = 0;
    this.vel.set(0, 0, 0);
  }

  saveCheckpoint() {
    this.checkpoint = { x: this.playerPos.x, z: this.playerPos.z, yaw: this.yaw, hp: Math.max(this.hp, 60) };
  }

  respawn() {
    const c = this.checkpoint;
    this.setPlayer(c.x, c.z, c.yaw);
    this.hp = Math.max(c.hp, 75);
    this.oxygen = 100;
    this.reserve.ammo = Math.max(this.reserve.ammo, 24);
    if (this.owned.has('mg')) this.reserve.mg_ammo = Math.max(this.reserve.mg_ammo, arsenal === 'tang' ? 12 : 60);
    if (this.owned.has('cryo')) this.reserve.cryo_ammo = Math.max(this.reserve.cryo_ammo, 12);
    this.weapon.reloading = 0;
    for (const e of this.enemies) e.reset();
    for (const p of this.projectiles) { this.world.remove(p.sprite); if (p.warn) this.world.remove(p.warn); }
    this.projectiles = [];
    for (const n of this.npcs.values()) if (n.following) n.pos.set(c.x, 0, c.z + 1);
    this.flow.invalidate();
    this.hud.setFade(0, 600);
    this.setState('playing');
  }

  spawn(kind: string, where: string | [number, number], opts: { state?: EnemyState; ox?: number; oz?: number; scale?: number; tag?: string } = {}) {
    const [c, r] = typeof where === 'string' ? this.chapter!.marks[where] : where;
    const { x, z } = cellCenter(c, r);
    const e = new Enemy(kind, x + (opts.ox ?? 0), z + (opts.oz ?? 0), 0, opts.state ?? 'idle', opts.scale ?? 1);
    e.tag = opts.tag ?? '';
    this.enemies.push(e);
    this.world.add(e.group);
    if (kind !== 'anchor') this.stats.totalKills++;
    return e;
  }

  npc(id: string, where: string | [number, number], follow = false) {
    const [c, r] = typeof where === 'string' ? this.chapter!.marks[where] : where;
    const { x, z } = cellCenter(c, r);
    const n = new Npc(id, x, z);
    n.following = follow;
    if (id === 'man') n.followDist = 1.6;
    this.npcs.set(id, n);
    this.world.add(n.group);
    return n;
  }

  // 场景立绘道具（悬吊的青铜棺、培养舱里的人形……），始终面向镜头
  prop(name: string, where: string | [number, number], h: number, y = 0, emissive = 0x000000) {
    const [c, r] = typeof where === 'string' ? this.chapter!.marks[where] : where;
    const { x, z } = cellCenter(c, r);
    const info = spriteInfo(name);
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: info.tex, alphaTest: 0.4, side: THREE.DoubleSide, emissive, roughness: 0.8 }));
    m.scale.set(h * info.aspect, h, 1);
    m.position.set(x, y, z);
    this.world.add(m);
    this.props.push(m);
    return m;
  }

  addObject(o: THREE.Object3D) {
    this.world.add(o);
  }

  removeObject(o: THREE.Object3D) {
    this.world.remove(o);
  }

  removeProp(m: THREE.Mesh) {
    this.world.remove(m);
    this.props = this.props.filter((p) => p !== m);
  }

  removeNpc(id: string) {
    const n = this.npcs.get(id);
    if (n) { this.world.remove(n.group); this.npcs.delete(id); }
  }

  openDoor(id: string, open = true) {
    this.level?.setDoor(id, open);
    this.flow.invalidate();
    audio.door();
  }

  setFlag(f: string) {
    this.flags.add(f);
    for (const d of this.level?.doors.values() ?? []) if (d.def.flag === f && !d.open) this.openDoor(d.def.id);
  }

  giveKey(k: KeyColor) {
    this.keys.add(k);
    audio.pickup();
  }

  giveWeapon(w: WeaponId, ammo = 0) {
    if (!this.owned.has(w)) this.mags[w] = WEAPONS[w].mag;
    this.owned.add(w);
    this.reserve[WEAPONS[w].ammo] += ammo;
    this.switchWeapon(w);
  }

  setLoadout(ws: WeaponId[], reserve: Partial<Record<AmmoType, number>>) {
    this.owned = new Set(ws);
    this.current = ws[0];
    this.weapon.swap(WEAPONS[ws[0]]);
    for (const w of ws) this.mags[w] = WEAPONS[w].mag;
    Object.assign(this.reserve, { ammo: 0, mg_ammo: 0, cryo_ammo: 0 }, reserve);
  }

  switchWeapon(w: WeaponId) {
    if (!this.owned.has(w) || this.current === w) return;
    this.current = w;
    this.weapon.reloading = 0;
    this.weapon.swap(WEAPONS[w]);
  }

  addInteract(id: string, where: string | [number, number], label: string, onUse: () => void, icon?: string, ox = 0, oz = 0) {
    const [c, r] = typeof where === 'string' ? this.chapter!.marks[where] : where;
    const { x, z } = cellCenter(c, r);
    const it: Interactable = { id, pos: new THREE.Vector3(x + ox, 0, z + oz), label, active: true, onUse };
    if (icon) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: (icon === 'serum' ? imageTexture('prop:serum') : null) ?? iconTexture(icon), depthWrite: false }));
      s.scale.set(0.8, 0.8, 1);
      s.position.set(x + ox, 0.9, z + oz);
      this.world.add(s);
      it.icon = s;
    }
    this.interactables = this.interactables.filter((i) => i.id !== id);
    this.interactables.push(it);
    return it;
  }

  removeInteract(id: string) {
    const it = this.interactables.find((i) => i.id === id);
    if (!it) return;
    it.active = false;
    if (it.icon) this.world.remove(it.icon);
  }

  // 等待交互（返回 Promise）
  interact(id: string, where: string | [number, number], label: string, icon?: string, ox = 0, oz = 0) {
    let used = false;
    this.addInteract(id, where, label, () => { used = true; this.removeInteract(id); }, icon, ox, oz);
    return this.until(() => used);
  }

  addPickup(type: ItemType, col: number, row: number, respawn = 0, ox = 0, oz = 0) {
    const { x, z } = cellCenter(col, row);
    const tang = arsenal === 'tang';
    const prop = type === 'medkit' ? (tang ? 'prop:x_medkit' : 'prop:medkit')
      : type === 'mg_ammo' && tang ? 'prop:x_shells'
      : type.endsWith('ammo') ? (tang ? 'prop:x_ammo' : 'prop:ammo') : null;
    const ptex = prop ? imageTexture(prop) : null;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ptex ?? iconTexture(type), depthWrite: false, color: tang ? 0xffffff : type === 'cryo_ammo' ? 0x9ff : type === 'mg_ammo' ? 0xffd090 : 0xffffff }));
    const big = type.startsWith('weapon') || type.startsWith('key') || !!ptex;
    s.scale.set(big ? 0.9 : 0.7, big ? 0.9 : 0.7, 1);
    s.position.set(x + ox, 0.45, z + oz);
    this.world.add(s);
    const counted = !type.startsWith('key') && respawn === 0;
    if (counted) this.stats.totalItems++;
    this.pickups.push({ type, sprite: s, taken: false, counted, respawn, timer: 0 });
  }

  // 走到出口才算通关
  reachExit(): Promise<void> {
    this.exitEnabled = true;
    return new Promise((res) => (this.exitResolve = res));
  }

  electrify(cells: [number, number][], sec: number) {
    for (const [c, r] of cells) this.electrified.set(r * COLS + c, this.time + sec);
    audio.explosion();
  }

  isElectrified(x: number, z: number) {
    if (!this.electrified.size) return false;
    const { col, row } = toCell(x, z);
    const t = this.electrified.get(row * COLS + col);
    return t !== undefined && t > this.time;
  }

  jumpscare(spriteName: string, dmg = 0) {
    this.hud.jumpscare(spriteName);
    audio.scream();
    this.shake = Math.max(this.shake, 0.9);
    if (dmg) this.damagePlayer(dmg, this.playerPos.clone().add(new THREE.Vector3(0.1, 0, 0.1)), 'scare');
    this.scareCd = 25;
  }

  shakeCamera(v: number) {
    this.shake = Math.max(this.shake, v);
  }

  // ======================= EnemyHost =======================
  damagePlayer(amount: number, from: THREE.Vector3, kind?: string) {
    if (this.state !== 'playing' || this.cutscene || this.dashT > 0) return;
    const absorbed = Math.min(this.armor, amount / 3);
    this.armor -= absorbed;
    this.hp -= amount - absorbed;
    const dx = from.x - this.playerPos.x, dz = from.z - this.playerPos.z;
    const right = Math.cos(this.yaw) * dx - Math.sin(this.yaw) * dz;
    this.hud.damage(Math.sign(right));
    this.shake = Math.max(this.shake, 0.35);
    audio.playerHurt();
    const l = Math.hypot(dx, dz) || 1;
    this.vel.x -= (dx / l) * 4;
    this.vel.z -= (dz / l) * 4;
    // 偶发跳脸：近身被扑时惊吓
    if (kind && kind !== 'scare' && this.scareCd <= 0 && Math.random() < 0.35) {
      const e = this.enemies.find((en) => en.kind.name === kind && en.alive);
      if (e && !e.kind.boss) { this.hud.jumpscare(e.info.name); audio.scream(); this.scareCd = 30; }
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.hud.setFade(0.85, 1500);
      this.setState('dead');
    }
  }

  spawnProjectile(from: THREE.Vector3, to: THREE.Vector3, kind: string, dmg: number, speed: number, owner: Enemy | null) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture(kind), blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(kind === 'proj_rock' ? 1.1 : 0.6);
    s.position.copy(from);
    this.world.add(s);
    const vel = to.clone().sub(from).normalize().multiplyScalar(speed);
    this.projectiles.push({ sprite: s, vel, dmg, life: 4, owner });
  }

  // 从天而降的蛊虫雨/落石，地面有预警圈
  rainOn(x: number, z: number, kind = 'proj_bug', dmg = 12) {
    const warn = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: iconTexture('warn'), transparent: true, depthWrite: false }));
    warn.rotation.x = -Math.PI / 2;
    warn.position.set(x, 0.04, z);
    this.world.add(warn);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture(kind), blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(0.8);
    s.position.set(x, WALL_H + 3, z);
    this.world.add(s);
    this.projectiles.push({ sprite: s, vel: new THREE.Vector3(0, -4, 0), dmg, life: 3, owner: null, falling: true, warn });
  }

  onChargeHit(e: Enemy): boolean {
    for (const p of this.level?.pipes ?? []) {
      if (p.burst) continue;
      const { x, z } = cellCenter(p.col, p.row);
      if (Math.hypot(e.pos.x - x, e.pos.z - z) < 2.2) {
        this.burstPipe(p);
        return true;
      }
    }
    return false;
  }

  private burstPipe(p: Level['pipes'][number]) {
    if (p.burst) return;
    p.burst = true;
    const { x, z } = cellCenter(p.col, p.row);
    audio.explosion({ x, y: 1.5, z });
    this.shake = Math.max(this.shake, 0.6);
    (p.mesh.material as THREE.MeshStandardMaterial) = (p.mesh.material as THREE.MeshStandardMaterial).clone();
    (p.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x40484f);
    for (let i = 0; i < 40; i++) this.particle(new THREE.Vector3(x, 1 + Math.random() * 2, z), 0xe8f4ff, new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 2, (Math.random() - 0.5) * 6), 1.4, -0.4, 0.3);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.pos.x - x, e.pos.z - z) < 5) {
        e.vulnerable = true;
        e.damage(e.kind.boss ? 60 : 120, 'weak');
        e.freeze(e.kind.boss ? 5 : 4);
        setTimeout(() => (e.vulnerable = false), 5000);
      }
    }
    if (Math.hypot(this.playerPos.x - x, this.playerPos.z - z) < 3) this.damagePlayer(12, new THREE.Vector3(x, 0, z));
  }

  // ======================= 战斗 =======================
  private particleGeo = new THREE.BoxGeometry(1, 1, 1);
  private particle(pos: THREE.Vector3, color: number, vel: THREE.Vector3, life: number, gravity = -9, size = 0.05) {
    if (this.particles.length > 200) this.world.remove(this.particles.shift()!.mesh);
    const m = new THREE.Mesh(this.particleGeo, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
    m.scale.setScalar(size);
    m.position.copy(pos);
    this.world.add(m);
    this.particles.push({ mesh: m, vel, life, gravity });
  }

  private decal(point: THREE.Vector3, normal: THREE.Vector3, blood = false, size = 0.08) {
    const mat = blood
      ? new THREE.MeshBasicMaterial({ map: iconTexture('blood'), transparent: true, depthWrite: false })
      : new THREE.MeshBasicMaterial({ color: 0x080808, depthWrite: false });
    const m = new THREE.Mesh(blood ? new THREE.PlaneGeometry(size, size) : new THREE.CircleGeometry(size / 2, 6), mat);
    m.position.copy(point).addScaledVector(normal, 0.012);
    m.lookAt(point.clone().add(normal));
    this.world.add(m);
    this.decals.push(m);
    if (this.decals.length > 60) this.world.remove(this.decals.shift()!);
  }

  private fire() {
    const def = WEAPONS[this.current];
    if (this.fireCd > 0 || this.weapon.busy || this.weapon.reloading > 0) return;
    if (!def.auto && this.triggerHeld) return;
    this.triggerHeld = true;
    if (def.melee) { this.slash(def); return; }
    if (this.mags[this.current] <= 0) {
      audio.dryFire();
      this.fireCd = 0.3;
      this.startReload();
      return;
    }
    this.mags[this.current]--;
    this.fireCd = def.rate;
    this.weapon.kick();
    this.stats.shots++;
    if (def.id === 'cryo') audio.sample('cryo_blast', 0.7) || audio.flash();
    else if (def.pellets) { audio.sample('pistol_shot', 1, 0.6) || audio.gunshot(); audio.explosion(); setTimeout(() => audio.reload(), 380); }
    else if (!audio.sample('pistol_shot', def.id === 'mg' ? 0.5 : 0.8, def.id === 'mg' ? 0.85 : 1)) audio.gunshot();
    this.onShot?.();
    this.pitch += def.pellets ? 0.03 : def.id === 'mg' ? 0.006 : 0.014;
    this.yaw += (Math.random() - 0.5) * (def.id === 'mg' ? 0.01 : 0.004);
    this.flashBurst = Math.max(this.flashBurst, def.pellets ? 0.1 : 0.05);
    if (def.pellets) this.shake = Math.max(this.shake, 0.25);
    for (let i = 0; i < (def.pellets ?? 1); i++) this.shootRay(def, i > 0);
  }

  // 单条弹道：先找立绘命中，再比较墙体距离
  private shootRay(def: WeaponDef, quiet: boolean) {
    const moving = Math.min(1, this.vel.length() / 3);
    const spread = def.spread * (1 + moving);
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3((Math.random() - 0.5) * spread * 2, (Math.random() - 0.5) * spread * 2, -1).normalize().applyQuaternion(this.camera.quaternion);
    if (this.settings.aimAssist && !def.pellets) {
      let best = IS_MOBILE ? 0.09 : 0.05, bd: THREE.Vector3 | null = null;
      for (const e of this.enemies) {
        if (!e.alive || e.state === 'dormant' || (e.kind.passive && !e.enraged)) continue;
        const to = e.center().sub(origin);
        if (to.length() > 30) continue;
        to.normalize();
        const a = to.angleTo(dir);
        if (a < best && lineOfSight(origin.x, origin.z, e.pos.x, e.pos.z)) { best = a; bd = to; }
      }
      if (bd) dir.lerp(bd, 0.75).normalize();
    }
    // 先找立绘命中，再比较墙体距离
    let eh: { e: Enemy; dist: number; part: HitPart; point: THREE.Vector3 } | null = null;
    for (const e of this.enemies) {
      const h = e.hitTest(origin, dir);
      if (h && (!eh || h.dist < eh.dist)) eh = { e, ...h };
    }
    this.raycaster.set(origin, dir);
    this.raycaster.far = 90;
    const wh = this.raycaster.intersectObjects(this.level?.colliders ?? [], false)[0];
    if (eh && (!wh || eh.dist < wh.distance)) {
      const e = eh.e;
      const cryo = def.id === 'cryo';
      e.damage(def.dmg, eh.part, { cryo });
      if (!quiet) this.stats.hits++;
      if (eh.part === 'head' && !quiet) this.stats.headshots++;
      this.hud.hit(!e.alive, eh.part !== 'body');
      const n = dir.clone().negate();
      for (let i = 0; i < (quiet ? 3 : eh.part === 'head' ? 14 : 8); i++) {
        this.particle(eh.point, cryo ? 0xbff6ff : i % 3 ? 0x7a0a05 : 0xd02810, new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3).addScaledVector(n, 2), 0.6);
      }
      if (cryo) for (const o of this.enemies) if (o !== e && o.alive && o.pos.distanceTo(e.pos) < 2.5) o.damage(def.dmg * 0.5, 'body', { cryo: true });
    } else if (wh) {
      const ud = wh.object.userData;
      if (ud.pipe) {
        const pipe = this.level!.pipes.find((p) => p.mesh === wh.object);
        if (pipe) this.burstPipe(pipe);
      }
      const n = wh.face ? wh.face.normal.clone().transformDirection(wh.object.matrixWorld) : dir.clone().negate();
      if (!quiet || Math.random() < 0.4) this.decal(wh.point, n);
      for (let i = 0; i < (quiet ? 2 : 5); i++) this.particle(wh.point.clone().addScaledVector(n, 0.03), def.id === 'cryo' ? 0x9ff : 0xffc060, n.clone().multiplyScalar(2).add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3)), 0.25, -6, 0.025);
    }
  }

  // 赤霄：扇形斩击（不耗弹）。斩到的蛊化者算“断首”，丹奴不会再爬起来
  private slash(def: WeaponDef) {
    this.fireCd = def.rate;
    this.weapon.kick();
    this.stats.shots++;
    const a = audio;
    a.noise(0.18, a.out(), 'bandpass', 2600, 0.35, 1.2, 0.01);
    a.tone('sine', 900, 300, 0.15, 0.06, a.out());
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    let hit = 0;
    setTimeout(() => {
      for (const e of this.enemies) {
        const to = new THREE.Vector3(e.pos.x - this.playerPos.x, 0, e.pos.z - this.playerPos.z);
        const d = to.length() - e.kind.radius;
        if (e.downed && d < 2.2) {
          // 倒地的丹奴：补刀斩首
          e.finish();
          this.hud.message('赤霄斩首——它不会再爬起来了');
          for (let i = 0; i < 12; i++) this.particle(e.pos.clone().setY(0.3), 0x7a0a05, new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3), 0.6);
          hit++;
          continue;
        }
        if (!e.alive || e.state === 'dormant' && e.kind.passive) continue;
        if (d > 2.4 || to.normalize().dot(fwd) < 0.45) continue;
        e.damage(def.dmg, 'body', { melee: true });
        if (e.kind.boss) e.interrupt?.();
        hit++;
        const p = e.center();
        for (let i = 0; i < 10; i++) this.particle(p, i % 3 ? 0x7a0a05 : 0xd02810, new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4), 0.6);
        this.hud.hit(!e.alive, false);
      }
      if (hit) { this.stats.hits++; a.hitFlesh(); this.shake = Math.max(this.shake, 0.2); }
      this.onSlash?.(this.playerPos, fwd);
    }, 120);
  }

  onBell: (() => void) | null = null;

  // 火：煤油灯 / 火油。范围内的蛊化者受火伤，倒地的丹奴被彻底烧尽
  fireBurst(x: number, z: number, radius = 4) {
    const c = new THREE.Vector3(x, 0.4, z);
    audio.explosion(c);
    this.shake = Math.max(this.shake, 0.5);
    this.flashBurst = Math.max(this.flashBurst, 0.3);
    for (let i = 0; i < 40; i++) {
      this.particle(c.clone().add(new THREE.Vector3((Math.random() - 0.5) * radius, Math.random() * 0.6, (Math.random() - 0.5) * radius)),
        i % 3 ? 0xff8020 : 0xffd060, new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random() * 3, (Math.random() - 0.5) * 2), 0.9, 2, 0.08);
    }
    for (const e of this.enemies) {
      if (Math.hypot(e.pos.x - x, e.pos.z - z) > radius) continue;
      if (e.downed) e.finish();
      else if (e.alive) e.damage(e.kind.boss ? 120 : 140, 'body', { fire: true });
    }
    if (Math.hypot(this.playerPos.x - x, this.playerPos.z - z) < radius * 0.6) this.damagePlayer(15, c);
  }
  onSlash: ((pos: THREE.Vector3, fwd: THREE.Vector3) => void) | null = null;

  private startReload() {
    const def = WEAPONS[this.current];
    if (def.melee || this.weapon.reloading > 0 || this.mags[this.current] >= def.mag || this.reserve[def.ammo] <= 0) return;
    this.weapon.reloading = def.reload;
    audio.reload();
  }

  useScan() {
    if (!this.scanUnlocked || this.scanCd > 0) return;
    this.scanT = 6;
    this.scanCd = 12;
    this.scanning = true;
    this.hud.setScan(true);
    if (!audio.sample('scanner_pulse', 0.6)) audio.scan();
    for (const e of this.enemies) if (e.kind.boss) e.weakVisible = true;
    // 勘察镜也能发现暗门
    for (const m of this.level?.secrets.values() ?? []) {
      if (m.position.distanceTo(this.playerPos) < 15) (m.material as THREE.MeshStandardMaterial).emissive?.setHex(0x331100);
    }
    this.onScan?.();
  }

  useFlash() {
    if (!this.flashUnlocked || this.flashCd > 0) return;
    this.flashCd = 8;
    this.flashBurst = 0.6;
    this.hud.whiteFlash();
    audio.flash();
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    for (const e of this.enemies) {
      if (!e.alive || e.state === 'dormant') continue;
      const to = new THREE.Vector3(e.pos.x - this.playerPos.x, 0, e.pos.z - this.playerPos.z);
      const d = to.length();
      if (d > 13 || (to.normalize().dot(fwd) < 0.8 && d > 2)) continue;
      if (!lineOfSight(this.playerPos.x, this.playerPos.z, e.pos.x, e.pos.z)) continue;
      e.stun(e.kind.boss ? 1.0 : 3.2);
    }
  }

  useBell() {
    const man = this.npcs.get('man');
    if (!this.bellUnlocked || this.bellCd > 0) return;
    if (this.bellOwn) {
      // 镇魂铜铃：6 米内的蛊化者僵直，对人类无效
      this.bellCd = 12;
      this.weapon.showBell();
      if (!audio.sample('bronze_bell_long', 0.8)) audio.bellRing();
      for (const e of this.enemies) {
        if (!e.alive || e.kind.human) continue;
        if (Math.hypot(e.pos.x - this.playerPos.x, e.pos.z - this.playerPos.z) < 6.5) e.stun(e.kind.boss ? 1.5 : 2.5);
      }
      this.onBell?.();
      return;
    }
    this.bellCd = 60;
    if (man) man.ringT = 1.2;
    this.weapon.showBell();
    if (!audio.sample('bronze_bell_long', 0.8)) audio.bellRing();
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.pos.x - this.playerPos.x, e.pos.z - this.playerPos.z) < 16) {
        if (this.flags.has('bellCharm') && e.kind.name !== '无名会武装') e.charmT = 8;
        else if (e.kind.boss) e.stun(2);
        else e.flee(6);
      }
    }
  }

  useZhenyin() {
    if (!this.zhenyinUnlocked || this.zhenyinCd > 0) return;
    this.zhenyinCd = 25;
    this.weapon.showBell();
    // 三长两短
    const seq = [0, 520, 1040, 1420, 1640];
    seq.forEach((ms, i) => setTimeout(() => audio.sample(i < 3 ? 'bronze_bell_long' : 'bronze_bell_short', 0.6) || audio.bell(undefined, 0.5), ms));
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.pos.x - this.playerPos.x, e.pos.z - this.playerPos.z) < 13) e.stun(e.kind.boss ? 1.5 : 4);
    }
  }

  private useHerb() {
    if (this.herbs <= 0 || this.hp >= 100 || this.healCd > 0) return;
    this.herbs--;
    this.hp = Math.min(100, this.hp + 40);
    this.healCd = 1;
    audio.pickup();
    this.hud.message('使用草药：生命 +40');
  }

  private tryUse() {
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    // 潜行：从背后无声击倒未察觉的人类守卫
    for (const e of this.enemies) {
      if (!e.alive || (e.state !== 'idle' && e.state !== 'dormant') || !e.kind.ranged || e.kind.boss) continue;
      const dx = e.pos.x - this.playerPos.x, dz = e.pos.z - this.playerPos.z, d = Math.hypot(dx, dz);
      if (d < 1.8 && (dx * fx + dz * fz) / d > 0.6) {
        e.damage(9999, 'head');
        audio.hitFlesh();
        this.hud.message('无声击倒');
        return true;
      }
    }
    // 前方的门 / 暗门
    for (const d of [0.9, 1.8, 2.6]) {
      const { col, row } = toCell(this.playerPos.x + fx * d, this.playerPos.z + fz * d);
      const ch = charAt(col, row);
      if (isDoorChar(ch) && !isDoorOpen(ch)) {
        const door = this.level!.doors.get(ch)!;
        const def = door.def;
        if (def.key && !this.keys.has(def.key)) {
          this.hud.message(`需要${({ red: '红色', blue: '蓝色', yellow: '黄色' } as Record<string, string>)[def.key]}钥匙卡`);
          audio.dryFire();
        } else if (def.flag && !this.flags.has(def.flag)) {
          this.hud.message(def.label ? `${def.label}：被封锁` : '门被锁住了');
          audio.dryFire();
        } else this.openDoor(ch);
        return true;
      }
      if (ch === '$' && this.level!.openSecretAt(col, row)) {
        this.stats.secrets++;
        this.flow.invalidate();
        audio.door();
        this.hud.message('发现隐藏区域！');
        return true;
      }
      if (blocked(col, row)) break;
    }
    return false;
  }

  // ======================= 主循环 =======================
  start() {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private frame(dt: number) {
    if (this.state === 'menu' || this.state === 'inter') {
      this.menuT += dt;
      if (this.level) {
        this.camera.position.set(this.playerPos.x + Math.sin(this.menuT * 0.1) * 2, 1.8, this.playerPos.z + Math.cos(this.menuT * 0.1) * 2);
        this.camera.rotation.set(0, this.menuT * 0.05, 0);
        this.level.update(dt, this.camera.position, this.camera.position);
        this.renderer.render(this.scene, this.camera);
      } else {
        this.renderer.setClearColor(0x000000);
        this.renderer.clear();
      }
      this.weapon.update(dt, 0, false);
      return;
    }
    if (this.state === 'cine') { this.weapon.update(dt, 0, false); return; }
    if (this.state === 'playing') {
      this.input.update();
      if (this.input.consume('pause') && !this.hud.documentOpen && !this.mg.active) this.pause();
      if (this.mg.active || this.hud.documentOpen) {
        this.input.takeLook();
      } else {
        this.time += dt;
        this.stats.time += dt;
        this.totalTime += dt;
        this.updatePlayer(dt);
        this.updateWorld(dt);
      }
      for (let i = this.waiters.length - 1; i >= 0; i--) {
        const w = this.waiters[i];
        if (w.cond()) { this.waiters.splice(i, 1); w.resolve(); }
      }
    } else if (this.state === 'dead') {
      this.updateWorld(dt * 0.25);
    }
    this.syncCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private updatePlayer(dt: number) {
    const inp = this.input;
    const canAct = !this.cutscene;
    const look = inp.takeLook();
    if (canAct) {
      this.yaw -= look.dx;
      this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - look.dy));
    } else if (this.lookTarget) {
      const dx = this.lookTarget.x - this.playerPos.x, dz = this.lookTarget.z - this.playerPos.z;
      let d = Math.atan2(-dx, -dz) - this.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.yaw += d * Math.min(1, dt * 2.5);
      this.pitch += (Math.atan2(this.lookTarget.y - EYE, Math.hypot(dx, dz)) - this.pitch) * Math.min(1, dt * 2.5);
    }

    // 恐怖游戏的移动节奏：慢走、短促奔跑（耗体力）、翻滚闪避
    let mx = canAct ? inp.moveX : 0, my = canAct ? inp.moveY : 0;
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    const { col, row } = toCell(this.playerPos.x, this.playerPos.z);
    this.water = charAt(col, row) === '~';
    const sprinting = inp.sprint && my > 0.3 && this.stamina > 0.05 && !this.water;
    let speed = (my < -0.1 ? 1.7 : 2.4) * (sprinting ? 1.75 : 1);
    if (this.water) speed *= 0.6;
    if (sprinting) this.stamina = Math.max(0, this.stamina - dt * 0.22);
    else this.stamina = Math.min(1, this.stamina + dt * 0.12);
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = (mx * cos - my * sin) * speed;
    let wz = (-mx * sin - my * cos) * speed;
    if (canAct && inp.consume('dash') && this.dashCd <= 0 && this.stamina > 0.3) {
      this.dashT = 0.28;
      this.dashCd = 1.2;
      this.stamina -= 0.3;
      if (ml > 0.1) this.dashDir.set(wx, 0, wz).normalize(); else this.dashDir.set(-mx || sin, 0, cos);
      audio.step(false);
    }
    if (this.dashT > 0) {
      this.dashT -= dt;
      wx = this.dashDir.x * 7;
      wz = this.dashDir.z * 7;
    }
    this.dashCd -= dt;
    const k = Math.min(1, dt * 8);
    this.vel.x += (wx - this.vel.x) * k;
    this.vel.z += (wz - this.vel.z) * k;
    const before = this.playerPos.clone();
    this.playerPos.x += this.vel.x * dt;
    this.playerPos.z += this.vel.z * dt;
    collide(this.playerPos, 0.38);
    // 撞到普通门时自动开门
    {
      const ahead = toCell(this.playerPos.x + this.vel.x * 0.25, this.playerPos.z + this.vel.z * 0.25);
      const ch = charAt(ahead.col, ahead.row);
      if (isDoorChar(ch) && !isDoorOpen(ch)) {
        const d = this.level!.doors.get(ch);
        if (d && !d.def.key && !d.def.flag) this.openDoor(ch);
      }
    }
    const moved = before.distanceTo(this.playerPos);
    this.stepDist += moved;
    this.bobT += moved * 2.2;
    if (this.stepDist > (sprinting ? 1.9 : 1.6)) {
      this.stepDist = 0;
      audio.step(charAt(col, row) === ',' || this.water);
    }

    // 武器与技能
    const def = WEAPONS[this.current];
    this.fireCd -= dt;
    if (!inp.fire) this.triggerHeld = false;
    if (canAct) {
      if (inp.fire) this.fire();
      if (inp.consume('reload')) this.startReload();
      if (inp.consume('scan')) this.useScan();
      if (inp.consume('flash')) this.useFlash();
      if (inp.consume('bell')) this.useBell();
      if (inp.consume('zhenyin')) this.useZhenyin();
      if (inp.consume('heal')) this.useHerb();
      if (inp.consume('weapon1')) this.switchWeapon('pistol');
      if (inp.consume('weapon2')) this.switchWeapon('mg');
      if (inp.consume('weapon3')) this.switchWeapon('cryo');
      if (inp.consume('nextWeapon')) {
        const list = (['pistol', 'mg', 'cryo'] as WeaponId[]).filter((w) => this.owned.has(w));
        this.switchWeapon(list[(list.indexOf(this.current) + 1) % list.length]);
      }
      if (inp.consume('map')) this.mapOpen = !this.mapOpen;
      if (this.mags[this.current] === 0 && this.reserve[def.ammo] > 0 && !inp.fire) this.startReload();
    } else {
      for (const a of ['reload', 'scan', 'flash', 'bell', 'zhenyin', 'heal', 'weapon1', 'weapon2', 'weapon3', 'nextWeapon', 'map'] as const) inp.consume(a);
    }
    if (this.weapon.reloading > 0) {
      this.weapon.reloading -= dt;
      if (this.weapon.reloading <= 0) {
        const need = def.mag - this.mags[this.current];
        const take = Math.min(need, this.reserve[def.ammo]);
        this.mags[this.current] += take;
        this.reserve[def.ammo] -= take;
      }
    }

    // 互动
    let best: Interactable | null = null, bestD = 2.4;
    const fwd = new THREE.Vector3(-sin, 0, -cos);
    if (canAct) for (const it of this.interactables) {
      if (!it.active) continue;
      const to = new THREE.Vector3(it.pos.x - this.playerPos.x, 0, it.pos.z - this.playerPos.z);
      const d = to.length();
      if (d > bestD || (d > 0.7 && to.normalize().dot(fwd) < 0.3)) continue;
      best = it;
      bestD = d;
    }
    let doorPrompt: string | null = null;
    if (!best && canAct) {
      for (const d of [0.9, 1.8]) {
        const c = toCell(this.playerPos.x + fwd.x * d, this.playerPos.z + fwd.z * d);
        const ch = charAt(c.col, c.row);
        if (isDoorChar(ch) && !isDoorOpen(ch)) { doorPrompt = '开门'; break; }
        if (blocked(c.col, c.row)) break;
      }
    }
    const useLabel = best ? best.label : doorPrompt;
    this.hud.setPrompt(useLabel ? `${IS_MOBILE ? '【互动】' : '[E]'} ${useLabel}` : null);
    this.input.setButton('use', { visible: !!useLabel || true });
    if (inp.consume('use') && canAct) {
      if (best) { audio.pickup(); best.onUse(); } else this.tryUse();
    }

    // 拾取
    for (const p of this.pickups) {
      if (p.taken) {
        if (p.respawn > 0) { p.timer -= dt; if (p.timer <= 0) { p.taken = false; p.sprite.visible = true; } }
        continue;
      }
      p.sprite.position.y = 0.45 + Math.sin(this.time * 2.5 + p.sprite.position.x) * 0.06;
      if (Math.hypot(p.sprite.position.x - this.playerPos.x, p.sprite.position.z - this.playerPos.z) > 1.1) continue;
      if (!this.takePickup(p.type)) continue;
      p.taken = true;
      p.sprite.visible = false;
      p.timer = p.respawn;
      if (p.counted) { this.stats.items++; p.counted = false; }
      audio.pickup();
    }

    // 出口
    if (this.exitPads.some((e) => Math.hypot(e.x - this.playerPos.x, e.z - this.playerPos.z) < 1.2)) {
      if (this.exitResolve) {
        const r = this.exitResolve;
        this.exitResolve = null;
        audio.door();
        r();
      } else if (!this.exitEnabled) this.hud.message('还有未完成的目标');
    }

    // 计时
    this.scanCd = Math.max(0, this.scanCd - dt);
    this.flashCd = Math.max(0, this.flashCd - dt);
    this.bellCd = Math.max(0, this.bellCd - dt);
    this.zhenyinCd = Math.max(0, this.zhenyinCd - dt);
    this.healCd = Math.max(0, this.healCd - dt);
    this.scareCd -= dt;
    if (this.scanT > 0) {
      this.scanT -= dt;
      if (this.scanT <= 0) {
        this.scanning = false;
        this.hud.setScan(false);
        for (const e of this.enemies) e.weakVisible = false;
      }
    }
    if (this.water) {
      this.oxygen = Math.max(0, this.oxygen - dt * 4.5);
      if (this.oxygen <= 0) { this.hp -= dt * 8; this.hud.damage(); if (this.hp <= 0) { this.hp = 0; this.setState('dead'); } }
    } else this.oxygen = Math.min(100, this.oxygen + dt * 25);
    this.hud.setWater(this.water);

    const manHere = !!this.npcs.get('man')?.following;
    this.hud.set({
      hp: this.hp, armor: this.armor, ammo: def.melee ? '—' : this.mags[this.current], ammoName: def.name, reserve: this.reserve,
      reserveNames: arsenal === 'tang' ? ['手枪弹', '霰弹', null] : undefined,
      weapons: (['pistol', 'mg', 'cryo'] as WeaponId[]).map((w) => ({ slot: WEAPONS[w].slot, name: WEAPONS[w].name, owned: this.owned.has(w), active: this.current === w })),
      keys: [...this.keys], herbs: this.herbs, stamina: this.stamina,
      oxygen: this.oxygen < 99.5 || this.water ? this.oxygen : null,
      reloading: this.weapon.reloading > 0,
      abilities: [
        { key: 'F', name: '强光', cd: this.flashCd, max: 8, on: this.flashUnlocked },
        { key: 'C', name: '勘察镜', cd: this.scanCd, max: 12, on: this.scanUnlocked },
        { key: 'Q', name: '铜铃', cd: this.bellCd, max: this.bellOwn ? 12 : 60, on: this.bellUnlocked && (manHere || this.bellOwn) },
        { key: 'Z', name: '镇音', cd: this.zhenyinCd, max: 25, on: this.zhenyinUnlocked },
        { key: 'Space', name: '闪避', cd: Math.max(0, this.dashCd), max: 1.2, on: true },
      ],
    });
    this.input.setButton('scan', { visible: this.scanUnlocked, cooldown: this.scanCd / 12 });
    this.input.setButton('flash', { visible: this.flashUnlocked, cooldown: this.flashCd / 8 });
    this.input.setButton('bell', { visible: this.bellUnlocked && (manHere || this.bellOwn), cooldown: this.bellCd / (this.bellOwn ? 12 : 60) });
    this.input.setButton('zhenyin', { visible: this.zhenyinUnlocked, cooldown: this.zhenyinCd / 25 });
    this.input.setButton('weapon', { visible: this.owned.size > 1 });
    this.input.setButton('dash', { cooldown: Math.max(0, this.dashCd) / 1.2 });
    this.hud.setCrosshair(Math.min(1, this.vel.length() / 3), !this.cutscene);
    this.hud.update(dt, this.hp);
    audio.heartbeat(dt, this.hp < 35 ? (35 - this.hp) / 35 : 0);
    if (this.boss) this.hud.setBoss(this.boss.alive ? this.bossName || this.boss.name : null, this.boss.hp / this.boss.maxHp);
    this.hud.markExplored(this.playerPos.x, this.playerPos.z);
    this.hud.drawMap(this.mapOpen, this.playerPos.x, this.playerPos.z, this.yaw, this.exitEnabled ? this.exitPads : []);
  }

  private takePickup(t: ItemType): boolean {
    const msg = (s: string) => this.hud.message(s);
    switch (t) {
      case 'ammo': this.reserve.ammo += 12; msg('拾取 手枪弹 ×12'); return true;
      case 'mg_ammo':
        if (arsenal === 'tang') { this.reserve.mg_ammo += 8; msg('拾取 霰弹 ×8'); return true; }
        this.reserve.mg_ammo += 50; msg('拾取 机枪弹 ×50'); return true;
      case 'cryo_ammo': this.reserve.cryo_ammo += 6; msg('拾取 冷凝弹 ×6'); return true;
      case 'herb': this.herbs++; msg('拾取 草药'); return true;
      case 'medkit': if (this.hp >= 100) return false; this.hp = Math.min(100, this.hp + 25); msg('急救包：生命 +25'); return true;
      case 'armor': if (this.armor >= 100) return false; this.armor = Math.min(100, this.armor + 50); msg(arsenal === 'tang' ? '牛皮护甲：护甲 +50' : 'NBER 防弹背心：护甲 +50'); return true;
      case 'key_red': this.keys.add('red'); msg('获得 红色钥匙卡'); return true;
      case 'key_blue': this.keys.add('blue'); msg('获得 蓝色钥匙卡'); return true;
      case 'key_yellow': this.keys.add('yellow'); msg('获得 黄色钥匙卡'); return true;
      case 'weapon_mg':
        if (arsenal === 'tang') { this.giveWeapon('mg', 8); msg('缴获 短管霰弹枪'); return true; }
        this.giveWeapon('mg', 60); msg('获得 重机枪'); return true;
      case 'weapon_cryo': this.giveWeapon('cryo', 12); msg('获得 冷凝枪'); return true;
    }
    return false;
  }

  private updateWorld(dt: number) {
    const { col, row } = toCell(this.playerPos.x, this.playerPos.z);
    this.flow.update(col, row);
    if (!this.frozen) {
      for (const e of this.enemies) {
        if (!e.alive && !e.justDied && e.mat.opacity <= 0) { e.group.visible = false; continue; }
        if (e.alive && Math.abs(e.pos.x - this.playerPos.x) + Math.abs(e.pos.z - this.playerPos.z) > 55) continue;
        // 被铜铃驱使的蛊化者攻击附近的无名会成员
        if (e.charmT > 0) {
          const victim = this.enemies.find((o) => o.alive && o.kind.name === '无名会武装' && o.pos.distanceTo(e.pos) < 14);
          if (victim) {
            const dx = victim.pos.x - e.pos.x, dz = victim.pos.z - e.pos.z, d = Math.hypot(dx, dz);
            if (d > 1.3) { e.pos.x += (dx / d) * e.speed * dt; e.pos.z += (dz / d) * e.speed * dt; collide(e.pos, e.kind.radius); }
            else if (Math.random() < dt * 1.5) victim.damage(30, 'body');
            e.group.position.set(e.pos.x, 0, e.pos.z);
            e.group.rotation.y = Math.atan2(this.camPos.x - e.pos.x, this.camPos.z - e.pos.z);
            e.charmT -= dt;
            continue;
          }
        }
        e.update(dt, this);
        if (e.justDied) {
          e.justDied = false;
          if (e.kind.name !== '菌丝锚点' && !e.killCounted) this.stats.kills++;
          e.killCounted = true;
          const fx = this.camPos.x - e.pos.x, fz = this.camPos.z - e.pos.z;
          const fl = Math.hypot(fx, fz) || 1;
          const bp = new THREE.Vector3(e.pos.x - (fx / fl) * 0.6, 0.02, e.pos.z - (fz / fl) * 0.6);
          this.decal(bp, new THREE.Vector3(0, 1, 0), true, e.height * 0.9);
          if (!e.kind.boss && Math.random() < 0.3) this.dropLoot(e.pos);
          this.onKill?.(e);
        }
      }
      for (let i = 0; i < this.enemies.length; i++) {
        const a = this.enemies[i];
        if (!a.alive || a.kind.speed === 0) continue;
        for (let j = i + 1; j < this.enemies.length; j++) {
          const b = this.enemies[j];
          if (!b.alive || b.kind.speed === 0) continue;
          const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, min = a.kind.radius + b.kind.radius, d2 = dx * dx + dz * dz;
          if (d2 < min * min && d2 > 1e-6) {
            const d = Math.sqrt(d2), p = (min - d) / 2;
            a.pos.x -= (dx / d) * p; a.pos.z -= (dz / d) * p; b.pos.x += (dx / d) * p; b.pos.z += (dz / d) * p;
          }
        }
      }
      this.updateProjectiles(dt);
    } else {
      for (const e of this.enemies) e.group.rotation.y = Math.atan2(this.camPos.x - e.pos.x, this.camPos.z - e.pos.z);
    }
    for (const p of this.props) p.rotation.y = Math.atan2(this.camPos.x - p.position.x, this.camPos.z - p.position.z);
    const su = this.npcs.get('su');
    for (const n of this.npcs.values()) n.update(dt, this.playerPos, this.camPos, this.flow, n.id === 'man' && su?.following ? su.pos : undefined);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.world.remove(p.mesh); (p.mesh.material as THREE.Material).dispose(); this.particles.splice(i, 1); continue; }
      p.vel.y += p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.position.y < 0.01) { p.mesh.position.y = 0.01; p.vel.set(0, 0, 0); }
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.9, p.life * 2);
    }
    // 通电轨道火花
    if (this.electrified.size && Math.random() < 0.6) {
      for (const [idx, t] of this.electrified) {
        if (t < this.time) { this.electrified.delete(idx); continue; }
        if (Math.random() < 0.15) {
          const { x, z } = cellCenter(idx % COLS, Math.floor(idx / COLS));
          this.particle(new THREE.Vector3(x + (Math.random() - 0.5) * 2, 0.1, z + (Math.random() - 0.5) * 2), 0x9fe8ff, new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2), 0.3, -8, 0.04);
        }
      }
    }
    this.level?.update(dt, this.playerPos, this.camPos);
  }

  private dropLoot(p: THREE.Vector3) {
    const types: ItemType[] = ['ammo', 'ammo', 'herb', 'medkit'];
    if (this.owned.has('mg')) types.push('mg_ammo');
    if (this.owned.has('cryo') && !WEAPONS.cryo.melee) types.push('cryo_ammo');
    const t = types[(Math.random() * types.length) | 0];
    const { col, row } = toCell(p.x, p.z);
    const c = cellCenter(col, row);
    this.addPickup(t, col, row, 0, p.x - c.x, p.z - c.z);
    this.stats.totalItems--; // 掉落物不计入收集率
    this.pickups[this.pickups.length - 1].counted = false;
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.falling) p.vel.y -= 14 * dt;
      p.sprite.position.addScaledVector(p.vel, dt);
      const pos = p.sprite.position;
      let dead = p.life <= 0;
      const { col, row } = toCell(pos.x, pos.z);
      if (!p.falling && (blocked(col, row) && charAt(col, row) !== 'b' && charAt(col, row) !== 'T' || pos.y < 0)) dead = true;
      if (p.falling && pos.y <= 0.3) {
        dead = true;
        if (Math.hypot(pos.x - this.playerPos.x, pos.z - this.playerPos.z) < 1.3) this.damagePlayer(p.dmg, pos.clone());
        for (let k = 0; k < 8; k++) this.particle(pos.clone(), 0x901008, new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4), 0.5);
      }
      if (!p.falling && !dead && Math.hypot(pos.x - this.playerPos.x, pos.z - this.playerPos.z) < 0.6 && pos.y < 2.1) {
        this.damagePlayer(p.dmg, p.owner?.pos ?? pos.clone());
        dead = true;
      }
      if (dead) {
        this.world.remove(p.sprite);
        if (p.warn) this.world.remove(p.warn);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private syncCamera(dt: number) {
    this.shake = Math.max(0, this.shake - dt * 1.4);
    const bob = Math.sin(this.bobT) * 0.04;
    const s = this.shake * this.shake;
    const eye = this.water ? 1.25 : EYE;
    this.camera.position.set(
      this.playerPos.x + (Math.random() - 0.5) * s * 0.3,
      eye + bob + (Math.random() - 0.5) * s * 0.3,
      this.playerPos.z + (Math.random() - 0.5) * s * 0.3,
    );
    this.camPos.copy(this.camera.position);
    this.camera.rotation.set(this.pitch, this.yaw, Math.sin(this.bobT * 0.5) * 0.006 + (this.dashT > 0 ? 0.05 : 0));
    this.flashBurst = Math.max(0, this.flashBurst - dt);
    const base = this.flashlightWeak ? 32 : 70;
    this.flashlight.intensity = this.flashBurst > 0 ? base + this.flashBurst * 500 : base;
    this.flashlight.angle = this.flashBurst > 0.1 ? 0.7 : 0.48;
    audio.setListener(this.playerPos.x, EYE, this.playerPos.z, -Math.sin(this.yaw), -Math.cos(this.yaw));
    const moving = Math.min(1, this.vel.length() / 3);
    this.weapon.update(dt, moving, (this.state === 'playing' || this.state === 'dead') && !this.cutscene && !this.mapOpen);
  }
}
