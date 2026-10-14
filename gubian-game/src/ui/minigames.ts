import { IS_MOBILE } from '../platform';
import { audio } from '../core/audio';

// 小游戏叠层：黑客连线、三长两短节奏、傩面顺序、QTE 连打、剧情选择
// 电脑版用键鼠，手机版用触控；两端都可直接点击
const auto = () => (window as unknown as { __autoMG?: boolean }).__autoMG === true;

export class Minigames {
  private root = document.getElementById('mg')!;
  active = false;
  easy = false;
  onOpen: (() => void) | null = null;
  onClose: (() => void) | null = null;

  private open(html: string) {
    this.root.innerHTML = `<div class="mg-box">${html}</div>`;
    this.root.classList.add('on');
    this.active = true;
    this.onOpen?.();
    return this.root.querySelector<HTMLDivElement>('.mg-box')!;
  }

  private close() {
    this.root.classList.remove('on');
    this.root.innerHTML = '';
    this.active = false;
    this.onClose?.();
  }

  // 选择
  choice(title: string, options: string[]): Promise<number> {
    const box = this.open(`<h3>${title}</h3>${options.map((o, i) => `<button class="mg-opt" data-i="${i}">${o}</button>`).join('')}`);
    if (auto()) { this.close(); return Promise.resolve(1); }
    return new Promise((res) => {
      box.querySelectorAll<HTMLButtonElement>('.mg-opt').forEach((b) => b.addEventListener('click', () => {
        audio.pickup();
        this.close();
        res(Number(b.dataset.i));
      }));
    });
  }

  // 黑客：限时连线配对
  hack(title: string, pairs = 4, time = 30): Promise<boolean> {
    const syms = ['◆', '●', '▲', '■', '★', '✚', '◐', '☰'].slice(0, pairs);
    const cells = [...syms, ...syms].sort(() => Math.random() - 0.5);
    const box = this.open(`<h3>${title}</h3><p class="mg-tip">依次点击两个相同的节点完成连线</p>
      <div class="mg-grid">${cells.map((s, i) => `<button class="mg-node" data-i="${i}">${s}</button>`).join('')}</div>
      <div class="mg-timer"><i></i></div>`);
    if (auto()) { this.close(); return Promise.resolve(true); }
    return new Promise((res) => {
      let first: HTMLButtonElement | null = null;
      let done = 0;
      const t0 = performance.now();
      const bar = box.querySelector<HTMLElement>('.mg-timer i')!;
      const limit = time * (this.easy ? 1.6 : 1) * 1000;
      const iv = setInterval(() => {
        const k = 1 - (performance.now() - t0) / limit;
        bar.style.width = `${Math.max(0, k) * 100}%`;
        if (k <= 0) { clearInterval(iv); this.close(); audio.dryFire(); res(false); }
      }, 50);
      box.querySelectorAll<HTMLButtonElement>('.mg-node').forEach((b) => b.addEventListener('click', () => {
        if (b.classList.contains('ok') || b === first) return;
        audio.scan();
        if (!first) { first = b; b.classList.add('sel'); return; }
        if (first.textContent === b.textContent) {
          first.classList.add('ok'); b.classList.add('ok');
          first.classList.remove('sel');
          done++;
          if (done === pairs) { clearInterval(iv); setTimeout(() => { this.close(); res(true); }, 300); }
        } else {
          first.classList.remove('sel');
          b.classList.add('bad');
          setTimeout(() => b.classList.remove('bad'), 300);
        }
        first = null;
      }));
    });
  }

