import { IS_MOBILE } from '../platform';
import { artUrl, portraitUrl, PORTRAITS } from '../core/assets';
import { COLS, ROWS, MAP, charAt, isDoorChar, isDoorOpen, isWallChar, CELL } from '../world/map';

// 说话人 → 头像与颜色
const SPEAKERS: Record<string, { p?: string; c: string }> = {
  林骁: { p: 'lin', c: '#9fc6ff' }, 苏晚: { p: 'su', c: '#ffb3c4' }, 陈砚: { p: 'chen', c: '#9dffb8' },
  老周: { p: 'zhou', c: '#ffd27a' }, 小满: { p: 'man', c: '#ffe08a' }, 阿婆: { p: 'apo', c: '#e6c9a0' },
  许怀远: { p: 'xu', c: '#c0c8ff' }, 钟曼: { p: 'zhong', c: '#ff9a9a' }, 方鹤年: { c: '#d8d0b8' }, 苏明远: { c: '#ff8a7a' },
  广播: { c: '#ff6a5a' }, 蛊母: { c: '#ff5040' }, 新娘: { c: '#ff6a8a' }, 技术员: { c: '#cccccc' },
  唐武男: { p: 'tang', c: '#ff7a5a' }, 土蜘蛛: { c: '#b0b8c8' }, 傩戏班姑娘: { c: '#e6c9a0' }, 船长: { c: '#d8d0b8' }, 押运员: { c: '#cccccc' }, 能面众: { c: '#e8e8e8' },
};

const el = (tag: string, cls: string, parent: HTMLElement, html = '') => {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  parent.appendChild(e);
  return e as HTMLDivElement;
};

export interface HudState {
  hp: number;
  armor: number;
  ammo: number | string;
  ammoName: string;
  reserve: { ammo: number; mg_ammo: number; cryo_ammo: number };
  reserveNames?: [string, string, string | null];
  weapons: { slot: number; name: string; owned: boolean; active: boolean }[];
  keys: string[];
  herbs: number;
  abilities: { key: string; name: string; cd: number; max: number; on: boolean }[];
  stamina: number;
  oxygen: number | null;
  reloading: boolean;
}

export class Hud {
  root = document.getElementById('hud')!;
  private bar!: HTMLDivElement;
  private face!: HTMLImageElement;
  private hpEl!: HTMLDivElement;
  private armorEl!: HTMLDivElement;
  private ammoEl!: HTMLDivElement;
  private armsEl!: HTMLDivElement;
  private keysEl!: HTMLDivElement;
  private tableEl!: HTMLDivElement;
  private abilEl!: HTMLDivElement;
  private staminaEl!: HTMLDivElement;
  private oxyEl!: HTMLDivElement;
  private objective!: HTMLDivElement;
  private subtitle!: HTMLDivElement;
  private prompt!: HTMLDivElement;
  private hint!: HTMLDivElement;
  private msg!: HTMLDivElement;
  private crosshair!: HTMLDivElement;
  private hitmarker!: HTMLDivElement;
  private vignette!: HTMLDivElement;
  private scanTint!: HTMLDivElement;
  private frost!: HTMLDivElement;
  private water!: HTMLDivElement;
  private letterbox!: HTMLDivElement;
  private fade!: HTMLDivElement;
  private caption!: HTMLDivElement;
  private boss!: HTMLDivElement;
  private bossFill!: HTMLDivElement;
  private doc!: HTMLDivElement;
  private scare!: HTMLDivElement;
  private scareImg!: HTMLImageElement;
  private flashW!: HTMLDivElement;
  private mapCanvas!: HTMLCanvasElement;
  private hitT = 0;
  private dmgK = 0;
  private hintT = 0;
  private msgT = 0;
  private faceT = 0;
  private faceLook = 0;
  private scareT = 0;
  private docResolve: (() => void) | null = null;
  onDocOpen: (() => void) | null = null;
  onDocClose: (() => void) | null = null;
  explored = new Uint8Array(0);

