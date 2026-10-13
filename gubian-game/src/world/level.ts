import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CELL, COLS, ROWS, WALL_H, MAP, charAt, isDoor, isExterior, cellCenter, DoorId, setDoorOpen } from './map';
import type { Textures } from '../core/textures';

export interface LightAnchor {
  pos: THREE.Vector3;
  color: number;
  intensity: number;
  distance: number;
  flicker: number; // 0 = 稳定, 1 = 剧烈闪烁
  phase: number;
  on: boolean;
}

export interface Door {
  id: DoorId;
  mesh: THREE.Mesh;
  open: boolean;
  t: number; // 0 关 → 1 开
}

export interface Pipe {
  col: number;
  row: number;
  mesh: THREE.Mesh;
  burst: boolean;
}

type Region = 'deck' | 'hall' | 'corridor' | 'cabin' | 'kitchen' | 'cold' | 'bridge';

export function regionOf(col: number, row: number): Region {
  if (row <= 4) return 'deck';
  if (row <= 14 && col <= 18) return 'hall';
  if (col >= 20 && col <= 21) return 'corridor';
  if (col >= 23) return 'cabin';
  if (row >= 16 && row <= 20 && col <= 6) return 'bridge';
  if (row >= 16 && row <= 20) return 'kitchen';
  return 'cold';
}

export class Level {
  group = new THREE.Group();
  colliders: THREE.Object3D[] = []; // 子弹会命中的静态物体
  doors = new Map<DoorId, Door>();
  anchors: LightAnchor[] = [];
  pipes: Pipe[] = [];
  private pool: THREE.PointLight[] = [];
  private radarTex!: THREE.CanvasTexture;
  private radarCtx!: CanvasRenderingContext2D;
  private wheel!: THREE.Object3D;
  private time = 0;

  constructor(private tex: Textures, private poolSize: number) {
    this.build();
  }

  private mat(map: THREE.Texture | null, color = 0xffffff, rough = 0.85, metal = 0.05) {
    return new THREE.MeshStandardMaterial({ map, color, roughness: rough, metalness: metal });
  }

