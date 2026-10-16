// fal.ai 队列接口：开源模型（Qwen-Image / FLUX.1-schnell / Wan2.2-5B）云端推理，仅在服务端调用
import { config } from '../config.ts';
import { HttpError } from '../settings.ts';
import { WAN_MAX_SECONDS, type Aspect, type RefImage } from '../../shared/types.ts';
import type { MediaOut } from './gemini.ts';

export const FAL_MODELS = {
  'qwen-image': 'fal-ai/qwen-image',
  'flux-schnell': 'fal-ai/flux/schnell',
  'wan-t2v': 'fal-ai/wan/v2.2-5b/text-to-video',
  'wan-i2v': 'fal-ai/wan/v2.2-5b/image-to-video',
} as const;

const IMAGE_SIZE: Record<Aspect, string> = { '9:16': 'portrait_16_9', '16:9': 'landscape_16_9', '1:1': 'square_hd' };

async function falError(r: Response) {
  const text = await r.text().catch(() => '');
  try {
    const d = JSON.parse(text).detail;
    return `fal ${r.status}：${typeof d === 'string' ? d : d ? JSON.stringify(d).slice(0, 300) : text.slice(0, 300)}`;
  } catch {
    return `fal ${r.status}：${text.slice(0, 300)}`;
  }
}

async function run<T>(key: string, model: string, input: Record<string, unknown>, pollMs: number): Promise<T> {
  if (!key) throw new HttpError(400, '服务端未配置 fal API Key，请在「设置」中填写');
  const headers = { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };
  const sub = await fetch(`${config.upstream.falQueue}/${model}`, { method: 'POST', headers, body: JSON.stringify(input) });
  if (!sub.ok) throw new Error(await falError(sub));
  const ticket = (await sub.json()) as { request_id: string; status_url: string; response_url: string };
  const deadline = Date.now() + 15 * 60_000;
  for (;;) {
    if (Date.now() > deadline) throw new Error('fal 任务超时（15 分钟）');
    await new Promise((r) => setTimeout(r, pollMs));
    const st = await fetch(ticket.status_url, { headers });
    if (!st.ok && st.status !== 202) throw new Error(await falError(st));
    const s = (await st.json()) as { status: string };
    if (s.status === 'COMPLETED') break;
  }
  const res = await fetch(ticket.response_url, { headers });
  if (!res.ok) throw new Error(await falError(res));
  return res.json() as Promise<T>;
}

async function download(url: string, fallbackType: string): Promise<MediaOut> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`结果下载失败 ${r.status}`);
  return { data: Buffer.from(await r.arrayBuffer()), mimeType: r.headers.get('content-type') ?? fallbackType };
}

export async function falImage(key: string, engine: 'qwen-image' | 'flux-schnell', prompt: string, aspect: Aspect): Promise<MediaOut> {
  const input: Record<string, unknown> = { prompt, image_size: IMAGE_SIZE[aspect], num_images: 1, enable_safety_checker: true, output_format: 'png' };
  if (engine === 'flux-schnell') input.num_inference_steps = 4;
  const out = await run<{ images?: { url: string }[] }>(key, FAL_MODELS[engine], input, 1500);
  const url = out.images?.[0]?.url;
  if (!url) throw new Error('fal 未返回图片');
  return download(url, 'image/png');
}

/** Wan2.2-5B：单镜 1–5 秒（24fps，17–121 帧），720p，16:9 / 9:16 / 1:1 */
export async function falWanVideo(key: string, prompt: string, aspect: Aspect, seconds: number, first?: RefImage): Promise<MediaOut> {
  const fps = 24;
  const sec = Math.min(WAN_MAX_SECONDS, Math.max(1, seconds));
  const num_frames = Math.min(121, Math.max(17, Math.round(sec * fps) + 1));
  const input: Record<string, unknown> = { prompt, num_frames, frames_per_second: fps, resolution: '720p', aspect_ratio: aspect, enable_safety_checker: true };
  if (first) input.image_url = `data:${first.mimeType};base64,${first.data}`;
  const out = await run<{ video?: { url: string } }>(key, first ? FAL_MODELS['wan-i2v'] : FAL_MODELS['wan-t2v'], input, 5000);
  const url = out.video?.url;
  if (!url) throw new Error('fal 未返回视频');
  return download(url, 'video/mp4');
}
