import { IS_MOBILE } from '../platform';

// 统一的输入接口；电脑版与手机版各自实现，构建时只启用其一
export type Action =
  | 'reload' | 'scan' | 'flash' | 'bell' | 'zhenyin' | 'heal' | 'use' | 'pause' | 'dash'
  | 'weapon1' | 'weapon2' | 'weapon3' | 'nextWeapon' | 'map' | 'skip';

export interface Input {
  moveX: number;
  moveY: number;
  fire: boolean;
  sprint: boolean;
  sensitivity: number;
  enabled: boolean;
  takeLook(): { dx: number; dy: number };
  consume(a: Action): boolean;
  clear(): void;
  update(): void;
  lock(): void;
  unlock(): void;
  show(v: boolean): void;
  setButton(act: string, s: { visible?: boolean; cooldown?: number; label?: string }): void;
  onPointerLockLost: (() => void) | null;
}

// ---------------- 电脑版：键盘 + 鼠标（指针锁定）+ 手柄 ----------------
class DesktopInput implements Input {
  moveX = 0;
  moveY = 0;
  fire = false;
  sprint = false;
  sensitivity = 1;
  enabled = false;
  onPointerLockLost: (() => void) | null = null;
  private keys = new Set<string>();
  private pressed = new Set<Action>();
  private lookDX = 0;
  private lookDY = 0;
  private mouseFire = false;
  private padPrev: boolean[] = [];

  constructor(private canvas: HTMLElement) {
    const map: Record<string, Action> = {
      KeyR: 'reload', KeyC: 'scan', KeyF: 'flash', KeyQ: 'bell', KeyZ: 'zhenyin', KeyH: 'heal', KeyE: 'use',
      Space: 'dash', Digit1: 'weapon1', Digit2: 'weapon2', Digit3: 'weapon3', Tab: 'map', Escape: 'pause', KeyP: 'pause',
    };
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat && map[e.code]) this.pressed.add(map[e.code]);
      if (!e.repeat && (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape')) this.pressed.add('skip');
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouseFire = false; });
    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (document.pointerLockElement !== canvas) { this.lock(); return; }
      if (e.button === 0) this.mouseFire = true;
      if (e.button === 2) this.pressed.add('flash');
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseFire = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('wheel', (e) => { if (this.enabled && Math.abs(e.deltaY) > 10) this.pressed.add('nextWeapon'); });
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas) return;
      this.lookDX += e.movementX * 0.0022 * this.sensitivity;
      this.lookDY += e.movementY * 0.0022 * this.sensitivity;
    });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== canvas && this.enabled) {
        this.mouseFire = false;
        this.onPointerLockLost?.();
      }
    });
  }

  lock() {
    const p = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
    p?.catch?.(() => {});
  }
  unlock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }
  show() {}
  setButton() {}
  consume(a: Action) {
    const had = this.pressed.has(a);
    this.pressed.delete(a);
    return had;
  }
  clear() {
    this.pressed.clear();
    this.lookDX = this.lookDY = 0;
    this.mouseFire = false;
  }
  takeLook() {
    const r = { dx: this.lookDX, dy: this.lookDY };
    this.lookDX = this.lookDY = 0;
    return r;
  }
  update() {
    const k = this.keys;
    this.moveX = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    this.moveY = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    this.sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    this.fire = this.mouseFire;
    // 手柄（Xbox 布局）
    const pads = navigator.getGamepads?.() ?? [];
    const pad = [...pads].find((p) => p);
    if (pad) {
      const dz = (v: number) => (Math.abs(v) < 0.18 ? 0 : v);
      if (dz(pad.axes[0]) || dz(pad.axes[1])) { this.moveX = dz(pad.axes[0]); this.moveY = -dz(pad.axes[1]); }
      this.lookDX += dz(pad.axes[2] ?? 0) * 0.045 * this.sensitivity;
      this.lookDY += dz(pad.axes[3] ?? 0) * 0.035 * this.sensitivity;
      const b = (i: number) => !!pad.buttons[i]?.pressed;
      if (b(7)) this.fire = true;
      if (b(10)) this.sprint = true;
      const edge: [number, Action][] = [[0, 'use'], [1, 'dash'], [2, 'reload'], [3, 'nextWeapon'], [4, 'scan'], [5, 'flash'], [6, 'bell'], [12, 'zhenyin'], [13, 'heal'], [9, 'pause'], [8, 'map']];
      for (const [i, a] of edge) {
        if (b(i) && !this.padPrev[i]) { this.pressed.add(a); if (i === 0 || i === 9) this.pressed.add('skip'); }
        this.padPrev[i] = b(i);
      }
    }
  }
}

