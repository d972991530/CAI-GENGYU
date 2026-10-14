import { hudUrl } from '../core/assets';
import { audio } from '../core/audio';

export type WeaponId = 'pistol' | 'mg' | 'cryo';
export type AmmoType = 'ammo' | 'mg_ammo' | 'cryo_ammo';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  img: string;
  dmg: number;
  rate: number;
  mag: number;
  auto: boolean;
  spread: number;
  ammo: AmmoType;
  reload: number;
  // 屏幕摆放：图片宽度占屏宽比例、右侧偏移、底部偏移、枪口在图片中的位置
  w: number;
  right: number;
  bottom: number;
  muzzle: [number, number];
  slot: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pistol: { id: 'pistol', name: '制式手枪', img: 'w_pistol2', dmg: 24, rate: 0.32, mag: 12, auto: false, spread: 0.012, ammo: 'ammo', reload: 1.5, w: 0.3, right: 0.2, bottom: -0.08, muzzle: [0.2, 0.08], slot: 1 },
  mg: { id: 'mg', name: '老周的重机枪', img: 'w_mg', dmg: 15, rate: 0.09, mag: 60, auto: true, spread: 0.035, ammo: 'mg_ammo', reload: 2.6, w: 0.46, right: 0.18, bottom: -0.06, muzzle: [0.12, 0.2], slot: 2 },
  cryo: { id: 'cryo', name: '苏晚的冷凝枪', img: 'w_cryo2', dmg: 14, rate: 0.55, mag: 6, auto: false, spread: 0.01, ammo: 'cryo_ammo', reload: 2.0, w: 0.48, right: 0.1, bottom: -0.1, muzzle: [0.04, 0.06], slot: 3 },
};

// 屏幕下方的 2D 手持武器（Doom 式），带晃动、后坐力、枪口火光、换弹/换枪动画
export class WeaponView {
  el = document.getElementById('weapon')!;
  private img = document.createElement('img');
  private flash = document.createElement('div');
  private bell = document.createElement('img');
  def: WeaponDef = WEAPONS.pistol;
  private bobT = 0;
  private recoil = 0;
  private lower = 0; // 0 正常 1 收起
  private swapTo: WeaponDef | null = null;
  private flashT = 0;
  private bellT = 0;
  reloading = 0;

  constructor() {
    this.img.className = 'wpn';
    this.flash.className = 'muzzle';
    this.bell.className = 'bell-hand';
    this.bell.src = hudUrl('h_bell_b');
    this.el.append(this.bell, this.img, this.flash);
    this.set(WEAPONS.pistol);
  }

  private set(def: WeaponDef) {
    this.def = def;
    this.img.src = hudUrl(def.img);
    this.img.style.width = `${def.w * 100}vw`;
    if (def.id === 'pistol') this.img.style.maxWidth = '58vh';
    else this.img.style.maxWidth = '90vh';
  }

  swap(def: WeaponDef) {
    if (def.id === this.def.id && !this.swapTo) return;
    this.swapTo = def;
  }

  kick() {
    this.recoil = 1;
    this.flashT = 0.06;
  }

  showBell() {
    this.bellT = 1.4;
  }

  get busy() {
    return this.lower > 0.05 || this.swapTo !== null;
  }

  update(dt: number, moving: number, visible: boolean) {
    this.el.style.display = visible ? 'block' : 'none';
    if (this.swapTo) {
      this.lower = Math.min(1, this.lower + dt * 4);
      if (this.lower >= 1) {
        this.set(this.swapTo);
        this.swapTo = null;
        audio.reload();
      }
    } else this.lower = Math.max(0, this.lower - dt * 4);
    const rl = this.reloading > 0 ? Math.sin(Math.min(1, this.reloading / this.def.reload) * Math.PI) : 0;
    this.bobT += dt * (1.5 + moving * 5.5);
    const bx = Math.sin(this.bobT) * (0.6 + moving * 1.4);
    const by = Math.abs(Math.cos(this.bobT)) * (0.6 + moving * 1.8);
    this.recoil = Math.max(0, this.recoil - dt * 9);
    const drop = this.lower * 40 + rl * 22 + this.recoil * 3;
    const rot = this.recoil * -4 + rl * 18;
    const d = this.def;
    this.img.style.right = `${d.right * 100 + bx * 0.3}vw`;
    this.img.style.bottom = `calc(${d.bottom * 100 - by * 0.4 - drop}vh)`;
    this.img.style.transform = `rotate(${rot}deg) scale(${1 + this.recoil * 0.03})`;
    this.flashT -= dt;
    this.flash.style.opacity = this.flashT > 0 ? '1' : '0';
    if (this.flashT > 0) {
      const r = this.img.getBoundingClientRect();
      this.flash.style.left = `${r.left + r.width * d.muzzle[0]}px`;
      this.flash.style.top = `${r.top + r.height * d.muzzle[1]}px`;
      this.flash.style.transform = `translate(-50%,-50%) rotate(${Math.random() * 360}deg) scale(${0.8 + Math.random() * 0.6})`;
      this.flash.classList.toggle('cryo', d.id === 'cryo');
    }
    this.bellT = Math.max(0, this.bellT - dt);
    const bk = this.bellT > 0 ? Math.min(1, this.bellT * 3, (1.4 - this.bellT) * 6) : 0;
    this.bell.style.opacity = String(bk);
    this.bell.style.transform = `translateY(${(1 - bk) * 30}vh) rotate(${Math.sin(this.bellT * 30) * 8 * bk}deg)`;
  }
}
