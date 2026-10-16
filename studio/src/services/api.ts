// 前端唯一的网络出口：只访问同域 /api，由后端代为调用各模型服务
import type { JobRecord, MediaRequest, PublicSettings, SettingsPatch, TextRequest } from '../../shared/types';

const TOKEN_KEY = 'jingfang.token';
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; } };
export const setToken = (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } };

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-studio-token': getToken(), ...init.headers },
    });
  } catch {
    throw new ApiError(0, '无法连接后端服务，请确认已启动（npm run dev 或 npm start）');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `请求失败 ${res.status}`);
  }
  return res;
}

const json = async <T>(path: string, init?: RequestInit) => (await request(path, init)).json() as Promise<T>;

export const api = {
  health: () => json<{ ok: boolean; tokenRequired: boolean }>('/api/health'),
  settings: () => json<PublicSettings>('/api/settings'),
  saveSettings: (p: SettingsPatch) => json<PublicSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(p) }),
  text: <T>(req: TextRequest) => json<T>('/api/text', { method: 'POST', body: JSON.stringify(req) }),
  jobs: () => json<{ jobs: JobRecord[] }>('/api/jobs?limit=100'),

  /** 提交媒体任务并等待结果 */
  async media(req: MediaRequest): Promise<Blob> {
    const { job } = await json<{ job: JobRecord }>('/api/jobs', { method: 'POST', body: JSON.stringify(req) });
    const interval = req.kind === 'video' ? 4000 : req.kind === 'image' ? 1500 : 1000;
    let cur = job;
    while (cur.status === 'queued' || cur.status === 'running') {
      await new Promise((r) => setTimeout(r, interval));
      cur = (await json<{ job: JobRecord }>(`/api/jobs/${job.id}`)).job;
    }
    if (cur.status === 'error') throw new Error(cur.error ?? '生成失败');
    return (await request(`/api/jobs/${job.id}/result`)).blob();
  },
};
