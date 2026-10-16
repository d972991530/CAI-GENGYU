export type ProjectFormat = 'short-drama' | 'comic-drama' | 'film';
export type Aspect = '9:16' | '16:9' | '1:1';
export type GenStatus = 'idle' | 'queued' | 'running' | 'done' | 'error';

export interface Asset {
  id: string;
  kind: 'character' | 'scene';
  name: string;
  /** 设定描述（性格/身份 或 场景氛围） */
  description: string;
  /** 视觉提示词（外貌/服装 或 空间/光线），用于保持一致性 */
  visual: string;
  /** 角色配音音色 */
  voice?: string;
  imageKey?: string;
  imageStatus?: GenStatus;
  locked?: boolean;
}

export interface Shot {
  id: string;
  /** 景别：远景/全景/中景/近景/特写 */
  scale: string;
  /** 运镜：固定/推/拉/摇/移/跟/升降/手持 */
  camera: string;
  description: string;
  speaker?: string;
  dialogue?: string;
  duration: number;
  characterIds: string[];
  sceneId?: string;
  imageKey?: string;
  imageStatus?: GenStatus;
  videoKey?: string;
  videoStatus?: GenStatus;
  audioKey?: string;
  audioStatus?: GenStatus;
  error?: string;
}

export interface Episode {
  id: string;
  title: string;
  summary: string;
  script: string;
  shots: Shot[];
}

export interface Project {
  id: string;
  name: string;
  format: ProjectFormat;
  aspect: Aspect;
  genre: string;
  styleId: string;
  styleExtra: string;
  idea: string;
  novel: string;
  logline: string;
  episodes: Episode[];
  characters: Asset[];
  scenes: Asset[];
  createdAt: number;
  updatedAt: number;
}

export interface StylePreset {
  id: string;
  name: string;
  tag: string;
  prompt: string;
  swatch: [string, string];
}

export interface Job {
  id: string;
  label: string;
  status: 'queued' | 'running' | 'done' | 'error';
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export type TextEngine = 'gemini' | 'demo';
export type ImageEngine = 'gemini' | 'qwen-image' | 'flux-schnell' | 'demo';
export type VideoEngine = 'veo' | 'wan' | 'demo';
export type TtsEngine = 'gemini' | 'demo';

export interface Engines { text: TextEngine; image: ImageEngine; video: VideoEngine; tts: TtsEngine }

export interface Settings {
  engines: Engines;
  /** Gemini API Key */
  apiKey: string;
  /** fal.ai API Key（开源模型云端推理） */
  falKey: string;
  textModel: string;
  imageModel: string;
  videoModel: string;
  ttsModel: string;
  concurrency: number;
}
