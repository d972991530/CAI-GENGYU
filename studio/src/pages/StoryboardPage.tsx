import { useState } from 'react';
import { ArrowRight, ArrowUp, ArrowDown, Plus, Trash2, Wand2, LayoutPanelTop, Copy, FileText } from 'lucide-react';
import { useStore } from '../store/store';
import { generateStoryboard } from '../store/actions';
import { Button, Empty, Panel, SectionTitle } from '../components/ui';
import { CAMERA_MOVES, SHOT_SCALES } from '../lib/presets';
import { uid } from '../lib/util';
import { go } from '../lib/router';
import type { Shot } from '../types';
import type { StepProps } from './Workspace';

export default function StoryboardPage({ p, epId }: StepProps) {
  const patch = useStore((s) => s.patch);
  const [busy, setBusy] = useState(false);
  const [showScript, setShowScript] = useState(true);
  const epIndex = p.episodes.findIndex((e) => e.id === epId);
  const ep = p.episodes[epIndex];

  if (!ep) return <Empty icon={<LayoutPanelTop className="size-10" />} title="还没有分集" desc="先在「故事」中生成剧本。" action={<Button onClick={() => go(`/p/${p.id}/story`)}>去写剧本</Button>} />;

  const total = ep.shots.reduce((a, s) => a + s.duration, 0);
  const upd = (i: number, fn: (s: Shot) => void) => patch(p.id, (x) => fn(x.episodes[epIndex].shots[i]));
  const mutate = (fn: (shots: Shot[]) => void) => patch(p.id, (x) => fn(x.episodes[epIndex].shots));
  const blank = (): Shot => ({ id: uid('s_'), scale: '中景', camera: '固定', description: '', duration: 3, characterIds: [], sceneId: ep.shots.at(-1)?.sceneId });

  return (
    <>
      <SectionTitle no="04 / STORYBOARD" title="智能分镜" desc={`把「${ep.title}」拆分成逐镜可生成的分镜表：景别、运镜、画面、台词、时长，并绑定出镜角色与场景。`}
        right={<>
          <Button icon={<FileText className="size-4" />} variant="ghost" onClick={() => setShowScript(!showScript)}>{showScript ? '隐藏剧本' : '显示剧本'}</Button>
          <Button loading={busy} icon={<Wand2 className="size-4" />} onClick={async () => {
            if (ep.shots.length && !confirm('重新分镜会覆盖当前分镜表（已生成的图片/视频将解除关联），继续？')) return;
            setBusy(true); try { await generateStoryboard(p.id, ep.id); } finally { setBusy(false); }
          }}>{ep.shots.length ? '重新 AI 分镜' : 'AI 一键分镜'}</Button>
          <Button variant="primary" disabled={!ep.shots.length} onClick={() => go(`/p/${p.id}/produce`)} icon={<ArrowRight className="size-4" />}>下一步：制作</Button>
        </>} />

      {p.characters.length === 0 && (
        <div className="mb-4 rounded-xl border border-amber/30 bg-amber-soft px-4 py-3 text-sm text-amber">
          提示：还没有角色资产，分镜无法绑定角色参考图。建议先去「资产」提取角色与场景。
        </div>
      )}

      <div className={`grid gap-6 ${showScript ? 'xl:grid-cols-[340px_1fr]' : ''}`}>
        {showScript && (
          <Panel className="h-fit max-h-[75vh] overflow-auto p-5 xl:sticky xl:top-0">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-faint">剧本 · {ep.title}</div>
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-7 text-paper/85">{ep.script || '（空）'}</pre>
          </Panel>
        )}

        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-4 font-mono text-xs text-dim">
            <span>{ep.shots.length} 镜</span><span>约 {total}s</span>
            <div className="flex-1" />
            <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => mutate((s) => s.push(blank()))}>添加镜头</Button>
          </div>

          {ep.shots.length === 0 ? (
            <Empty icon={<LayoutPanelTop className="size-10" />} title="分镜表为空" desc="点击「AI 一键分镜」，或手动添加镜头。" />
          ) : (
            <div className="space-y-2">
              {ep.shots.map((s, i) => (
                <div key={s.id} className="group grid grid-cols-[44px_1fr] gap-3 rounded-2xl border border-line bg-ink-1 p-3 transition hover:border-dim">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <span className="font-mono text-sm font-bold text-amber">{String(i + 1).padStart(2, '0')}</span>
                    <div className="flex flex-col opacity-0 transition group-hover:opacity-100">
                      <IconBtn title="上移" disabled={i === 0} onClick={() => mutate((a) => a.splice(i - 1, 0, a.splice(i, 1)[0]))}><ArrowUp className="size-3.5" /></IconBtn>
                      <IconBtn title="下移" disabled={i === ep.shots.length - 1} onClick={() => mutate((a) => a.splice(i + 1, 0, a.splice(i, 1)[0]))}><ArrowDown className="size-3.5" /></IconBtn>
                      <IconBtn title="复制" onClick={() => mutate((a) => a.splice(i + 1, 0, { ...structuredClone(a[i]), id: uid('s_'), imageKey: undefined, videoKey: undefined, audioKey: undefined, imageStatus: undefined, videoStatus: undefined, audioStatus: undefined }))}><Copy className="size-3.5" /></IconBtn>
                      <IconBtn title="插入" onClick={() => mutate((a) => a.splice(i + 1, 0, blank()))}><Plus className="size-3.5" /></IconBtn>
                      <IconBtn title="删除" danger onClick={() => mutate((a) => a.splice(i, 1))}><Trash2 className="size-3.5" /></IconBtn>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pick value={s.scale} options={SHOT_SCALES} onChange={(v) => upd(i, (x) => (x.scale = v))} />
                      <Pick value={s.camera} options={CAMERA_MOVES} onChange={(v) => upd(i, (x) => (x.camera = v))} />
                      <select className="field !w-auto !rounded-full !py-1 text-xs" value={s.sceneId ?? ''} onChange={(e) => upd(i, (x) => (x.sceneId = e.target.value || undefined))}>
                        <option value="">— 场景 —</option>
                        {p.scenes.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                      </select>
                      <label className="flex items-center gap-1 font-mono text-xs text-dim">
                        <input type="number" min={1} max={15} className="field !w-14 !rounded-full !py-1 text-center text-xs" value={s.duration}
                          onChange={(e) => upd(i, (x) => (x.duration = Math.max(1, Number(e.target.value) || 1)))} />s
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {p.characters.map((c) => {
                          const on = s.characterIds.includes(c.id);
                          return (
                            <button key={c.id} onClick={() => upd(i, (x) => (x.characterIds = on ? x.characterIds.filter((y) => y !== c.id) : [...x.characterIds, c.id]))}
                              className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition ${on ? 'border-amber bg-amber-soft text-amber' : 'border-line text-faint hover:text-paper'}`}>{c.name}</button>
                          );
                        })}
                      </div>
                    </div>
                    <textarea rows={2} className="field resize-y text-sm leading-relaxed" placeholder="画面描述：谁、在哪、做什么、表情、构图、光线" value={s.description}
                      onChange={(e) => upd(i, (x) => (x.description = e.target.value))} />
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <input className="field text-xs" placeholder="说话人" value={s.speaker ?? ''} onChange={(e) => upd(i, (x) => (x.speaker = e.target.value || undefined))} />
                      <input className="field text-sm" placeholder="台词 / 旁白（可空）" value={s.dialogue ?? ''} onChange={(e) => upd(i, (x) => (x.dialogue = e.target.value || undefined))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Pick({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select className="field !w-auto !rounded-full !py-1 text-xs" value={value} onChange={(e) => onChange(e.target.value)}>
      {!options.includes(value) && <option>{value}</option>}
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function IconBtn({ children, danger, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return <button {...rest} className={`cursor-pointer rounded p-1 text-faint disabled:opacity-20 ${danger ? 'hover:text-vermilion' : 'hover:text-paper'}`}>{children}</button>;
}
