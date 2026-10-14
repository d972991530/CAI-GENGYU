import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CELL, COLS, ROWS, WALL_H, MAP, charAt, isDoorChar, isExterior, cellCenter, setDoorOpen, openSecret } from './map';
import { texture, proc } from '../core/textures';
import { imageTexture, sprite } from '../core/assets';
import type { ChapterData, DoorDef } from '../chapters/types';

interface Anchor {
  pos: THREE.Vector3;
  color: number;
  intensity: number;
  distance: number;
  flicker: number;
  phase: number;
}

export interface Door {
  def: DoorDef;
  mesh: THREE.Mesh;
  col: number;
  row: number;
  open: boolean;
  t: number;
}

const KEY_COLORS: Record<string, number> = { red: 0xff2a20, blue: 0x2f7cff, yellow: 0xffc030 };

export class Level {
  group = new THREE.Group();
  colliders: THREE.Object3D[] = [];
  doors = new Map<string, Door>();
  secrets = new Map<number, THREE.Mesh>();
  pipes: { col: number; row: number; mesh: THREE.Mesh; burst: boolean }[] = [];
  anchors: Anchor[] = [];
  private pool: THREE.PointLight[] = [];
  private sky: THREE.Mesh | null = null;
  private exitMats: THREE.MeshBasicMaterial[] = [];
  private waterMat: THREE.MeshStandardMaterial | null = null;
  private time = 0;
  private animated: { obj: THREE.Object3D; fn: (t: number) => void }[] = [];

