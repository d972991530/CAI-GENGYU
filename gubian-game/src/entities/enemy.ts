import * as THREE from 'three';
import type { Textures } from '../core/textures';
import { collide, FlowField, lineOfSight, toCell } from '../world/map';
import { audio } from '../core/audio';

export type EnemyKind = 'walker' | 'butcher';
export type EnemyState = 'dormant' | 'idle' | 'awaken' | 'chase' | 'attack' | 'stunned' | 'flee' | 'charge' | 'windup' | 'dead';
export type HitPart = 'head' | 'body' | 'weak';

export interface EnemyHost {
  playerPos: THREE.Vector3;
  flow: FlowField;
  damagePlayer(amount: number, from: THREE.Vector3): void;
  onPipeCollision(e: Enemy): boolean;
  scanning: boolean;
}

let sharedSkin: THREE.MeshStandardMaterial | null = null;

const CLOTHES = [0x16171b, 0x1d2333, 0x4a0f18, 0x2c2c2c, 0x3b3226, 0x5a5048];

export class Enemy {
  group = new THREE.Group();
  hitMeshes: THREE.Mesh[] = [];
  pos: THREE.Vector3;
  spawn: THREE.Vector3;
  spawnYaw: number;
  yaw: number;
  hp: number;
  maxHp: number;
  state: EnemyState;
  stateT = 0;
  speed: number;
  radius: number;
  private head!: THREE.Mesh;
  private armL!: THREE.Object3D;
  private armR!: THREE.Object3D;
  private legL!: THREE.Object3D;
  private legR!: THREE.Object3D;
  private body!: THREE.Object3D;
  private veinMats: THREE.MeshStandardMaterial[] = [];
  private weak: THREE.Mesh | null = null;
  private walkT = Math.random() * 10;
  private groanT = 2 + Math.random() * 6;
  private attackCd = 0;
  private chargeCd = 6;
  private twitchT = 0;
  private chargeDir = new THREE.Vector3();
  private deathT = 0;
  awakeRadius = 11;
  justDied = false;
  tag = '';

  constructor(public kind: EnemyKind, tex: Textures, x: number, z: number, yaw: number, state: EnemyState = 'idle') {
    this.pos = new THREE.Vector3(x, 0, z);
    this.spawn = this.pos.clone();
    this.spawnYaw = yaw;
    this.yaw = yaw;
    this.state = state;
    const boss = kind === 'butcher';
    this.maxHp = this.hp = boss ? 900 : 100;
    this.speed = boss ? 2.6 : 1.5 + Math.random() * 0.9;
    this.radius = boss ? 0.8 : 0.35;
    this.build(tex);
    this.group.position.copy(this.pos);
    this.group.rotation.y = yaw;
  }

