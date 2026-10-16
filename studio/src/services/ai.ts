import type { Aspect, ProjectFormat, Settings } from '../types';
import { geminiProvider } from './gemini';
import { demoProvider } from './demo';

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

export interface StoryBrief {
  format: ProjectFormat; genre: string; episodes: number; aspect: Aspect;
}

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

export function getProvider(s: Settings): AIProvider {
  if (s.provider === 'gemini' && s.apiKey) return geminiProvider(s);
  return demoProvider;
}

// ---------- 共享提示词 ----------
const FORMAT_DESC: Record<ProjectFormat, string> = {
  'short-drama': '竖屏真人短剧：每集 1~2 分钟，开场 3 秒必须有强钩子，每集结尾留悬念（卡点）',
  'comic-drama': 'AI 动态漫剧：每集 1~2 分钟，画面表现力强，旁白+对白推动剧情',
  film: '电影短片：单片 3~5 分钟，注重镜头语言与情绪递进',
};

export const prompts = {
  story: (idea: string, b: StoryBrief) => `你是一线短剧/影视编剧。根据创意写出可直接拍摄的分集剧本。
形式：${FORMAT_DESC[b.format]}
题材：${b.genre}
集数：${b.episodes}
创意：${idea}

要求：
- title 为作品名；logline 一句话梗概（含主角、目标、阻碍）。
- 每集 script 用标准剧本格式：场景标题行（如「1-1 日 内 公司会议室」），动作描述行，角色名：台词（括号内可写表演提示）。
- 每集 3~6 场戏，对白口语化，冲突密集。
只输出 JSON：{"title":"","logline":"","episodes":[{"title":"","summary":"","script":""}]}`,

  novel: (novel: string, b: StoryBrief) => `你是资深改编编剧。把下面的小说文本改编为 ${b.episodes} 集的剧本。
形式：${FORMAT_DESC[b.format]}
要求：保留核心人物与主线冲突，删繁就简；把心理描写转化为可拍的动作和对白；每集结尾卡在悬念点。
剧本格式：场景标题行（如「1-1 夜 外 街道」），动作描述，角色名：台词。
只输出 JSON：{"title":"","logline":"","episodes":[{"title":"","summary":"","script":""}]}

小说原文：
${novel.slice(0, 30000)}`,

  assets: (script: string) => `你是美术指导。从剧本中提取主要角色与主要场景，用于 AI 生图保持一致性。
- characters：name 角色名（与剧本一致）；description 身份/性格；visual 英文外貌提示词（年龄、性别、发型发色、五官特征、体型、标志性服装与配饰），不少于 25 个英文单词。
- scenes：name 场景名（简短，如「公司会议室」）；description 氛围；visual 英文场景提示词（空间结构、陈设、时代、光线、色调），不出现人物。
只输出 JSON：{"characters":[{"name":"","description":"","visual":""}],"scenes":[{"name":"","description":"","visual":""}]}

剧本：
${script.slice(0, 30000)}`,

  storyboard: (script: string, a: DraftAssets, b: StoryBrief) => `你是电影分镜师。把剧本拆成可逐镜生成的分镜表，画幅 ${b.aspect}。
可用角色：${a.characters.map((c) => c.name).join('、') || '无'}
可用场景：${a.scenes.map((s) => s.name).join('、') || '无'}
规则：
- 每个镜头 2~6 秒（duration 为整数秒），一场戏 3~8 个镜头，景别与运镜要有变化。
- scale 取值：远景/全景/中景/近景/特写/大特写；camera 取值：固定/推镜/拉镜/摇镜/移镜/跟拍/升降/手持/环绕。
- description：一句具体可画的中文画面描述（谁、在哪、做什么、表情、构图、光线），不写台词。
- speaker/dialogue：本镜对白或旁白（旁白 speaker 写「旁白」），可为空字符串。
- characters：本镜出镜角色名数组（必须来自可用角色）；scene：场景名（必须来自可用场景）。
只输出 JSON 数组：[{"scale":"","camera":"","description":"","speaker":"","dialogue":"","duration":3,"characters":[],"scene":""}]

剧本：
${script}`,
};

export function shotImagePrompt(opts: {
  style: string; description: string; scale: string; camera: string;
  characters: { name: string; visual: string }[]; scene?: { name: string; visual: string };
  hasRefs: boolean;
}) {
  const scaleEn: Record<string, string> = {
    远景: 'extreme wide shot', 全景: 'full shot', 中景: 'medium shot', 近景: 'medium close-up', 特写: 'close-up', 大特写: 'extreme close-up',
  };
  return [
    `Art style: ${opts.style}.`,
    `Shot: ${scaleEn[opts.scale] ?? opts.scale}.`,
    `Scene content: ${opts.description}`,
    opts.scene ? `Location (${opts.scene.name}): ${opts.scene.visual}` : '',
    ...opts.characters.map((c) => `Character "${c.name}": ${c.visual}`),
    opts.hasRefs ? 'Keep characters and location strictly consistent with the provided reference images (same face, hairstyle, outfit, set design).' : '',
    'Single cinematic frame, no text, no watermark, no speech bubbles.',
  ].filter(Boolean).join('\n');
}

export function shotVideoPrompt(opts: { style: string; description: string; camera: string; dialogue?: string }) {
  const camEn: Record<string, string> = {
    固定: 'static camera', 推镜: 'slow dolly in', 拉镜: 'slow dolly out', 摇镜: 'pan', 移镜: 'tracking shot',
    跟拍: 'follow shot', 升降: 'crane movement', 手持: 'handheld camera', 环绕: 'orbit around subject',
  };
  return `${opts.description}. Camera: ${camEn[opts.camera] ?? opts.camera}. Style: ${opts.style}. Natural subtle motion, consistent characters.${opts.dialogue ? ' The character speaks with natural lip movement.' : ''}`;
}