  constructor() {
    const r = this.root;
    r.classList.add(IS_MOBILE ? 'mobile' : 'desktop');
    this.vignette = el('div', 'h-vignette', document.body);
    this.scanTint = el('div', 'h-scan', document.body);
    this.frost = el('div', 'h-frost', document.body);
    this.water = el('div', 'h-water', document.body);
    this.flashW = el('div', 'h-flashw', document.body);
    this.objective = el('div', 'h-objective', r);
    this.crosshair = el('div', 'h-cross', r, '<i></i><i></i><i></i><i></i>');
    this.hitmarker = el('div', 'h-hit', r);
    this.prompt = el('div', 'h-prompt', r);
    this.hint = el('div', 'h-hint', r);
    this.msg = el('div', 'h-msg', r);
    this.boss = el('div', 'h-boss', r, '<span></span><div class="bar"><div></div></div>');
    this.bossFill = this.boss.querySelector('.bar div') as HTMLDivElement;
    this.subtitle = el('div', 'h-sub', document.body);
    this.letterbox = el('div', 'h-letterbox', document.body, '<div></div><div></div>');
    this.fade = el('div', 'h-fade', document.body);
    this.caption = el('div', 'h-caption', document.body);
    this.doc = el('div', 'h-doc', document.body);
    this.scare = el('div', 'h-scare', document.body);
    this.scareImg = document.createElement('img');
    this.scare.appendChild(this.scareImg);
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.className = 'h-map';
    // 点一下地图本身也能关闭
    this.mapCanvas.addEventListener('pointerdown', (e) => { e.preventDefault(); this.mapTap = true; });
    document.body.appendChild(this.mapCanvas);
    this.oxyEl = el('div', 'h-oxy', r, '<span>氧气</span><div><i></i></div>');

    // 状态栏：电脑版为 Doom 式底栏；手机版为顶部精简信息
    this.bar = el('div', 'h-bar', r);
    this.ammoEl = el('div', 'b-ammo', this.bar);
    this.hpEl = el('div', 'b-hp', this.bar);
    this.armsEl = el('div', 'b-arms', this.bar);
    const faceBox = el('div', 'b-face', this.bar);
    this.face = document.createElement('img');
    faceBox.appendChild(this.face);
    this.armorEl = el('div', 'b-armor', this.bar);
    this.keysEl = el('div', 'b-keys', this.bar);
    this.tableEl = el('div', 'b-table', this.bar);
    this.abilEl = el('div', 'h-abil', r);
    this.staminaEl = el('div', 'h-stamina', r, '<i></i>');

    this.doc.addEventListener('click', () => this.closeDocument());
    window.addEventListener('keydown', (e) => {
      if (this.docResolve && ['KeyE', 'Space', 'Enter', 'Escape'].includes(e.code)) {
        e.stopPropagation();
        this.closeDocument();
      }
    }, true);
    // 预载头像
    for (const p of PORTRAITS) new Image().src = portraitUrl(p);
  }

  show(v: boolean) {
    this.root.style.display = v ? 'block' : 'none';
  }

  // 换章时清掉残留的提示、字幕和消息
  reset() {
    this.hint.classList.remove('on');
    this.msg.classList.remove('on');
    this.subtitle.classList.remove('on');
    this.hintT = this.msgT = 0;
    this.setPrompt(null);
    this.setCaption('');
    this.setLetterbox(false);
    this.setScan(false);
  }

  setFace(id: string) {
    this.face.src = portraitUrl(id);
  }

  set(s: HudState) {
    const hp = Math.max(0, Math.round(s.hp));
    this.hpEl.innerHTML = `<b>${hp}%</b><small>生命</small>`;
    this.hpEl.classList.toggle('low', hp < 30);
    this.armorEl.innerHTML = `<b>${Math.round(s.armor)}%</b><small>护甲</small>`;
    this.ammoEl.innerHTML = s.reloading ? '<b class="dim">··</b><small>换弹中</small>' : `<b>${s.ammo}</b><small>${s.ammoName}</small>`;
    this.armsEl.innerHTML = `<small>武器</small><div>${s.weapons.map((w) => `<span class="${w.owned ? 'own' : ''} ${w.active ? 'act' : ''}">${w.slot}</span>`).join('')}</div>`;
    this.keysEl.innerHTML = ['red', 'blue', 'yellow'].map((k) => `<i class="k-${k} ${s.keys.includes(k) ? 'has' : ''}"></i>`).join('') + `<span class="herb">草药×${s.herbs}</span>`;
    const rn = s.reserveNames ?? ['手枪弹', '机枪弹', '冷凝弹'];
    this.tableEl.innerHTML = `<div>${rn[0]} <b>${s.reserve.ammo}</b></div><div>${rn[1]} <b>${s.reserve.mg_ammo}</b></div>` + (rn[2] ? `<div>${rn[2]} <b>${s.reserve.cryo_ammo}</b></div>` : '<div>赤霄 <b>∞</b></div>');
    if (!IS_MOBILE) {
      this.abilEl.innerHTML = s.abilities.filter((a) => a.on).map((a) =>
        `<div class="ab ${a.cd > 0 ? 'cd' : ''}"><b>${a.key}</b>${a.name}${a.cd > 0 ? `<i>${Math.ceil(a.cd)}</i>` : ''}<s style="width:${a.cd > 0 ? (1 - a.cd / a.max) * 100 : 100}%"></s></div>`).join('');
    }
    (this.staminaEl.firstChild as HTMLElement).style.width = `${s.stamina * 100}%`;
    this.staminaEl.style.opacity = s.stamina < 0.98 ? '1' : '0';
    this.oxyEl.style.display = s.oxygen === null ? 'none' : 'flex';
    if (s.oxygen !== null) (this.oxyEl.querySelector('i') as HTMLElement).style.width = `${s.oxygen}%`;
    // 头像随伤势变红
    const k = 1 - hp / 100;
    this.face.style.filter = `sepia(${k * 0.6}) saturate(${1 + k * 2}) hue-rotate(${-k * 25}deg) brightness(${1 - k * 0.3})`;
  }

