// 前后端共享的类型
export type ProjectFormat = 'short-drama' | 'comic-drama' | 'film';
export type Aspect = '9:16' | '16:9' | '1:1';

export type TextEngine = 'gemini' | 'demo';
export type ImageEngine = 'gemini' | 'qwen-image' | 'flux-schnell' | 'demo';
export type VideoEngine = 'veo' | 'wan' | 'demo';
export type TtsEngine = 'gemini' | 'demo';
export interface Engines { text: TextEngine; image: ImageEngine; video: VideoEngine; tts: TtsEngine }
export interface Models { text: string; image: string; video: string; tts: string }

/** 服务端返回给前端的设置（不含任何密钥明文） */
export interface PublicSettings {
  engines: Engines;
  models: Models;
  keys: { gemini: KeyState; fal: KeyState };
  /** 服务端是否要求访问口令 */
  tokenRequired: boolean;
}
export interface KeyState { set: boolean; hint?: string; source?: 'saved' | 'env' }

/** 前端提交的设置修改；key 字段为 null 表示清除，undefined 表示不变 */
export interface SettingsPatch {
  engines?: Partial<Engines>;
  models?: Partial<Models>;
  geminiKey?: string | null;
  falKey?: string | null;
}

export interface DraftEpisode { title: string; summary: string; script: string }
export interface DraftStory { title: string; logline: string; episodes: DraftEpisode[] }
export interface DraftAsset { name: string; description: string; visual: string }
export interface DraftAssets { characters: DraftAsset[]; scenes: DraftAsset[] }
export interface DraftShot {
  scale: string; camera: string; description: string;
  speaker?: string; dialogue?: string; duration: number;
  characters: string[]; scene?: string;
}
export interface RefImage { data: string; mimeType: string; label: string }
export interface StoryBrief { format: ProjectFormat; genre: string; episodes: number; aspect: Aspect }

/** 文本类请求（同步） */
export type TextRequest =
  | { op: 'story'; idea: string; brief: StoryBrief }
  | { op: 'novel'; novel: string; brief: StoryBrief }
  | { op: 'assets'; script: string }
  | { op: 'storyboard'; script: string; assets: DraftAssets; brief: StoryBrief }
  | { op: 'rewrite'; text: string; instruction: string };

/** 媒体类请求（异步任务） */
export type MediaRequest =
  | { kind: 'image'; prompt: string; aspect: Aspect; refs: RefImage[] }
  | { kind: 'video'; prompt: string; aspect: Aspect; first?: RefImage; seconds: number }
  | { kind: 'tts'; text: string; voice: string };

export type JobStatus = 'queued' | 'running' | 'done' | 'error';
export interface JobRecord {
  id: string;
  kind: MediaRequest['kind'];
  engine: string;
  label: string;
  status: JobStatus;
  error?: string;
  mimeType?: string;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export const WAN_MAX_SECONDS = 5;
