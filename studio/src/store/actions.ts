import type { Asset, Episode, Project, Shot } from '../types';
import { enqueue, useStore } from './store';
import { getProvider, shotImagePrompt, shotVideoPrompt, type DraftStory, type RefImage, type StoryBrief } from '../services/ai';
import { blobToBase64, deleteMedia, getMedia, putMedia } from '../lib/db';
import { styleById } from '../lib/presets';
import { uid } from '../lib/util';

const S = () => useStore.getState();
const provider = () => getProvider(S().settings);
const proj = (id: string) => {
  const p = S().projects[id];
  if (!p) throw new Error('作品不存在');
  return p;
};
const styleText = (p: Project) => [styleById(p.styleId).prompt, p.styleExtra].filter(Boolean).join(', ');
const brief = (p: Project, episodes: number): StoryBrief => ({ format: p.format, genre: p.genre, aspect: p.aspect, episodes });

function findShot(p: Project, epId: string, shotId: string) {
  const ep = p.episodes.find((e) => e.id === epId);
  const shot = ep?.shots.find((s) => s.id === shotId);
  if (!ep || !shot) throw new Error('镜头不存在');
  return { ep, shot };
}
function patchShot(pid: string, epId: string, shotId: string, fn: (s: Shot) => void) {
  S().patch(pid, (p) => {
    const s = p.episodes.find((e) => e.id === epId)?.shots.find((x) => x.id === shotId);
    if (s) fn(s);
  });
}
function patchAsset(pid: string, assetId: string, fn: (a: Asset) => void) {
  S().patch(pid, (p) => {
    const a = [...p.characters, ...p.scenes].find((x) => x.id === assetId);
    if (a) fn(a);
  });
}
async function ref(key: string | undefined, label: string): Promise<RefImage | undefined> {
  if (!key) return;
  const blob = await getMedia(key);
  if (!blob) return;
  return { ...(await blobToBase64(blob)), label };
}

// ---------- 故事 ----------
function applyStory(pid: string, d: DraftStory, mode: 'replace' | 'append') {
  S().patch(pid, (p) => {
    if (d.title && (p.name === '未命名作品' || mode === 'replace')) p.name = d.title.replace(/[《》]/g, '');
    if (d.logline) p.logline = d.logline;
    const eps: Episode[] = d.episodes.map((e) => ({ id: uid('e_'), title: e.title, summary: e.summary, script: e.script, shots: [] }));
    p.episodes = mode === 'replace' ? eps : [...p.episodes, ...eps];
  });
}

export function generateStory(pid: string, episodes: number, mode: 'replace' | 'append') {
  const p = proj(pid);
  return enqueue('创意 → 分集剧本', async () => {
    const d = await provider().ideaToStory(p.idea, brief(p, episodes));
    applyStory(pid, d, mode);
    S().toast(`已生成 ${d.episodes.length} 集剧本`, 'ok');
  });
}

export function adaptNovel(pid: string, episodes: number, mode: 'replace' | 'append') {
  const p = proj(pid);
  return enqueue('小说 → 分集剧本', async () => {
    const d = await provider().novelToEpisodes(p.novel, brief(p, episodes));
    applyStory(pid, d, mode);
    S().toast(`小说已改编为 ${d.episodes.length} 集`, 'ok');
  });
}

export function rewriteEpisode(pid: string, epId: string, instruction: string) {
  const ep = proj(pid).episodes.find((e) => e.id === epId);
  if (!ep) return;
  return enqueue(`润色：${ep.title}`, async () => {
    const text = await provider().rewrite(ep.script, instruction);
    S().patch(pid, (p) => { const e = p.episodes.find((x) => x.id === epId); if (e) e.script = text; });
  });
}

