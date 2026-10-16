import { useState } from 'react';
import { ServerCrash, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';
import { Button, Label, Modal } from './ui';
import { useStore } from '../store/store';
import type { Engines, Models } from '../../shared/types';
import type { PublicSettings } from '../types';
import { getToken, setToken } from '../services/api';

type Opt<T extends string> = { id: T; name: string; hint: string; license?: string };

const TEXT: Opt<Engines['text']>[] = [
  { id: 'gemini', name: 'Gemini', hint: '剧本、改编、分镜 JSON' },
  { id: 'demo', name: '演示', hint: '离线规则生成' },
];
const IMAGE: Opt<Engines['image']>[] = [
  { id: 'qwen-image', name: 'Qwen-Image', hint: '文生图、分镜配图（fal）', license: 'Apache 2.0' },
  { id: 'flux-schnell', name: 'FLUX.1-schnell', hint: '4 步快速文生图（fal）', license: 'Apache 2.0' },
  { id: 'gemini', name: 'Gemini Image', hint: '支持参考图保持一致' },
  { id: 'demo', name: '演示', hint: '本地占位渲染' },
];
const VIDEO: Opt<Engines['video']>[] = [
  { id: 'wan', name: 'Wan2.2-5B', hint: '文/图生视频，1–5 秒 720p（fal）', license: 'Apache 2.0' },
  { id: 'veo', name: 'Veo 3.1 Fast', hint: '图生视频（Gemini）' },
  { id: 'demo', name: '演示', hint: '本地推拉动效' },
];
const TTS: Opt<Engines['tts']>[] = [
  { id: 'gemini', name: 'Gemini TTS', hint: '多音色配音' },
  { id: 'demo', name: '演示', hint: '占位音' },
];

const NAMES: Record<string, string> = Object.fromEntries([...TEXT, ...IMAGE, ...VIDEO, ...TTS].filter((o) => o.id !== 'demo').map((o) => [o.id, o.name]));
export function engineSummary(s: PublicSettings | null) {
  if (!s) return '演示模式';
  return [s.engines.image, s.engines.video].filter((e) => e !== 'demo').map((e) => NAMES[e]).join(' · ') || NAMES[s.engines.text] || '已接入';
}

function EnginePicker<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Opt<T>[]; onChange: (v: T) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)}
            className={`cursor-pointer rounded-xl border p-2.5 text-left transition ${value === o.id ? 'border-amber bg-amber-soft' : 'border-line hover:border-dim'}`}>
            <div className="text-sm font-semibold">{o.name}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-dim">{o.hint}</div>
            {o.license && <div className="mt-1 font-mono text-[10px] text-jade">{o.license}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_ENGINES: Engines = { text: 'demo', image: 'demo', video: 'demo', tts: 'demo' };

function KeyField({ label, state, value, onChange, cleared, onClear, placeholder }: {
  label: string; state?: { set: boolean; hint?: string; source?: string }; value: string; onChange: (v: string) => void;
  cleared: boolean; onClear: () => void; placeholder: string;
}) {
  const saved = state?.set && !cleared;
  return (
    <div>
      <Label hint={<span className="inline-flex items-center gap-1"><ShieldCheck className="size-3" />加密保存在服务端，不回传前端</span>}>{label}</Label>
      <div className="flex gap-2">
        <input className="field font-mono" type="password" autoComplete="off" value={value}
          placeholder={saved ? `已保存 ${state?.hint ?? ''}${state?.source === 'env' ? '（来自服务器环境变量）' : ''}，输入新值可替换` : placeholder}
          onChange={(ev) => onChange(ev.target.value)} />
        {saved && state?.source === 'saved' && <Button size="sm" variant="danger" onClick={onClear}>清除</Button>}
      </div>
    </div>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const status = useStore((s) => s.serverStatus);
  const serverError = useStore((s) => s.serverError);
  const saveSettings = useStore((s) => s.saveSettings);
  const refresh = useStore((s) => s.refreshSettings);
  const concurrency = useStore((s) => s.concurrency);
  const setConcurrency = useStore((s) => s.setConcurrency);
  const toast = useStore((s) => s.toast);

  const [engines, setEngines] = useState<Engines>(settings?.engines ?? DEFAULT_ENGINES);
  const [models, setModels] = useState<Models | undefined>(settings?.models);
  const [geminiKey, setGeminiKey] = useState('');
  const [falKey, setFalKey] = useState('');
  const [clear, setClear] = useState({ gemini: false, fal: false });
  const [conc, setConc] = useState(concurrency);
  const [token, setTok] = useState(getToken());
  const [saving, setSaving] = useState(false);
  const eng = (p: Partial<Engines>) => setEngines((d) => ({ ...d, ...p }));
  const usesGemini = engines.text === 'gemini' || engines.image === 'gemini' || engines.video === 'veo' || engines.tts === 'gemini';
  const usesFal = engines.image === 'qwen-image' || engines.image === 'flux-schnell' || engines.video === 'wan';
  const online = status === 'ok' && settings;

  const save = async () => {
    setConcurrency(conc);
    if (!online) { onClose(); return; }
    setSaving(true);
    try {
      await saveSettings({
        engines, models,
        geminiKey: clear.gemini ? null : geminiKey || undefined,
        falKey: clear.fal ? null : falKey || undefined,
      });
      toast('设置已保存到服务端', 'ok');
      onClose();
    } catch (e) {
      toast(`保存失败：${(e as Error).message}`, 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="模型与接口设置" width="max-w-2xl">
      <div className="space-y-5">
        {status === 'offline' && (
          <div className="flex items-start gap-3 rounded-xl border border-vermilion/40 bg-vermilion/10 p-4 text-sm">
            <ServerCrash className="mt-0.5 size-4 shrink-0 text-vermilion" />
            <div className="flex-1">
              <div className="font-semibold text-vermilion">后端未连接，当前只能使用演示模式</div>
              <div className="mt-1 text-xs text-dim">{serverError}</div>
            </div>
            <Button size="sm" icon={<RefreshCw className="size-3.5" />} onClick={refresh}>重试</Button>
          </div>
        )}
        {status === 'unauthorized' && (
          <div className="rounded-xl border border-amber/40 bg-amber-soft p-4">
            <Label hint="由部署者在服务器上设置的 STUDIO_TOKEN">访问口令</Label>
            <div className="flex gap-2">
              <input className="field font-mono" type="password" value={token} onChange={(ev) => setTok(ev.target.value)} />
              <Button variant="primary" icon={<KeyRound className="size-4" />} onClick={async () => { setToken(token); await refresh(); }}>验证</Button>
            </div>
          </div>
        )}

        <fieldset disabled={!online} className={`space-y-5 ${online ? '' : 'pointer-events-none opacity-40'}`}>
          <EnginePicker label="剧本 / 分镜" value={engines.text} options={TEXT} onChange={(v) => eng({ text: v })} />
          <EnginePicker label="生图（定妆、场景、分镜配图）" value={engines.image} options={IMAGE} onChange={(v) => eng({ image: v })} />
          <EnginePicker label="视频" value={engines.video} options={VIDEO} onChange={(v) => eng({ video: v })} />
          <EnginePicker label="配音" value={engines.tts} options={TTS} onChange={(v) => eng({ tts: v })} />

          {usesFal && (
            <div className="rounded-xl border border-line bg-ink-0 p-4">
              <KeyField label="fal API Key" state={settings?.keys.fal} value={falKey} onChange={setFalKey} placeholder="xxxxxxxx-xxxx:xxxxxxxx"
                cleared={clear.fal} onClear={() => setClear((c) => ({ ...c, fal: true }))} />
              <p className="mt-2 text-[11px] leading-relaxed text-faint">
                开源模型仍需要算力，这里由后端调用 fal 云端运行，按调用计费，需要有效 Key 和额度。
                Qwen-Image / FLUX.1-schnell 为纯文生图，不读取参考图，角色一致性依靠资产中的视觉提示词。
                Wan2.2-5B 单镜 1–5 秒、720p，支持 16:9 / 9:16 / 1:1。
              </p>
            </div>
          )}
          {usesGemini && (
            <div className="rounded-xl border border-line bg-ink-0 p-4">
              <KeyField label="Gemini API Key" state={settings?.keys.gemini} value={geminiKey} onChange={setGeminiKey} placeholder="AIza…"
                cleared={clear.gemini} onClear={() => setClear((c) => ({ ...c, gemini: true }))} />
              {models && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {([['text', '剧本 / 分镜模型'], ['image', '生图模型'], ['video', '视频模型'], ['tts', '配音模型']] as const).map(([k, l]) => (
                    <div key={k}>
                      <Label>{l}</Label>
                      <input className="field font-mono text-xs" value={models[k]} onChange={(ev) => setModels({ ...models, [k]: ev.target.value })} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </fieldset>

        <div>
          <Label hint="本浏览器同时提交的生成任务数">并发数：{conc}</Label>
          <input type="range" min={1} max={6} value={conc} onChange={(ev) => setConc(Number(ev.target.value))} className="w-full accent-amber" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="primary" loading={saving} onClick={save}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}