// ---------------- 手机版：左侧浮动摇杆 + 右侧滑动视角 + 触控按键 ----------------
class MobileInput implements Input {
  moveX = 0;
  moveY = 0;
  fire = false;
  sprint = false;
  sensitivity = 1;
  enabled = false;
  onPointerLockLost: (() => void) | null = null;
  private pressed = new Set<Action>();
  private lookDX = 0;
  private lookDY = 0;
  private root: HTMLDivElement;

  constructor() {
    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = `
      <div class="t-look"></div>
      <div class="t-stick"><div class="t-knob"></div></div>
      <button class="t-btn t-fire" data-hold="fire"><span>开火</span></button>
      <button class="t-btn t-use" data-act="use"><span>互动</span></button>
      <button class="t-btn t-reload" data-act="reload"><span>换弹</span></button>
      <button class="t-btn t-dash" data-act="dash"><span>闪避</span></button>
      <button class="t-btn t-weapon" data-act="nextWeapon"><span>换枪</span></button>
      <button class="t-btn t-flash" data-act="flash"><span>强光</span></button>
      <button class="t-btn t-scan" data-act="scan"><span>勘察</span></button>
      <button class="t-btn t-bell" data-act="bell"><span>铜铃</span></button>
      <button class="t-btn t-zhenyin" data-act="zhenyin"><span>镇音</span></button>
      <button class="t-btn t-heal" data-act="heal"><span>草药</span></button>
      <button class="t-btn t-map" data-act="map"><span>地图</span></button>
      <button class="t-btn t-pause" data-act="pause"><span>❚❚</span></button>`;
    document.body.appendChild(root);
    this.root = root;
    const stick = root.querySelector<HTMLDivElement>('.t-stick')!;
    const knob = root.querySelector<HTMLDivElement>('.t-knob')!;
    const zone = root.querySelector<HTMLDivElement>('.t-look')!;
    let stickId = -1, sx = 0, sy = 0;
    const looks = new Map<number, { x: number; y: number }>();
    zone.addEventListener('pointerdown', (e) => {
      if (e.clientX < window.innerWidth * 0.42 && stickId === -1) {
        stickId = e.pointerId;
        sx = e.clientX; sy = e.clientY;
        stick.style.left = `${sx}px`;
        stick.style.top = `${sy}px`;
        stick.classList.add('active');
      } else looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId === stickId) {
        let dx = e.clientX - sx, dy = e.clientY - sy;
        const max = 60, len = Math.hypot(dx, dy);
        if (len > max) { dx *= max / len; dy *= max / len; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.moveX = dx / max;
        this.moveY = -dy / max;
        this.sprint = len > max * 1.5;
      }
      this.track(e, looks);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId === stickId) {
        stickId = -1;
        this.moveX = this.moveY = 0;
        this.sprint = false;
        knob.style.transform = '';
        stick.classList.remove('active');
      }
      looks.delete(e.pointerId);
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    root.querySelectorAll<HTMLButtonElement>('.t-btn').forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        b.classList.add('down');
        if (b.dataset.hold === 'fire') {
          this.fire = true;
          looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
        } else if (b.dataset.act) this.pressed.add(b.dataset.act as Action);
      });
      b.addEventListener('pointermove', (e) => this.track(e, looks));
      const up = (e: PointerEvent) => {
        b.classList.remove('down');
        if (b.dataset.hold === 'fire') this.fire = false;
        looks.delete(e.pointerId);
      };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
    });
  }

  private track(e: PointerEvent, ids: Map<number, { x: number; y: number }>) {
    const p = ids.get(e.pointerId);
    if (!p) return;
    this.lookDX += (e.clientX - p.x) * 0.0052 * this.sensitivity;
    this.lookDY += (e.clientY - p.y) * 0.0052 * this.sensitivity;
    p.x = e.clientX;
    p.y = e.clientY;
  }

  lock() {}
  unlock() {}
  show(v: boolean) {
    this.root.style.display = v ? 'block' : 'none';
  }
  setButton(act: string, s: { visible?: boolean; cooldown?: number; label?: string }) {
    const b = this.root.querySelector<HTMLButtonElement>(`.t-${act}`);
    if (!b) return;
    if (s.visible !== undefined) b.style.display = s.visible ? '' : 'none';
    if (s.cooldown !== undefined) b.style.setProperty('--cd', `${Math.round(Math.max(0, Math.min(1, s.cooldown)) * 100)}%`);
    if (s.label !== undefined) b.querySelector('span')!.textContent = s.label;
  }
  consume(a: Action) {
    const had = this.pressed.has(a);
    this.pressed.delete(a);
    return had;
  }
  clear() {
    this.pressed.clear();
    this.lookDX = this.lookDY = 0;
    this.fire = false;
  }
  takeLook() {
    const r = { dx: this.lookDX, dy: this.lookDY };
    this.lookDX = this.lookDY = 0;
    return r;
  }
  update() {}
}

export function createInput(canvas: HTMLElement): Input {
  return IS_MOBILE ? new MobileInput() : new DesktopInput(canvas);
}
