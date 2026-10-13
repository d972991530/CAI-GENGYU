import * as THREE from 'three';
import { audio } from '../core/audio';

// 林骁的配枪：第一人称手枪模型、弹药与后坐力
export class Pistol {
  model = new THREE.Group();
  mag = 12;
  magSize = 12;
  reserve = 24;
  reloading = 0;
  private cooldown = 0;
  private recoil = 0;
  private bobT = 0;
  private flash: THREE.Mesh;
  private flashLight: THREE.PointLight;
  private flashT = 0;
  aimK = 0;

  constructor(camera: THREE.Camera) {
    const dark = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.4, metalness: 0.6 });
    const grip = new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: 0.9 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xb08c70, roughness: 0.7 });
    const sleeve = new THREE.MeshStandardMaterial({ color: 0x2c3440, roughness: 0.9 });

    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.2), dark);
    slide.position.set(0, 0.02, -0.06);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.025, 0.16), dark);
    frame.position.set(0, -0.01, -0.04);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.045), grip);
    handle.position.set(0, -0.06, 0.02);
    handle.rotation.x = 0.25;
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.01, 0.006), new THREE.MeshBasicMaterial({ color: 0x40ff60 }));
    sight.position.set(0, 0.045, -0.15);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.08), skin);
    hand.position.set(0, -0.06, 0.03);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.22), sleeve);
    arm.position.set(0.01, -0.08, 0.16);
    arm.rotation.x = 0.1;
    this.model.add(slide, frame, handle, sight, hand, arm);

    this.flash = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0xffd080, transparent: true, opacity: 0.9 }));
    this.flash.position.set(0, 0.02, -0.18);
    this.flash.visible = false;
    this.model.add(this.flash);
    this.flashLight = new THREE.PointLight(0xffb060, 0, 8, 2);
    this.flashLight.position.set(0, 0.02, -0.3);
    this.model.add(this.flashLight);

    this.model.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.renderOrder = 10;
        const mat = o.material as THREE.Material;
        mat.depthTest = true;
      }
    });
    this.model.scale.setScalar(0.85);
    camera.add(this.model);
    this.place(0, 0);
  }

  private place(bobX: number, bobY: number) {
    const hip = new THREE.Vector3(0.12, -0.12, -0.42);
    const ads = new THREE.Vector3(0, -0.067, -0.24);
    this.model.position.lerpVectors(hip, ads, this.aimK);
    this.model.position.x += bobX * (1 - this.aimK * 0.8);
    this.model.position.y += bobY * (1 - this.aimK * 0.8) - (this.reloading > 0 ? 0.12 : 0);
    this.model.position.z += this.recoil * 0.06;
    this.model.rotation.set(this.recoil * 0.25 + (this.reloading > 0 ? 0.7 : 0), 0, this.reloading > 0 ? 0.4 : 0);
  }

  canFire() {
    return this.cooldown <= 0 && this.reloading <= 0;
  }

  // 返回是否真正击发
  tryFire(): boolean {
    if (!this.canFire()) return false;
    if (this.mag <= 0) {
      audio.dryFire();
      this.cooldown = 0.3;
      if (this.reserve > 0) this.startReload();
      return false;
    }
    this.mag--;
    this.cooldown = 0.2;
    this.recoil = 1;
    this.flashT = 0.05;
    audio.gunshot();
    return true;
  }

  startReload() {
    if (this.reloading > 0 || this.mag >= this.magSize || this.reserve <= 0) return;
    this.reloading = 1.4;
    audio.reload();
  }

  update(dt: number, moving: number, aiming: boolean) {
    this.cooldown -= dt;
    if (this.reloading > 0) {
      this.reloading -= dt;
      if (this.reloading <= 0) {
        const need = this.magSize - this.mag;
        const take = Math.min(need, this.reserve);
        this.mag += take;
        this.reserve -= take;
      }
    }
    this.recoil *= Math.pow(0.0005, dt);
    this.aimK += ((aiming && this.reloading <= 0 ? 1 : 0) - this.aimK) * Math.min(1, dt * 10);
    this.bobT += dt * (2 + moving * 7);
    const bx = Math.sin(this.bobT) * 0.008 * (0.3 + moving);
    const by = Math.abs(Math.cos(this.bobT)) * 0.008 * (0.3 + moving);
    this.flashT -= dt;
    this.flash.visible = this.flashT > 0;
    this.flash.rotation.z = Math.random() * 3;
    this.flashLight.intensity = this.flashT > 0 ? 6 : 0;
    this.place(bx, by);
  }
}