// ---------- 资产 ----------
export function extractAssets(pid: string) {
  const p = proj(pid);
  const script = p.episodes.map((e) => `【${e.title}】\n${e.script}`).join('\n\n');
  if (!script.trim()) { S().toast('请先在「故事」中生成或填写剧本', 'error'); return; }
  return enqueue('提取角色与场景', async () => {
    const d = await provider().extractAssets(script);
    S().patch(pid, (p) => {
      const merge = (list: Asset[], items: typeof d.characters, kind: Asset['kind']) => {
        for (const it of items) {
          const ex = list.find((a) => a.name === it.name);
          if (ex) { if (!ex.locked) { ex.description = it.description; ex.visual = it.visual; } }
          else list.push({ id: uid('a_'), kind, name: it.name, description: it.description, visual: it.visual, voice: kind === 'character' ? ['Kore', 'Puck', 'Charon', 'Aoede'][list.length % 4] : undefined });
        }
      };
      merge(p.characters, d.characters, 'character');
      merge(p.scenes, d.scenes, 'scene');
    });
    S().toast(`识别到 ${d.characters.length} 个角色、${d.scenes.length} 个场景`, 'ok');
  });
}

export function generateAssetImage(pid: string, assetId: string) {
  const p = proj(pid);
  const a = [...p.characters, ...p.scenes].find((x) => x.id === assetId);
  if (!a) return;
  patchAsset(pid, assetId, (x) => (x.imageStatus = 'queued'));
  return enqueue(`${a.kind === 'character' ? '角色' : '场景'}设定图：${a.name}`, async () => {
    patchAsset(pid, assetId, (x) => (x.imageStatus = 'running'));
    try {
      const prompt = a.kind === 'character'
        ? `Art style: ${styleText(p)}.\nCharacter design sheet of "${a.name}": ${a.visual}.\nFull body front view on the left, close-up portrait on the right, neutral light grey background, consistent design, no text.`
        : `Art style: ${styleText(p)}.\nEnvironment concept art of "${a.name}": ${a.visual}.\nEstablishing wide shot, no people, no text.`;
      const blob = await provider().image(prompt, a.kind === 'character' ? '16:9' : p.aspect, []);
      const key = await putMedia(blob);
      const old = a.imageKey;
      patchAsset(pid, assetId, (x) => { x.imageKey = key; x.imageStatus = 'done'; });
      deleteMedia(old);
    } catch (e) {
      patchAsset(pid, assetId, (x) => (x.imageStatus = 'error'));
      throw e;
    }
  });
}

export async function uploadAssetImage(pid: string, assetId: string, file: File) {
  const key = await putMedia(file);
  patchAsset(pid, assetId, (x) => { deleteMedia(x.imageKey); x.imageKey = key; x.imageStatus = 'done'; });
}

// ---------- 分镜 ----------
export function generateStoryboard(pid: string, epId: string) {
  const p = proj(pid);
  const ep = p.episodes.find((e) => e.id === epId);
  if (!ep) return;
  const assets = {
    characters: p.characters.map((c) => ({ name: c.name, description: c.description, visual: c.visual })),
    scenes: p.scenes.map((c) => ({ name: c.name, description: c.description, visual: c.visual })),
  };
  return enqueue(`智能分镜：${ep.title}`, async () => {
    const shots = await provider().storyboard(ep.script, assets, brief(p, 1));
    S().patch(pid, (p) => {
      const e = p.episodes.find((x) => x.id === epId);
      if (!e) return;
      e.shots = shots.map((s) => ({
        id: uid('s_'), scale: s.scale, camera: s.camera, description: s.description,
        speaker: s.speaker || undefined, dialogue: s.dialogue || undefined,
        duration: Math.max(1, Math.round(Number(s.duration) || 3)),
        characterIds: p.characters.filter((c) => s.characters?.includes(c.name)).map((c) => c.id),
        sceneId: p.scenes.find((x) => x.name === s.scene)?.id,
      }));
    });
    S().toast(`${ep.title} 拆分为 ${shots.length} 个镜头`, 'ok');
  });
}