  constructor(public data: ChapterData, poolSize: number) {
    this.build();
    for (let i = 0; i < poolSize; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 10, 1.2);
      this.pool.push(l);
      this.group.add(l);
    }
  }

  private mat(t: THREE.Texture, color = 0xffffff, rough = 0.85, metal = 0.05) {
    return new THREE.MeshStandardMaterial({ map: t, color, roughness: rough, metalness: metal });
  }

  private build() {
    const th = this.data.theme;
    const tint = th.wallTint ?? 0xffffff;
    const matCache = new Map<string, THREE.Material>();
    const M = (ref: string, color = 0xffffff, rough = 0.85, metal = 0.05) => {
      const k = `${ref}|${color}|${rough}`;
      if (!matCache.has(k)) matCache.set(k, this.mat(texture(ref), color, rough, metal));
      return matCache.get(k)!;
    };
    const tankMat = this.mat(imageTexture('tex:tank_wall') ?? proc('metal'), 0xffffff, 0.3, 0.2);
    tankMat.emissive = new THREE.Color(0x401010);
    tankMat.emissiveMap = tankMat.map;
    const zoneOf = (c: number, r: number) => th.zones?.find((z) => c >= z.rect[0] && c <= z.rect[2] && r >= z.rect[1] && r <= z.rect[3]);
    const wallRef = (ch: string, c: number, r: number) => {
      if (ch === '|') return 'tank';
      if (ch === '&') return this.data.mural;
      if (ch === '%') return th.wall2;
      // 普通墙：取相邻地面所在分区的墙贴图
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const z = zoneOf(c + dc, r + dr);
        if (z?.wall && !isWallCh(charAt(c + dc, r + dr))) return z.wall;
      }
      return zoneOf(c, r)?.wall ?? th.wall;
    };
    const isWallCh = (n: string) => n === '#' || n === '%' || n === '&' || n === '|';
    const wallMat = (ref: string) => ref === 'tank' ? tankMat : ref === this.data.mural ? M(ref, 0xffffff, 0.6) : M(ref, tint);
    this.waterMat = new THREE.MeshStandardMaterial({ map: proc('water'), color: 0x88aaaa, roughness: 0.1, metalness: 0.5 });

    const box = new THREE.BoxGeometry(CELL, WALL_H, CELL);
    const plane = new THREE.PlaneGeometry(CELL, CELL);
    plane.rotateX(-Math.PI / 2);
    const wallCells = new Map<string, [number, number, number][]>();
    const floorCells = new Map<string, [number, number][]>();
    const ceilCells = new Map<string, [number, number][]>();
    const push = <T>(m: Map<string, T[]>, k: string, v: T) => { if (!m.has(k)) m.set(k, []); m.get(k)!.push(v); };
    const waterCells: [number, number][] = [];
    const exitCells: [number, number][] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r][c];
        const z = zoneOf(c, r);
        if (isWallCh(ch)) {
          let visible = false, nearExt = false;
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const n = charAt(c + dc, r + dr);
            if (!isWallCh(n)) visible = true;
            if (isExterior(c + dc, r + dr)) nearExt = true;
          }
          if (visible) push(wallCells, wallRef(ch, c, r), [c, r, nearExt ? 2 : 1]);
          continue;
        }
        if (ch === '$') {
          const m = new THREE.Mesh(box, wallMat(wallRef('#', c, r)));
          const { x, z: zz } = cellCenter(c, r);
          m.position.set(x, WALL_H / 2, zz);
          m.userData.dynamic = true;
          (m.material as THREE.MeshStandardMaterial) = (m.material as THREE.MeshStandardMaterial).clone();
          this.group.add(m);
          this.colliders.push(m);
          this.secrets.set(r * COLS + c, m);
          push(floorCells, z?.floor ?? th.floor, [c, r]);
          push(ceilCells, z?.ceiling ?? th.ceiling, [c, r]);
          continue;
        }
        const ext = ch === ',' || ch === 'R' || ch === 't' || ch === 'h';
        if (ch === '~') waterCells.push([c, r]);
        if (ch === 'X') exitCells.push([c, r]);
        const fref = ch === '=' ? 'p:rail' : ch === '~' ? '~' : ext ? (z?.floor ?? th.floorOut) : (z?.floor ?? th.floor);
        push(floorCells, fref, [c, r]);
        if (!isExterior(c, r)) push(ceilCells, z?.ceiling ?? th.ceiling, [c, r]);
      }
    }

    const m4 = new THREE.Matrix4();
    for (const [ref, cells] of wallCells) {
      const im = new THREE.InstancedMesh(box, wallMat(ref), cells.length);
      cells.forEach(([c, r, h], i) => {
        const { x, z } = cellCenter(c, r);
        m4.makeScale(1, h, 1).setPosition(x, (WALL_H * h) / 2, z);
        im.setMatrixAt(i, m4);
      });
      im.castShadow = im.receiveShadow = true;
      this.group.add(im);
      this.colliders.push(im);
    }
    for (const [ref, cells] of floorCells) {
      const mat = ref === '~' ? this.waterMat : M(ref, 0xffffff, ref === 'p:rail' ? 0.6 : 0.75, ref === 'p:rail' ? 0.3 : 0.05);
      const im = new THREE.InstancedMesh(plane, mat, cells.length);
      cells.forEach(([c, r], i) => {
        const { x, z } = cellCenter(c, r);
        m4.makeTranslation(x, ref === '~' ? 0.02 : 0, z);
        im.setMatrixAt(i, m4);
      });
      im.receiveShadow = true;
      this.group.add(im);
      this.colliders.push(im);
    }
    const ceilGeo = plane.clone();
    ceilGeo.rotateX(Math.PI);
    for (const [ref, cells] of ceilCells) {
      const ceil = new THREE.InstancedMesh(ceilGeo, M(ref, 0x999999, 1), cells.length);
      cells.forEach(([c, r], i) => {
        const { x, z } = cellCenter(c, r);
        m4.makeTranslation(x, WALL_H, z);
        ceil.setMatrixAt(i, m4);
      });
      this.group.add(ceil);
      this.colliders.push(ceil);
    }
    const floorCellsWater = waterCells;
    const floorCellsExit = exitCells;

    // 积水：半透明水面
    if (floorCellsWater.length) {
      const wm = new THREE.MeshStandardMaterial({ color: 0x1b4040, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.6, depthWrite: false });
      const surf = new THREE.InstancedMesh(plane, wm, floorCellsWater.length);
      floorCellsWater.forEach(([c, r], i) => {
        const { x, z } = cellCenter(c, r);
        m4.makeTranslation(x, 0.75, z);
        surf.setMatrixAt(i, m4);
      });
      surf.userData.dynamic = true;
      this.group.add(surf);
    }
    // 出口发光
    for (const [c, r] of floorCellsExit) {
      const { x, z } = cellCenter(c, r);
      const mat = new THREE.MeshBasicMaterial({ color: 0x30ff70, transparent: true, opacity: 0.35, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.3, 32), mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.03, z);
      ring.userData.dynamic = true;
      this.exitMats.push(mat);
      this.group.add(ring);
      const sign = this.textSprite('出口 EXIT', '#40ff80');
      sign.position.set(x, 2.6, z);
      sign.userData.dynamic = true;
      this.group.add(sign);
    }

    if (th.sky) {
      const st = imageTexture(th.sky);
      if (st) {
        const sky = new THREE.Mesh(
          new THREE.CylinderGeometry(160, 160, 120, 32, 1, true),
          new THREE.MeshBasicMaterial({ map: st, side: THREE.BackSide, fog: false, color: 0xbfcfdf }),
        );
        sky.position.set((COLS * CELL) / 2, 30, (ROWS * CELL) / 2);
        sky.userData.dynamic = true;
        this.sky = sky;
        this.group.add(sky);
      }
    }
    if (th.water) {
      const water = new THREE.Mesh(new THREE.PlaneGeometry(800, 800),
        new THREE.MeshStandardMaterial({ color: 0x06100e, roughness: 0.12, metalness: 0.7 }));
      water.rotation.x = -Math.PI / 2;
      water.position.set((COLS * CELL) / 2, -3, (ROWS * CELL) / 2);
      water.userData.dynamic = true;
      this.group.add(water);
    }

    this.buildDoors();
    this.buildFurniture();
    for (const l of this.data.lights) {
      const { x, z } = cellCenter(l.at[0], l.at[1]);
      this.anchors.push({ pos: new THREE.Vector3(x, l.y ?? WALL_H - 0.4, z), color: l.color, intensity: l.intensity, distance: 14, flicker: l.flicker ?? 0, phase: Math.random() * 100 });
    }
    this.mergeStatic();
  }

  textSprite(text: string, color: string) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(0, 0, 256, 64);
    g.strokeStyle = color;
    g.lineWidth = 3;
    g.strokeRect(2, 2, 252, 60);
    g.fillStyle = color;
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'center';
    g.fillText(text, 128, 43);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, fog: false }));
    s.scale.set(2, 0.5, 1);
    return s;
  }

  private buildDoors() {
    const doorTex = proc('door');
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r][c];
        if (!isDoorChar(ch)) continue;
        const def = this.data.doors.find((d) => d.id === ch) ?? { id: ch };
        const solid = (n: string) => n === '#' || n === '%' || n === '&' || n === '|' || n === '$';
        const horizontal = solid(charAt(c - 1, r)) || solid(charAt(c + 1, r));
        const geo = horizontal ? new THREE.BoxGeometry(CELL, WALL_H, 0.3) : new THREE.BoxGeometry(0.3, WALL_H, CELL);
        const mat = new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.6, metalness: 0.4 });
        if (def.key) {
          mat.emissive = new THREE.Color(KEY_COLORS[def.key]);
          mat.emissiveIntensity = 0.25;
          mat.color = new THREE.Color(KEY_COLORS[def.key]).lerp(new THREE.Color(0xffffff), 0.6);
        } else if (def.flag) {
          mat.color = new THREE.Color(0x8a8f96);
        }
        const mesh = new THREE.Mesh(geo, mat);
        const { x, z } = cellCenter(c, r);
        mesh.position.set(x, WALL_H / 2, z);
        mesh.castShadow = true;
        mesh.userData.dynamic = true;
        mesh.userData.door = ch;
        this.group.add(mesh);
        this.colliders.push(mesh);
        if (def.key || def.label) {
          const sign = this.textSprite(def.label ?? ({ red: '红卡', blue: '蓝卡', yellow: '黄卡' } as Record<string, string>)[def.key!], def.key ? `#${KEY_COLORS[def.key].toString(16).padStart(6, '0')}` : '#ddd');
          sign.position.set(x, WALL_H - 0.5, z);
          sign.userData.dynamic = true;
          mesh.add(sign);
          sign.position.set(0, WALL_H / 2 - 0.5, 0);
        }
        this.doors.set(ch, { def, mesh, col: c, row: r, open: false, t: 0 });
      }
    }
  }

  setDoor(id: string, open: boolean) {
    const d = this.doors.get(id);
    if (!d) return;
    d.open = open;
    setDoorOpen(id, open);
  }

  openSecretAt(col: number, row: number) {
    const idx = row * COLS + col;
    const m = this.secrets.get(idx);
    if (!m) return false;
    openSecret(col, row);
    m.userData.opening = true;
    return true;
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
    const wood = new THREE.MeshStandardMaterial({ map: imageTexture('tex:wood_panel') ?? proc('lattice'), color: 0x8a6a4a, roughness: 0.7 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x8d9497, roughness: 0.3, metalness: 0.9 });
    const marble = new THREE.MeshStandardMaterial({ color: 0x5b5450, roughness: 0.35 });
    const pipeMat = new THREE.MeshStandardMaterial({ map: proc('frost'), color: 0xbfd6e0, roughness: 0.4, metalness: 0.6 });
    const crate = new THREE.MeshStandardMaterial({ map: proc('rust'), color: 0x8a7a60, roughness: 0.9 });
    const rail = new THREE.MeshStandardMaterial({ color: 0x9a9a92, roughness: 0.4, metalness: 0.8 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x80c0b0, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.3, depthWrite: false });
    const bark = new THREE.MeshStandardMaterial({ color: 0x1c1712, roughness: 1 });
    const house = new THREE.MeshStandardMaterial({ map: imageTexture('tex:village_wall') ?? proc('stone'), color: 0xaaaaaa, roughness: 0.9 });
    const roof = new THREE.MeshStandardMaterial({ color: 0x22201c, roughness: 0.9 });
    const tankTex = (() => { try { return sprite('tank_body').tex; } catch { return null; } })();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r][c];
        const { x, z } = cellCenter(c, r);
        if (ch === 'T') {
          this.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 2.6), cloth)).position.set(x, 0.78, z);
          this.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.7, 2.5), cloth)).position.set(x, 0.4, z);
          for (let i = 0; i < 6; i++) {
            const p = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 10), steel), false);
            p.position.set(x + (Math.random() - 0.5) * 2, 0.83, z + (Math.random() - 0.5) * 2);
          }
        } else if (ch === 'P') {
          this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, WALL_H, 12), marble)).position.set(x, WALL_H / 2, z);
        } else if (ch === 'c') {
          this.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.95, 2.0), steel)).position.set(x, 0.475, z);
        } else if (ch === 'p') {
          const p = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, WALL_H, 14), pipeMat));
          p.position.set(x, WALL_H / 2, z);
          p.userData.pipe = true;
          p.userData.dynamic = true;
          const sign = this.add(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0x442200 })), false);
          sign.position.set(x, 1.5, z + 0.47);
          this.pipes.push({ col: c, row: r, mesh: p, burst: false });
        } else if (ch === 'b') {
          for (let i = 0; i < 3; i++) {
            const s = 0.8 + Math.random() * 0.5;
            const b = this.add(new THREE.Mesh(new THREE.BoxGeometry(s, s, s), crate));
            b.position.set(x + (Math.random() - 0.5) * 0.6, s / 2 + (i === 2 ? 0.9 : 0), z + (Math.random() - 0.5) * 0.6);
            b.rotation.y = Math.random();
          }
        } else if (ch === 'k') {
          this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.3, 16), steel)).position.set(x, 0.15, z);
          this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.3, 16), steel)).position.set(x, WALL_H - 0.6, z);
          const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, WALL_H - 0.9, 16),
            new THREE.MeshStandardMaterial({ color: 0x40c8a0, emissive: 0x0c3a2a, transparent: true, opacity: 0.35, depthWrite: false }));
          liquid.position.set(x, (WALL_H - 0.6) / 2 + 0.15, z);
          this.add(liquid, false);
          if (tankTex) {
            const body = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.4), new THREE.MeshStandardMaterial({ map: tankTex, transparent: true, alphaTest: 0.4, emissive: 0x401010, side: THREE.DoubleSide }));
            body.position.set(x, 1.45, z);
            body.userData.dynamic = true;
            body.userData.billboard = true;
            this.group.add(body);
            this.animated.push({ obj: body, fn: (t) => { body.position.y = 1.45 + Math.sin(t * 0.7 + x) * 0.05; } });
          }
          const g = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, WALL_H - 0.9, 16, 1, true), glass), true);
          g.position.set(x, (WALL_H - 0.6) / 2 + 0.15, z);
        } else if (ch === 'x') {
          this.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 1.2), new THREE.MeshStandardMaterial({ map: proc('temple'), roughness: 0.8 }))).position.set(x, 0.5, z);
          for (let i = 0; i < 5; i++) {
            const cnd = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 6), new THREE.MeshStandardMaterial({ color: 0xeeeedd, emissive: 0xffaa40, emissiveIntensity: 0.6 })), false);
            cnd.position.set(x - 0.8 + i * 0.4, 1.13, z + (Math.random() - 0.5) * 0.6);
          }
        } else if (ch === 't') {
          const trunk = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 5, 7), bark));
          trunk.position.set(x, 2.5, z);
          trunk.rotation.z = (Math.random() - 0.5) * 0.2;
          for (let i = 0; i < 5; i++) {
            const br = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.09, 2.2, 5), bark), false);
            br.position.set(x + (Math.random() - 0.5) * 1.2, 3.6 + Math.random() * 1.2, z + (Math.random() - 0.5) * 1.2);
            br.rotation.set(Math.random() - 0.5, Math.random() * 3, (Math.random() - 0.5) * 1.8);
          }
        } else if (ch === 'm') {
          this.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 2.4), crate)).position.set(x, 0.75, z);
        } else if (ch === 'd') {
          this.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 2.2), wood)).position.set(x, 0.25, z);
          this.add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 2.1), cloth), false).position.set(x, 0.56, z);
        } else if (ch === 'o') {
          this.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.6), wood)).position.set(x, 1.2, z);
        } else if (ch === 'w') {
          this.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.6), wood)).position.set(x, 0.5, z);
          const wheel = new THREE.Group();
          wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 6, 20), wood));
          for (let i = 0; i < 4; i++) {
            const sp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.04), wood);
            sp.rotation.z = (i * Math.PI) / 4;
            wheel.add(sp);
          }
          wheel.position.set(x, 1.35, z - 0.35);
          wheel.userData.dynamic = true;
          this.group.add(wheel);
          this.animated.push({ obj: wheel, fn: () => { wheel.rotation.z += 0.01; } });
        } else if (ch === 'h') {
          this.add(new THREE.Mesh(new THREE.BoxGeometry(3, 3.4, 3), house)).position.set(x, 1.7, z);
          const rf = this.add(new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), roof), false);
          rf.position.set(x, 4.1, z);
          rf.rotation.y = Math.PI / 4;
        } else if (ch === 'R') {
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const n = charAt(c + dc, r + dr);
            if (n === 'R' || n === '#' || n === '%') continue;
            for (const h of [0.5, 1.05]) {
              const b = this.add(new THREE.Mesh(new THREE.BoxGeometry(dc ? 0.06 : CELL, 0.06, dc ? CELL : 0.06), rail), false);
              b.position.set(x + dc * (CELL / 2 - 0.05), h, z + dr * (CELL / 2 - 0.05));
            }
          }
        }
      }
    }
  }

  private mergeStatic() {
    this.group.updateMatrixWorld(true);
    const colliderSet = new Set(this.colliders);
    const batches = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; collide: boolean }>();
    const victims: THREE.Mesh[] = [];
    const visit = (o: THREE.Object3D) => {
      if (o.userData.dynamic) return;
      if (o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh) && !Array.isArray(o.material)) {
        const collide = colliderSet.has(o);
        const key = `${o.material.uuid}|${collide}`;
        let b = batches.get(key);
        if (!b) batches.set(key, (b = { mat: o.material, geos: [], collide }));
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        g.applyMatrix4(o.matrixWorld);
        for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
        b.geos.push(g);
        victims.push(o);
      }
      for (const c of [...o.children]) visit(c);
    };
    for (const c of [...this.group.children]) visit(c);
    for (const v of victims) v.removeFromParent();
    const vs = new Set<THREE.Object3D>(victims);
    this.colliders = this.colliders.filter((c) => !vs.has(c));
    for (const b of batches.values()) {
      const merged = mergeGeometries(b.geos, false);
      if (!merged) continue;
      const m = new THREE.Mesh(merged, b.mat);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
      if (b.collide) this.colliders.push(m);
    }
  }

  update(dt: number, viewer: THREE.Vector3, camPos: THREE.Vector3) {
    this.time += dt;
    const sorted = this.anchors
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
      if (a.flicker >= 2) k = Math.sin(this.time * 2 + a.phase) > 0 ? 1 : 0.05;
      else if (a.flicker > 0) {
        const t = this.time * 8 + a.phase;
        if (Math.sin(t) * Math.sin(t * 2.31) * Math.sin(t * 0.37) > 0.6 - a.flicker * 0.4) k = 0.15;
      }
      l.intensity = a.intensity * k * 3;
    });
    for (const d of this.doors.values()) {
      const target = d.open ? 1 : 0;
      if (d.t !== target) {
        d.t = Math.max(0, Math.min(1, d.t + Math.sign(target - d.t) * dt * 1.2));
        d.mesh.position.y = WALL_H / 2 + d.t * (WALL_H - 0.25);
      }
    }
    for (const m of this.secrets.values()) {
      if (m.userData.opening && m.position.y < WALL_H * 1.5) m.position.y += dt * 2.5;
    }
    for (const a of this.animated) {
      a.fn(this.time);
      if (a.obj.userData.billboard) a.obj.rotation.y = Math.atan2(camPos.x - a.obj.position.x, camPos.z - a.obj.position.z);
    }
    for (const m of this.exitMats) m.opacity = 0.25 + Math.sin(this.time * 4) * 0.15;
    if (this.waterMat?.map) this.waterMat.map.offset.set(this.time * 0.02, this.time * 0.013);
    if (this.sky) this.sky.position.set(camPos.x, 30, camPos.z);
  }

  dispose() {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
      }
    });
  }
}
