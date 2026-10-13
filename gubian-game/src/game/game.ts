import * as THREE from 'three';
import { audio } from '../core/audio';
import { Input } from '../core/input';
import { makeTextures, Textures } from '../core/textures';
import { Level, regionOf } from '../world/level';
import { CELL, cellCenter, collide, DoorId, FlowField, isExterior, toCell, lineOfSight, resetDoors } from '../world/map';
import { Enemy, EnemyHost, EnemyKind, EnemyState, HitPart } from '../entities/enemy';
import { Companion, CompanionId } from '../entities/companion';
import { Pistol } from './weapon';
import { Hud } from '../ui/hud';

export type Quality = 'low' | 'mid' | 'high';

export interface Settings {
  quality: Quality;
  sensitivity: number;
  volume: number;
  aimAssist: boolean;
}

interface Interactable {
  id: string;
  pos: THREE.Vector3;
  label: string;
  active: boolean;
  mesh?: THREE.Object3D;
  onUse: () => void;
}

interface Pickup {
  type: 'ammo' | 'herb';
  amount: number;
  mesh: THREE.Object3D;
  taken: boolean;
  respawn: number; // >0 表示被拾取后若干秒重新出现
  timer: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  gravity: number;
  grow: number;
}

interface Waiter {
  cond: () => boolean;
  resolve: () => void;
}

type GameState = 'menu' | 'playing' | 'paused' | 'dead' | 'ended';

const EYE = 1.62;

export class Game implements EnemyHost {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  private viewScene = new THREE.Scene();
  private viewCam: THREE.PerspectiveCamera;
  tex: Textures;
  level: Level;
  input: Input;
  hud = new Hud();
  pistol: Pistol;
  flow = new FlowField();
  enemies: Enemy[] = [];
  companions = new Map<CompanionId, Companion>();
  interactables: Interactable[] = [];
  pickups: Pickup[] = [];
  private particles: Particle[] = [];
  private decals: THREE.Mesh[] = [];
  private waiters: Waiter[] = [];
  private flashlight: THREE.SpotLight;
  private hemi: THREE.HemisphereLight;
  private moon: THREE.DirectionalLight;
  private raycaster = new THREE.Raycaster();

  state: GameState = 'menu';
  time = 0;
  playerPos = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  hp = 100;
  herbs = 1;
  cutscene = false;
  frozen = false; // 冻结敌人 AI
  lookTarget: THREE.Vector3 | null = null;
  scanning = false;
  scanUnlocked = false;
  flashUnlocked = false;
  bellUnlocked = false;
  scanCd = 0;
  scanT = 0;
  flashCd = 0;
  bellCd = 0;
  private healCd = 0;
  private shake = 0;
  private stepDist = 0;
  private vel = new THREE.Vector3();
  private bobT = 0;
  private menuT = 0;
  private flashBurst = 0;
  private checkpoint = { x: 0, z: 0, yaw: 0, mag: 12, reserve: 24, herbs: 1 };
  stats = { kills: 0, headshots: 0, shots: 0, hits: 0, start: 0 };
  boss: Enemy | null = null;
  bossName = '';
  onScan: (() => void) | null = null;
  onFlash: (() => void) | null = null;
  onBell: (() => void) | null = null;
  onKill: ((e: Enemy) => void) | null = null;
  onStateChange: ((s: GameState) => void) | null = null;
  private itemMats = new Map<string, THREE.Material>();

  constructor(canvas: HTMLCanvasElement, public settings: Settings) {
    const q = settings.quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: q !== 'low', powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.renderer.shadowMap.enabled = q === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.autoClear = false;

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 140);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.scene.background = new THREE.Color(0x05080a);
    this.scene.fog = new THREE.FogExp2(0x05080a, 0.05);