  private build() {
    const t = this.tex;
    const box = new THREE.BoxGeometry(CELL, WALL_H, CELL);

    // ---- 墙体：按区域分材质，实例化渲染 ----
    const wallSets: Record<string, { mat: THREE.Material; cells: [number, number, number][] }> = {
      hull: { mat: this.mat(t.metal, 0xb9b4a8, 0.7, 0.3), cells: [] },
      paper: { mat: this.mat(t.wallpaper, 0xffffff, 0.9), cells: [] },
      metal: { mat: this.mat(t.metal, 0x9aa3a6, 0.6, 0.4), cells: [] },
      frost: { mat: this.mat(t.frost, 0xffffff, 0.5, 0.2), cells: [] },
    };
    const floorSets: Record<string, { mat: THREE.Material; cells: [number, number][] }> = {
      deck: { mat: this.mat(t.deck, 0xffffff, 0.55, 0.05), cells: [] },
      carpet: { mat: this.mat(t.carpet, 0xffffff, 1), cells: [] },
      tile: { mat: this.mat(t.tile, 0xffffff, 0.35, 0.1), cells: [] },
      metal: { mat: this.mat(t.metal, 0x777f82, 0.5, 0.5), cells: [] },
      frost: { mat: this.mat(t.frost, 0xd8e6ee, 0.3, 0.1), cells: [] },
    };
    const ceilCells: [number, number][] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r][c];
        if (ch === '#') {
          let nearExt = false, region: Region | null = null;
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const n = charAt(c + dc, r + dr);
            if (n === ',' || n === 'R') nearExt = true;
            else if (n !== '#') region = region ?? regionOf(c + dc, r + dr);
          }
          if (nearExt) wallSets.hull.cells.push([c, r, 2]);
          else if (region === 'kitchen' || region === 'bridge') wallSets.metal.cells.push([c, r, 1]);
          else if (region === 'cold') wallSets.frost.cells.push([c, r, 1]);
          else if (region) wallSets.paper.cells.push([c, r, 1]);
          else if (r <= 4) wallSets.hull.cells.push([c, r, 2]); // 上层建筑
          continue;
        }
        const reg = regionOf(c, r);
        if (ch === ',' || ch === 'R') floorSets.deck.cells.push([c, r]);
        else if (reg === 'kitchen') floorSets.tile.cells.push([c, r]);
        else if (reg === 'cold') floorSets.frost.cells.push([c, r]);
        else if (reg === 'bridge') floorSets.metal.cells.push([c, r]);
        else floorSets.carpet.cells.push([c, r]);
        if (!isExterior(c, r) && ch !== 'R') ceilCells.push([c, r]);
      }
    }

    const m4 = new THREE.Matrix4();
    for (const set of Object.values(wallSets)) {
      if (!set.cells.length) continue;
      const im = new THREE.InstancedMesh(box, set.mat, set.cells.length);
      set.cells.forEach(([c, r, h], i) => {
        const { x, z } = cellCenter(c, r);
        m4.makeScale(1, h, 1).setPosition(x, (WALL_H * h) / 2, z);
        im.setMatrixAt(i, m4);
      });
      im.receiveShadow = true;
      im.castShadow = true;
      this.group.add(im);
      this.colliders.push(im);
    }

    const plane = new THREE.PlaneGeometry(CELL, CELL);
    plane.rotateX(-Math.PI / 2);
    for (const set of Object.values(floorSets)) {
      if (!set.cells.length) continue;
      const im = new THREE.InstancedMesh(plane, set.mat, set.cells.length);
      set.cells.forEach(([c, r], i) => {
        const { x, z } = cellCenter(c, r);
        m4.makeTranslation(x, 0, z);
        im.setMatrixAt(i, m4);
      });
      im.receiveShadow = true;
      this.group.add(im);
      this.colliders.push(im);
    }
    const ceilGeo = plane.clone();
    ceilGeo.rotateX(Math.PI);
    const ceil = new THREE.InstancedMesh(ceilGeo, this.mat(t.ceiling, 0x888888, 1), ceilCells.length);
    ceilCells.forEach(([c, r], i) => {
      const { x, z } = cellCenter(c, r);
      m4.makeTranslation(x, WALL_H, z);
      ceil.setMatrixAt(i, m4);
    });
    this.group.add(ceil);
    this.colliders.push(ceil);

    // 江面
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({ color: 0x06100e, roughness: 0.15, metalness: 0.7 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(30, -3.5, 0);
    this.group.add(water);

    this.buildRailings();
    this.buildDoors();
    this.buildFurniture();
    this.buildLights();
    this.mergeStatic();
  }

  // 把静态装饰按材质合并成少量网格，大幅减少手机端的绘制调用
  private mergeStatic() {
    this.group.updateMatrixWorld(true);
    const colliderSet = new Set(this.colliders);
    const batches = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; collide: boolean; shadow: boolean }>();
    const victims: THREE.Mesh[] = [];
    const visit = (o: THREE.Object3D) => {
      if (o.userData.dynamic) return;
      if (o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh) && !Array.isArray(o.material)) {
        const collide = colliderSet.has(o);
        const key = `${o.material.uuid}|${collide}`;
        let b = batches.get(key);
        if (!b) batches.set(key, (b = { mat: o.material, geos: [], collide, shadow: o.castShadow }));
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        g.applyMatrix4(o.matrixWorld);
        for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
        b.geos.push(g);
        victims.push(o);
      }
      for (const c of o.children) visit(c);
    };
    for (const c of this.group.children) visit(c);
    for (const v of victims) v.removeFromParent();
    this.colliders = this.colliders.filter((c) => !victims.includes(c as THREE.Mesh));
    for (const b of batches.values()) {
      const merged = mergeGeometries(b.geos, false);
      if (!merged) continue;
      const m = new THREE.Mesh(merged, b.mat);
      m.castShadow = b.shadow;
      m.receiveShadow = true;
      this.group.add(m);
      if (b.collide) this.colliders.push(m);
    }
  }

  private buildRailings() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x9a9a92, roughness: 0.4, metalness: 0.8 });
    const bar = new THREE.BoxGeometry(CELL, 0.06, 0.06);
    const post = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (MAP[r][c] !== 'R') continue;
        const { x, z } = cellCenter(c, r);
        // 栏杆贴在面向甲板一侧的格边
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (charAt(c + dc, r + dr) !== ',') continue;
          const g = new THREE.Group();
          for (const h of [0.5, 1.05]) {
            const b = new THREE.Mesh(bar, mat);
            b.position.y = h;
            g.add(b);
          }
          for (const px of [-1.2, 0, 1.2]) {
            const p = new THREE.Mesh(post, mat);
            p.position.set(px, 0.55, 0);
            g.add(p);
          }
          g.position.set(x + dc * (CELL / 2 - 0.05), 0, z + dr * (CELL / 2 - 0.05));
          if (dc !== 0) g.rotation.y = Math.PI / 2;
          this.group.add(g);
        }
      }
    }
  }

  private buildDoors() {
    const mat = new THREE.MeshStandardMaterial({ map: this.tex.metal, color: 0x6b5a48, roughness: 0.6, metalness: 0.5 });
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r][c];
        if (!isDoor(ch)) continue;
        const horizontal = charAt(c - 1, r) === '#' || charAt(c + 1, r) === '#';
        const geo = horizontal ? new THREE.BoxGeometry(CELL, WALL_H, 0.25) : new THREE.BoxGeometry(0.25, WALL_H, CELL);
        const mesh = new THREE.Mesh(geo, mat);
        const { x, z } = cellCenter(c, r);
        mesh.position.set(x, WALL_H / 2, z);
        mesh.castShadow = true;
        mesh.userData.door = ch;
        mesh.userData.dynamic = true;
        this.group.add(mesh);
        this.colliders.push(mesh);
        // 门框
        const frame = new THREE.Mesh(
          horizontal ? new THREE.BoxGeometry(CELL, 0.3, 0.6) : new THREE.BoxGeometry(0.6, 0.3, CELL),
          new THREE.MeshStandardMaterial({ color: 0x2a221a, roughness: 0.8 }),
        );
        frame.position.set(x, WALL_H - 0.15, z);
        this.group.add(frame);
        this.doors.set(ch, { id: ch, mesh, open: false, t: 0 });
      }
    }
  }

  setDoor(id: DoorId, open: boolean) {
    const d = this.doors.get(id)!;
    d.open = open;
    setDoorOpen(id, open);
  }

  private add(mesh: THREE.Mesh, collide = true) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    if (collide) this.colliders.push(mesh);
    return mesh;
  }

  private buildFurniture() {
    const cloth = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.95 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.7 });
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 });
    const foodMat = new THREE.MeshStandardMaterial({ color: 0x5a2a12, roughness: 0.8 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x8d9497, roughness: 0.3, metalness: 0.9 });
    const marble = new THREE.MeshStandardMaterial({ color: 0x4b4440, roughness: 0.4 });
    const pipeMat = new THREE.MeshStandardMaterial({ map: this.tex.frost, color: 0xbfd6e0, roughness: 0.4, metalness: 0.6 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x55462e, roughness: 0.9 });

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r][c];
        const { x, z } = cellCenter(c, r);
        if (ch === 'T') {
          const top = this.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 2.6), cloth));
          top.position.set(x, 0.78, z);
          const skirt = this.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.7, 2.5), cloth));
          skirt.position.set(x, 0.4, z);
          for (let i = 0; i < 5; i++) {
            const px = x + (Math.random() - 0.5) * 2, pz = z + (Math.random() - 0.5) * 2;
            const plate = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12), plateMat), false);
            plate.position.set(px, 0.83, pz);
            const food = this.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), foodMat), false);
            food.position.set(px, 0.87, pz);
            food.scale.y = 0.5;
          }
          // 未动过的酒杯
          for (let i = 0; i < 4; i++) {
            const g = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.16, 6),
              new THREE.MeshStandardMaterial({ color: 0x8a1010, transparent: true, opacity: 0.6, roughness: 0.1 })), false);
            g.position.set(x + (Math.random() - 0.5) * 2.2, 0.9, z + (Math.random() - 0.5) * 2.2);
          }
        } else if (ch === 'P') {
          const p = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, WALL_H, 12), marble));
          p.position.set(x, WALL_H / 2, z);
        } else if (ch === 'c') {
          const ct = this.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.95, 2.0), steel));
          ct.position.set(x, 0.475, z);
          const knife = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.01, 0.07), steel), false);
          knife.position.set(x + 0.3, 0.96, z - 0.2);
          knife.rotation.y = Math.random() * 3;
        } else if (ch === 'p') {
          const p = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, WALL_H, 14), pipeMat));
          p.position.set(x, WALL_H / 2, z);
          p.userData.pipe = true;
          p.userData.dynamic = true;
          for (const h of [0.6, 2.4]) {
            const ring = this.add(new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.06, 6, 16), steel), false);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(x, h, z);
          }
          // 警示标记
          const sign = this.add(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0x332200 })), false);
          sign.position.set(x, 1.5, z + 0.47);
          this.pipes.push({ col: c, row: r, mesh: p, burst: false });
        } else if (ch === 'b') {
          for (let i = 0; i < 3; i++) {
            const s = 0.7 + Math.random() * 0.5;
            const b = this.add(new THREE.Mesh(new THREE.BoxGeometry(s, s, s), crateMat));
            b.position.set(x + (Math.random() - 0.5) * 0.6, s / 2 + (i === 2 ? 0.9 : 0), z + (Math.random() - 0.5) * 0.6);
            b.rotation.y = Math.random();
          }
        } else if (ch === 'd') {
          const bed = this.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 2.2), wood));
          bed.position.set(x, 0.25, z);
          const sheet = this.add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 2.1), cloth), false);
          sheet.position.set(x, 0.56, z);
          sheet.rotation.y = 0.05;
        } else if (ch === 'o') {
          const wr = this.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.6), wood));
          wr.position.set(x, 1.2, z);
          const gap = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.2, 0.02),
            new THREE.MeshBasicMaterial({ color: 0x000000 })), false);
          gap.position.set(x - 0.81, 1.2, z);
          gap.rotation.y = Math.PI / 2;
        } else if (ch === 'w') {
          const stand = this.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.6), wood));
          stand.position.set(x, 0.5, z);
          const wheel = new THREE.Group();
          const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 6, 20), wood);
          wheel.add(rim);
          for (let i = 0; i < 4; i++) {
            const sp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.04), wood);
            sp.rotation.z = (i * Math.PI) / 4;
            wheel.add(sp);
          }
          wheel.position.set(x, 1.35, z - 0.35);
          wheel.userData.dynamic = true;
          this.group.add(wheel);
          this.wheel = wheel;
          // 雷达屏
          const rc = document.createElement('canvas');
          rc.width = rc.height = 128;
          this.radarCtx = rc.getContext('2d')!;
          this.radarTex = new THREE.CanvasTexture(rc);
          const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0),
            new THREE.MeshBasicMaterial({ map: this.radarTex }));
          screen.position.set(x + 1.6, 1.5, z - 1.45);
          screen.userData.dynamic = true;
          this.group.add(screen);
          const console_ = this.add(new THREE.Mesh(new THREE.BoxGeometry(5, 1.0, 0.6), steel));
          console_.position.set(x, 0.5, z - 1.2);
        }
      }
    }

    // 冷库挂着的冻肉
    const meat = new THREE.MeshStandardMaterial({ color: 0x6e2a26, roughness: 0.6 });
    for (let i = 0; i < 10; i++) {
      const { x, z } = cellCenter(2 + Math.floor(Math.random() * 16), 22 + Math.floor(Math.random() * 5));
      const m = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 0.25), meat), false);
      m.position.set(x + Math.random(), 2.4, z + Math.random());
      m.rotation.y = Math.random() * 3;
      const hook = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7), steel), false);
      hook.position.set(m.position.x, 3.25, m.position.z);
    }

    // 半坠的水晶吊灯
    const chand = new THREE.Group();
    const crystal = new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0x332a10, roughness: 0.1, metalness: 0.3 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 6, 24), steel);
    ring.rotation.x = Math.PI / 2;
    chand.add(ring);
    for (let i = 0; i < 16; i++) {
      const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), crystal);
      const a = (i / 16) * Math.PI * 2;
      cr.position.set(Math.cos(a) * 0.9, -0.15, Math.sin(a) * 0.9);
      chand.add(cr);
    }
    const hall = cellCenter(9, 10);
    chand.position.set(hall.x, 2.3, hall.z);
    chand.rotation.z = 0.35;
    this.group.add(chand);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4), steel);
    chain.position.set(hall.x - 0.25, 3.0, hall.z);
    chain.rotation.z = 0.35;
    this.group.add(chain);

    // 甲板散落物
    const heel = new THREE.MeshStandardMaterial({ color: 0x8a0d0d, roughness: 0.3 });
    for (const [c, r] of [[6, 2], [14, 3], [11, 1]]) {
      const { x, z } = cellCenter(c, r);
      const h = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.24), heel), false);
      h.position.set(x + 0.5, 0.05, z - 0.4);
      h.rotation.y = Math.random() * 3;
      const glass = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.16, 6),
        new THREE.MeshStandardMaterial({ color: 0xccddee, transparent: true, opacity: 0.5 })), false);
      glass.rotation.z = Math.PI / 2;
      glass.position.set(x - 0.6, 0.04, z + 0.5);
    }
    // 拖行血迹：从手机一路延伸到主舱门
    this.bloodTrail(cellCenter(12, 3), cellCenter(9, 5));
    this.bloodTrail(cellCenter(9, 6), cellCenter(9, 8));
    // 冷库地面血迹
    this.bloodTrail(cellCenter(13, 22), cellCenter(9, 24));
  }

  private bloodTex: THREE.Texture | null = null;
  private bloodTrail(a: { x: number; z: number }, b: { x: number; z: number }) {
    if (!this.bloodTex) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d')!;
      const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
      grd.addColorStop(0, 'rgba(90,0,0,0.95)');
      grd.addColorStop(0.6, 'rgba(70,0,0,0.6)');
      grd.addColorStop(1, 'rgba(40,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
      this.bloodTex = new THREE.CanvasTexture(c);
    }
    const mat = new THREE.MeshStandardMaterial({ map: this.bloodTex, transparent: true, depthWrite: false, roughness: 0.2 });
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.5);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7 + Math.random() * 0.5, 0.5 + Math.random() * 0.4), mat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = Math.random() * 3;
      m.position.set(a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 0.3, 0.012 + i * 0.0003, a.z + (b.z - a.z) * t + (Math.random() - 0.5) * 0.3);
      this.group.add(m);
    }
  }

  private buildLights() {
    const A = (c: number, r: number, color: number, intensity: number, distance: number, flicker: number, y = WALL_H - 0.4) => {
      const { x, z } = cellCenter(c, r);
      this.anchors.push({ pos: new THREE.Vector3(x, y, z), color, intensity, distance, flicker, phase: Math.random() * 100, on: true });
    };
    A(1, 1, 0xff1a10, 6, 14, 2, 3.5); // 船艏红灯一明一暗
    A(9, 6, 0xffb060, 4, 10, 0.5);
    A(9, 10, 0xffd9a0, 9, 16, 0.8, 2.2); // 吊灯
    A(20, 7, 0xffe0b0, 4, 10, 1);
    A(21, 13, 0xffe0b0, 4, 10, 0.3);
    A(20, 19, 0xffe0b0, 3, 9, 1);
    A(25, 7, 0xffc080, 3, 8, 0.1);
    A(26, 12, 0xffc080, 3, 8, 0.4);
    A(26, 18, 0xffb070, 3, 8, 0.2);
    A(13, 18, 0xd0f0ff, 5, 12, 0.9); // 后厨日光灯
    A(9, 22, 0x88c0ff, 6, 14, 0.2); // 冷库
    A(9, 26, 0xff2010, 4, 12, 0.6);
    A(3, 17, 0x30ff80, 3, 9, 0.1, 1.6); // 驾驶舱雷达
    for (let i = 0; i < this.poolSize; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 10, 1.2);
      this.pool.push(l);
      this.group.add(l);
    }
  }

  update(dt: number, viewer: THREE.Vector3) {
    this.time += dt;
    // 光源池：把最近的锚点分配给有限数量的点光源（避免着色器因灯数变化而重新编译）
    const sorted = this.anchors
      .filter((a) => a.on)
      .map((a) => ({ a, d: a.pos.distanceToSquared(viewer) }))
      .sort((p, q) => p.d - q.d);
    this.pool.forEach((l, i) => {
      const s = sorted[i];
      if (!s) { l.intensity = 0; return; }
      const a = s.a;
      l.position.copy(a.pos);
      l.color.setHex(a.color);
      l.distance = a.distance;
      let k = 1;
      if (a.flicker > 0) {
        const t = this.time * 8 + a.phase;
        const n = Math.sin(t) * Math.sin(t * 2.31) * Math.sin(t * 0.37);
        if (a.flicker >= 2) k = Math.sin(this.time * 2) > 0 ? 1 : 0.05;
        else if (n > 0.6 - a.flicker * 0.4) k = 0.15;
      }
      l.intensity = a.intensity * k * 3;
    });

    for (const d of this.doors.values()) {
      const target = d.open ? 1 : 0;
      if (d.t !== target) {
        d.t += Math.sign(target - d.t) * dt * 0.8;
        d.t = Math.max(0, Math.min(1, d.t));
        d.mesh.position.y = WALL_H / 2 + d.t * (WALL_H - 0.3);
      }
    }

    if (this.wheel) this.wheel.rotation.z += dt * 0.6;
    if (this.radarCtx) {
      const g = this.radarCtx;
      g.fillStyle = 'rgba(0,20,8,0.12)';
      g.fillRect(0, 0, 128, 128);
      const a = this.time * 1.5;
      g.strokeStyle = '#3f6';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60); g.stroke();
      g.fillStyle = '#f33';
      g.fillRect(84, 30, 5, 5); // 七二一水域
      this.radarTex.needsUpdate = true;
    }
  }
}
