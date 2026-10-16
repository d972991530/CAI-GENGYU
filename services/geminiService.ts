// 浏览器端客户端：不包含任何 API Key 或第三方地址，所有请求都发到同域 /api，由后端调用 Gemini
import type { ComicPanel, PrevisConfig } from '../shared/types';
export type { ComicPanel } from '../shared/types';

const TOKEN_KEY = 'kcinema.token';
const token = () => { try { return localStorage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; } };

async function call(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', 'x-app-token': token(), ...init.headers } });
  if (res.status === 401 && !retried) {
    const t = window.prompt('请输入访问口令');
    if (t) { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } return call(path, init, true); }
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `请求失败 ${res.status}`);
  }
  return res;
}
const post = async <T>(path: string, body: unknown) => (await call(path, { method: 'POST', body: JSON.stringify(body) })).json() as Promise<T>;

export async function analyzeScript(script: string) {
  return (await post<{ text: string }>('/api/analyze', { script })).text;
}

export async function generateProductionTip(stage: string) {
  return (await post<{ text: string }>('/api/tip', { stage })).text;
}

export async function generateStoryboardDescription(prompt: string, mode: 'create' | 'optimize' = 'create') {
  return (await post<{ text: string }>('/api/storyboard', { prompt, mode })).text;
}

export async function breakdownScriptToComicPanels(script: string, panelCount = 6): Promise<ComicPanel[]> {
  return (await post<{ panels: ComicPanel[] }>('/api/comic/panels', { script, panelCount })).panels;
}

export async function generateComicPanelImage(panel: ComicPanel, style = '日式漫画 (Manga B&W)'): Promise<string | null> {
  return (await post<{ image: string | null }>('/api/comic/image', { panel, style })).image;
}

export async function generateKeyframeImage(prompt: string, style = 'Cinematic') {
  return (await post<{ image: string | null }>('/api/keyframe', { prompt, style })).image;
}

/** 提交视频预演任务，轮询完成后返回可播放的 blob URL */
export async function generateMotionPrevis(
  prompt: string,
  imageBase64?: string,
  config: PrevisConfig = { style: 'Cinematic', pace: 'Moderate', transition: 'Standard' },
) {
  const { id } = await post<{ id: string }>('/api/previs', { prompt, imageBase64, config });
  for (;;) {
    await new Promise((r) => setTimeout(r, 5000));
    const st = await (await call(`/api/previs/${id}`)).json() as { status: string; error?: string };
    if (st.status === 'error') throw new Error(st.error ?? '视频生成失败');
    if (st.status === 'done') break;
  }
  return URL.createObjectURL(await (await call(`/api/previs/${id}/video`)).blob());
}
