import { create } from 'zustand';
import type { Job, Project, PublicSettings, SettingsPatch } from '../types';
import { api, ApiError } from '../services/api';
import { idb } from '../lib/db';
import { uid } from '../lib/util';

const CONCURRENCY_KEY = 'jingfang.concurrency';
const loadConcurrency = () => { try { return Number(localStorage.getItem(CONCURRENCY_KEY)) || 2; } catch { return 2; } };

/** 后端连接状态：offline 时只能使用演示引擎 */
export type ServerStatus = 'loading' | 'ok' | 'offline' | 'unauthorized';

export interface Toast { id: string; text: string; tone: 'info' | 'error' | 'ok' }

interface State {
  ready: boolean;
  projects: Record<string, Project>;
  /** 服务端设置（不含密钥明文）；后端不可用时为 null，全部走演示引擎 */
  settings: PublicSettings | null;
  serverStatus: ServerStatus;
  serverError?: string;
  concurrency: number;
  jobs: Job[];
  toasts: Toast[];
  load(): Promise<void>;
  createProject(p: Partial<Project>): string;
  patch(id: string, recipe: (p: Project) => void): void;
  removeProject(id: string): void;
  refreshSettings(): Promise<void>;
  saveSettings(p: SettingsPatch): Promise<void>;
  setConcurrency(n: number): void;
  toast(text: string, tone?: Toast['tone']): void;
}

const saveTimers = new Map<string, number>();
function scheduleSave(p: Project) {
  clearTimeout(saveTimers.get(p.id));
  saveTimers.set(p.id, window.setTimeout(() => idb.set('projects', p.id, p), 400));
}

export const useStore = create<State>((set, get) => ({
  ready: false,
  projects: {},
  settings: null,
  serverStatus: 'loading',
  concurrency: loadConcurrency(),
  jobs: [],
  toasts: [],

  async load() {
    const list = await idb.all<Project>('projects');
    set({ projects: Object.fromEntries(list.map((p) => [p.id, p])), ready: true });
    get().refreshSettings();
  },

  async refreshSettings() {
    try {
      set({ settings: await api.settings(), serverStatus: 'ok', serverError: undefined });
    } catch (e) {
      const status = e instanceof ApiError && e.status === 401 ? 'unauthorized' : 'offline';
      set({ settings: null, serverStatus: status, serverError: (e as Error).message });
    }
  },

  async saveSettings(p) {
    set({ settings: await api.saveSettings(p), serverStatus: 'ok', serverError: undefined });
  },

  setConcurrency(n) {
    try { localStorage.setItem(CONCURRENCY_KEY, String(n)); } catch { /* ignore */ }
    set({ concurrency: n });
  },

  createProject(init) {
    const now = Date.now();
    const p: Project = {
      id: uid('p_'), name: '未命名作品', format: 'short-drama', aspect: '9:16', genre: '都市逆袭',
      styleId: 'guoman', styleExtra: '', idea: '', novel: '', logline: '',
      episodes: [], characters: [], scenes: [], createdAt: now, updatedAt: now, ...init,
    };
    set({ projects: { ...get().projects, [p.id]: p } });
    scheduleSave(p);
    return p.id;
  },

  patch(id, recipe) {
    const cur = get().projects[id];
    if (!cur) return;
    const next = structuredClone(cur);
    recipe(next);
    next.updatedAt = Date.now();
    set({ projects: { ...get().projects, [id]: next } });
    scheduleSave(next);
  },

  removeProject(id) {
    const { [id]: _gone, ...rest } = get().projects;
    set({ projects: rest });
    idb.del('projects', id);
  },

  toast(text, tone = 'info') {
    const t = { id: uid(), text, tone };
    set({ toasts: [...get().toasts, t] });
    setTimeout(() => set({ toasts: get().toasts.filter((x) => x.id !== t.id) }), 4200);
  },
}));

// ---------- 任务队列（限制并发，避免打爆配额） ----------
type Runner = () => Promise<void>;
const pending: { job: Job; run: Runner; resolve: () => void }[] = [];
let active = 0;

function pump() {
  const { concurrency } = useStore.getState();
  while (active < concurrency && pending.length) {
    const item = pending.shift()!;
    active++;
    updateJob(item.job.id, { status: 'running', startedAt: Date.now() });
    item.run()
      .then(() => updateJob(item.job.id, { status: 'done', finishedAt: Date.now() }))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        updateJob(item.job.id, { status: 'error', error: msg, finishedAt: Date.now() });
        useStore.getState().toast(`${item.job.label} 失败：${msg.slice(0, 120)}`, 'error');
      })
      .finally(() => { active--; item.resolve(); pump(); });
  }
}

function updateJob(id: string, patch: Partial<Job>) {
  useStore.setState((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
}

export function enqueue(label: string, run: Runner): Promise<void> {
  const job: Job = { id: uid('j_'), label, status: 'queued' };
  useStore.setState((s) => ({ jobs: [job, ...s.jobs].slice(0, 80) }));
  return new Promise((resolve) => { pending.push({ job, run, resolve }); pump(); });
}

export function clearFinishedJobs() {
  useStore.setState((s) => ({ jobs: s.jobs.filter((j) => j.status === 'queued' || j.status === 'running') }));
}