    this.viewCam = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 5);
    this.viewScene.add(this.viewCam);
    this.viewScene.add(new THREE.HemisphereLight(0x8090a0, 0x201810, 0.9));
    const vl = new THREE.DirectionalLight(0xfff0dd, 1.2);
    vl.position.set(0.5, 1, 0.5);
    this.viewScene.add(vl);

    this.tex = makeTextures();
    this.level = new Level(this.tex, q === 'high' ? 6 : q === 'mid' ? 4 : 3);
    this.scene.add(this.level.group);

    this.hemi = new THREE.HemisphereLight(0x51667a, 0x2a1a10, 0.8);
    this.scene.add(this.hemi);
    this.moon = new THREE.DirectionalLight(0x7f96b8, 0.9);
    this.moon.position.set(-20, 40, -30);
    this.scene.add(this.moon);

    // 手电筒
    this.flashlight = new THREE.SpotLight(0xfff2dc, 60, 34, 0.5, 0.45, 1.3);
    this.flashlight.position.set(0.2, -0.15, 0);
    this.flashlight.target.position.set(0, 0, -1);
    this.flashlight.castShadow = q === 'high';
    this.flashlight.shadow.mapSize.set(1024, 1024);
    this.flashlight.shadow.camera.near = 0.3;
    this.camera.add(this.flashlight, this.flashlight.target);

    this.pistol = new Pistol(this.viewCam);
    this.input = new Input(canvas);
    this.input.sensitivity = settings.sensitivity;
    this.input.onPointerLockLost = () => {
      if (this.state === 'playing' && !this.hud.documentOpen) this.pause();
    };

    // 阅读档案时释放鼠标，方便点击关闭
    this.hud.onDocOpen = () => this.input.unlock();
    this.hud.onDocClose = () => {
      this.input.clear();
      if (this.state === 'playing') this.input.lock();
    };
    window.addEventListener('resize', () => this.resize());
    this.hud.show(false);
    this.input.showTouch(false);
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
  }

  private resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = this.viewCam.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.viewCam.updateProjectionMatrix();
  }

  setState(s: GameState) {
    this.state = s;
    const playing = s === 'playing';
    this.hud.show(s === 'playing' || s === 'paused' || s === 'dead');
    this.input.enabled = playing;
    this.input.showTouch(playing);
    if (playing) this.input.lock();
    else this.input.unlock();
    this.onStateChange?.(s);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.setState('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.input.clear();
    this.setState('playing');
  }

  // ---------------- 剧情工具 ----------------
  until(cond: () => boolean): Promise<void> {
    if (cond()) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push({ cond, resolve }));
  }

  wait(sec: number) {
    const t = this.time + sec;
    return this.until(() => this.time >= t);
  }

  async say(speaker: string, text: string, dur?: number) {
    if (speaker === '陈砚' || speaker === '广播') audio.radio();
    this.hud.say(speaker, text);
    await this.wait(dur ?? 1.4 + text.length * 0.11);
    this.hud.say('', '');
  }

  objective(text: string) {
    this.hud.setObjective(text);
  }

  async setCutscene(on: boolean) {
    this.cutscene = on;
    this.frozen = on;
    this.hud.setLetterbox(on);
    this.input.showTouch(!on && this.state === 'playing');
    if (!on) this.lookTarget = null;
  }

  setPlayer(x: number, z: number, yaw: number) {
    this.playerPos.set(x, 0, z);
    this.yaw = yaw;
    this.pitch = 0;
  }

  saveCheckpoint() {
    this.checkpoint = {
      x: this.playerPos.x, z: this.playerPos.z, yaw: this.yaw,
      mag: this.pistol.mag, reserve: this.pistol.reserve, herbs: this.herbs,
    };
  }

  respawn() {
    const c = this.checkpoint;
    this.setPlayer(c.x, c.z, c.yaw);
    this.pistol.mag = c.mag;
    this.pistol.reserve = Math.max(c.reserve, 12);
    this.pistol.reloading = 0;
    this.herbs = Math.max(c.herbs, 1);
    this.hp = 100;
    for (const e of this.enemies) e.reset();
    for (const comp of this.companions.values()) {
      if (comp.following) comp.pos.set(c.x - Math.sin(c.yaw) * 1.5, 0, c.z - Math.cos(c.yaw) * 1.5);
    }
    this.flow.invalidate();
    this.hud.setFade(0, 800);
    this.setState('playing');
  }

  // ---------------- 实体工厂 ----------------
  spawnEnemy(kind: EnemyKind, col: number, row: number, yaw = 0, state: EnemyState = 'idle', ox = 0, oz = 0) {
    const { x, z } = cellCenter(col, row);
    const e = new Enemy(kind, this.tex, x + ox, z + oz, yaw, state);
    this.enemies.push(e);
    this.scene.add(e.group);
    return e;
  }

  spawnCompanion(id: CompanionId, col: number, row: number, ox = 0, oz = 0) {
    const { x, z } = cellCenter(col, row);
    const c = new Companion(id, x + ox, z + oz);
    this.companions.set(id, c);
    this.scene.add(c.group);
    return c;
  }

  private itemMesh(kind: string): THREE.Object3D {
    const g = new THREE.Group();
    const em = (color: number, emissive: number) => {
      const key = `${color}-${emissive}`;
      if (!this.itemMats.has(key)) {
        this.itemMats.set(key, new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.8, roughness: 0.5 }));
      }
      return this.itemMats.get(key)!;
    };
    if (kind === 'ammo') {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.2), em(0x3b4a2a, 0x223311));
      b.position.y = 0.08;
      const label = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.21), em(0xd0b040, 0x664400));
      label.position.y = 0.12;
      g.add(b, label);
    } else if (kind === 'herb') {
      for (let i = 0; i < 4; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 5), em(0x2f7a2a, 0x113a10));
        leaf.position.set(Math.cos(i * 1.6) * 0.05, 0.12, Math.sin(i * 1.6) * 0.05);
        leaf.rotation.z = Math.cos(i) * 0.4;
        g.add(leaf);
      }
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.08, 8), em(0x6a4a30, 0x221100));
      pot.position.y = 0.04;
      g.add(pot);
    } else if (kind === 'phone') {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.16), em(0x111111, 0x000000));
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.14), new THREE.MeshBasicMaterial({ color: 0x88aaff }));
      s.rotation.x = -Math.PI / 2;
      s.position.y = 0.006;
      g.add(b, s);
      g.position.y = 0.01;
    } else if (kind === 'file') {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.3), em(0xd8cfb0, 0x332e20));
      g.add(p);
    } else if (kind === 'keycard') {
      const k = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.005, 0.055), em(0xcc2222, 0xaa1010));
      g.add(k);
    }
    g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    return g;
  }

  addPickup(type: 'ammo' | 'herb', col: number, row: number, amount: number, ox = 0, oz = 0, y = 0, respawn = 0) {
    const { x, z } = cellCenter(col, row);
    const mesh = this.itemMesh(type);
    mesh.position.set(x + ox, y, z + oz);
    this.scene.add(mesh);
    this.pickups.push({ type, amount, mesh, taken: false, respawn, timer: 0 });
  }

  addInteractable(id: string, kind: string, col: number, row: number, label: string, onUse: () => void, ox = 0, oz = 0, y = 0) {
    const { x, z } = cellCenter(col, row);
    let mesh: THREE.Object3D | undefined;
    if (kind) {
      mesh = this.itemMesh(kind);
      mesh.position.set(x + ox, y, z + oz);
      this.scene.add(mesh);
    }
    const it: Interactable = { id, pos: new THREE.Vector3(x + ox, y, z + oz), label, active: true, mesh, onUse };
    this.interactables.push(it);
    return it;
  }

  removeInteractable(id: string) {
    const it = this.interactables.find((i) => i.id === id);
    if (!it) return;
    it.active = false;
    if (it.mesh) this.scene.remove(it.mesh);
  }

  openDoor(id: DoorId, open = true) {
    this.level.setDoor(id, open);
    this.flow.invalidate();
    audio.door();
  }

  cellOfPlayer() {
    return toCell(this.playerPos.x, this.playerPos.z);
  }

  inCells(c0: number, r0: number, c1: number, r1: number) {
    const { col, row } = this.cellOfPlayer();
    return col >= c0 && col <= c1 && row >= r0 && row <= r1;
  }

  // ---------------- EnemyHost ----------------
  damagePlayer(amount: number, from: THREE.Vector3) {
    if (this.state !== 'playing' || this.cutscene) return;
    this.hp -= amount;
    this.hud.damage();
    this.shake = Math.max(this.shake, 0.35);
    audio.playerHurt();
    const dx = this.playerPos.x - from.x, dz = this.playerPos.z - from.z;
    const l = Math.hypot(dx, dz) || 1;
    this.vel.x += (dx / l) * 5;
    this.vel.z += (dz / l) * 5;
    if (this.hp <= 0) {
      this.hp = 0;
      this.hud.setFade(0.85, 1500);
      this.setState('dead');
    }
  }

  onPipeCollision(e: Enemy): boolean {
    for (const p of this.level.pipes) {
      if (p.burst) continue;
      const { x, z } = cellCenter(p.col, p.row);
      if (Math.hypot(e.pos.x - x, e.pos.z - z) < 2.0) {
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
    (p.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x55606a);
    for (let i = 0; i < 40; i++) {
      this.particle(new THREE.Vector3(x, 1.2 + Math.random() * 1.5, z), 0xe8f4ff,
        new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 2, (Math.random() - 0.5) * 6), 1.6, -0.5, 0.35, 2.5);
    }
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.pos.x - x, e.pos.z - z);
      if (d < 4.5) {
        e.damage(e.kind === 'butcher' ? 30 : 100, 'weak');
        e.stun(e.kind === 'butcher' ? 4.5 : 3);
        if (e.kind === 'butcher') e.yaw += Math.PI * 0.9; // 踉跄转身，背部囊泡暴露
      }
    }
    const pd = Math.hypot(this.playerPos.x - x, this.playerPos.z - z);
    if (pd < 3) this.damagePlayer(15, new THREE.Vector3(x, 0, z));
  }

  // ---------------- 特效 ----------------
  private particleGeo = new THREE.BoxGeometry(1, 1, 1);
  private particle(pos: THREE.Vector3, color: number, vel: THREE.Vector3, life: number, gravity = -9, size = 0.04, grow = 0) {
    if (this.particles.length > 220) {
      const old = this.particles.shift()!;
      this.scene.remove(old.mesh);
    }
    const m = new THREE.Mesh(this.particleGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
    m.scale.setScalar(size);
    m.position.copy(pos);
    this.scene.add(m);
    this.particles.push({ mesh: m, vel, life, gravity, grow });
  }

  private bulletHole(point: THREE.Vector3, normal: THREE.Vector3) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.04, 6), new THREE.MeshBasicMaterial({ color: 0x080808, depthWrite: false }));
    m.position.copy(point).addScaledVector(normal, 0.01);
    m.lookAt(point.clone().add(normal));
    this.scene.add(m);
    this.decals.push(m);
    if (this.decals.length > 40) this.scene.remove(this.decals.shift()!);
  }

  // ---------------- 战斗 ----------------
  private fire() {
    if (!this.pistol.tryFire()) return;
    this.stats.shots++;
    const moving = Math.min(1, this.vel.length() / 4);
    const spread = this.pistol.aimK > 0.8 ? 0.003 : 0.012 + moving * 0.03;
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * spread * 2, (Math.random() - 0.5) * spread * 2, -1,
    ).normalize().applyQuaternion(this.camera.quaternion);
    const origin = this.camera.getWorldPosition(new THREE.Vector3());

    // 触屏辅助瞄准：吸附到准星附近的头部
    if (this.settings.aimAssist) {
      let best = 0.06, bestDir: THREE.Vector3 | null = null;
      for (const e of this.enemies) {
        if (!e.alive || e.state === 'dormant') continue;
        const to = e.headPos.sub(origin);
        const d = to.length();
        if (d > 25) continue;
        to.normalize();
        const ang = to.angleTo(dir);
        if (ang < best && lineOfSight(origin.x, origin.z, e.pos.x, e.pos.z)) { best = ang; bestDir = to; }
      }
      if (bestDir) dir.copy(bestDir);
    }

    this.raycaster.set(origin, dir);
    this.raycaster.far = 80;
    const targets: THREE.Object3D[] = [...this.level.colliders];
    for (const e of this.enemies) if (e.alive) targets.push(...e.hitMeshes);
    const hits = this.raycaster.intersectObjects(targets, false);
    this.pitch += 0.018; // 后坐力
    this.yaw += (Math.random() - 0.5) * 0.008;
    const h = hits[0];
    if (!h) return;
    const ud = h.object.userData;
    if (ud.enemy) {
      const e = ud.enemy as Enemy;
      const part = ud.part as HitPart;
      e.damage(25, part);
      this.stats.hits++;
      if (part === 'head') this.stats.headshots++;
      const kill = !e.alive;
      this.hud.hit(kill, part === 'weak' || part === 'head');
      for (let i = 0; i < (part === 'head' ? 14 : 8); i++) {
        this.particle(h.point, i % 3 ? 0x7a0a05 : 0xd02810,
          new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3).addScaledVector(dir, -2), 0.6);
      }
    } else {
      if (ud.pipe) {
        const pipe = this.level.pipes.find((p) => p.mesh === h.object);
        if (pipe) this.burstPipe(pipe);
      }
      const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : dir.clone().negate();
      this.bulletHole(h.point, n);
      for (let i = 0; i < 6; i++) {
        this.particle(h.point.clone().addScaledVector(n, 0.02), 0xffc060,
          n.clone().multiplyScalar(2).add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3)), 0.25, -6, 0.02);
      }
    }
  }

  useScan() {
    if (!this.scanUnlocked || this.scanCd > 0) return;
    this.scanT = 6;
    this.scanCd = 12;
    this.scanning = true;
    this.hud.setScan(true);
    audio.scan();
    this.onScan?.();
  }

  useFlash() {
    if (!this.flashUnlocked || this.flashCd > 0) return;
    this.flashCd = 8;
    this.flashBurst = 0.6;
    audio.flash();
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    fwd.y = 0;
    fwd.normalize();
    let n = 0;
    for (const e of this.enemies) {
      if (!e.alive || e.state === 'dormant') continue;
      const to = new THREE.Vector3(e.pos.x - this.playerPos.x, 0, e.pos.z - this.playerPos.z);
      const d = to.length();
      if (d > 12) continue;
      to.normalize();
      if (to.dot(fwd) < 0.82 && d > 2) continue;
      if (!lineOfSight(this.playerPos.x, this.playerPos.z, e.pos.x, e.pos.z)) continue;
      e.stun(e.kind === 'butcher' ? 1.0 : 3);
      n++;
    }
    if (n) this.onFlash?.();
  }

  useBell() {
    const man = this.companions.get('man');
    if (!this.bellUnlocked || this.bellCd > 0 || !man) return;
    this.bellCd = 60;
    man.ringT = 1.2;
    audio.bellRing({ x: man.pos.x, y: 1, z: man.pos.z });
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.pos.x - this.playerPos.x, e.pos.z - this.playerPos.z) < 15) e.flee(6);
    }
    this.onBell?.();
  }

  private useHerb() {
    if (this.herbs <= 0 || this.hp >= 100 || this.healCd > 0) return;
    this.herbs--;
    this.hp = Math.min(100, this.hp + 45);
    this.healCd = 1;
    audio.pickup();
    this.hud.showHint('使用草药：生命恢复', 2);
  }

  // ---------------- 主循环 ----------------
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
    if (this.state === 'menu') {
      this.menuT += dt;
      const { x, z } = cellCenter(10, 2);
      this.camera.position.set(x + Math.sin(this.menuT * 0.05) * 6, 2.2, z - 6);
      this.camera.lookAt(x, 2.2, z + 30);
      this.flashlight.intensity = 0;
      this.level.update(dt, this.camera.position);
      this.render();
      return;
    }

    if (this.state === 'playing') {
      this.input.update();
      if (this.input.consume('pause')) {
        if (!this.hud.documentOpen) this.pause();
      }
      this.time += dt;
      this.updatePlayer(dt);
      this.updateWorld(dt);
      // 剧情等待
      for (let i = this.waiters.length - 1; i >= 0; i--) {
        const w = this.waiters[i];
        if (w.cond()) {
          this.waiters.splice(i, 1);
          w.resolve();
        }
      }
    } else if (this.state === 'dead') {
      this.updateWorld(dt * 0.2);
    }
    this.syncCamera(dt);
    this.render();
  }

  private updatePlayer(dt: number) {
    const inp = this.input;
    const docOpen = this.hud.documentOpen;
    const canAct = !this.cutscene && !docOpen;
    const look = inp.takeLook();
    if (canAct) {
      const sens = this.pistol.aimK > 0.5 ? 0.6 : 1;
      this.yaw -= look.dx * sens;
      this.pitch -= look.dy * sens;
      this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));
    } else if (this.lookTarget) {
      const dx = this.lookTarget.x - this.playerPos.x, dz = this.lookTarget.z - this.playerPos.z;
      const ty = Math.atan2(-dx, -dz);
      let d = ty - this.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.yaw += d * Math.min(1, dt * 2.5);
      const tp = Math.atan2(this.lookTarget.y - EYE, Math.hypot(dx, dz));
      this.pitch += (tp - this.pitch) * Math.min(1, dt * 2.5);
    }

    // 移动
    const aiming = canAct && inp.aim;
    let mx = canAct ? inp.moveX : 0, my = canAct ? inp.moveY : 0;
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    const sprint = inp.sprint && my > 0.3 && !aiming;
    const speed = aiming ? 2.0 : sprint ? 5.4 : 3.3;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const wx = (mx * cos - my * sin) * speed;
    const wz = (-mx * sin - my * cos) * speed;
    const k = Math.min(1, dt * 10);
    this.vel.x += (wx - this.vel.x) * k;
    this.vel.z += (wz - this.vel.z) * k;
    const before = this.playerPos.clone();
    this.playerPos.x += this.vel.x * dt;
    this.playerPos.z += this.vel.z * dt;
    collide(this.playerPos, 0.38);
    const moved = before.distanceTo(this.playerPos);
    this.stepDist += moved;
    this.bobT += moved * 2.4;
    if (this.stepDist > (sprint ? 2.2 : 1.8)) {
      this.stepDist = 0;
      const { col, row } = this.cellOfPlayer();
      audio.step(isExterior(col, row));
    }

    // 武器与能力
    if (canAct) {
      if (inp.fire) this.fire();
      if (inp.consume('reload')) this.pistol.startReload();
      if (inp.consume('scan')) this.useScan();
      if (inp.consume('flash')) this.useFlash();
      if (inp.consume('bell')) this.useBell();
      if (inp.consume('heal')) this.useHerb();
      if (this.pistol.mag === 0 && this.pistol.reserve > 0 && !inp.fire) this.pistol.startReload();
    } else {
      inp.consume('reload'); inp.consume('scan'); inp.consume('flash'); inp.consume('bell'); inp.consume('heal');
    }
    this.pistol.update(dt, Math.min(1, this.vel.length() / 4), aiming);

    // 互动
    let best: Interactable | null = null, bestD = 2.4;
    if (canAct) {
      const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      for (const it of this.interactables) {
        if (!it.active) continue;
        const to = new THREE.Vector3(it.pos.x - this.playerPos.x, 0, it.pos.z - this.playerPos.z);
        const d = to.length();
        if (d > bestD) continue;
        if (d > 0.6 && to.normalize().dot(fwd) < 0.35) continue;
        best = it;
        bestD = d;
      }
    }
    this.hud.setPrompt(best ? `${inp.touchMode ? '【互动】' : '[E]'} ${best.label}` : null);
    this.input.setButtonState('interact', { visible: !!best });
    const wantsUse = inp.consume('interact');
    if (best && wantsUse) {
      audio.pickup();
      best.onUse();
    }

    // 拾取
    for (const p of this.pickups) {
      if (p.taken) {
        if (p.respawn > 0) {
          p.timer -= dt;
          if (p.timer <= 0) { p.taken = false; p.mesh.visible = true; }
        }
        continue;
      }
      p.mesh.rotation.y += dt;
      if (Math.hypot(p.mesh.position.x - this.playerPos.x, p.mesh.position.z - this.playerPos.z) < 1.1) {
        p.taken = true;
        p.mesh.visible = false;
        p.timer = p.respawn;
        audio.pickup();
        if (p.type === 'ammo') {
          this.pistol.reserve += p.amount;
          this.hud.showHint(`拾取 手枪弹药 ×${p.amount}`, 2);
        } else {
          this.herbs += p.amount;
          this.hud.showHint(`拾取 草药 ×${p.amount}`, 2);
        }
      }
    }

    // 计时
    this.scanCd = Math.max(0, this.scanCd - dt);
    this.flashCd = Math.max(0, this.flashCd - dt);
    this.bellCd = Math.max(0, this.bellCd - dt);
    this.healCd = Math.max(0, this.healCd - dt);
    if (this.scanT > 0) {
      this.scanT -= dt;
      if (this.scanT <= 0) {
        this.scanning = false;
        this.hud.setScan(false);
      }
    }

    // HUD
    this.hud.setHealth(this.hp);
    this.hud.setAmmo(this.pistol.mag, this.pistol.reserve, this.pistol.reloading > 0);
    this.hud.setHerbs(this.herbs);
    this.hud.setAbilities([
      { key: 'Q', name: '勘察镜', cd: this.scanCd, unlocked: this.scanUnlocked },
      { key: 'F', name: '强光', cd: this.flashCd, unlocked: this.flashUnlocked },
      { key: 'G', name: '铜铃', cd: this.bellCd, unlocked: this.bellUnlocked },
      { key: 'H', name: '草药', cd: 0, unlocked: true },
    ], inp.touchMode);
    this.input.setButtonState('scan', { visible: this.scanUnlocked, cooldown: this.scanCd / 12 });
    this.input.setButtonState('flash', { visible: this.flashUnlocked, cooldown: this.flashCd / 8 });
    this.input.setButtonState('bell', { visible: this.bellUnlocked, cooldown: this.bellCd / 60 });
    this.hud.setCrosshair(this.pistol.aimK > 0.8 ? 0 : Math.min(1, this.vel.length() / 4), !this.cutscene);
    this.hud.update(dt, this.hp);
    audio.heartbeat(dt, this.hp < 35 ? (35 - this.hp) / 35 : 0);
    if (this.boss) this.hud.setBoss(this.boss.alive ? this.bossName : null, this.boss.hp / this.boss.maxHp);

    const { col, row } = this.cellOfPlayer();
    const region = regionOf(col, row);
    this.hud.setFrost(region === 'cold' ? 0.55 : 0);
    const fog = this.scene.fog as THREE.FogExp2;
    const targetFog = region === 'deck' ? 0.04 : region === 'cold' ? 0.07 : 0.05;
    fog.density += (targetFog - fog.density) * Math.min(1, dt);
  }

  private updateWorld(dt: number) {
    const { col, row } = this.cellOfPlayer();
    this.flow.update(col, row);
    if (!this.frozen) {
      for (const e of this.enemies) {
        if (!e.alive && !e.justDied && e.group.position.y < -0.14) continue;
        if (Math.abs(e.pos.x - this.playerPos.x) + Math.abs(e.pos.z - this.playerPos.z) > 45 && e.alive) continue;
        e.update(dt, this);
        if (e.justDied) {
          e.justDied = false;
          this.stats.kills++;
          this.onKill?.(e);
        }
      }
      // 敌人互相推开
      for (let i = 0; i < this.enemies.length; i++) {
        const a = this.enemies[i];
        if (!a.alive) continue;
        for (let j = i + 1; j < this.enemies.length; j++) {
          const b = this.enemies[j];
          if (!b.alive) continue;
          const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
          const min = a.radius + b.radius;
          const d2 = dx * dx + dz * dz;
          if (d2 < min * min && d2 > 1e-6) {
            const d = Math.sqrt(d2), push = (min - d) / 2;
            a.pos.x -= (dx / d) * push; a.pos.z -= (dz / d) * push;
            b.pos.x += (dx / d) * push; b.pos.z += (dz / d) * push;
          }
        }
      }
    } else {
      for (const e of this.enemies) {
        e.group.position.set(e.pos.x, e.alive ? 0 : e.group.position.y, e.pos.z);
      }
    }
    // 同伴：小满跟着苏晚，其余跟着玩家
    const su = this.companions.get('su');
    for (const c of this.companions.values()) {
      c.update(dt, this.playerPos, this.flow, c.id === 'man' && su?.following ? su.pos : undefined);
    }
    // 粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y += p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.position.y < 0.01) { p.mesh.position.y = 0.01; p.vel.set(0, 0, 0); }
      if (p.grow) p.mesh.scale.multiplyScalar(1 + p.grow * dt);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.9, p.life * 2);
    }
    // 道具呼吸光
    const pulse = 0.5 + Math.sin(this.time * 4) * 0.4;
    for (const m of this.itemMats.values()) (m as THREE.MeshStandardMaterial).emissiveIntensity = this.scanning ? 2 : pulse;
    this.level.update(dt, this.playerPos);
  }

  private syncCamera(dt: number) {
    this.shake = Math.max(0, this.shake - dt * 1.5);
    const bob = Math.sin(this.bobT) * 0.035;
    const s = this.shake * this.shake;
    this.camera.position.set(
      this.playerPos.x + (Math.random() - 0.5) * s * 0.3,
      EYE + bob + (Math.random() - 0.5) * s * 0.3,
      this.playerPos.z + (Math.random() - 0.5) * s * 0.3,
    );
    this.camera.rotation.set(this.pitch, this.yaw, Math.sin(this.bobT * 0.5) * 0.004);
    const targetFov = 72 - this.pistol.aimK * 20;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }
    this.flashBurst = Math.max(0, this.flashBurst - dt);
    this.flashlight.intensity = this.flashBurst > 0 ? 60 + this.flashBurst * 500 : 60;
    this.flashlight.angle = this.flashBurst > 0 ? 0.7 : 0.5;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    audio.setListener(this.playerPos.x, EYE, this.playerPos.z, fx, fz);
  }

  shakeCamera(v: number) {
    this.shake = Math.max(this.shake, v);
  }

  private render() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    if (this.state !== 'menu' && !this.cutscene) {
      this.renderer.clearDepth();
      this.renderer.render(this.viewScene, this.viewCam);
    }
  }

  // 第一章结束时清理
  resetWorld() {
    resetDoors();
  }

  cellToWorld(col: number, row: number, y = 0) {
    const { x, z } = cellCenter(col, row);
    return new THREE.Vector3(x, y, z);
  }
}

export { CELL };
