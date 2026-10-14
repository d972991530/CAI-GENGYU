import * as THREE from 'three';
import { sprite, SpriteInfo } from '../core/assets';
import { iconTexture } from '../core/textures';
import { collide, FlowField, lineOfSight } from '../world/map';

const PLANE = (() => {
  const g = new THREE.PlaneGeometry(1, 1);
  g.translate(0, 0.5, 0);
  return g;
})();

const HEIGHTS: Record<string, number> = { lin: 1.8, zhou: 1.78, su: 1.68, man: 1.25, chen: 1.75, apo: 1.5, xu: 1.8, zhong: 1.72 };

// 剧情同伴 / NPC：立绘公告板，跟随玩家，不参与伤害
export class Npc {
  group = new THREE.Group();
  mesh: THREE.Mesh;
  info: SpriteInfo;
  pos: THREE.Vector3;
  following = false;
  followDist = 2.4;
  ringT = 0;
  private walkT = Math.random() * 5;
  private h: number;
  private mat: THREE.MeshStandardMaterial;

  constructor(public id: string, x: number, z: number) {
    this.info = sprite(id);
    this.h = HEIGHTS[id] ?? 1.75;
    this.pos = new THREE.Vector3(x, 0, z);
    this.mat = new THREE.MeshStandardMaterial({ map: this.info.tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
    this.mat.color.setScalar(id === 'su' ? 1.05 : 1.25);
    this.mesh = new THREE.Mesh(PLANE, this.mat);
    this.mesh.scale.set(this.h * this.info.aspect, this.h, 1);
    this.group.add(this.mesh);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: iconTexture('shadow'), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.02;
    sh.scale.set(this.h * 0.45, this.h * 0.28, 1);
    this.group.add(sh);
    this.group.position.copy(this.pos);
  }

  update(dt: number, player: THREE.Vector3, cam: THREE.Vector3, flow: FlowField, leader?: THREE.Vector3) {
    const tgt = leader ?? player;
    const dx = tgt.x - this.pos.x, dz = tgt.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    let speed = 0;
    if (this.following) {
      if (dist > 16 && !lineOfSight(this.pos.x, this.pos.z, player.x, player.z)) {
        // 跟丢时直接在玩家身后出现
        const n = flow.next(player.x, player.z);
        this.pos.set(n ? n.x : player.x, 0, n ? n.z : player.z);
      } else if (dist > this.followDist) {
        speed = Math.min(6.5, 2 + (dist - this.followDist) * 1.6);
        let t: { x: number; z: number } = { x: tgt.x, z: tgt.z };
        if (!lineOfSight(this.pos.x, this.pos.z, tgt.x, tgt.z)) t = flow.next(this.pos.x, this.pos.z) ?? t;
        const tx = t.x - this.pos.x, tz = t.z - this.pos.z;
        const tl = Math.hypot(tx, tz) || 1;
        this.pos.x += (tx / tl) * speed * dt;
        this.pos.z += (tz / tl) * speed * dt;
        collide(this.pos, 0.3);
      }
    }
    this.walkT += dt * (speed > 0 ? 2 + speed * 2 : 1);
    const s = Math.sin(this.walkT);
    this.group.rotation.y = Math.atan2(cam.x - this.pos.x, cam.z - this.pos.z);
    this.mesh.position.y = speed > 0 ? Math.abs(s) * 0.06 : 0;
    this.mesh.rotation.z = speed > 0 ? s * 0.04 : Math.sin(this.walkT * 0.5) * 0.01;
    if (this.ringT > 0) {
      this.ringT -= dt;
      this.mesh.rotation.z = Math.sin(this.ringT * 40) * 0.08;
      this.mat.emissive.setRGB(0.3, 0.22, 0.05);
    } else this.mat.emissive.setRGB(0, 0, 0);
    this.group.position.copy(this.pos);
  }
}
