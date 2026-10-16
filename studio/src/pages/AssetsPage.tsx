import { useState } from 'react';
import { ArrowRight, ScanSearch, Plus, Lock, LockOpen, RefreshCw, Trash2, Upload, User, Mountain, ImagePlus } from 'lucide-react';
import { useStore } from '../store/store';
import { extractAssets, generateAssetImage, uploadAssetImage } from '../store/actions';
import { Button, Empty, Label, Panel, SectionTitle, Segmented, StatusPill } from '../components/ui';
import { MediaImg } from '../components/Media';
import { VOICES } from '../lib/presets';
import { uid } from '../lib/util';
import { go } from '../lib/router';
import type { Asset } from '../types';
import type { StepProps } from './Workspace';

export default function AssetsPage({ p }: StepProps) {
  const patch = useStore((s) => s.patch);
  const [tab, setTab] = useState<'character' | 'scene'>('character');
  const [busy, setBusy] = useState(false);
  const list = tab === 'character' ? p.characters : p.scenes;
  const missing = list.filter((a) => !a.imageKey);

  return (
    <>
      <SectionTitle no="03 / CAST & SET" title="角色与场景资产" desc="先给每个角色定妆、给每个场景出概念图。后续分镜配图会把这些图作为参考图输入，保证角色脸、服装和场景一致。"
        right={<>
          <Button loading={busy} icon={<ScanSearch className="size-4" />} onClick={async () => { setBusy(true); try { await extractAssets(p.id); } finally { setBusy(false); } }}>从剧本提取</Button>
          <Button variant="primary" onClick={() => go(`/p/${p.id}/storyboard`)} icon={<ArrowRight className="size-4" />}>下一步：分镜</Button>
        </>} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented value={tab} onChange={setTab} options={[
          { id: 'character', name: `角色 ${p.characters.length}` },
          { id: 'scene', name: `场景 ${p.scenes.length}` },
        ]} />
        <div className="flex-1" />
        {missing.length > 0 && (
          <Button size="sm" icon={<ImagePlus className="size-3.5" />} onClick={() => missing.forEach((a) => generateAssetImage(p.id, a.id))}>
            一键生成缺失的 {missing.length} 张设定图
          </Button>
        )}
        <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => patch(p.id, (x) => {
          const a: Asset = { id: uid('a_'), kind: tab, name: tab === 'character' ? '新角色' : '新场景', description: '', visual: '', voice: tab === 'character' ? 'Kore' : undefined };
          (tab === 'character' ? x.characters : x.scenes).push(a);
        })}>手动添加</Button>
      </div>

      {list.length === 0 ? (
        <Empty icon={tab === 'character' ? <User className="size-10" /> : <Mountain className="size-10" />}
          title={tab === 'character' ? '还没有角色' : '还没有场景'} desc="点击「从剧本提取」，AI 会读完所有分集，列出主要角色和场景，并写好视觉提示词。" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((a) => <AssetCard key={a.id} pid={p.id} a={a} aspect={a.kind === 'character' ? '16/9' : p.aspect.replace(':', '/')} />)}
        </div>
      )}
    </>
  );
}

function AssetCard({ pid, a, aspect }: { pid: string; a: Asset; aspect: string }) {
  const patch = useStore((s) => s.patch);
  const upd = (fn: (x: Asset) => void) => patch(pid, (p) => {
    const x = [...p.characters, ...p.scenes].find((y) => y.id === a.id);
    if (x) fn(x);
  });
  const busy = a.imageStatus === 'running' || a.imageStatus === 'queued';

  return (
    <Panel className="overflow-hidden">
      <div className="group relative bg-ink-0" style={{ aspectRatio: aspect, maxHeight: 360 }}>
        {busy ? <div className="shimmer size-full" /> : a.imageKey ? <MediaImg k={a.imageKey} className="size-full object-cover" />
          : <div className="grid size-full place-items-center text-xs text-faint">尚未生成设定图</div>}
        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/80 p-3 opacity-0 transition group-hover:opacity-100">
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-ink-1 px-3 text-xs hover:border-amber">
            <Upload className="size-3.5" />上传
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAssetImage(pid, a.id, f); }} />
          </label>
          <Button size="sm" variant="primary" disabled={busy} icon={<RefreshCw className="size-3.5" />} onClick={() => generateAssetImage(pid, a.id)}>
            {a.imageKey ? '重新生成' : '生成'}
          </Button>
        </div>
        <div className="absolute left-3 top-3"><StatusPill status={a.imageStatus} label={a.kind === 'character' ? '定妆' : '概念图'} /></div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <input className="min-w-0 flex-1 bg-transparent font-serif text-lg font-bold outline-none focus:text-amber" value={a.name} onChange={(e) => upd((x) => (x.name = e.target.value))} />
          <button title={a.locked ? '已锁定：重新提取时不会覆盖' : '锁定设定'} onClick={() => upd((x) => (x.locked = !x.locked))}
            className={`cursor-pointer rounded-full p-1.5 ${a.locked ? 'text-amber' : 'text-faint hover:text-paper'}`}>
            {a.locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
          </button>
          <button onClick={() => confirm(`删除「${a.name}」？`) && patch(pid, (p) => {
            p.characters = p.characters.filter((x) => x.id !== a.id);
            p.scenes = p.scenes.filter((x) => x.id !== a.id);
          })} className="cursor-pointer rounded-full p-1.5 text-faint hover:text-vermilion"><Trash2 className="size-4" /></button>
        </div>
        <div>
          <Label>{a.kind === 'character' ? '身份 / 性格' : '氛围'}</Label>
          <input className="field text-sm" value={a.description} onChange={(e) => upd((x) => (x.description = e.target.value))} />
        </div>
        <div>
          <Label hint="用于一致性">视觉提示词</Label>
          <textarea className="field min-h-20 font-mono text-[11px] leading-relaxed" value={a.visual} onChange={(e) => upd((x) => (x.visual = e.target.value))} />
        </div>
        {a.kind === 'character' && (
          <div>
            <Label>配音音色</Label>
            <select className="field text-sm" value={a.voice} onChange={(e) => upd((x) => (x.voice = e.target.value))}>
              {VOICES.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.id}</option>)}
            </select>
          </div>
        )}
      </div>
    </Panel>
  );
}