  private build(tex: Textures) {
    if (!sharedSkin) {
      sharedSkin = new THREE.MeshStandardMaterial({
        map: tex.infectedSkin, emissiveMap: tex.veinsEmissive, emissive: 0xff2a10, emissiveIntensity: 0.25, roughness: 0.8,
      });
    }
    const boss = this.kind === 'butcher';
    const skin = sharedSkin.clone();
    this.veinMats.push(skin);
    const cloth = new THREE.MeshStandardMaterial({
      map: tex.suit, color: boss ? 0xd8d0c0 : CLOTHES[(Math.random() * CLOTHES.length) | 0], roughness: 0.9,
    });
    const s = boss ? 1.6 : 0.95 + Math.random() * 0.12;
    const root = new THREE.Group();
    root.scale.setScalar(s);
    this.group.add(root);

    const body = new THREE.Group();
    body.position.y = 0.95;
    root.add(body);
    this.body = body;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(boss ? 0.75 : 0.46, 0.68, boss ? 0.48 : 0.26), cloth);
    torso.position.y = 0.32;
    torso.castShadow = true;
    body.add(torso);
    this.reg(torso, 'body');
    if (!boss && Math.random() < 0.4) {
      // 晚礼服裙摆
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.75, 8), cloth);
      skirt.position.y = -0.3;
      body.add(skirt);
      this.reg(skirt, 'body');
    }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 6), skin);
    neck.position.y = 0.72;
    body.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(boss ? 0.2 : 0.15, 12, 10), skin);
    head.scale.set(1, 1.18, 1.05);
    head.position.y = 0.88;
    head.castShadow = true;
    body.add(head);
    this.head = head;
    this.reg(head, 'head');
    // 发光的眼睛
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3010 });
    for (const ex of [-0.05, 0.05]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), eyeMat);
      eye.position.set(ex * (boss ? 1.3 : 1), 0.03, (boss ? 0.19 : 0.14));
      head.add(eye);
    }
    // 口中朱砂色黏液
    const drool = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.02), new THREE.MeshBasicMaterial({ color: 0x9a0c06 }));
    drool.position.set(0, -0.12, boss ? 0.19 : 0.135);
    head.add(drool);

    const limb = (w: number, h: number, mat: THREE.Material, part: HitPart) => {
      const pivot = new THREE.Group();
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
      m.position.y = -h / 2;
      m.castShadow = true;
      pivot.add(m);
      this.reg(m, part);
      return pivot;
    };
    const aw = boss ? 0.2 : 0.11;
    this.armL = limb(aw, 0.62, skin, 'body');
    this.armR = limb(aw, 0.62, skin, 'body');
    this.armL.position.set(-(boss ? 0.48 : 0.29), 0.62, 0);
    this.armR.position.set(boss ? 0.48 : 0.29, 0.62, 0);
    body.add(this.armL, this.armR);
    this.legL = limb(0.14, 0.95, cloth, 'body');
    this.legR = limb(0.14, 0.95, cloth, 'body');
    this.legL.position.set(-0.12, 0.95, 0);
    this.legR.position.set(0.12, 0.95, 0);
    root.add(this.legL, this.legR);

    if (boss) {
      // 剁骨刀
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x9aa0a4, metalness: 0.9, roughness: 0.35 }));
      blade.position.set(0, -0.7, 0.15);
      this.armR.add(blade);
      // 围裙血迹
      const apron = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xc8beb0, map: tex.suit, roughness: 1 }));
      apron.position.set(0, 0.15, 0.25);
      body.add(apron);
      // 背部朱砂囊泡 —— 弱点
      const sacMat = new THREE.MeshStandardMaterial({ color: 0xb01808, emissive: 0xff2000, emissiveIntensity: 0.6, roughness: 0.3 });
      const sac = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), sacMat);
      sac.position.set(0, 0.42, -0.3);
      body.add(sac);
      this.reg(sac, 'weak');
      this.weak = sac;
      for (let i = 0; i < 5; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.06, 8, 6), sacMat);
        b.position.set((Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.35, -0.28 - Math.random() * 0.06);
        body.add(b);
        this.reg(b, 'weak');
      }
    }

    if (this.state === 'dormant') {
      // 低头静立
      this.head.rotation.x = 0.5;
      this.armL.rotation.x = this.armR.rotation.x = 0.05;
    }
  }

  private reg(m: THREE.Mesh, part: HitPart) {
    m.userData.enemy = this;
    m.userData.part = part;
    this.hitMeshes.push(m);
  }

  get alive() {
    return this.state !== 'dead';
  }

  get headPos() {
    const v = new THREE.Vector3();
    this.head.getWorldPosition(v);
    return v;
  }

  awaken() {
    if (this.state === 'dormant' || this.state === 'idle') {
      this.state = 'awaken';
      this.stateT = 0;
      audio.groan({ x: this.pos.x, y: 1.6, z: this.pos.z }, this.kind === 'butcher' ? 0.5 : 1, 0.7);
    }
  }

  damage(amount: number, part: HitPart): number {
    if (!this.alive) return 0;
    let mult = 1;
    if (this.kind === 'walker') mult = part === 'head' ? 3 : 1;
    else {
      // 屠夫：正面厚甲，只有背部囊泡吃满伤害
      mult = part === 'weak' ? 4 : part === 'head' ? 0.5 : 0.15;
      if (this.state === 'stunned') mult *= 1.5;
    }
    const dmg = amount * mult;
    this.hp -= dmg;
    audio.hitFlesh({ x: this.pos.x, y: 1.4, z: this.pos.z });
    if (this.state === 'dormant' || this.state === 'idle') this.awaken();
    if (this.kind === 'walker' && this.state === 'chase' && Math.random() < 0.3) {
      this.state = 'stunned';
      this.stateT = 0.6;
    }
    if (this.hp <= 0) this.die();
    return dmg;
  }

  die() {
    this.state = 'dead';
    this.deathT = 0;
    this.justDied = true;
    audio.groan({ x: this.pos.x, y: 1.2, z: this.pos.z }, this.kind === 'butcher' ? 0.4 : 0.8, 0.6);
  }

  stun(sec: number) {
    if (!this.alive || this.state === 'dormant') return;
    this.state = 'stunned';
    this.stateT = sec;
  }

  flee(sec: number) {
    if (!this.alive || this.kind === 'butcher') return;
    if (this.state === 'dormant') return;
    this.state = 'flee';
    this.stateT = sec;
  }

  reset() {
    if (!this.alive) return;
    this.pos.copy(this.spawn);
    this.yaw = this.spawnYaw;
    this.hp = this.maxHp;
    // 仍在沉睡的保持沉睡，已被惊醒的回到原位重新游荡
    this.state = this.state === 'dormant' ? 'dormant' : 'idle';
    this.group.rotation.set(0, this.yaw, 0);
  }

  update(dt: number, host: EnemyHost) {
    const p = host.playerPos;
    const dx = p.x - this.pos.x, dz = p.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    const boss = this.kind === 'butcher';

    // 勘察镜高亮脉络
    const glow = host.scanning ? 2.2 : 0.25 + (this.state === 'chase' ? 0.15 : 0);
    for (const m of this.veinMats) m.emissiveIntensity += (glow - m.emissiveIntensity) * Math.min(1, dt * 6);
    if (this.weak) {
      const mat = this.weak.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = (host.scanning ? 3 : 0.6) + Math.sin(performance.now() * 0.008) * 0.4;
      this.weak.scale.setScalar(1 + Math.sin(performance.now() * 0.006) * 0.08);
    }

    if (this.state === 'dead') {
      this.deathT += dt;
      const k = Math.min(1, this.deathT * 1.8);
      this.group.rotation.x = -k * Math.PI * 0.48;
      this.group.position.y = -k * 0.15;
      return;
    }

    this.attackCd -= dt;
    this.stateT -= dt;
    let move = 0;
    let faceTarget = true;
    let target: { x: number; z: number } | null = null;

    switch (this.state) {
      case 'dormant':
        faceTarget = false;
        if (dist < 1.6) this.awaken();
        break;
      case 'idle':
        faceTarget = false;
        if (dist < this.awakeRadius && lineOfSight(this.pos.x, this.pos.z, p.x, p.z)) this.awaken();
        break;
      case 'awaken':
        // 缓慢转身
        this.stateT += dt * 2;
        if (this.stateT > 1.4) { this.state = 'chase'; this.stateT = 0; }
        break;
      case 'stunned':
        faceTarget = false;
        if (this.stateT <= 0) this.state = 'chase';
        break;
      case 'flee':
        target = { x: this.pos.x - dx, z: this.pos.z - dz };
        move = this.speed * 0.9;
        faceTarget = false;
        if (this.stateT <= 0) this.state = 'chase';
        break;
      case 'chase': {
        const reach = boss ? 2.3 : 1.25;
        if (dist < reach && this.attackCd <= 0) {
          this.state = 'attack';
          this.stateT = boss ? 0.8 : 0.55;
          break;
        }
        if (boss) {
          this.chargeCd -= dt;
          if (this.chargeCd <= 0 && dist > 5 && dist < 22 && lineOfSight(this.pos.x, this.pos.z, p.x, p.z)) {
            this.state = 'windup';
            this.stateT = 1.1;
            audio.roar({ x: this.pos.x, y: 2, z: this.pos.z });
            break;
          }
        }
        if (dist > reach * 0.8) {
          move = this.speed;
          if (dist < 4 && lineOfSight(this.pos.x, this.pos.z, p.x, p.z)) target = { x: p.x, z: p.z };
          else target = host.flow.next(this.pos.x, this.pos.z) ?? { x: p.x, z: p.z };
        }
        break;
      }
      case 'attack':
        if (this.stateT <= 0) {
          const reach = boss ? 2.6 : 1.5;
          if (dist < reach) host.damagePlayer(boss ? 28 : 14, this.pos);
          this.state = 'chase';
          this.attackCd = boss ? 1.4 : 1.1;
        }
        break;
      case 'windup':
        if (this.stateT <= 0) {
          this.state = 'charge';
          this.stateT = 2.2;
          this.chargeDir.set(dx, 0, dz).normalize();
        }
        break;
      case 'charge': {
        faceTarget = false;
        const before = this.pos.clone();
        this.pos.x += this.chargeDir.x * 10 * dt;
        this.pos.z += this.chargeDir.z * 10 * dt;
        collide(this.pos, this.radius);
        if (dist < 1.8) {
          host.damagePlayer(35, this.pos);
          this.state = 'chase';
          this.chargeCd = 7;
          break;
        }
        if (host.onPipeCollision(this)) {
          this.chargeCd = 8;
          break;
        }
        const moved = before.distanceTo(this.pos);
        if (moved < 10 * dt * 0.4 || this.stateT <= 0) {
          // 撞墙
          this.state = 'stunned';
          this.stateT = 1.2;
          this.chargeCd = 7;
        }
        break;
      }
    }

    if (target && move > 0) {
      const tx = target.x - this.pos.x, tz = target.z - this.pos.z;
      const tl = Math.hypot(tx, tz) || 1;
      this.pos.x += (tx / tl) * move * dt;
      this.pos.z += (tz / tl) * move * dt;
      collide(this.pos, this.radius);
      if (!faceTarget || this.state === 'flee') this.turnTo(Math.atan2(tx, tz), dt, 5);
    }
    if (faceTarget && this.state !== 'dormant' && this.state !== 'idle') {
      this.turnTo(Math.atan2(dx, dz), dt, this.state === 'awaken' ? 2 : boss ? 2.5 : 5);
    }

    this.animate(dt, move, dist);

    // 嘶吼
    this.groanT -= dt;
    if (this.groanT <= 0 && this.state !== 'dormant' && dist < 25) {
      this.groanT = 3 + Math.random() * 6;
      audio.groan({ x: this.pos.x, y: 1.6, z: this.pos.z }, boss ? 0.55 : 0.9 + Math.random() * 0.3, boss ? 0.8 : 0.4);
    }

    this.group.position.set(this.pos.x, 0, this.pos.z);
    this.group.rotation.y = this.yaw;
  }

  private turnTo(target: number, dt: number, rate: number) {
    let d = target - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += Math.max(-rate * dt, Math.min(rate * dt, d));
  }

  private animate(dt: number, move: number, dist: number) {
    const boss = this.kind === 'butcher';
    this.walkT += dt * (move > 0 ? move * 3.2 : 0.8);
    const sw = Math.sin(this.walkT);
    if (this.state === 'dormant') {
      // 几乎不动的呼吸
      this.body.rotation.z = Math.sin(this.walkT * 0.5) * 0.02;
      return;
    }
    this.legL.rotation.x = move > 0 ? sw * 0.5 : 0;
    this.legR.rotation.x = move > 0 ? -sw * 0.5 : 0;
    this.body.rotation.z = sw * (boss ? 0.05 : 0.12);
    this.body.rotation.x = move > 0 ? 0.18 : 0.05;
    let armX = -1.3 + Math.sin(this.walkT * 0.7) * 0.15; // 伸手扑抓
    if (this.state === 'attack') {
      const k = 1 - Math.max(0, this.stateT) / (boss ? 0.8 : 0.55);
      armX = boss ? -2.6 + k * 2.4 : -1.6 - Math.sin(k * Math.PI) * 0.8;
    } else if (this.state === 'windup') {
      armX = -2.8;
      this.body.rotation.x = -0.25;
    } else if (this.state === 'charge') {
      armX = -0.4;
      this.body.rotation.x = 0.5;
    } else if (this.state === 'stunned') {
      armX = -0.2;
      this.body.rotation.x = -0.3 + Math.sin(this.walkT * 6) * 0.05;
    } else if (this.state === 'awaken') {
      armX = -0.3 - Math.min(1, this.stateT) * 1;
    }
    this.armL.rotation.x += (armX - this.armL.rotation.x) * Math.min(1, dt * 8);
    this.armR.rotation.x += ((boss ? armX : armX + 0.2) - this.armR.rotation.x) * Math.min(1, dt * 8);
    // 抽搐
    this.twitchT -= dt;
    if (this.twitchT <= 0) {
      this.twitchT = 0.3 + Math.random() * 2.5;
      this.head.rotation.z = (Math.random() - 0.5) * 0.9;
      this.head.rotation.x = (Math.random() - 0.5) * 0.5;
    } else {
      this.head.rotation.z *= 0.97;
    }
    void dist;
  }

  cell() {
    return toCell(this.pos.x, this.pos.z);
  }
}
