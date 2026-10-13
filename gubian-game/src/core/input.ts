// 统一输入：PC 键鼠（指针锁定）+ 安卓触屏（左摇杆 / 右侧滑动视角 / 动作按键）
export type Action = 'reload' | 'scan' | 'flash' | 'bell' | 'heal' | 'interact' | 'pause';

export class Input {
  moveX = 0;
  moveY = 0;
  lookDX = 0;
  lookDY = 0;
  fire = false;
  aim = false;
  sprint = false;
  sensitivity = 1;
  touchMode = false;
  enabled = false;
  private keys = new Set<string>();
  private pressed = new Set<Action>();
  private canvas: HTMLElement;
  onPointerLockLost: (() => void) | null = null;

  constructor(canvas: HTMLElement) {
    this.canvas = canvas;
    this.touchMode = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      const map: Record<string, Action> = {
        KeyR: 'reload', KeyQ: 'scan', KeyF: 'flash', KeyG: 'bell', KeyH: 'heal', KeyE: 'interact',
      };
      if (map[e.code] && !e.repeat) this.pressed.add(map[e.code]);
      if (e.code === 'Escape' || e.code === 'KeyP') this.pressed.add('pause');
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.fire = false;
      this.aim = false;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (this.touchMode || !this.enabled) return;
      if (document.pointerLockElement !== canvas) {
        this.lock();
        return;
      }
      if (e.button === 0) this.fire = true;
      if (e.button === 2) this.aim = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (this.touchMode) return;
      if (e.button === 0) this.fire = false;
      if (e.button === 2) this.aim = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas) return;
      this.lookDX += e.movementX * 0.0022 * this.sensitivity;
      this.lookDY += e.movementY * 0.0022 * this.sensitivity;
    });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== canvas && this.enabled && !this.touchMode) {
        this.fire = false;
        this.onPointerLockLost?.();
      }
    });

    if (this.touchMode) this.buildTouchUI();
  }

  lock() {
    if (this.touchMode) return;
    const p = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
    p?.catch?.(() => {});
  }

  unlock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  consume(a: Action) {
    const had = this.pressed.has(a);
    this.pressed.delete(a);
    return had;
  }

  trigger(a: Action) {
    this.pressed.add(a);
  }

  clear() {
    this.pressed.clear();
    this.lookDX = this.lookDY = 0;
    this.fire = this.aim = false;
  }

  update() {
    if (!this.touchMode) {
      const k = this.keys;
      this.moveX = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
      this.moveY = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      this.sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    }
  }

  takeLook() {
    const r = { dx: this.lookDX, dy: this.lookDY };
    this.lookDX = this.lookDY = 0;
    return r;
  }

  // ---------- 触屏 ----------
  touchRoot: HTMLDivElement | null = null;

  private buildTouchUI() {
    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = `
      <div class="t-look"></div>
      <div class="t-stick"><div class="t-knob"></div></div>
      <button class="t-btn t-fire" data-hold="fire">开火</button>
      <button class="t-btn t-aim" data-toggle="aim">瞄准</button>
      <button class="t-btn t-reload" data-act="reload">换弹</button>
      <button class="t-btn t-interact" data-act="interact">互动</button>
      <button class="t-btn t-scan" data-act="scan">勘察</button>
      <button class="t-btn t-flash" data-act="flash">强光</button>
      <button class="t-btn t-bell" data-act="bell">铜铃</button>
      <button class="t-btn t-heal" data-act="heal">草药</button>
      <button class="t-btn t-pause" data-act="pause">❚❚</button>`;
    document.body.appendChild(root);
    this.touchRoot = root;

    const stick = root.querySelector<HTMLDivElement>('.t-stick')!;
    const knob = root.querySelector<HTMLDivElement>('.t-knob')!;
    const lookZone = root.querySelector<HTMLDivElement>('.t-look')!;
    let stickId = -1, sx = 0, sy = 0;
    const lookIds = new Map<number, { x: number; y: number }>();

    const startLook = (e: PointerEvent) => lookIds.set(e.pointerId, { x: e.clientX, y: e.clientY });

    lookZone.addEventListener('pointerdown', (e) => {
      if (e.clientX < window.innerWidth * 0.42 && stickId === -1) {
        stickId = e.pointerId;
        sx = e.clientX; sy = e.clientY;
        stick.style.left = `${sx}px`;
        stick.style.top = `${sy}px`;
        stick.classList.add('active');
      } else {
        startLook(e);
      }
      lookZone.setPointerCapture(e.pointerId);
    });
    lookZone.addEventListener('pointermove', (e) => {
      if (e.pointerId === stickId) {
        let dx = e.clientX - sx, dy = e.clientY - sy;
        const max = 55;
        const len = Math.hypot(dx, dy);
        if (len > max) { dx *= max / len; dy *= max / len; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.moveX = dx / max;
        this.moveY = -dy / max;
        this.sprint = len > max * 1.4;
      }
      this.trackLook(e, lookIds);
    });
    const endStick = (e: PointerEvent) => {
      if (e.pointerId === stickId) {
        stickId = -1;
        this.moveX = this.moveY = 0;
        this.sprint = false;
        knob.style.transform = '';
        stick.classList.remove('active');
      }
      lookIds.delete(e.pointerId);
    };
    lookZone.addEventListener('pointerup', endStick);
    lookZone.addEventListener('pointercancel', endStick);

    root.querySelectorAll<HTMLButtonElement>('.t-btn').forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        b.classList.add('down');
        if (b.dataset.hold === 'fire') {
          this.fire = true;
          startLook(e); // 按住开火时可拖动瞄准
        } else if (b.dataset.toggle === 'aim') {
          this.aim = !this.aim;
          b.classList.toggle('on', this.aim);
        } else if (b.dataset.act) {
          this.pressed.add(b.dataset.act as Action);
        }
      });
      b.addEventListener('pointermove', (e) => this.trackLook(e, lookIds));
      const up = (e: PointerEvent) => {
        b.classList.remove('down');
        if (b.dataset.hold === 'fire') this.fire = false;
        lookIds.delete(e.pointerId);
      };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
    });
  }

  private trackLook(e: PointerEvent, ids: Map<number, { x: number; y: number }>) {
    const p = ids.get(e.pointerId);
    if (!p) return;
    this.lookDX += (e.clientX - p.x) * 0.0055 * this.sensitivity;
    this.lookDY += (e.clientY - p.y) * 0.0055 * this.sensitivity;
    p.x = e.clientX; p.y = e.clientY;
  }

  showTouch(v: boolean) {
    if (this.touchRoot) this.touchRoot.style.display = v ? 'block' : 'none';
  }

  setButtonState(act: string, state: { visible?: boolean; cooldown?: number }) {
    if (!this.touchRoot) return;
    const b = this.touchRoot.querySelector<HTMLButtonElement>(`.t-${act}`);
    if (!b) return;
    if (state.visible !== undefined) b.style.display = state.visible ? '' : 'none';
    if (state.cooldown !== undefined) b.style.setProperty('--cd', `${Math.round(state.cooldown * 100)}%`);
  }

  resetAimToggle() {
    this.aim = false;
    this.touchRoot?.querySelector('.t-aim')?.classList.remove('on');
  }
}
