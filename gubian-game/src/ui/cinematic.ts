import { IS_MOBILE } from '../platform';
import { artUrl, portraitUrl } from '../core/assets';
import { audio } from '../core/audio';

export type Line = [string, string, number?];

export interface Shot {
  img?: string; // 'f02' 视频帧 / 's3_0' 场景插画 / 'tex:m_ch3' 壁画 / 'team' 'cast'
  video?: string; // 'opening'
  from?: number; // 视频起止秒
  to?: number;
  kb?: 'in' | 'out' | 'left' | 'right' | 'up';
  dur?: number;
  lines?: Line[];
  chars?: { id: string; side: 'left' | 'right' | 'center' }[];
  caption?: string;
  title?: [string, string];
  sfx?: 'bell' | 'impact' | 'scream' | 'radio' | 'explosion' | 'stinger' | 'whisper' | 'gunshot' | 'roar';
  shake?: boolean;
  scare?: string;
  tint?: string;
  dark?: boolean;
}

const SPEAKER_PORTRAIT: Record<string, string> = {
  林骁: 'lin', 苏晚: 'su', 陈砚: 'chen', 老周: 'zhou', 小满: 'man', 阿婆: 'apo', 许怀远: 'xu', 钟曼: 'zhong', 唐武男: 'tang',
};

function imgUrl(id: string) {
  if (id.startsWith('tex:')) return artUrl(`tex/${id.slice(4)}.webp`);
  return artUrl(`cine/${id}.jpg`);
}

// 过场动画播放器（DOM 叠层，独立于游戏循环）
export class Cinematic {
  private root = document.getElementById('cine')!;
  private stage: HTMLDivElement;
  private sub: HTMLDivElement;
  private skipBtn: HTMLButtonElement;
  private advance: (() => void) | null = null;
  private skipped = false;
  playing = false;

  constructor() {
    this.root.innerHTML = `<div class="c-stage"></div><div class="c-bars"><i></i><i></i></div><div class="c-sub"></div>
      <button class="c-skip">${IS_MOBILE ? '跳过 ▶▶' : '跳过（Esc）'}</button><div class="c-tip">${IS_MOBILE ? '点击屏幕继续' : '点击 / 空格 继续'}</div>`;
    this.stage = this.root.querySelector('.c-stage')!;
    this.sub = this.root.querySelector('.c-sub')!;
    this.skipBtn = this.root.querySelector('.c-skip')!;
    this.skipBtn.addEventListener('click', (e) => { e.stopPropagation(); this.skip(); });
    this.root.addEventListener('click', () => this.advance?.());
    window.addEventListener('keydown', (e) => {
      if (!this.playing) return;
      if (e.code === 'Escape') this.skip();
      else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') this.advance?.();
    });
  }

  private skip() {
    this.skipped = true;
    this.advance?.();
  }

  private wait(ms: number) {
    return new Promise<void>((res) => {
      const t = setTimeout(() => { this.advance = null; res(); }, ms);
      this.advance = () => { clearTimeout(t); this.advance = null; res(); };
    });
  }

