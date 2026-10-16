import type { Aspect, Engines, PublicSettings } from '../types';
import { demoProvider } from './demo';
import { api } from './api';
import { WAN_MAX_SECONDS, type DraftAssets, type DraftShot, type DraftStory, type RefImage, type StoryBrief } from '../../shared/types';

export type { DraftAssets, DraftShot, DraftStory, RefImage, StoryBrief } from '../../shared/types';
export { prompts, shotImagePrompt, shotVideoPrompt } from '../../shared/prompts';

export interface AIProvider {
  ideaToStory(idea: string, brief: StoryBrief): Promise<DraftStory>;
  novelToEpisodes(novel: string, brief: StoryBrief): Promise<DraftStory>;
  extractAssets(script: string): Promise<DraftAssets>;
  storyboard(script: string, assets: DraftAssets, brief: StoryBrief): Promise<DraftShot[]>;
  rewrite(text: string, instruction: string): Promise<string>;
  image(prompt: string, aspect: Aspect, refs: RefImage[]): Promise<Blob>;
  video(prompt: string, aspect: Aspect, first?: RefImage, seconds?: number): Promise<Blob>;
  tts(text: string, voice: string): Promise<Blob>;
}

const DEMO_ENGINES: Engines = { text: 'demo', image: 'demo', video: 'demo', tts: 'demo' };
const enginesOf = (s: PublicSettings | null) => s?.engines ?? DEMO_ENGINES;

/** 按能力组合引擎：演示引擎在浏览器本地运行，其余全部经由后端 /api 调用 */
export function getProvider(s: PublicSettings | null): AIProvider {
  const e = enginesOf(s);
  const remoteText = e.text !== 'demo';
  return {
    ideaToStory: (idea, brief) => (remoteText ? api.text<DraftStory>({ op: 'story', idea, brief }) : demoProvider.ideaToStory(idea, brief)),
    novelToEpisodes: (novel, brief) => (remoteText ? api.text<DraftStory>({ op: 'novel', novel, brief }) : demoProvider.novelToEpisodes(novel, brief)),
    extractAssets: (script) => (remoteText ? api.text<DraftAssets>({ op: 'assets', script }) : demoProvider.extractAssets(script)),
    storyboard: (script, assets, brief) => (remoteText ? api.text<DraftShot[]>({ op: 'storyboard', script, assets, brief }) : demoProvider.storyboard(script, assets, brief)),
    rewrite: async (text, instruction) => (remoteText ? (await api.text<{ text: string }>({ op: 'rewrite', text, instruction })).text : demoProvider.rewrite(text, instruction)),
    image: (prompt, aspect, refs) => (e.image !== 'demo' ? api.media({ kind: 'image', prompt, aspect, refs }) : demoProvider.image(prompt, aspect, refs)),
    video: (prompt, aspect, first, seconds = 5) => (e.video !== 'demo' ? api.media({ kind: 'video', prompt, aspect, first, seconds }) : demoProvider.video(prompt, aspect, first, seconds)),
    tts: (text, voice) => (e.tts !== 'demo' ? api.media({ kind: 'tts', text, voice }) : demoProvider.tts(text, voice)),
  };
}

/** 当前视频引擎的单镜最大时长（秒） */
export function videoMaxSeconds(s: PublicSettings | null) {
  const v = enginesOf(s).video;
  return v === 'wan' ? WAN_MAX_SECONDS : v === 'veo' ? 8 : 4;
}

export function isAllDemo(s: PublicSettings | null) {
  return Object.values(enginesOf(s)).every((v) => v === 'demo');
}
