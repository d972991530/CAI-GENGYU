import { useState } from 'react';
import { ArrowRight, Image as ImageIcon, Film, Mic, Upload, Play, Clapperboard, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/store';
import { batch, generateShotAudio, generateShotImage, generateShotVideo } from '../store/actions';
import { Button, Empty, Panel, SectionTitle, StatusPill } from '../components/ui';
import { MediaImg, MediaVideo, useMediaUrl } from '../components/Media';
import { putMedia } from '../lib/db';
import { go } from '../lib/router';
import type { Project, Shot } from '../types';
import type { StepProps } from './Workspace';

export default function ProducePage({ p, epId }: StepProps) {
  const ep = p.episodes.find((e) => e.id === epId);
  const [overwrite, setOverwrite] = useState(false);
  if (!ep || !ep.shots.length) {
    return <Empty icon={<Clapperboard className="size-10" />} title="这一集还没有分镜" desc="先在「分镜」中生成分镜表。" action={<Button onClick={() => go(`/p/${p.id}/storyboard`)}>去分镜</Button>} />;
  }
  const n = ep.shots.length;
  const count = (k: 'imageKey' | 'videoKey' | 'audioKey') => ep.shots.filter((s) => s[k]).length;
  const withLines = ep.shots.filter((s) => s.dialogue).length;

  return (
    <>
      <SectionTitle no="05 / SHOOT" title="分镜配图 · 图生视频 · 配音" desc="逐镜生成画面：分镜图会参考角色定妆与场景概念图；视频以分镜图为首帧生成；有台词的镜头按角色音色配音。"
        right={<Button variant="primary" onClick={() => go(`/p/${p.id}/final`)} icon={<ArrowRight className="size-4" />}>下一步：成片</Button>} />

      <Panel className="mb-6 grid gap-4 p-5 md:grid-cols-[1fr_1fr_1fr_auto]">
        <Progress icon={<ImageIcon className="size-4" />} label="分镜图" done={count('imageKey')} total={n}
          action={<Button size="sm" onClick={() => batch(p.id, ep.id, 'image', !overwrite)}>批量配图</Button>} />
        <Progress icon={<Film className="size-4" />} label="视频" done={count('videoKey')} total={n}
          action={<Button size="sm" onClick={() => batch(p.id, ep.id, 'video', !overwrite)}>批量生成</Button>} />
        <Progress icon={<Mic className="size-4" />} label="配音" done={count('audioKey')} total={withLines}
          action={<Button size="sm" onClick={() => batch(p.id, ep.id, 'audio', !overwrite)}>批量配音</Button>} />
        <label className="flex cursor-pointer items-center gap-2 self-center text-xs text-dim">
          <input type="checkbox" className="accent-amber" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
          批量时覆盖已有结果
        </label>
      </Panel>

      <div className={`grid gap-4 ${p.aspect === '9:16' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
        {ep.shots.map((s, i) => <ShotCard key={s.id} p={p} epId={ep.id} s={s} i={i} />)}
      </div>
    </>
  );
}

function Progress({ icon, label, done, total, action }: { icon: React.ReactNode; label: string; done: number; total: number; action: React.ReactNode }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="text-amber">{icon}</span>{label}
        <span className="font-mono text-xs text-faint">{done}/{total}</span>
        <div className="flex-1" />{action}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-3"><div className="h-full bg-amber transition-all" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function ShotCard({ p, epId, s, i }: { p: Project; epId: string; s: Shot; i: number }) {
  const patch = useStore((st) => st.patch);
  const [view, setView] = useState<'image' | 'video'>(s.videoKey ? 'video' : 'image');
  const audioUrl = useMediaUrl(s.audioKey);
  const busyImg = s.imageStatus === 'running' || s.imageStatus === 'queued';
  const busyVid = s.videoStatus === 'running' || s.videoStatus === 'queued';
  const showVideo = view === 'video' && s.videoKey;
  const chars = p.characters.filter((c) => s.characterIds.includes(c.id)).map((c) => c.name);

  return (
    <Panel className="flex flex-col overflow-hidden">
      <div className="group relative bg-ink-0" style={{ aspectRatio: p.aspect.replace(':', '/') }}>
        {busyImg && !s.imageKey ? <div className="shimmer size-full" />
          : showVideo ? <MediaVideo k={s.videoKey} className="size-full object-cover" controls loop playsInline />
          : s.imageKey ? <MediaImg k={s.imageKey} className={`size-full object-cover ${busyImg ? 'opacity-40' : ''}`} />
          : <div className="flex size-full items-center justify-center p-4 text-center text-xs leading-relaxed text-faint">{s.description}</div>}
        <span className="absolute left-2 top-2 rounded bg-ink-0/80 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber">{String(i + 1).padStart(2, '0')}</span>
        <span className="absolute right-2 top-2 rounded bg-ink-0/80 px-1.5 py-0.5 font-mono text-[10px]">{s.scale}·{s.camera}·{s.duration}s</span>
        {busyVid && <span className="absolute bottom-2 left-2 rounded-full bg-ink-0/80 px-2 py-0.5 text-[10px] text-amber">视频生成中…</span>}
        {!showVideo && (
          <label className="absolute bottom-2 right-2 hidden cursor-pointer rounded-full bg-ink-0/80 p-1.5 text-dim hover:text-amber group-hover:block" title="上传替换分镜图">
            <Upload className="size-3.5" />
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const key = await putMedia(f);
              patch(p.id, (x) => { const t = x.episodes.find((e) => e.id === epId)?.shots.find((y) => y.id === s.id); if (t) { t.imageKey = key; t.imageStatus = 'done'; } });
            }} />
          </label>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-xs leading-relaxed text-paper/85" title={s.description}>{s.description}</p>
        {s.dialogue && <p className="line-clamp-2 border-l-2 border-amber/60 pl-2 text-xs text-dim"><b className="text-paper/70">{s.speaker ?? '旁白'}：</b>{s.dialogue}</p>}
        {chars.length > 0 && <p className="text-[10px] text-faint">出镜：{chars.join('、')}</p>}
        {s.error && <p className="flex items-start gap-1 text-[10px] text-vermilion"><AlertTriangle className="mt-px size-3 shrink-0" /><span className="line-clamp-2">{s.error}</span></p>}
        <div className="flex flex-wrap gap-1">
          <StatusPill status={s.imageStatus} label="图" />
          <StatusPill status={s.videoStatus} label="视频" />
          {s.dialogue && <StatusPill status={s.audioStatus} label="配音" />}
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <Button size="sm" disabled={busyImg} onClick={() => generateShotImage(p.id, epId, s.id)} icon={<ImageIcon className="size-3.5" />}>{s.imageKey ? '重绘' : '配图'}</Button>
          <Button size="sm" disabled={!s.imageKey || busyVid} onClick={() => generateShotVideo(p.id, epId, s.id)} icon={<Film className="size-3.5" />}>视频</Button>
          {s.dialogue && <Button size="sm" onClick={() => generateShotAudio(p.id, epId, s.id)} icon={<Mic className="size-3.5" />}>配音</Button>}
          {audioUrl && <Button size="sm" variant="ghost" onClick={() => new Audio(audioUrl).play()} icon={<Play className="size-3.5" />} />}
          {s.videoKey && (
            <Button size="sm" variant="ghost" onClick={() => setView(view === 'video' ? 'image' : 'video')}>{view === 'video' ? '看图' : '看视频'}</Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
