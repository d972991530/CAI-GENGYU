import { useState } from 'react';
import { KeyRound, FlaskConical } from 'lucide-react';
import { Button, Label, Modal } from './ui';
import { useStore } from '../store/store';
import type { Settings } from '../types';

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [draft, setDraft] = useState<Settings>(settings);
  const upd = (p: Partial<Settings>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <Modal open={open} onClose={onClose} title="模型与引擎设置">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {([['gemini', '接入 Gemini', <KeyRound className="size-4" />, '文本 / 生图 / Veo 视频 / 配音'],
             ['demo', '演示模式', <FlaskConical className="size-4" />, '离线本地渲染，免 Key 体验全流程']] as const).map(([id, name, icon, hint]) => (
            <button key={id} onClick={() => upd({ provider: id })}
              className={`cursor-pointer rounded-xl border p-3 text-left transition ${draft.provider === id ? 'border-amber bg-amber-soft' : 'border-line hover:border-dim'}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">{icon}{name}</div>
              <div className="mt-1 text-xs text-dim">{hint}</div>
            </button>
          ))}
        </div>
        {draft.provider === 'gemini' && (
          <>
            <div>
              <Label hint="仅保存在本机浏览器">API Key</Label>
              <input className="field font-mono" type="password" value={draft.apiKey} placeholder="AIza…" onChange={(e) => upd({ apiKey: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['textModel', '剧本 / 分镜模型'], ['imageModel', '生图模型'], ['videoModel', '视频模型'], ['ttsModel', '配音模型']] as const).map(([k, l]) => (
                <div key={k}>
                  <Label>{l}</Label>
                  <input className="field font-mono text-xs" value={draft[k]} onChange={(e) => upd({ [k]: e.target.value })} />
                </div>
              ))}
            </div>
          </>
        )}
        <div>
          <Label hint="同时运行的生成任务数">并发数：{draft.concurrency}</Label>
          <input type="range" min={1} max={6} value={draft.concurrency} onChange={(e) => upd({ concurrency: Number(e.target.value) })} className="w-full accent-amber" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={() => { setSettings(draft); onClose(); }}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}
