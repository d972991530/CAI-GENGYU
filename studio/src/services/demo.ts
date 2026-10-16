// 演示模式：完全离线运行的本地「模型」，便于在没有 API Key 时体验完整流程。
import { pcmToWav } from './audio';
import type { AIProvider, DraftAssets, DraftShot, DraftStory, RefImage, StoryBrief } from './ai';
import type { Aspect } from '../types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const SCENE_RE = /^\s*(\d+-\d+)\s+(日|夜|晨|黄昏)\s+(内|外)\s+(.+)$/;
const LINE_RE = /^\s*([^\s：:（(]{1,8})\s*[：:]\s*(?:[（(]([^）)]*)[）)])?\s*(.+)$/;

function storyFromIdea(idea: string, b: StoryBrief): DraftStory {
  const core = idea.trim().slice(0, 18) || '无名之夜';
  const title = ['逆光而行', '她的反击', '暗夜回响', '重返巅峰', '无声对决'][hash(idea) % 5];
  const hero = '林夏', rival = '顾言', mentor = '老周';
  const places = ['公司会议室', '雨夜街头', '天台', '老旧公寓'];
  const episodes = Array.from({ length: b.episodes }, (_, i) => {
    const n = i + 1;
    const [p1, p2] = [places[i % places.length], places[(i + 1) % places.length]];
    return {
      title: `第${n}集 · ${['逆风', '暗涌', '交锋', '反转', '破局', '余烬'][i % 6]}`,
      summary: `${hero}在${p1}遭遇${rival}的步步紧逼，${n === b.episodes ? '最终揭开真相' : '却意外发现新的线索'}。`,
      script: [
        `${n}-1 日 内 ${p1}`,
        `${hero}推门而入，所有人的目光同时落在她身上。`,
        `${rival}：（冷笑）你还敢回来？`,
        `${hero}：（平静）我回来，是来拿回属于我的东西。`,
        `${mentor}放下茶杯，若有所思地看着两人。`,
        `${mentor}：${core}……这件事，没那么简单。`,
        ``,
        `${n}-2 夜 外 ${p2}`,
        `雨水打在${hero}脸上，她攥紧手里的旧照片。`,
        `旁白：那一夜，她终于明白，所有的巧合都是有人精心安排。`,
        `${rival}从阴影中走出，撑着一把黑伞。`,
        `${rival}：想知道真相？明天中午，一个人来。`,
      ].join('\n'),
    };
  });
  return { title: `《${title}》`, logline: `${hero}为夺回被夺走的一切，与${rival}正面交锋，却卷入一场更大的阴谋。`, episodes };
}

function storyFromNovel(novel: string, b: StoryBrief): DraftStory {
  const paras = novel.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const per = Math.max(1, Math.ceil(paras.length / b.episodes));
  const episodes = Array.from({ length: b.episodes }, (_, i) => {
    const chunk = paras.slice(i * per, (i + 1) * per);
    const lines: string[] = [`${i + 1}-1 日 内 主场景`];
    for (const p of chunk) {
      const m = p.match(/^(.{1,6}?)(?:说|道|喊道|问)?[：:]?[“"「](.+?)[”"」]/);
      if (m) lines.push(`${m[1].replace(/[，,]/g, '')}：${m[2]}`);
      else lines.push(p.length > 60 ? p.slice(0, 60) + '……' : p);
    }
    return { title: `第${i + 1}集`, summary: (chunk[0] ?? '').slice(0, 40), script: lines.join('\n') };
  }).filter((e) => e.script.split('\n').length > 1);
  return { title: '《小说改编》', logline: (paras[0] ?? '').slice(0, 50), episodes };
}

