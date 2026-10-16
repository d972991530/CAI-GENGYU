import { useState } from 'react';
import { Button, Label, Modal } from './ui';
import { useStore } from '../store/store';
import type { Engines, Settings } from '../types';

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
export function engineSummary(s: Settings) {
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

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [draft, setDraft] = useState<Settings>(settings);
  const upd = (p: Partial<Settings>) => setDraft((d) => ({ ...d, ...p }));
  const eng = (p: Partial<Engines>) => setDraft((d) => ({ ...d, engines: { ...d.engines, ...p } }));
  const e = draft.engines;
  const usesGemini = e.text === 'gemini' || e.image === 'gemini' || e.video === 'veo' || e.tts === 'gemini';
  const usesFal = e.image === 'qwen-image' || e.image === 'flux-schnell' || e.video === 'wan';

  return (
    <Modal open={open} onClose={onClose} title="模型与接口设置" width="max-w-2xl">
      <div className="space-y-5">
        <EnginePicker label="剧本 / 分镜" value={e.text} options={TEXT} onChange={(v) => eng({ text: v })} />
        <EnginePicker label="生图（定妆、场景、分镜配图）" value={e.image} options={IMAGE} onChange={(v) => eng({ image: v })} />
        <EnginePicker label="视频" value={e.video} options={VIDEO} onChange={(v) => eng({ video: v })} />
        <EnginePicker label="配音" value={e.tts} options={TTS} onChange={(v) => eng({ tts: v })} />

        {usesFal && (
          <div className="rounded-xl border border-line bg-ink-0 p-4">
            <Label hint="仅保存在本机浏览器">fal API Key</Label>
            <input className="field font-mono" type="password" value={draft.falKey} placeholder="xxxxxxxx-xxxx:xxxxxxxx" onChange={(ev) => upd({ falKey: ev.target.value })} />
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              开源模型仍需要算力，这里通过 fal 云端运行，按调用计费，需要有效 Key 和额度。
              Qwen-Image / FLUX.1-schnell 为纯文生图，不读取参考图，角色一致性依靠资产中的视觉提示词。
              Wan2.2-5B 单镜 1–5 秒、720p，支持 16:9 / 9:16 / 1:1。
            </p>
          </div>
        )}
        {usesGemini && (
          <div className="rounded-xl border border-line bg-ink-0 p-4">
            <Label hint="仅保存在本机浏览器">Gemini API Key</Label>
            <input className="field font-mono" type="password" value={draft.apiKey} placeholder="AIza…" onChange={(ev) => upd({ apiKey: ev.target.value })} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {([['textModel', '剧本 / 分镜模型'], ['imageModel', '生图模型'], ['videoModel', '视频模型'], ['ttsModel', '配音模型']] as const).map(([k, l]) => (
                <div key={k}>
                  <Label>{l}</Label>
                  <input className="field font-mono text-xs" value={draft[k]} onChange={(ev) => upd({ [k]: ev.target.value })} />
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <Label hint="同时运行的生成任务数">并发数：{draft.concurrency}</Label>
          <input type="range" min={1} max={6} value={draft.concurrency} onChange={(ev) => upd({ concurrency: Number(ev.target.value) })} className="w-full accent-amber" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={() => { setSettings(draft); onClose(); }}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}