  // 节奏：L=长 S=短（三长两短）
  rhythm(title: string, pattern: ('L' | 'S')[]): Promise<boolean> {
    const box = this.open(`<h3>${title}</h3>
      <p class="mg-tip">${IS_MOBILE ? '按住/轻点下方按钮' : '按住 / 轻按 空格（或鼠标左键）'}：<b>长</b>＝按住到条满，<b>短</b>＝轻点</p>
      <div class="mg-beats">${pattern.map((p) => `<span class="${p}">${p === 'L' ? '长' : '短'}</span>`).join('')}</div>
      <div class="mg-hold"><i></i></div>
      <button class="mg-press">${IS_MOBILE ? '敲 击' : '敲击（空格）'}</button>`);
    if (auto()) { this.close(); return Promise.resolve(true); }
    return new Promise((res) => {
      let idx = 0, down = 0, holding = false, raf = 0;
      const beats = [...box.querySelectorAll<HTMLElement>('.mg-beats span')];
      const fill = box.querySelector<HTMLElement>('.mg-hold i')!;
      const longT = this.easy ? 0.45 : 0.6;
      const shortMax = this.easy ? 0.45 : 0.32;
      beats[0].classList.add('cur');
      const start = () => { if (!holding) { holding = true; down = performance.now(); audio.bell(undefined, 0.3); } };
      const end = () => {
        if (!holding) return;
        holding = false;
        const d = (performance.now() - down) / 1000;
        const want = pattern[idx];
        const ok = want === 'L' ? d >= longT : d <= shortMax;
        if (ok) {
          beats[idx].classList.add('ok');
          beats[idx].classList.remove('cur');
          audio.bell(undefined, want === 'L' ? 0.7 : 0.45);
          idx++;
          if (idx >= pattern.length) { cleanup(); setTimeout(() => { this.close(); res(true); }, 500); return; }
          beats[idx].classList.add('cur');
        } else {
          audio.dryFire();
          beats.forEach((b) => b.classList.remove('ok', 'cur'));
          idx = 0;
          beats[0].classList.add('cur');
          box.classList.add('shake');
          setTimeout(() => box.classList.remove('shake'), 300);
        }
      };
      const loop = () => {
        fill.style.width = holding ? `${Math.min(1, (performance.now() - down) / 1000 / longT) * 100}%` : '0%';
        raf = requestAnimationFrame(loop);
      };
      loop();
      const btn = box.querySelector<HTMLButtonElement>('.mg-press')!;
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); start(); });
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointerleave', end);
      const kd = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); start(); } };
      const ku = (e: KeyboardEvent) => { if (e.code === 'Space') end(); };
      window.addEventListener('keydown', kd);
      window.addEventListener('keyup', ku);
      const cleanup = () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    });
  }

  // 傩面机关：按顺序点击面具
  masks(title: string, all: string[], order: string[], hint: string): Promise<boolean> {
    const box = this.open(`<h3>${title}</h3><p class="mg-tip">${hint}</p>
      <div class="mg-masks">${all.map((m) => `<button class="mg-mask" data-m="${m}"><i></i>${m}</button>`).join('')}</div><div class="mg-seq"></div>`);
    if (auto()) { this.close(); return Promise.resolve(true); }
    return new Promise((res) => {
      let i = 0;
      const seq = box.querySelector<HTMLElement>('.mg-seq')!;
      box.querySelectorAll<HTMLButtonElement>('.mg-mask').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.m === order[i]) {
          b.classList.add('ok');
          audio.bell(undefined, 0.4);
          i++;
          seq.textContent = order.slice(0, i).join(' → ');
          if (i === order.length) setTimeout(() => { this.close(); res(true); }, 600);
        } else {
          audio.stinger();
          box.querySelectorAll('.mg-mask').forEach((x) => x.classList.remove('ok'));
          i = 0;
          seq.textContent = '顺序错误，机关复位……';
        }
      }));
    });
  }

  // QTE 连打
  mash(title: string, need = 10, time = 3.5): Promise<boolean> {
    const box = this.open(`<h3 class="red">${title}</h3><div class="mg-timer"><i></i></div><div class="mg-meter"><i></i></div>
      <button class="mg-press big">${IS_MOBILE ? '连 点！' : '连按 空格 / 鼠标'}</button>`);
    if (auto()) { this.close(); return Promise.resolve(true); }
    const n = this.easy ? Math.ceil(need * 0.6) : need;
    return new Promise((res) => {
      let c = 0;
      const t0 = performance.now();
      const bar = box.querySelector<HTMLElement>('.mg-timer i')!;
      const meter = box.querySelector<HTMLElement>('.mg-meter i')!;
      const hit = () => {
        c++;
        meter.style.width = `${Math.min(1, c / n) * 100}%`;
        audio.hitFlesh();
        if (c >= n) finish(true);
      };
      const kd = (e: KeyboardEvent) => { if ((e.code === 'Space' || e.code === 'KeyE') && !e.repeat) { e.preventDefault(); hit(); } };
      window.addEventListener('keydown', kd);
      box.querySelector('.mg-press')!.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(); });
      const iv = setInterval(() => {
        const k = 1 - (performance.now() - t0) / (time * 1000);
        bar.style.width = `${Math.max(0, k) * 100}%`;
        if (k <= 0) finish(false);
      }, 40);
      let doneF = false;
      const finish = (ok: boolean) => {
        if (doneF) return;
        doneF = true;
        clearInterval(iv);
        window.removeEventListener('keydown', kd);
        this.close();
        res(ok);
      };
    });
  }
}