  private say(who: string, text: string) {
    if (!text) { this.sub.classList.remove('on'); return; }
    const base = who.replace(/[（(].*$/, '');
    const p = SPEAKER_PORTRAIT[base];
    this.sub.innerHTML = `${p ? `<img src="${portraitUrl(p)}">` : ''}<div>${who ? `<b>${who}</b>` : ''}<p>${text}</p></div>`;
    this.sub.classList.toggle('narr', !who);
    this.sub.classList.add('on');
  }

  async play(shots: Shot[]) {
    this.playing = true;
    this.skipped = false;
    this.root.classList.add('on');
    for (const s of shots) {
      if (this.skipped) break;
      await this.shot(s);
    }
    this.sub.classList.remove('on');
    this.stage.innerHTML = '';
    this.root.classList.remove('on');
    this.playing = false;
  }

  private async shot(s: Shot) {
    this.stage.innerHTML = '';
    this.sub.classList.remove('on');
    const layer = document.createElement('div');
    layer.className = 'c-layer';
    this.stage.appendChild(layer);
    let video: HTMLVideoElement | null = null;
    const lines = s.lines ?? [];
    const lineTime = lines.reduce((a, l) => a + (l[2] ?? 1.6 + l[1].length * 0.13), 0);
    const dur = Math.max(s.dur ?? 3.5, lineTime + 0.6);

    if (s.video) {
      video = document.createElement('video');
      video.src = artUrl(`cine/${s.video}.mp4`);
      video.muted = false;
      video.playsInline = true;
      video.className = 'c-video';
      layer.appendChild(video);
      try {
        video.currentTime = s.from ?? 0;
        await video.play();
      } catch {
        video.muted = true;
        try { await video.play(); } catch { /* 无法播放时跳过视频 */ }
      }
    } else if (s.img) {
      const im = document.createElement('div');
      im.className = 'c-img';
      im.style.backgroundImage = `url(${imgUrl(s.img)})`;
      const kb = s.kb ?? 'in';
      const from = { in: 'scale(1.02)', out: 'scale(1.18)', left: 'scale(1.15) translateX(4%)', right: 'scale(1.15) translateX(-4%)', up: 'scale(1.15) translateY(4%)' }[kb];
      const to = { in: 'scale(1.16)', out: 'scale(1.02)', left: 'scale(1.15) translateX(-4%)', right: 'scale(1.15) translateX(4%)', up: 'scale(1.15) translateY(-4%)' }[kb];
      im.animate([{ transform: from }, { transform: to }], { duration: dur * 1000 + 600, easing: 'ease-in-out', fill: 'forwards' });
      im.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'forwards' });
      if (s.dark) im.style.filter = 'brightness(0.55) saturate(0.8)';
      layer.appendChild(im);
    } else {
      layer.style.background = '#000';
    }
    if (s.tint) {
      const t = document.createElement('div');
      t.className = 'c-tint';
      t.style.background = s.tint;
      layer.appendChild(t);
    }
    for (const [i, c] of (s.chars ?? []).entries()) {
      const ch = document.createElement('img');
      ch.className = `c-char ${c.side}`;
      ch.src = artUrl(`sprites/${c.id}.webp`);
      ch.style.animationDelay = `${0.2 + i * 0.25}s`;
      layer.appendChild(ch);
    }
    if (s.title) {
      const t = document.createElement('div');
      t.className = 'c-title';
      t.innerHTML = `<small>${s.title[0]}</small><h2>${s.title[1]}</h2>`;
      layer.appendChild(t);
    }
    if (s.caption) {
      const c = document.createElement('div');
      c.className = 'c-caption';
      c.innerHTML = s.caption;
      layer.appendChild(c);
    }
    if (s.shake) this.stage.animate(
      [{ transform: 'translate(0,0)' }, { transform: 'translate(-10px,6px)' }, { transform: 'translate(8px,-6px)' }, { transform: 'translate(-4px,3px)' }, { transform: 'translate(0,0)' }],
      { duration: 500, iterations: 2 },
    );
    if (s.sfx) {
      const f = s.sfx;
      if (f === 'bell') audio.bellRing();
      else if (f === 'impact') audio.impact();
      else if (f === 'scream') audio.scream();
      else if (f === 'radio') audio.radio();
      else if (f === 'explosion') audio.explosion();
      else if (f === 'stinger') audio.stinger();
      else if (f === 'whisper') audio.whisper();
      else if (f === 'gunshot') audio.gunshot();
      else if (f === 'roar') audio.roar({ x: 0, y: 0, z: 0 });
    }
    if (s.scare) {
      const sc = document.createElement('img');
      sc.className = 'c-scare';
      sc.src = artUrl(`sprites/${s.scare}.webp`);
      layer.appendChild(sc);
      audio.scream();
    }

    if (video) {
      // 视频：按字幕时间轴推进，直到片段结束
      const end = s.to ?? 999;
      let li = 0;
      await new Promise<void>((res) => {
        const tick = () => {
          if (this.skipped || !video || video.ended || video.currentTime >= end || video.error) { res(); return; }
          const t = video.currentTime - (s.from ?? 0);
          let acc = 0;
          for (let i = 0; i < lines.length; i++) {
            const d = lines[i][2] ?? 2.5;
            if (t >= acc && t < acc + d && li !== i + 1) { li = i + 1; this.say(lines[i][0], lines[i][1]); }
            acc += d;
          }
          if (t > acc && lines.length) this.sub.classList.remove('on');
          requestAnimationFrame(tick);
        };
        this.advance = () => this.skip();
        tick();
      });
      this.advance = null;
      video.pause();
      return;
    }

    if (!lines.length) {
      await this.wait(dur * 1000);
      return;
    }
    await this.wait(400);
    for (const [who, text, d] of lines) {
      if (this.skipped) return;
      this.say(who, text);
      await this.wait((d ?? 1.6 + text.length * 0.13) * 1000);
    }
  }
}
