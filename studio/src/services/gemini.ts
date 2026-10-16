import { GoogleGenAI, Modality } from '@google/genai';
import type { Settings } from '../types';
import { base64ToBlob } from '../lib/db';
import { parseJSON } from '../lib/util';
import { pcmToWav } from './audio';
import { prompts, type AIProvider, type DraftAssets, type DraftShot, type DraftStory } from './ai';

export function geminiProvider(s: Settings): AIProvider {
  const ai = new GoogleGenAI({ apiKey: s.apiKey });

  async function json<T>(prompt: string, temperature = 0.8): Promise<T> {
    const res = await ai.models.generateContent({
      model: s.textModel,
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature },
    });
    return parseJSON<T>(res.text ?? '');
  }

  return {
    ideaToStory: (idea, b) => json<DraftStory>(prompts.story(idea, b)),
    novelToEpisodes: (novel, b) => json<DraftStory>(prompts.novel(novel, b), 0.6),
    extractAssets: (script) => json<DraftAssets>(prompts.assets(script), 0.5),
    storyboard: (script, a, b) => json<DraftShot[]>(prompts.storyboard(script, a, b), 0.6),

    async rewrite(text, instruction) {
      const res = await ai.models.generateContent({
        model: s.textModel,
        contents: `${instruction}\n只输出修改后的正文，不要解释。\n\n${text}`,
      });
      return (res.text ?? '').trim();
    },

    async image(prompt, aspect, refs) {
      const parts = [
        ...refs.flatMap((r) => [{ text: `Reference image — ${r.label}:` }, { inlineData: { data: r.data, mimeType: r.mimeType } }]),
        { text: prompt },
      ];
      const res = await ai.models.generateContent({
        model: s.imageModel,
        contents: [{ role: 'user', parts }],
        config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: aspect } },
      });
      const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!part?.inlineData?.data) throw new Error(res.text || '模型未返回图片（可能触发了安全策略）');
      return base64ToBlob(part.inlineData.data, part.inlineData.mimeType ?? 'image/png');
    },

    async video(prompt, aspect, first) {
      let op = await ai.models.generateVideos({
        model: s.videoModel,
        prompt,
        image: first ? { imageBytes: first.data, mimeType: first.mimeType } : undefined,
        // Veo 仅支持 16:9 / 9:16
        config: { numberOfVideos: 1, aspectRatio: aspect === '9:16' ? '9:16' : '16:9' },
      });
      while (!op.done) {
        await new Promise((r) => setTimeout(r, 8000));
        op = await ai.operations.getVideosOperation({ operation: op });
      }
      if (op.error) throw new Error(String(op.error.message ?? '视频生成失败'));
      const uri = op.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) throw new Error('视频生成失败：未返回结果（可能触发了安全策略）');
      const r = await fetch(uri, { headers: { 'x-goog-api-key': s.apiKey } });
      if (!r.ok) throw new Error(`视频下载失败 ${r.status}`);
      return r.blob();
    },

    async tts(text, voice) {
      const res = await ai.models.generateContent({
        model: s.ttsModel,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      });
      const data = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!data) throw new Error('配音生成失败');
      const bin = atob(data);
      const pcm = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);
      return pcmToWav(pcm, 24000);
    },
  };
}
