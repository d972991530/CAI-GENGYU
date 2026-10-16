import { useState } from 'react';
import { Sparkles, BookOpenText, PenLine, Plus, Trash2, Wand2, ChevronDown, ArrowRight, Upload } from 'lucide-react';
import { useStore } from '../store/store';
import { adaptNovel, generateStory, rewriteEpisode } from '../store/actions';
import { Button, Empty, Label, Panel, SectionTitle, Segmented } from '../components/ui';
import { FORMATS, GENRES } from '../lib/presets';
import { uid } from '../lib/util';
import { go } from '../lib/router';
import type { StepProps } from './Workspace';

const REWRITES = ['强化开场 3 秒钩子', '增加冲突与反转', '台词更口语化、更短', '结尾加悬念卡点', '扩写细节与动作'];

export default function StoryPage({ p }: StepProps) {
  const patch = useStore((s) => s.patch);
  const [tab, setTab] = useState<'idea' | 'novel' | 'manual'>(p.novel ? 'novel' : 'idea');
  const [count, setCount] = useState(p.format === 'film' ? 1 : 3);
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [busy, setBusy] = useState(false);
  const [openEp, setOpenEp] = useState<string | null>(p.episodes[0]?.id ?? null);

  const run = async (fn: () => Promise<void> | undefined) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const totalChars = p.episodes.reduce((a, e) => a + e.script.length, 0);

  return (
    <>
      <SectionTitle no="01 / STORY" title="故事与剧本" desc="从一句创意或一段小说开始，AI 生成可直接拍摄的分集剧本；也可以手动编写、逐集润色。"
        right={p.episodes.length > 0 && <Button variant="primary" onClick={() => go(`/p/${p.id}/style`)} icon={<ArrowRight className="size-4" />}>下一步：画风</Button>} />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Panel className="h-fit p-5 lg:sticky lg:top-0">
          <Segmented value={tab} onChange={setTab} options={[
            { id: 'idea', name: <span className="flex items-center gap-1"><Sparkles className="size-3" />创意成剧</span> },
            { id: 'novel', name: <span className="flex items-center gap-1"><BookOpenText className="size-3" />小说改编</span> },
            { id: 'manual', name: <span className="flex items-center gap-1"><PenLine className="size-3" />手动</span> },
          ]} />

          <div className="mt-5 space-y-4">
            {tab === 'idea' && (
              <div>
                <Label hint={`${p.idea.length} 字`}>一句话创意 / 故事梗概</Label>
                <textarea className="field min-h-36 resize-y leading-relaxed" value={p.idea} placeholder="例：外卖小哥意外获得预知未来 10 秒的能力……"
                  onChange={(e) => patch(p.id, (x) => (x.idea = e.target.value))} />
              </div>
            )}
            {tab === 'novel' && (
              <div>
                <Label hint={`${p.novel.length.toLocaleString()} 字`}>小说原文</Label>
                <textarea className="field min-h-56 resize-y text-[13px] leading-relaxed" value={p.novel} placeholder="粘贴小说章节，或导入 .txt 文件"
                  onChange={(e) => patch(p.id, (x) => (x.novel = e.target.value))} />
                <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs text-dim hover:text-amber">
                  <Upload className="size-3.5" />导入 TXT
                  <input type="file" accept=".txt,text/plain" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) { const t = await f.text(); patch(p.id, (x) => (x.novel = t)); }
                  }} />
                </label>
              </div>
            )}
            {tab === 'manual' && (
              <div className="space-y-3 text-sm text-dim">
                <p>直接新增空白分集，手写剧本。推荐格式：</p>
                <pre className="rounded-lg bg-ink-0 p-3 font-mono text-[11px] leading-relaxed text-paper/80">{`1-1 日 内 咖啡馆\n林夏推门而入，环顾四周。\n林夏：（低声）他果然来了。\n旁白：三年了，她终于等到这一天。`}</pre>
                <Button icon={<Plus className="size-4" />} onClick={() => {
                  const id = uid('e_');
                  patch(p.id, (x) => x.episodes.push({ id, title: `第${x.episodes.length + 1}集`, summary: '', script: '', shots: [] }));
                  setOpenEp(id);
                }}>新增空白分集</Button>
              </div>
            )}

            {tab !== 'manual' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>形式</Label>
                    <select className="field" value={p.format} onChange={(e) => patch(p.id, (x) => (x.format = e.target.value as typeof x.format))}>
                      {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>题材</Label>
                    <select className="field" value={p.genre} onChange={(e) => patch(p.id, (x) => (x.genre = e.target.value))}>
                      {GENRES.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label hint={`${count} 集`}>生成集数</Label>
                  <input type="range" min={1} max={tab === 'novel' ? 30 : 12} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-amber" />
                </div>
                {p.episodes.length > 0 && (
                  <Segmented value={mode} onChange={setMode} options={[{ id: 'replace', name: '覆盖现有分集' }, { id: 'append', name: '追加到末尾' }]} />
                )}
                <Button variant="primary" className="w-full" loading={busy} icon={<Wand2 className="size-4" />}
                  disabled={tab === 'idea' ? !p.idea.trim() : !p.novel.trim()}
                  onClick={() => {
                    if (mode === 'replace' && p.episodes.some((e) => e.shots.length) && !confirm('覆盖会清空现有分集和分镜，确定继续？')) return;
                    run(() => (tab === 'idea' ? generateStory : adaptNovel)(p.id, count, mode));
                  }}>
                  {tab === 'idea' ? '生成分集剧本' : '改编为分集剧本'}
                </Button>
              </>
            )}
          </div>
        </Panel>

        <div className="min-w-0 space-y-4">
          <Panel className="p-5">
            <Label hint={`${p.episodes.length} 集 · ${totalChars.toLocaleString()} 字`}>一句话梗概 Logline</Label>
            <input className="field font-serif text-base" value={p.logline} placeholder="生成剧本后自动填写"
              onChange={(e) => patch(p.id, (x) => (x.logline = e.target.value))} />
          </Panel>

          {p.episodes.length === 0 ? (
            <Empty icon={<ScrollIcon />} title="还没有剧本" desc="在左侧输入创意或小说，点击生成。生成的每一集都可以单独编辑、润色。" />
          ) : p.episodes.map((ep, i) => {
            const open = openEp === ep.id;
            return (
              <Panel key={ep.id} className={`overflow-hidden transition ${open ? 'border-amber/40' : ''}`}>
                <button onClick={() => setOpenEp(open ? null : ep.id)} className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left">
                  <span className="font-mono text-xs text-amber">E{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-serif font-bold">{ep.title}</div>
                    {!open && <div className="truncate text-xs text-dim">{ep.summary || ep.script.slice(0, 60)}</div>}
                  </div>
                  <span className="font-mono text-[11px] text-faint">{ep.shots.length ? `${ep.shots.length} 镜` : '未分镜'}</span>
                  <ChevronDown className={`size-4 text-dim transition ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="space-y-3 border-t border-line px-5 pb-5 pt-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                      <input className="field" value={ep.title} onChange={(e) => patch(p.id, (x) => (x.episodes[i].title = e.target.value))} />
                      <input className="field" value={ep.summary} placeholder="本集看点" onChange={(e) => patch(p.id, (x) => (x.episodes[i].summary = e.target.value))} />
                    </div>
                    <textarea className="field min-h-80 resize-y font-mono text-[13px] leading-7" value={ep.script}
                      onChange={(e) => patch(p.id, (x) => (x.episodes[i].script = e.target.value))} />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-faint">AI 润色：</span>
                      {REWRITES.map((r) => (
                        <Button key={r} size="sm" onClick={() => rewriteEpisode(p.id, ep.id, `请按要求修改这集剧本：${r}。保持剧本格式。`)}>{r}</Button>
                      ))}
                      <div className="flex-1" />
                      <Button size="sm" variant="danger" icon={<Trash2 className="size-3.5" />} onClick={() => {
                        if (confirm(`删除「${ep.title}」？`)) patch(p.id, (x) => x.episodes.splice(i, 1));
                      }}>删除</Button>
                    </div>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      </div>
    </>
  );
}

const ScrollIcon = () => <BookOpenText className="size-10" />;