  setObjective(text: string) {
    this.objective.innerHTML = text ? `<span class="tag">目标</span>${text}` : '';
    this.objective.classList.remove('flash');
    void this.objective.offsetWidth;
    this.objective.classList.add('flash');
  }

  say(speaker: string, text: string) {
    if (!text) { this.subtitle.classList.remove('on'); return; }
    const base = speaker.replace(/[（(].*$/, '');
    const sp = SPEAKERS[base];
    const pic = sp?.p ? `<img src="${portraitUrl(sp.p)}">` : base ? `<div class="noface">${base.slice(0, 1)}</div>` : '';
    this.subtitle.innerHTML = `${pic}<div class="txt">${speaker ? `<span style="color:${sp?.c ?? '#ddd'}">${speaker}</span>` : ''}<p>${text}</p></div>`;
    this.subtitle.classList.toggle('narr', !speaker);
    this.subtitle.classList.add('on');
  }

  setPrompt(t: string | null) {
    this.prompt.textContent = t ?? '';
    this.prompt.style.opacity = t ? '1' : '0';
  }

  showHint(html: string, sec = 5) {
    this.hint.innerHTML = html;
    this.hint.classList.add('on');
    this.hintT = sec;
  }

  message(text: string, sec = 2.5) {
    this.msg.textContent = text;
    this.msg.classList.add('on');
    this.msgT = sec;
  }

  hit(kill: boolean, weak: boolean) {
    this.hitmarker.className = `h-hit ${kill ? 'kill' : weak ? 'weak' : ''}`;
    this.hitmarker.style.opacity = '1';
    this.hitT = 0.15;
  }

  damage(fromSide = 0) {
    this.dmgK = 1;
    this.faceT = 0.4;
    this.faceLook = fromSide;
  }

  setCrosshair(spread: number, visible: boolean) {
    this.crosshair.style.setProperty('--s', `${6 + spread * 26}px`);
    this.crosshair.style.opacity = visible ? '1' : '0';
  }

  setLetterbox(v: boolean) {
    this.letterbox.classList.toggle('on', v);
    document.body.classList.toggle('cutscene', v);
  }

  setFade(a: number, ms = 1200) {
    this.fade.style.transition = `opacity ${ms}ms`;
    this.fade.style.opacity = String(a);
  }

  setCaption(html: string) {
    this.caption.innerHTML = html;
    this.caption.classList.toggle('on', !!html);
  }

  setScan(v: boolean) { this.scanTint.classList.toggle('on', v); }
  setFrost(k: number) { this.frost.style.opacity = String(k); }
  setWater(v: boolean) { this.water.classList.toggle('on', v); }
  whiteFlash() {
    this.flashW.style.transition = 'none';
    this.flashW.style.opacity = '0.85';
    requestAnimationFrame(() => { this.flashW.style.transition = 'opacity 0.6s'; this.flashW.style.opacity = '0'; });
  }

  setBoss(name: string | null, k = 1) {
    this.boss.style.display = name ? 'block' : 'none';
    if (name) {
      (this.boss.querySelector('span') as HTMLElement).textContent = name;
      this.bossFill.style.width = `${Math.max(0, k) * 100}%`;
    }
  }

  // 跳脸惊吓：立绘猛扑到镜头前
  jumpscare(spriteName: string) {
    this.scareImg.src = artUrl(`sprites/${spriteName}.webp`);
    this.scare.classList.remove('go');
    void this.scare.offsetWidth;
    this.scare.classList.add('go');
    this.scareT = 0.9;
  }

  get scaring() {
    return this.scareT > 0;
  }

  showDocument(title: string, body: string): Promise<void> {
    this.doc.innerHTML = `<div class="paper"><h3>${title}</h3>${body}<p class="close">${IS_MOBILE ? '（点击关闭）' : '（点击或按 E 关闭）'}</p></div>`;
    this.doc.classList.add('on');
    const p = new Promise<void>((res) => (this.docResolve = res));
    this.onDocOpen?.();
    return p;
  }

  private closeDocument() {
    if (!this.docResolve) return;
    this.doc.classList.remove('on');
    const r = this.docResolve;
    this.docResolve = null;
    this.onDocClose?.();
    r();
  }

  get documentOpen() {
    return !!this.docResolve;
  }

  resetExplored() {
    this.explored = new Uint8Array(ROWS * COLS);
  }

  private mapTap = false;
  mapTapped() {
    const t = this.mapTap;
    this.mapTap = false;
    return t;
  }

  markExplored(px: number, pz: number) {
    const c0 = Math.floor(px / CELL), r0 = Math.floor(pz / CELL);
    for (let r = r0 - 3; r <= r0 + 3; r++) for (let c = c0 - 3; c <= c0 + 3; c++) {
      if (r >= 0 && c >= 0 && r < ROWS && c < COLS) this.explored[r * COLS + c] = 1;
    }
  }

  // 自动地图（Tab / 地图按钮）
  drawMap(show: boolean, px: number, pz: number, yaw: number, exits: { x: number; z: number }[]) {
    this.mapCanvas.style.display = show ? 'block' : 'none';
    if (!show) return;
    const cv = this.mapCanvas;
    const W = (cv.width = Math.min(window.innerWidth * 0.9, 900));
    const H = (cv.height = Math.min(window.innerHeight * 0.8, 640));
    const g = cv.getContext('2d')!;
    const s = Math.min(W / COLS, H / ROWS);
    const ox = (W - COLS * s) / 2, oy = (H - ROWS * s) / 2;
    g.fillStyle = 'rgba(0,0,0,0.82)';
    g.fillRect(0, 0, W, H);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!this.explored[r * COLS + c]) continue;
      const ch = MAP[r][c];
      const x = ox + c * s, y = oy + r * s;
      if (isWallChar(ch)) {
        let edge = false;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!isWallChar(charAt(c + dc, r + dr))) edge = true;
        if (edge) { g.fillStyle = '#b8322a'; g.fillRect(x, y, s, s); }
      } else if (isDoorChar(ch)) {
        g.fillStyle = isDoorOpen(ch) ? '#2a6' : '#e8c040'; g.fillRect(x, y, s, s);
      } else if (ch === 'X') {
        g.fillStyle = '#3f8'; g.fillRect(x, y, s, s);
      } else {
        g.fillStyle = '#2a2a2a'; g.fillRect(x + 0.5, y + 0.5, s - 1, s - 1);
      }
    }
    for (const e of exits) { g.fillStyle = '#3f8'; g.beginPath(); g.arc(ox + (e.x / CELL) * s, oy + (e.z / CELL) * s, s * 0.5, 0, 7); g.fill(); }
    const x = ox + (px / CELL) * s, y = oy + (pz / CELL) * s;
    g.save();
    g.translate(x, y);
    g.rotate(-yaw);
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(0, -s * 0.9); g.lineTo(s * 0.5, s * 0.5); g.lineTo(-s * 0.5, s * 0.5); g.fill();
    g.restore();
    g.fillStyle = '#ddd';
    g.font = '14px sans-serif';
    g.fillText(IS_MOBILE ? '点地图或「地图」按钮关闭 · 推摇杆也会关闭' : 'Tab / Esc / 鼠标左键 / 移动 都可关闭地图', 12, H - 12);
  }

  update(dt: number, hp: number) {
    if (this.hitT > 0) { this.hitT -= dt; if (this.hitT <= 0) this.hitmarker.style.opacity = '0'; }
    this.dmgK = Math.max(0, this.dmgK - dt * 1.4);
    const low = hp < 35 ? (35 - hp) / 35 : 0;
    this.vignette.style.opacity = String(Math.min(1, this.dmgK * 0.85 + low * (0.55 + Math.sin(performance.now() * 0.006) * 0.15)));
    if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) this.hint.classList.remove('on'); }
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) this.msg.classList.remove('on'); }
    this.scareT = Math.max(0, this.scareT - dt);
    // 头像：受伤时抖动并看向伤害方向，平时偶尔左右张望
    this.faceT = Math.max(0, this.faceT - dt);
    if (this.faceT <= 0 && Math.random() < dt * 0.5) this.faceLook = (Math.random() - 0.5) * 2;
    const sh = this.faceT > 0 ? (Math.random() - 0.5) * 6 : 0;
    this.face.style.transform = `translate(${this.faceLook * 3 + sh}px, ${sh * 0.5}px) scale(1.08)`;
  }
}
