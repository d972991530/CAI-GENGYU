import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.ts';
import { seal, unseal, type Sealed } from './crypto.ts';
import type { Engines, KeyState, Models, PublicSettings, SettingsPatch } from '../shared/types.ts';

interface Stored {
  engines: Engines;
  models: Models;
  keys: { gemini?: Sealed; fal?: Sealed };
}

const FILE = () => path.join(config.dataDir, 'settings.json');

const defaults = (): Stored => ({
  engines: config.envKeys.fal
    ? { text: config.envKeys.gemini ? 'gemini' : 'demo', image: 'qwen-image', video: 'wan', tts: config.envKeys.gemini ? 'gemini' : 'demo' }
    : config.envKeys.gemini
      ? { text: 'gemini', image: 'gemini', video: 'veo', tts: 'gemini' }
      : { text: 'demo', image: 'demo', video: 'demo', tts: 'demo' },
  models: {
    text: 'gemini-2.5-flash',
    image: 'gemini-2.5-flash-image',
    video: 'veo-3.1-fast-generate-preview',
    tts: 'gemini-2.5-flash-preview-tts',
  },
  keys: {},
});

let cache: Stored | undefined;
function load(): Stored {
  if (cache) return cache;
  const d = defaults();
  try {
    const raw = JSON.parse(fs.readFileSync(FILE(), 'utf8')) as Partial<Stored>;
    cache = { engines: { ...d.engines, ...raw.engines }, models: { ...d.models, ...raw.models }, keys: raw.keys ?? {} };
  } catch {
    cache = d;
  }
  return cache;
}

function save(s: Stored) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const tmp = FILE() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, FILE());
  cache = s;
}

/** 解密后的密钥，只在服务端内部使用 */
export function getKey(name: 'gemini' | 'fal'): string {
  const sealed = load().keys[name];
  if (sealed) {
    try { return unseal(sealed); } catch { /* 主密钥变更导致无法解密，回退到环境变量 */ }
  }
  return config.envKeys[name];
}

const hint = (k: string) => (k.length > 8 ? `••••${k.slice(-4)}` : '••••');
function keyState(name: 'gemini' | 'fal'): KeyState {
  const sealed = load().keys[name];
  if (sealed) {
    try { return { set: true, hint: hint(unseal(sealed)), source: 'saved' }; } catch { /* fallthrough */ }
  }
  if (config.envKeys[name]) return { set: true, hint: hint(config.envKeys[name]), source: 'env' };
  return { set: false };
}

export function getSettings() {
  const s = load();
  return { engines: s.engines, models: s.models };
}

export function publicSettings(): PublicSettings {
  const s = load();
  return { engines: s.engines, models: s.models, keys: { gemini: keyState('gemini'), fal: keyState('fal') }, tokenRequired: !!config.token };
}

const ENGINE_VALUES: Record<keyof Engines, string[]> = {
  text: ['gemini', 'demo'], image: ['gemini', 'qwen-image', 'flux-schnell', 'demo'], video: ['veo', 'wan', 'demo'], tts: ['gemini', 'demo'],
};

export function updateSettings(p: SettingsPatch): PublicSettings {
  const s = structuredClone(load());
  for (const [k, v] of Object.entries(p.engines ?? {}) as [keyof Engines, string][]) {
    if (!ENGINE_VALUES[k]?.includes(v)) throw new HttpError(400, `无效的引擎：${k}=${v}`);
    (s.engines as unknown as Record<string, string>)[k] = v;
  }
  for (const [k, v] of Object.entries(p.models ?? {}) as [keyof Models, string][]) {
    if (!(k in s.models) || typeof v !== 'string' || !/^[\w.\-/:]{1,120}$/.test(v)) throw new HttpError(400, `无效的模型名：${k}`);
    s.models[k] = v;
  }
  for (const name of ['gemini', 'fal'] as const) {
    const v = name === 'gemini' ? p.geminiKey : p.falKey;
    if (v === null) delete s.keys[name];
    else if (typeof v === 'string' && v.trim()) s.keys[name] = seal(v.trim());
  }
  save(s);
  return publicSettings();
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
