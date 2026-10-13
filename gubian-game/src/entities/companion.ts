import * as THREE from 'three';
import { collide, FlowField, lineOfSight } from '../world/map';

export type CompanionId = 'su' | 'man' | 'zhou';

interface Look {
  height: number;
  coat: number;
  pants: number;
  hair: number;
  bulk: number;
}

const LOOKS: Record<CompanionId, Look> = {
  su: { height: 1.66, coat: 0x23303a, pants: 0x161616, hair: 0x0b0806, bulk: 0.9 },
  man: { height: 1.12, coat: 0xa01c1c, pants: 0x2a2a3a, hair: 0x120c08, bulk: 0.75 },
  zhou: { height: 1.74, coat: 0x3d4430, pants: 0x232a1c, hair: 0x5a5650, bulk: 1.2 },
};

// 剧情同伴：只跟随，不参与伤害计算
export class Companion {
  group = new THREE.Group();
  pos: THREE.Vector3;
  yaw = 0;
  following = false;
  followDist: number;
  private walkT = 0;
  private legL: THREE.Object3D;
  private legR: THREE.Object3D;
  private armL: THREE.Object3D;
  private armR: THREE.Object3D;
  bellArm: THREE.Object3D | null = null;
  ringT = 0;

  constructor(public id: CompanionId, x: number, z: number) {
    this.pos = new THREE.Vector3(x, 0, z);
    this.followDist = id === 'man' ? 1.7 : id === 'su' ? 2.3 : 2.9;
    const L = LOOKS[id];
    const s = L.height / 1.75;
    const root = new THREE.Group();
    root.scale.setScalar(s);
    this.group.add(root);
    const coat = new THREE.MeshStandardMaterial({ color: L.coat, roughness: 0.8 });
    const pants = new THREE.MeshStandardMaterial({ color: L.pants, roughness: 0.9 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc9a68a, roughness: 0.7 });
    const hair = new THREE.MeshStandardMaterial({ color: L.hair, roughness: 0.9 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44 * L.bulk, 0.66, 0.26 * L.bulk), coat);
    torso.position.y = 1.27;
    torso.castShadow = true;
    root.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(id === 'man' ? 0.19 : 0.15, 12, 10), skin);
    head.position.y = 1.78;
    head.scale.set(1, 1.15, 1.05);
    root.add(head);
    const hairM = new THREE.Mesh(new THREE.SphereGeometry(id === 'man' ? 0.2 : 0.155, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), hair);
    hairM.position.y = 1.8;
    hairM.rotation.x = -0.2;
    root.add(hairM);
    if (id === 'su') {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.06), hair);
      tail.position.set(0, 1.62, -0.15);
      root.add(tail);
    }

    const limb = (w: number, h: number, mat: THREE.Material, x: number, y: number) => {
      const pivot = new THREE.Group();
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
      m.position.y = -h / 2;
      m.castShadow = true;
      pivot.add(m);
      pivot.position.set(x, y, 0);
      root.add(pivot);
      return pivot;
    };
    this.armL = limb(0.1, 0.6, coat, -0.27 * L.bulk, 1.56);
    this.armR = limb(0.1, 0.6, coat, 0.27 * L.bulk, 1.56);
    this.legL = limb(0.14, 0.94, pants, -0.11, 0.94);
    this.legR = limb(0.14, 0.94, pants, 0.11, 0.94);

    if (id === 'su') {
      // 便携式采样箱
      const caseM = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.38), new THREE.MeshStandardMaterial({ color: 0xbababa, metalness: 0.7, roughness: 0.3 }));
      caseM.position.set(0, -0.7, 0);
      this.armL.add(caseM);
    }
    if (id === 'man') {
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.12, 10, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xb08d3a, metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }));
      bell.position.set(0, -0.68, 0.05);
      this.armR.add(bell);
      this.bellArm = this.armR;
    }
    this.group.position.copy(this.pos);
  }

  update(dt: number, playerPos: THREE.Vector3, flow: FlowField, leader?: THREE.Vector3) {
    const tgt = leader ?? playerPos;
    const dx = tgt.x - this.pos.x, dz = tgt.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    let speed = 0;
    if (this.following) {
      // 远离且看不见时直接跟上，避免卡住
      if (dist > 14 && !lineOfSight(this.pos.x, this.pos.z, playerPos.x, playerPos.z)) {
        const n = flow.next(playerPos.x, playerPos.z);
        this.pos.set(n ? n.x : playerPos.x, 0, n ? n.z : playerPos.z);
        this.pos.x -= Math.sin(this.yaw) * 0.5;
      } else if (dist > this.followDist) {
        speed = Math.min(4.6, 1.8 + (dist - this.followDist) * 1.5);
        let target: { x: number; z: number } = { x: tgt.x, z: tgt.z };
        if (!lineOfSight(this.pos.x, this.pos.z, tgt.x, tgt.z)) target = flow.next(this.pos.x, this.pos.z) ?? target;
        const tx = target.x - this.pos.x, tz = target.z - this.pos.z;
        const tl = Math.hypot(tx, tz) || 1;
        this.pos.x += (tx / tl) * speed * dt;
        this.pos.z += (tz / tl) * speed * dt;
        collide(this.pos, 0.3);
      }
    }
    const faceYaw = Math.atan2(dx, dz);
    let d = faceYaw - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += d * Math.min(1, dt * 5);

    this.walkT += dt * speed * 3.5;
    const sw = Math.sin(this.walkT) * (speed > 0 ? 0.55 : 0);
    this.legL.rotation.x = sw;
    this.legR.rotation.x = -sw;
    this.armL.rotation.x = -sw * 0.6;
    if (this.ringT > 0) {
      this.ringT -= dt;
      this.armR.rotation.x = -1.6 + Math.sin(this.ringT * 30) * 0.3;
    } else {
      this.armR.rotation.x = sw * 0.6;
    }
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;
  }
}
