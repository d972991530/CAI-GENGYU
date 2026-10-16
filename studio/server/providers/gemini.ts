import { GoogleGenAI, Modality } from '@google/genai';
import { config } from '../config.ts';
import { HttpError } from '../settings.ts';
import { prompts } from '../../shared/prompts.ts';
import type { Aspect, Models, RefImage, TextRequest } from '../../shared/types.ts';

export interface MediaOut { data: Buffer; mimeType: string }

function client(key: string) {
  if (!key) throw new HttpError(400, '服务端未配置 Gemini API Key，请在「设置」中填写');
  return new GoogleGenAI({ apiKey: key, httpOptions: config.upstream.geminiBase ? { baseUrl: config.upstream.geminiBase } : undefined });
}

function parseJSON(text: string) {
  const cleaned = text.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(cleaned); } catch { throw new Error('模型返回的不是合法 JSON，请重试'); }
}

export async function geminiText(key: string, models: Models, req: TextRequest): Promise<unknown> {
  const ai = client(key);
  if (req.op === 'rewrite') {
    const res = await ai.models.generateContent({ model: models.text, contents: `${req.instruction}\n只输出修改后的正文，不要解释。\n\n${req.text}` });
    return { text: (res.text ?? '').trim() };
  }
  const [prompt, temperature] =
    req.op === 'story' ? [prompts.story(req.idea, req.brief), 0.8]
    : req.op === 'novel' ? [prompts.novel(req.novel, req.brief), 0.6]
    : req.op === 'assets' ? [prompts.assets(req.script), 0.5]
    : [prompts.storyboard(req.script, req.assets, req.brief), 0.6];
  const res = await ai.models.generateContent({ model: models.text, contents: prompt, config: { responseMimeType: 'application/json', temperature } });
  return parseJSON(res.text ?? '');
}

export async function geminiImage(key: string, models: Models, prompt: string, aspect: Aspect, refs: RefImage[]): Promise<MediaOut> {
  const ai = client(key);
  const parts = [
    ...refs.flatMap((r) => [{ text: `Reference image — ${r.label}:` }, { inlineData: { data: r.data, mimeType: r.mimeType } }]),
    { text: prompt },
  ];
  const res = await ai.models.generateContent({
    model: models.image,
    contents: [{ role: 'user', parts }],
    config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: aspect } },
  });
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error(res.text || '模型未返回图片（可能触发了安全策略）');
  return { data: Buffer.from(part.inlineData.data, 'base64'), mimeType: part.inlineData.mimeType ?? 'image/png' };
}

export async function geminiVideo(key: string, models: Models, prompt: string, aspect: Aspect, first?: RefImage): Promise<MediaOut> {
  const ai = client(key);
  let op = await ai.models.generateVideos({
    model: models.video,
    prompt,
    image: first ? { imageBytes: first.data, mimeType: first.mimeType } : undefined,
    config: { numberOfVideos: 1, aspectRatio: aspect === '9:16' ? '9:16' : '16:9' },
  });
  const deadline = Date.now() + 15 * 60_000;
  while (!op.done) {
    if (Date.now() > deadline) throw new Error('视频生成超时（15 分钟）');
    await new Promise((r) => setTimeout(r, 8000));
    op = await ai.operations.getVideosOperation({ operation: op });
  }
  if (op.error) throw new Error(String(op.error.message ?? '视频生成失败'));
  const uri = op.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error('视频生成失败：未返回结果（可能触发了安全策略）');
  const r = await fetch(uri, { headers: { 'x-goog-api-key': key } });
  if (!r.ok) throw new Error(`视频下载失败 ${r.status}`);
  return { data: Buffer.from(await r.arrayBuffer()), mimeType: r.headers.get('content-type') ?? 'video/mp4' };
}

export async function geminiTts(key: string, models: Models, text: string, voice: string): Promise<MediaOut> {
  const ai = client(key);
  const res = await ai.models.generateContent({
    model: models.tts,
    contents: [{ parts: [{ text }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
  });
  const data = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) throw new Error('配音生成失败');
  return { data: pcmToWav(Buffer.from(data, 'base64'), 24000), mimeType: 'audio/wav' };
}

/** 16-bit 单声道 PCM → WAV */
function pcmToWav(pcm: Buffer, rate: number) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