function assetsFromScript(script: string): DraftAssets {
  const chars = new Map<string, number>();
  const scenes = new Set<string>();
  for (const line of script.split('\n')) {
    const s = line.match(SCENE_RE);
    if (s) { scenes.add(s[4].trim()); continue; }
    const l = line.match(LINE_RE);
    if (l && l[1] !== '旁白') chars.set(l[1], (chars.get(l[1]) ?? 0) + 1);
  }
  const looks = [
    'young East Asian woman, mid 20s, long straight black hair, sharp determined eyes, slim, wearing a tailored beige trench coat and white shirt',
    'tall East Asian man, around 30, slicked-back black hair, cold handsome face, thin silver glasses, black three-piece suit, silver watch',
    'East Asian man in his 60s, grey short hair, kind wrinkled face, round glasses, dark green cardigan over a checked shirt',
    'teenage girl, short bob haircut with bangs, bright curious eyes, school uniform with navy blazer and red ribbon',
  ];
  return {
    characters: [...chars.entries()].slice(0, 6).map(([name], i) => ({
      name, description: i === 0 ? '主角，外柔内刚' : '关键人物', visual: looks[i % looks.length],
    })),
    scenes: [...scenes].slice(0, 6).map((name) => ({
      name, description: `${name}，故事主要发生地之一`,
      visual: `${name}, detailed environment concept, cinematic lighting, no people`,
    })),
  };
}

function boardFromScript(script: string, a: DraftAssets): DraftShot[] {
  const shots: DraftShot[] = [];
  let scene: string | undefined;
  const names = a.characters.map((c) => c.name);
  for (const raw of script.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const s = line.match(SCENE_RE);
    if (s) {
      scene = a.scenes.find((x) => s[4].includes(x.name))?.name ?? s[4];
      shots.push({ scale: '远景', camera: '推镜', description: `${s[4]}，${s[2]}，建立镜头交代环境`, duration: 3, characters: [], scene });
      continue;
    }
    const l = line.match(LINE_RE);
    if (l) {
      const who = l[1];
      const isVO = who === '旁白';
      shots.push({
        scale: isVO ? '全景' : shots.length % 3 === 0 ? '特写' : '近景',
        camera: isVO ? '移镜' : '固定',
        description: isVO ? '环境空镜，情绪渲染' : `${who}${l[2] ? `（${l[2]}）` : ''}说话，表情细腻`,
        speaker: who, dialogue: l[3],
        duration: Math.min(6, Math.max(2, Math.ceil(l[3].length / 6))),
        characters: isVO ? [] : names.filter((n) => n === who), scene,
      });
      continue;
    }
    shots.push({
      scale: '中景', camera: shots.length % 2 ? '跟拍' : '摇镜', description: line,
      duration: 3, characters: names.filter((n) => line.includes(n)), scene,
    });
  }
  return shots;
}

// ---------- 画面占位渲染 ----------
const SIZE: Record<Aspect, [number, number]> = { '9:16': [576, 1024], '16:9': [1024, 576], '1:1': [768, 768] };

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines = 6) {
  let line = '', lines = 0;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW) {
      ctx.fillText(line, x, y); y += lh; line = ch;
      if (++lines >= maxLines - 1) { ctx.fillText(line + '…', x, y); return; }
    } else line += ch;
  }
  ctx.fillText(line, x, y);
}

