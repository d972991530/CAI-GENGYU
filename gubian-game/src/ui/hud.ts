// 抬头显示与剧情 UI（DOM 叠层）
const SPEAKER_COLORS: Record<string, string> = {
  林骁: '#9fc6ff',
  苏晚: '#ffb3c4',
  陈砚: '#9dffb8',
  老周: '#ffd27a',
  小满: '#ffe08a',
  广播: '#ff6a5a',
  系统: '#cccccc',
};

const $ = <T extends HTMLElement = HTMLDivElement>(sel: string) => document.querySelector<T>(sel)!;

export class Hud {
  root = $('#hud');
  private hp = $('#hp-fill');
  private hpText = $('#hp-text');
  private ammo = $('#ammo');
  private herbs = $('#herbs');
  private objective = $('#objective');
  private subtitle = $('#subtitle');
  private prompt = $('#prompt');
  private crosshair = $('#crosshair');
  private hitmarker = $('#hitmarker');
  private vignette = $('#vignette');
  private letterbox = $('#letterbox');
  private fade = $('#fade');
  private caption = $('#caption');
  private hint = $('#hint');
  private scanTint = $('#scan-tint');
  private frost = $('#frost');
  private bossBar = $('#boss');
  private bossFill = $('#boss-fill');
  private doc = $('#document');
  private abilities = $('#abilities');
  private hitT = 0;
  private dmgK = 0;
  private hintT = 0;
  private docResolve: (() => void) | null = null;
  onDocOpen: (() => void) | null = null;
  onDocClose: (() => void) | null = null;

  constructor() {
    this.doc.addEventListener('click', () => this.closeDocument());
    window.addEventListener('keydown', (e) => {
      if (this.docResolve && (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
        e.stopPropagation();
        this.closeDocument();
      }
    }, true);
  }

  show(v: boolean) {
    this.root.style.display = v ? 'block' : 'none';
  }

  setHealth(hp: number) {
    const k = Math.max(0, hp) / 100;
    this.hp.style.width = `${k * 100}%`;
    this.hp.style.background = k > 0.6 ? '#5fbf6a' : k > 0.3 ? '#d8a23a' : '#c8322a';
    this.hpText.textContent = k > 0.6 ? '良好' : k > 0.3 ? '注意' : '危险';
  }

  setAmmo(mag: number, reserve: number, reloading: boolean) {
    this.ammo.innerHTML = reloading ? '<span class="dim">换弹中…</span>' : `<b>${mag}</b><span class="dim"> / ${reserve}</span>`;
    this.ammo.classList.toggle('low', mag <= 3);
  }

  setHerbs(n: number) {
    this.herbs.textContent = `草药 ×${n}`;
  }

  setAbilities(list: { key: string; name: string; cd: number; unlocked: boolean }[], touch: boolean) {
    this.abilities.innerHTML = list
      .filter((a) => a.unlocked)
      .map((a) => `<div class="ab${a.cd > 0 ? ' cd' : ''}"><span class="k">${touch ? '' : a.key}</span>${a.name}${a.cd > 0 ? ` <i>${Math.ceil(a.cd)}s</i>` : ''}</div>`)
      .join('');
  }

  setObjective(text: string) {
    this.objective.innerHTML = text ? `<span class="tag">目标</span>${text}` : '';
    this.objective.classList.remove('flash');
    void this.objective.offsetWidth;
    this.objective.classList.add('flash');
  }

  say(speaker: string, text: string) {
    if (!text) {
      this.subtitle.classList.remove('on');
      return;
    }
    const color = SPEAKER_COLORS[speaker.replace(/[（(].*$/, '')] ?? '#ddd';
    this.subtitle.innerHTML = speaker ? `<span style="color:${color}">${speaker}</span>：${text}` : text;
    this.subtitle.classList.add('on');
  }

  setPrompt(text: string | null) {
    this.prompt.textContent = text ?? '';
    this.prompt.style.opacity = text ? '1' : '0';
  }

  showHint(text: string, sec = 5) {
    this.hint.innerHTML = text;
    this.hint.classList.add('on');
    this.hintT = sec;
  }

  hit(kill: boolean, weak: boolean) {
    this.hitmarker.className = kill ? 'kill' : weak ? 'weak' : '';
    this.hitmarker.style.opacity = '1';
    this.hitT = 0.18;
  }

  damage() {
    this.dmgK = 1;
  }

  setCrosshair(spread: number, visible: boolean) {
    this.crosshair.style.setProperty('--s', `${8 + spread * 22}px`);
    this.crosshair.style.opacity = visible ? '1' : '0';
  }

  setLetterbox(v: boolean) {
    this.letterbox.classList.toggle('on', v);
  }

  setFade(alpha: number, ms = 1200) {
    this.fade.style.transition = `opacity ${ms}ms`;
    this.fade.style.opacity = String(alpha);
  }

  setCaption(html: string) {
    this.caption.innerHTML = html;
    this.caption.classList.toggle('on', !!html);
  }

  setScan(v: boolean) {
    this.scanTint.classList.toggle('on', v);
  }

  setFrost(k: number) {
    this.frost.style.opacity = String(k);
  }

  setBoss(name: string | null, k = 1) {
    this.bossBar.style.display = name ? 'block' : 'none';
    if (name) {
      this.bossBar.querySelector('span')!.textContent = name;
      this.bossFill.style.width = `${Math.max(0, k) * 100}%`;
    }
  }

  showDocument(title: string, body: string): Promise<void> {
    this.doc.innerHTML = `<div class="paper"><h3>${title}</h3>${body}<p class="close">（点击或按 E 关闭）</p></div>`;
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

  update(dt: number, hp: number) {
    if (this.hitT > 0) {
      this.hitT -= dt;
      if (this.hitT <= 0) this.hitmarker.style.opacity = '0';
    }
    this.dmgK = Math.max(0, this.dmgK - dt * 1.5);
    const low = hp < 35 ? (35 - hp) / 35 : 0;
    this.vignette.style.opacity = String(Math.min(1, this.dmgK * 0.8 + low * 0.7));
    if (this.hintT > 0) {
      this.hintT -= dt;
      if (this.hintT <= 0) this.hint.classList.remove('on');
    }
  }
}
