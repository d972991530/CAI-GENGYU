// 七七八AI 开放接口（https://api.lk888.ai）：即梦 5.0 Pro（Seedream）图片生成
// 流程：POST /v1/media/generate 拿 task_id → 轮询 GET /v1/media/status → is_final 后取 result_url
import { config } from '../config.ts';
import { HttpError } from '../settings.ts';
import { refToUrl } from '../publicRefs.ts';
import { SEEDREAM_MAX_REFS, type Aspect, type RefImage } from '../../shared/types.ts';
import type { MediaOut } from './gemini.ts';

interface CreateResp { code?: number; msg?: string; message?: string; error?: string; data?: { task_id?: number | string } }
interface StatusResp {
  task_id: number | string;
  state: 'pending' | 'running' | 'success' | 'failed';
  is_final: boolean;
  progress?: string;
  result_url?: string;
  result_type?: string;
  error?: string;
  cost?: number;
}

const headers = (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' });

async function readError(r: Response) {
  const text = await r.text().catch(() => '');
  try {
    const j = JSON.parse(text);
    return `七七八AI ${r.status}：${j.msg ?? j.message ?? j.error?.message ?? j.error ?? text.slice(0, 200)}`;
  } catch {
    return `七七八AI ${r.status}：${text.slice(0, 200)}`;
  }
}

/** 创建任务并轮询到终态（state 判定成功/失败；status/status_group 仅供展示，不参与判断） */
async function runTask(key: string, body: Record<string, unknown>, pollMs: number, timeoutMs: number): Promise<StatusResp> {
  if (!key) throw new HttpError(400, '服务端未配置七七八AI API Key，请在「设置」中填写');
  const base = config.upstream.lk888;
  const cr = await fetch(`${base}/v1/media/generate`, { method: 'POST', headers: headers(key), body: JSON.stringify(body) });
  if (!cr.ok) throw new Error(await readError(cr));
  const created = (await cr.json()) as CreateResp;
  const taskId = created.data?.task_id;
  if ((created.code !== undefined && created.code !== 200) || taskId === undefined) {
    throw new Error(`七七八AI 创建任务失败：${created.msg ?? created.message ?? created.error ?? JSON.stringify(created).slice(0, 200)}`);
  }
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    await new Promise((r) => setTimeout(r, pollMs));
    if (Date.now() > deadline) throw new Error(`七七八AI 任务 ${taskId} 超时`);
    const sr = await fetch(`${base}/v1/media/status?task_id=${encodeURIComponent(String(taskId))}`, { headers: headers(key) });
    if (!sr.ok) {
      // 查询偶发失败时继续轮询，任务本身不受影响
      if (sr.status >= 500) continue;
      throw new Error(await readError(sr));
    }
    const st = (await sr.json()) as StatusResp;
    if (!st.is_final) continue;
    if (st.state === 'success' && st.result_url) return st;
    throw new Error(`七七八AI 任务失败（已自动退款）：${st.error || st.state}`);
  }
}

export async function seedreamImage(
  key: string, model: string, prompt: string, aspect: Aspect, refs: RefImage[], size: '1K' | '2K',
): Promise<MediaOut & { cost?: number }> {
  const used = refs.slice(0, SEEDREAM_MAX_REFS);
  // 即梦按顺序接收参考图，在提示词里说明每张图对应的角色 / 场景
  const refNote = used.length ? `Reference images: ${used.map((r, i) => `image ${i + 1} = ${r.label}`).join('; ')}.\n` : '';
  const params: Record<string, unknown> = { aspect_ratio: aspect, size };
  if (used.length) params.images = used.map(refToUrl);
  const st = await runTask(key, { model, prompt: refNote + prompt, params }, 4000, 10 * 60_000);
  const r = await fetch(st.result_url!);
  if (!r.ok) throw new Error(`结果下载失败 ${r.status}`);
  return { data: Buffer.from(await r.arrayBuffer()), mimeType: r.headers.get('content-type')?.split(';')[0] ?? 'image/png', cost: st.cost };
}