async function renderPlaceholder(prompt: string, aspect: Aspect, refs: RefImage[]): Promise<Blob> {
  const [w, h] = SIZE[aspect];
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const hv = hash(prompt);
  const h1 = hv % 360, h2 = (h1 + 40 + (hv >> 8) % 80) % 360;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `hsl(${h1} 45% 22%)`);
  g.addColorStop(1, `hsl(${h2} 55% 12%)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // 远山 / 地平线
  for (let k = 0; k < 3; k++) {
    ctx.fillStyle = `hsla(${h2} 40% ${10 + k * 6}% / .8)`;
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, h * (0.55 + k * 0.12) + Math.sin((x + hv * (k + 1)) / (60 + k * 30)) * 30);
    ctx.lineTo(w, h); ctx.fill();
  }
  // 光斑
  const sun = ctx.createRadialGradient(w * 0.7, h * 0.3, 4, w * 0.7, h * 0.3, w * 0.4);
  sun.addColorStop(0, `hsla(${(h1 + 30) % 360} 90% 70% / .55)`); sun.addColorStop(1, 'transparent');
  ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);
  // 参考图缩略
  let rx = 24;
  for (const r of refs.slice(0, 3)) {
    const img = await createImageBitmap(await (await fetch(`data:${r.mimeType};base64,${r.data}`)).blob());
    const s = Math.min(w, h) * 0.22;
    ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(img, rx, h - s - 24, s, s); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.strokeRect(rx, h - s - 24, s, s);
    rx += s + 12;
  }
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.font = `600 ${Math.round(w / 30)}px "Noto Sans SC", sans-serif`;
  const content = prompt.match(/(?:Scene content|Character design sheet of|Environment concept art of):? (.*)/)?.[1] ?? prompt.split('\n').at(-1)!;
  wrap(ctx, content, 28, h * 0.1, w - 56, w / 22);
  ctx.font = `500 ${Math.round(w / 48)}px monospace`;
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.fillText('DEMO · 演示渲染', 28, h - (refs.length ? Math.min(w, h) * 0.22 + 40 : 24));
  return new Promise((res) => c.toBlob((b) => res(b!), 'image/png'));
}

async function renderKenBurns(prompt: string, aspect: Aspect, first: RefImage | undefined, seconds: number): Promise<Blob> {
  const src = first
    ? await (await fetch(`data:${first.mimeType};base64,${first.data}`)).blob()
    : await renderPlaceholder(prompt, aspect, []);
  const img = await createImageBitmap(src);
  const [w, h] = SIZE[aspect];
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const stream = c.captureStream(30);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((res) => (rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' }))));
  const dir = hash(prompt) % 2 ? 1 : -1;
  rec.start();
  const t0 = performance.now();
  await new Promise<void>((res) => {
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / (seconds * 1000));
      const z = 1.04 + t * 0.12;
      const dx = dir * t * w * 0.04;
      ctx.drawImage(img, (w - w * z) / 2 + dx, (h - h * z) / 2, w * z, h * z);
      if (t < 1) requestAnimationFrame(tick); else res();
    };
    tick();
  });
  rec.stop();
  return done;
}

function tone(text: string): Blob {
  const rate = 24000;
  const secs = Math.min(8, Math.max(1, text.length * 0.2));
  const n = Math.floor(rate * secs);
  const pcm = new Int16Array(n);
  const base = 180 + (hash(text) % 120);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const syll = Math.abs(Math.sin(Math.PI * t * 4.2)); // 模拟音节起伏
    const f = base * (1 + 0.08 * Math.sin(t * 3));
    pcm[i] = Math.sin(2 * Math.PI * f * t) * syll * 2500 * Math.min(1, (secs - t) * 4);
  }
  return pcmToWav(new Uint8Array(pcm.buffer), rate);
}

export const demoProvider: AIProvider = {
  async ideaToStory(idea, b) { await wait(900); return storyFromIdea(idea, b); },
  async novelToEpisodes(novel, b) { await wait(900); return storyFromNovel(novel, b); },
  async extractAssets(script) { await wait(600); return assetsFromScript(script); },
  async storyboard(script, a) { await wait(700); return boardFromScript(script, a); },
  async rewrite(text, instruction) { await wait(500); return `${text}\n\n（演示模式：已按「${instruction}」润色，接入模型后返回真实结果）`; },
  async image(prompt, aspect, refs) { await wait(500); return renderPlaceholder(prompt, aspect, refs); },
  async video(prompt, aspect, first, seconds = 3) { return renderKenBurns(prompt, aspect, first, Math.min(seconds, 4)); },
  async tts(text) { await wait(300); return tone(text); },
};
