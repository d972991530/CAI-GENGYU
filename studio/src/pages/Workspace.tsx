import { useEffect, useState } from 'react';
import { ArrowLeft, Settings2, ListChecks, ScrollText, Palette, Users, LayoutPanelTop, Clapperboard, MonitorPlay, Check } from 'lucide-react';
import { useStore } from '../store/store';
import { go } from '../lib/router';
import { Brand } from '../components/Brand';
import { Button } from '../components/ui';
import { JobsDrawer } from '../components/JobsDrawer';
import StoryPage from './StoryPage';
import StylePage from './StylePage';
import AssetsPage from './AssetsPage';
import StoryboardPage from './StoryboardPage';
import ProducePage from './ProducePage';
import FinalPage from './FinalPage';
import type { Project } from '../types';

const STEPS = [
  { id: 'story', name: '故事', en: 'Story', icon: ScrollText, done: (p: Project) => p.episodes.length > 0 },
  { id: 'style', name: '画风', en: 'Look', icon: Palette, done: (p: Project) => !!p.styleId },
  { id: 'assets', name: '资产', en: 'Cast & Set', icon: Users, done: (p: Project) => p.characters.length > 0 && p.characters.every((c) => c.imageKey) },
  { id: 'storyboard', name: '分镜', en: 'Board', icon: LayoutPanelTop, done: (p: Project) => p.episodes.some((e) => e.shots.length) },
  { id: 'produce', name: '制作', en: 'Shoot', icon: Clapperboard, done: (p: Project) => p.episodes.some((e) => e.shots.length && e.shots.every((s) => s.imageKey)) },
  { id: 'final', name: '成片', en: 'Cut', icon: MonitorPlay, done: (p: Project) => p.episodes.some((e) => e.shots.length && e.shots.every((s) => s.videoKey)) },
];

export interface StepProps { p: Project; epId?: string; setEpId: (id: string) => void }

export default function Workspace({ pid, step, onSettings }: { pid: string; step: string; onSettings: () => void }) {
  const p = useStore((s) => s.projects[pid]);
  const patch = useStore((s) => s.patch);
  const running = useStore((s) => s.jobs.filter((j) => j.status === 'running' || j.status === 'queued').length);
  const [epId, setEpId] = useState<string>();
  const [jobsOpen, setJobsOpen] = useState(false);

  useEffect(() => {
    if (p && (!epId || !p.episodes.some((e) => e.id === epId))) setEpId(p.episodes[0]?.id);
  }, [p, epId]);

  if (!p) {
    return (
      <div className="grid h-full place-items-center">
        <div className="text-center">
          <p className="text-dim">作品不存在或已删除</p>
          <Button className="mt-4" onClick={() => go('/')}>返回作品库</Button>
        </div>
      </div>
    );
  }

  const props: StepProps = { p, epId, setEpId };
  const Page = { story: StoryPage, style: StylePage, assets: AssetsPage, storyboard: StoryboardPage, produce: ProducePage, final: FinalPage }[step] ?? StoryPage;

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* 左侧流程轨 */}
      <aside className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-ink-1 px-2 py-2 md:w-24 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-0 md:py-4">
        <button onClick={() => go('/')} className="mb-0 cursor-pointer md:mb-6" title="作品库"><Brand compact /></button>
        {STEPS.map((s, i) => {
          const active = s.id === step;
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => go(`/p/${pid}/${s.id}`)}
              className={`group relative flex shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl px-3 py-2 transition md:w-20 md:py-3 ${active ? 'bg-ink-3 text-paper' : 'text-faint hover:text-paper'}`}>
              {active && <span className="absolute left-0 top-1/2 hidden h-8 w-1 -translate-y-1/2 rounded-r bg-amber md:block" />}
              <div className="relative">
                <Icon className={`size-5 ${active ? 'text-amber' : ''}`} />
                {s.done(p) && <Check className="absolute -right-2 -top-1.5 size-3 rounded-full bg-jade p-px text-ink-0" />}
              </div>
              <span className="text-xs font-medium">{s.name}</span>
              <span className="hidden font-mono text-[9px] uppercase tracking-wider opacity-60 md:block">{String(i + 1).padStart(2, '0')} {s.en}</span>
            </button>
          );
        })}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
          <button onClick={() => go('/')} className="cursor-pointer text-dim hover:text-paper" title="返回"><ArrowLeft className="size-4" /></button>
          <input value={p.name} onChange={(e) => patch(pid, (x) => (x.name = e.target.value))}
            className="min-w-0 flex-1 bg-transparent font-serif text-lg font-bold outline-none focus:text-amber" />
          {p.episodes.length > 0 && ['storyboard', 'produce', 'final'].includes(step) && (
            <select value={epId} onChange={(e) => setEpId(e.target.value)} className="field !w-auto max-w-56 !py-1.5 text-xs">
              {p.episodes.map((e, i) => <option key={e.id} value={e.id}>{`E${String(i + 1).padStart(2, '0')} · ${e.title}`}</option>)}
            </select>
          )}
          <Button size="sm" variant={running ? 'outline' : 'ghost'} onClick={() => setJobsOpen(true)}
            icon={<ListChecks className={`size-4 ${running ? 'text-amber' : ''}`} />}>
            <span className="hidden sm:inline">任务</span>{running > 0 && <span className="font-mono text-amber">{running}</span>}
          </Button>
          <Button size="sm" variant="ghost" onClick={onSettings} icon={<Settings2 className="size-4" />} />
        </header>
        <main className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
            <Page {...props} />
          </div>
        </main>
      </div>
      <JobsDrawer open={jobsOpen} onClose={() => setJobsOpen(false)} />
    </div>
  );
}
