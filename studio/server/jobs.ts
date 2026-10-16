// 媒体生成任务：持久化任务记录、结果落盘、并发限制、相同请求进行中时去重
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.ts';
import { getKey, getSettings, HttpError } from './settings.ts';
import { geminiImage, geminiTts, geminiVideo, type MediaOut } from './providers/gemini.ts';
import { falImage, falWanVideo } from './providers/fal.ts';
import { seedreamImage } from './providers/lk888.ts';
import type { JobRecord, MediaRequest } from '../shared/types.ts';

interface Internal extends JobRecord { hash: string; file?: string }

const JOBS_FILE = () => path.join(config.dataDir, 'jobs.json');
const RESULTS = () => path.join(config.dataDir, 'results');
const MAX_RECORDS = 500;

const jobs = new Map<string, Internal>();
const queue: { job: Internal; req: MediaRequest }[] = [];
let active = 0;
let saveTimer: NodeJS.Timeout | undefined;

export function initJobs() {
  fs.mkdirSync(RESULTS(), { recursive: true });
  try {
    const list = JSON.parse(fs.readFileSync(JOBS_FILE(), 'utf8')) as Internal[];
    for (const j of list) {
      // 服务重启时仍未完成的任务无法恢复
      if (j.status === 'queued' || j.status === 'running') Object.assign(j, { status: 'error', error: '服务重启，任务已中断，请重新提交', finishedAt: Date.now() });
      jobs.set(j.id, j);
    }
  } catch { /* 首次启动 */ }
  // 清理过期结果
  const ttl = config.resultTtlDays * 86400_000;
  for (const j of jobs.values()) {
    if (j.finishedAt && Date.now() - j.finishedAt > ttl && j.file) {
      fs.rmSync(path.join(RESULTS(), j.file), { force: true });
      j.file = undefined;
    }
  }
  persist();
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const list = [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_RECORDS);
    const tmp = JOBS_FILE() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(list));
    fs.renameSync(tmp, JOBS_FILE());
  }, 300);
}

const pub = ({ hash: _h, file: _f, ...rest }: Internal): JobRecord => rest;

function engineFor(req: MediaRequest) {
  const { engines } = getSettings();
  const e = req.kind === 'image' ? engines.image : req.kind === 'video' ? engines.video : engines.tts;
  if (e === 'demo') throw new HttpError(400, '当前为演示引擎，无需调用后端');
  return e;
}

function labelFor(req: MediaRequest, engine: string) {
  const name: Record<string, string> = { seedream: '即梦 5.0 Pro', 'qwen-image': 'Qwen-Image', 'flux-schnell': 'FLUX.1-schnell', wan: 'Wan2.2-5B', veo: 'Veo', gemini: 'Gemini' };
  const kind = { image: '生图', video: '视频', tts: '配音' }[req.kind];
  return `${kind} · ${name[engine] ?? engine}`;
}

function validate(req: MediaRequest) {
  const bad = (m: string) => { throw new HttpError(400, m); };
  if (!req || !['image', 'video', 'tts'].includes(req.kind)) bad('未知的任务类型');
  if (req.kind === 'tts') { if (!req.text?.trim()) bad('配音文本为空'); return; }
  if (!req.prompt?.trim()) bad('提示词为空');
  if (!['9:16', '16:9', '1:1'].includes(req.aspect)) bad('不支持的画幅');
}

export function submitJob(req: MediaRequest): { job: JobRecord; deduped: boolean } {
  validate(req);
  const engine = engineFor(req);
  const needs = engine === 'seedream' ? 'lk888' : engine === 'qwen-image' || engine === 'flux-schnell' || engine === 'wan' ? 'fal' : 'gemini';
  if (!getKey(needs)) throw new HttpError(400, `服务端未配置 ${{ lk888: '七七八AI', fal: 'fal', gemini: 'Gemini' }[needs]} API Key，请在「设置」中填写`);
  const hash = crypto.createHash('sha256').update(engine + JSON.stringify(req)).digest('hex');
  // 重复提交防护：完全相同的请求仍在排队或运行时，直接返回已有任务
  for (const j of jobs.values()) {
    if (j.hash === hash && (j.status === 'queued' || j.status === 'running')) return { job: pub(j), deduped: true };
  }
  const job: Internal = { id: crypto.randomUUID(), kind: req.kind, engine, label: labelFor(req, engine), status: 'queued', createdAt: Date.now(), hash };
  jobs.set(job.id, job);
  queue.push({ job, req });
  persist();
  pump();
  return { job: pub(job), deduped: false };
}

async function execute(engine: string, req: MediaRequest): Promise<MediaOut & { cost?: number }> {
  const { models, options } = getSettings();
  if (req.kind === 'image') {
    if (engine === 'seedream') return seedreamImage(getKey('lk888'), models.seedream, req.prompt, req.aspect, req.refs ?? [], options.seedreamSize);
    if (engine === 'gemini') return geminiImage(getKey('gemini'), models, req.prompt, req.aspect, req.refs ?? []);
    // 开源文生图模型不接收参考图，一致性依靠视觉提示词
    const prompt = req.prompt.replace(/\nKeep characters and location strictly consistent[^\n]*/, '');
    return falImage(getKey('fal'), engine as 'qwen-image' | 'flux-schnell', prompt, req.aspect);
  }
  if (req.kind === 'video') {
    if (engine === 'veo') return geminiVideo(getKey('gemini'), models, req.prompt, req.aspect, req.first);
    return falWanVideo(getKey('fal'), req.prompt, req.aspect, req.seconds, req.first);
  }
  return geminiTts(getKey('gemini'), models, req.text, req.voice);
}

const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm', 'audio/wav': 'wav' };

function pump() {
  while (active < config.jobConcurrency && queue.length) {
    const { job, req } = queue.shift()!;
    active++;
    Object.assign(job, { status: 'running', startedAt: Date.now() });
    persist();
    execute(job.engine, req)
      .then((out) => {
        const file = `${job.id}.${EXT[out.mimeType] ?? 'bin'}`;
        fs.writeFileSync(path.join(RESULTS(), file), out.data);
        Object.assign(job, { status: 'done', file, mimeType: out.mimeType, cost: out.cost, finishedAt: Date.now() });
      })
      .catch((e: unknown) => {
        Object.assign(job, { status: 'error', error: e instanceof Error ? e.message : String(e), finishedAt: Date.now() });
        console.error(`[job ${job.id}] ${job.label} 失败：`, job.error);
      })
      .finally(() => { active--; persist(); pump(); });
  }
}

export function getJob(id: string): JobRecord {
  const j = jobs.get(id);
  if (!j) throw new HttpError(404, '任务不存在');
  return pub(j);
}

export function listJobs(limit = 100): JobRecord[] {
  return [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit).map(pub);
}

export function resultFile(id: string): { file: string; mimeType: string } {
  const j = jobs.get(id);
  if (!j) throw new HttpError(404, '任务不存在');
  if (j.status !== 'done' || !j.file) throw new HttpError(409, j.status === 'error' ? `任务失败：${j.error}` : '任务尚未完成');
  const file = path.join(RESULTS(), j.file);
  if (!fs.existsSync(file)) throw new HttpError(410, '结果文件已过期清理');
  return { file, mimeType: j.mimeType ?? 'application/octet-stream' };
}
