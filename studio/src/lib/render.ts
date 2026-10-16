import type { Aspect, Episode } from '../types';
import { getMedia, mediaUrl } from './db';

const SIZE: Record<Aspect, [number, number]> = { '9:16': [720, 1280], '16:9': [1280, 720], '1:1': [960, 960] };

function drawCover(ctx: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number, w: number, h: number, zoom = 1, dx = 0) {
  const s = Math.max(w / sw, h / sh) * zoom;
  ctx.drawImage(src, (w - sw * s) / 2 + dx, (h - sh * s) / 2, sw * s, sh * s);
}

function drawSubtitle(ctx: CanvasRenderingContext2D, text: string, speaker: string | undefined, w: number, h: number) {
  const fs = Math.round(Math.min(w, h) / 22);
  ctx.font = `600 ${fs}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center';
  const maxW = w * 0.86;
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  const y0 = h * 0.86 - (lines.length - 1) * fs * 1.35;
  ctx.lineWidth = fs / 5; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.fillStyle = '#fff';
  lines.forEach((l, i) => { ctx.strokeText(l, w / 2, y0 + i * fs * 1.35); ctx.fillText(l, w / 2, y0 + i * fs * 1.35); });
  if (speaker && speaker !== '旁白') {
    ctx.font = `500 ${Math.round(fs * 0.62)}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = '#f0a43a';
    ctx.fillText(speaker, w / 2, y0 - fs * 1.1);
  }
}

/** 实时合成整集：画面（视频或图片+推拉）+ 字幕 + 配音 → WebM */
export async function renderEpisode(ep: Episode, aspect: Aspect, opts: { subtitles: boolean }, onProgress: (r: number) => void): Promise<Blob> {
  const [w, h] = SIZE[aspect];
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const actx = new AudioContext();
  const dest = actx.createMediaStreamDestination();
  const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const finished = new Promise<Blob>((r) => (rec.onstop = () => r(new Blob(chunks, { type: 'video/webm' }))));

  // 预加载素材
  const prepared = await Promise.all(ep.shots.map(async (s) => {
    let video: HTMLVideoElement | undefined;
    let image: ImageBitmap | undefined;
    if (s.videoKey) {
      const url = await mediaUrl(s.videoKey);
      if (url) {
        video = document.createElement('video');
        video.src = url; video.muted = true; video.playsInline = true; video.loop = true;
        await new Promise((r) => { video!.onloadeddata = r; video!.onerror = r; });
      }
    }
    if (!video && s.imageKey) {
      const b = await getMedia(s.imageKey);
      if (b) image = await createImageBitmap(b);
    }
    let audio: AudioBuffer | undefined;
    if (s.audioKey) {
      const b = await getMedia(s.audioKey);
      if (b) audio = await actx.decodeAudioData(await b.arrayBuffer()).catch(() => undefined);
    }
    return { s, video, image, audio };
  }));

  const total = ep.shots.reduce((a, s) => a + s.duration, 0);
  rec.start(500);
  let elapsed = 0;
  for (const [idx, it] of prepared.entries()) {
    if (it.audio) {
      const src = actx.createBufferSource();
      src.buffer = it.audio; src.connect(dest); src.start();
    }
    if (it.video) { it.video.currentTime = 0; await it.video.play().catch(() => {}); }
    const t0 = performance.now();
    const dur = it.s.duration * 1000;
    await new Promise<void>((done) => {
      const frame = () => {
        const t = Math.min(1, (performance.now() - t0) / dur);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
        if (it.video) drawCover(ctx, it.video, it.video.videoWidth, it.video.videoHeight, w, h);
        else if (it.image) drawCover(ctx, it.image, it.image.width, it.image.height, w, h, 1.03 + t * 0.08, (idx % 2 ? 1 : -1) * t * w * 0.02);
        if (opts.subtitles && it.s.dialogue) drawSubtitle(ctx, it.s.dialogue, it.s.speaker, w, h);
        // 转场：每镜头首尾 6 帧淡入淡出
        const fade = Math.min(1, Math.min(t * dur, (1 - t) * dur) / 200);
        if (fade < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - fade})`; ctx.fillRect(0, 0, w, h); }
        onProgress((elapsed + t * it.s.duration) / total);
        if (t < 1) requestAnimationFrame(frame); else done();
      };
      frame();
    });
    it.video?.pause();
    elapsed += it.s.duration;
  }
  rec.stop();
  const blob = await finished;
  actx.close();
  return blob;
}