// ---------- 镜头生成 ----------
export function generateShotImage(pid: string, epId: string, shotId: string) {
  patchShot(pid, epId, shotId, (s) => { s.imageStatus = 'queued'; s.error = undefined; });
  return enqueue('分镜配图', async () => {
    patchShot(pid, epId, shotId, (s) => (s.imageStatus = 'running'));
    try {
      const p = proj(pid);
      const { shot } = findShot(p, epId, shotId);
      const chars = p.characters.filter((c) => shot.characterIds.includes(c.id));
      const scene = p.scenes.find((x) => x.id === shot.sceneId);
      const refs = (await Promise.all([
        ...chars.map((c) => ref(c.imageKey, `character ${c.name}`)),
        ref(scene?.imageKey, `location ${scene?.name}`),
      ])).filter((r): r is RefImage => !!r);
      const prompt = shotImagePrompt({ style: styleText(p), description: shot.description, scale: shot.scale, camera: shot.camera, characters: chars, scene, hasRefs: refs.length > 0 });
      const blob = await provider().image(prompt, p.aspect, refs);
      const key = await putMedia(blob);
      patchShot(pid, epId, shotId, (s) => { deleteMedia(s.imageKey); s.imageKey = key; s.imageStatus = 'done'; });
    } catch (e) {
      patchShot(pid, epId, shotId, (s) => { s.imageStatus = 'error'; s.error = String((e as Error).message ?? e); });
      throw e;
    }
  });
}

export function generateShotVideo(pid: string, epId: string, shotId: string) {
  patchShot(pid, epId, shotId, (s) => { s.videoStatus = 'queued'; s.error = undefined; });
  return enqueue('图生视频', async () => {
    patchShot(pid, epId, shotId, (s) => (s.videoStatus = 'running'));
    try {
      const p = proj(pid);
      const { shot } = findShot(p, epId, shotId);
      const first = await ref(shot.imageKey, 'first frame');
      const prompt = shotVideoPrompt({ style: styleText(p), description: shot.description, camera: shot.camera, dialogue: shot.dialogue });
      const blob = await provider().video(prompt, p.aspect, first, shot.duration);
      const key = await putMedia(blob);
      patchShot(pid, epId, shotId, (s) => { deleteMedia(s.videoKey); s.videoKey = key; s.videoStatus = 'done'; });
    } catch (e) {
      patchShot(pid, epId, shotId, (s) => { s.videoStatus = 'error'; s.error = String((e as Error).message ?? e); });
      throw e;
    }
  });
}

export function generateShotAudio(pid: string, epId: string, shotId: string) {
  const p = proj(pid);
  const { shot } = findShot(p, epId, shotId);
  if (!shot.dialogue) return;
  patchShot(pid, epId, shotId, (s) => (s.audioStatus = 'queued'));
  return enqueue(`配音：${shot.speaker ?? '旁白'}`, async () => {
    patchShot(pid, epId, shotId, (s) => (s.audioStatus = 'running'));
    try {
      const voice = p.characters.find((c) => c.name === shot.speaker)?.voice ?? 'Charon';
      const blob = await provider().tts(shot.dialogue!, voice);
      const key = await putMedia(blob);
      patchShot(pid, epId, shotId, (s) => { deleteMedia(s.audioKey); s.audioKey = key; s.audioStatus = 'done'; });
    } catch (e) {
      patchShot(pid, epId, shotId, (s) => (s.audioStatus = 'error'));
      throw e;
    }
  });
}

export function batch(pid: string, epId: string, kind: 'image' | 'video' | 'audio', onlyMissing = true) {
  const ep = proj(pid).episodes.find((e) => e.id === epId);
  if (!ep) return;
  const fn = { image: generateShotImage, video: generateShotVideo, audio: generateShotAudio }[kind];
  const key = { image: 'imageKey', video: 'videoKey', audio: 'audioKey' }[kind] as 'imageKey' | 'videoKey' | 'audioKey';
  const targets = ep.shots.filter((s) => (!onlyMissing || !s[key]) && (kind !== 'audio' || s.dialogue) && (kind !== 'video' || s.imageKey));
  if (!targets.length) { S().toast(kind === 'video' ? '没有可生成视频的镜头（需先有分镜图）' : '没有需要生成的镜头'); return; }
  S().toast(`已加入 ${targets.length} 个任务`);
  targets.forEach((s) => fn(pid, epId, s.id));
}
