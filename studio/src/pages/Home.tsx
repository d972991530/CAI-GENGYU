import { useMemo, useState } from 'react';
import { Plus, Settings2, Trash2, Clapperboard, Sparkles, BookOpenText, Film, Wand2 } from 'lucide-react';
import { useStore } from '../store/store';
import { Brand } from '../components/Brand';
import { Button, Label, Modal, Segmented } from '../components/ui';
import { MediaImg } from '../components/Media';
import { FORMATS, GENRES, STYLE_PRESETS } from '../lib/presets';
import { coverKey, projectStats } from '../lib/cover';
import { timeAgo } from '../lib/util';
import { isAllDemo } from '../services/ai';
import { engineSummary } from '../components/SettingsModal';
import { go } from '../lib/router';
import type { Aspect, ProjectFormat } from '../types';

const SAMPLE_IDEA = '被豪门赶出家门的设计师林夏，三年后带着神秘身份回归，在一场发布会上当众揭穿前未婚夫顾言窃取她作品的真相。';

export default function Home({ onSettings }: { onSettings: () => void }) {
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);
  const removeProject = useStore((s) => s.removeProject);
  const [open, setOpen] = useState(false);
  const list = useMemo(() => Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt), [projects]);

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-8">
        <nav className="flex items-center justify-between py-6">
          <Brand />
          <div className="flex items-center gap-2">
            <span className={`hidden rounded-full border px-3 py-1 text-xs sm:inline ${isAllDemo(settings) ? 'border-amber/40 text-amber' : 'border-jade/40 text-jade'}`}>
              {isAllDemo(settings) ? '● 演示模式' : `● ${engineSummary(settings)}`}
            </span>
            <Button variant="ghost" icon={<Settings2 className="size-4" />} onClick={onSettings}>设置</Button>
          </div>
        </nav>

        <section className="grain relative mt-4 overflow-hidden rounded-3xl border border-line bg-ink-1 px-6 py-12 sm:px-12">
          <div className="sprockets absolute inset-y-0 left-0 w-4 bg-ink-3" />
          <div className="sprockets absolute inset-y-0 right-0 w-4 bg-ink-3" />
          <div className="relative max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Idea → Script → Assets → Storyboard → Film</div>
            <h1 className="mt-4 font-serif text-4xl font-black leading-tight sm:text-6xl">
              一个人，<br />就是一个剧组。
            </h1>
            <p className="mt-4 max-w-xl text-dim">
              从一句创意或一部小说出发，AI 帮你完成分集剧本、角色与场景定妆、智能分镜、分镜配图、图生视频与配音，最后在时间线上合成成片。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>新建作品</Button>
              <QuickSample />
            </div>
          </div>
          <div className="relative mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [Sparkles, '创意成剧', '一句话生成多集剧本'],
              [BookOpenText, '小说改编', '长文本自动拆分分集'],
              [Clapperboard, '智能分镜', '景别·运镜·台词·时长'],
              [Film, '图生视频', '逐镜生成并合成成片'],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Sparkles;
              return (
                <div key={t as string} className="rounded-xl border border-line bg-ink-0/60 p-4">
                  <I className="size-5 text-amber" />
                  <div className="mt-2 text-sm font-semibold">{t as string}</div>
                  <div className="text-xs text-dim">{d as string}</div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mb-4 mt-12 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-black">我的作品 <span className="font-mono text-sm text-faint">{list.length}</span></h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button onClick={() => setOpen(true)} className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line text-dim transition hover:border-amber hover:text-amber">
            <Plus className="size-8" />
            <span className="mt-2 text-sm">新建作品</span>
          </button>
          {list.map((p) => {
            const st = projectStats(p);
            const ck = coverKey(p);
            return (
              <div key={p.id} onClick={() => go(`/p/${p.id}/story`)}
                className="group relative flex aspect-[4/5] cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-ink-1 transition hover:border-amber/60">
                <div className="relative flex-1 overflow-hidden bg-ink-2">
                  {ck ? <MediaImg k={ck} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                      : <div className="grid size-full place-items-center font-serif text-5xl font-black text-ink-3">{p.name.slice(0, 1)}</div>}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className="rounded-full bg-ink-0/80 px-2 py-0.5 text-[10px]">{FORMATS.find((f) => f.id === p.format)?.name}</span>
                    <span className="rounded-full bg-ink-0/80 px-2 py-0.5 font-mono text-[10px]">{p.aspect}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`删除「${p.name}」？此操作不可恢复`)) removeProject(p.id); }}
                    className="absolute right-3 top-3 hidden cursor-pointer rounded-full bg-ink-0/80 p-1.5 text-dim hover:text-vermilion group-hover:block">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="truncate font-serif text-lg font-bold">{p.name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[11px] text-faint">
                    <span>{st.episodes} 集</span><span>{st.shots} 镜</span><span>{st.videos} 视频</span><span>{timeAgo(p.updatedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <NewProjectModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function QuickSample() {
  const create = useStore((s) => s.createProject);
  return (
    <Button icon={<Wand2 className="size-4" />} onClick={() => {
      const id = create({ name: '未命名作品', idea: SAMPLE_IDEA, genre: '都市逆袭', format: 'short-drama', aspect: '9:16', styleId: 'manhwa' });
      go(`/p/${id}/story`);
    }}>用示例创意开始</Button>
  );
}

function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useStore((s) => s.createProject);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<ProjectFormat>('short-drama');
  const [aspect, setAspect] = useState<Aspect>('9:16');
  const [genre, setGenre] = useState(GENRES[0]);
  const [styleId, setStyleId] = useState(STYLE_PRESETS[0].id);

  return (
    <Modal open={open} onClose={onClose} title="新建作品" width="max-w-2xl">
      <div className="space-y-5">
        <div>
          <Label>作品名称</Label>
          <input className="field" autoFocus value={name} placeholder="留空则由 AI 起名" onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>作品形式</Label>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <button key={f.id} onClick={() => { setFormat(f.id); setAspect(f.id === 'film' ? '16:9' : '9:16'); }}
                className={`cursor-pointer rounded-xl border p-3 text-left transition ${format === f.id ? 'border-amber bg-amber-soft' : 'border-line hover:border-dim'}`}>
                <div className="text-sm font-semibold">{f.name}</div>
                <div className="mt-0.5 text-[11px] text-dim">{f.hint}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <Label>画幅</Label>
            <Segmented value={aspect} onChange={setAspect} options={[{ id: '9:16', name: '9:16 竖屏' }, { id: '16:9', name: '16:9 横屏' }, { id: '1:1', name: '1:1' }]} />
          </div>
          <div className="min-w-48 flex-1">
            <Label>题材</Label>
            <select className="field" value={genre} onChange={(e) => setGenre(e.target.value)}>
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label hint="之后可在「画风」中修改">画风</Label>
          <div className="grid grid-cols-4 gap-2">
            {STYLE_PRESETS.map((s) => (
              <button key={s.id} onClick={() => setStyleId(s.id)}
                className={`cursor-pointer overflow-hidden rounded-xl border text-left transition ${styleId === s.id ? 'border-amber' : 'border-line hover:border-dim'}`}>
                <div className="h-8" style={{ background: `linear-gradient(120deg, ${s.swatch[0]}, ${s.swatch[1]})` }} />
                <div className="px-2 py-1.5 text-xs">{s.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={() => {
            const id = create({ name: name.trim() || '未命名作品', format, aspect, genre, styleId });
            onClose();
            go(`/p/${id}/story`);
          }}>创建并进入工作台</Button>
        </div>
      </div>
    </Modal>
  );
}
