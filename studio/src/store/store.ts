import { create } from 'zustand';
import type { Job, Project, Settings } from '../types';
import { idb } from '../lib/db';
import { uid } from '../lib/util';

declare const __DEFAULT_GEMINI_KEY__: string;

const SETTINGS_KEY = 'jingfang.settings';
const hasGemini = !!__DEFAULT_GEMINI_KEY__;
const defaultSettings: Settings = {
  engines: hasGemini
    ? { text: 'gemini', image: 'gemini', video: 'veo', tts: 'gemini' }
    : { text: 'demo', image: 'demo', video: 'demo', tts: 'demo' },
  apiKey: __DEFAULT_GEMINI_KEY__,
  falKey: '',
  textModel: 'gemini-2.5-flash',
  imageModel: 'gemini-2.5-flash-image',
  videoModel: 'veo-3.1-fast-generate-preview',
  ttsModel: 'gemini-2.5-flash-preview-tts',
  concurrency: 2,
};

function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    // 兼容旧版的单一 provider 字段
    if (raw.provider && !raw.engines) {
      raw.engines = raw.provider === 'gemini'
        ? { text: 'gemini', image: 'gemini', video: 'veo', tts: 'gemini' }
        : defaultSettings.engines;
      delete raw.provider;
    }
    return { ...defaultSettings, ...raw, engines: { ...defaultSettings.engines, ...raw.engines } };
  } catch {
    return defaultSettings;
  }
}

export interface Toast { id: string; text: string; tone: 'info' | 'error' | 'ok' }

interface State {
  ready: boolean;
  projects: Record<string, Project>;
  settings: Settings;
  jobs: Job[];
  toasts: Toast[];
  load(): Promise<void>;
  createProject(p: Partial<Project>): string;
  patch(id: string, recipe: (p: Project) => void): void;
  removeProject(id: string): void;
  setSettings(s: Partial<Settings>): void;
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
  settings: loadSettings(),
  jobs: [],
  toasts: [],

  async load() {
    const list = await idb.all<Project>('projects');
    set({ projects: Object.fromEntries(list.map((p) => [p.id, p])), ready: true });
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

  setSettings(s) {
    const settings = { ...get().settings, ...s };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    set({ settings });
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
  const { settings } = useStore.getState();
  while (active < settings.concurrency && pending.length) {
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
