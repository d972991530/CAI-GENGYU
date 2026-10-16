import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Download, Captions, FileJson, FileText, Clapperboard, Loader2 } from 'lucide-react';
import { useStore } from '../store/store';
import { Button, Empty, Panel, SectionTitle } from '../components/ui';
import { MediaImg, useMediaUrl } from '../components/Media';
import { renderEpisode } from '../lib/render';
import { download, srtTime } from '../lib/util';
import { go } from '../lib/router';
import type { Episode, Project, Shot } from '../types';
import type { StepProps } from './Workspace';

export default function FinalPage({ p, epId }: StepProps) {
  const toast = useStore((s) => s.toast);
  const ep = p.episodes.find((e) => e.id === epId);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [subs, setSubs] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [rendered, setRendered] = useState<string>();

  useEffect(() => { setIdx(0); setPlaying(false); setRendered(undefined); }, [epId]);

  // 播放控制：按镜头时长推进
  useEffect(() => {
    if (!playing || !ep) return;
    const shot = ep.shots[idx];
    if (!shot) { setPlaying(false); return; }
    const t = setTimeout(() => {
      if (idx + 1 < ep.shots.length) setIdx(idx + 1); else { setPlaying(false); setIdx(0); }
    }, shot.duration * 1000);
    return () => clearTimeout(t);
  }, [playing, idx, ep]);

  if (!ep || !ep.shots.length) {
    return <Empty icon={<Clapperboard className="size-10" />} title="没有可预览的镜头" action={<Button onClick={() => go(`/p/${p.id}/storyboard`)}>去分镜</Button>} />;
  }
  const total = ep.shots.reduce((a, s) => a + s.duration, 0);
  const startOf = (i: number) => ep.shots.slice(0, i).reduce((a, s) => a + s.duration, 0);
  const shot = ep.shots[Math.min(idx, ep.shots.length - 1)];
  const ready = ep.shots.filter((s) => s.videoKey || s.imageKey).length;

  const doRender = async () => {
    setProgress(0); setRendered(undefined);
    try {
      const blob = await renderEpisode(ep, p.aspect, { subtitles: subs }, setProgress);
      setRendered(URL.createObjectURL(blob));
      toast('成片合成完成', 'ok');
    } catch (e) {
      toast(`合成失败：${(e as Error).message}`, 'error');
    } finally { setProgress(null); }
  };

  return (
    <>
      <SectionTitle no="06 / FINAL CUT" title="成片预览与导出" desc="按分镜时长串联所有镜头，叠加字幕与配音预览；可直接在浏览器内合成整集视频并导出字幕、分镜脚本与工程文件。" />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="mx-auto overflow-hidden rounded-2xl border border-line bg-black"
            style={{ aspectRatio: p.aspect.replace(':', '/'), maxHeight: '68vh', maxWidth: p.aspect === '9:16' ? 'calc(68vh * 9 / 16)' : undefined }}>
            <Stage key={`${shot.id}-${playing}`} shot={shot} index={idx} playing={playing} subs={subs} />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="ghost" onClick={() => setIdx(Math.max(0, idx - 1))} icon={<SkipBack className="size-4" />} />
            <Button variant="primary" onClick={() => setPlaying(!playing)} icon={playing ? <Pause className="size-4" /> : <Play className="size-4" />}>
              {playing ? '暂停' : '播放'}
            </Button>
            <Button variant="ghost" onClick={() => setIdx(Math.min(ep.shots.length - 1, idx + 1))} icon={<SkipForward className="size-4" />} />
            <span className="ml-3 font-mono text-xs text-dim">{startOf(idx)}s / {total}s</span>
            <label className="ml-3 flex cursor-pointer items-center gap-1.5 text-xs text-dim">
              <input type="checkbox" className="accent-amber" checked={subs} onChange={(e) => setSubs(e.target.checked)} /><Captions className="size-3.5" />字幕
            </label>
          </div>

          {/* 时间线 */}
          <div className="mt-5 flex h-20 gap-0.5 overflow-x-auto rounded-xl border border-line bg-ink-1 p-1.5">
            {ep.shots.map((s, i) => (
              <button key={s.id} onClick={() => setIdx(i)} title={`${i + 1}. ${s.description}`}
                style={{ flex: `${s.duration} 0 ${s.duration * 22}px` }}
                className={`relative cursor-pointer overflow-hidden rounded-md border-2 transition ${i === idx ? 'border-amber' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                {s.imageKey ? <MediaImg k={s.imageKey} className="size-full object-cover" /> : <div className="size-full bg-ink-3" />}
                <span className="absolute bottom-0.5 left-1 font-mono text-[9px] text-white drop-shadow">{i + 1}{s.videoKey ? ' ▶' : ''}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Panel className="p-5">
            <h3 className="font-serif text-lg font-bold">合成整集</h3>
            <p className="mt-1 text-xs text-dim">已就绪 {ready}/{ep.shots.length} 镜（有视频用视频，无视频用分镜图推拉）。合成为实时渲染，约需 {total} 秒，请保持页面在前台。</p>
            {progress !== null ? (
              <div className="mt-4">
                <div className="mb-1 flex items-center gap-2 text-xs text-amber"><Loader2 className="size-3.5 animate-spin" />渲染中 {Math.round(progress * 100)}%</div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-3"><div className="h-full bg-amber" style={{ width: `${progress * 100}%` }} /></div>
              </div>
            ) : (
              <Button variant="primary" className="mt-4 w-full" disabled={!ready} onClick={doRender} icon={<Clapperboard className="size-4" />}>开始合成</Button>
            )}
            {rendered && (
              <div className="mt-4 space-y-2">
                <video src={rendered} controls className="w-full rounded-lg border border-line" />
                <Button className="w-full" icon={<Download className="size-4" />} onClick={() => { const a = document.createElement('a'); a.href = rendered; a.download = `${p.name}-${ep.title}.webm`; a.click(); }}>下载 WebM</Button>
              </div>
            )}
          </Panel>
          <Panel className="space-y-2 p-5">
            <h3 className="mb-2 font-serif text-lg font-bold">导出</h3>
            <Button className="w-full !justify-start" icon={<Captions className="size-4" />} onClick={() => download(`${p.name}-${ep.title}.srt`, toSrt(ep))}>字幕 SRT</Button>
            <Button className="w-full !justify-start" icon={<FileText className="size-4" />} onClick={() => download(`${p.name}-分镜脚本.md`, toMarkdown(p))}>分镜脚本 Markdown（全集）</Button>
            <Button className="w-full !justify-start" icon={<FileJson className="size-4" />} onClick={() => download(`${p.name}.jingfang.json`, JSON.stringify(p, null, 2), 'application/json')}>工程文件 JSON</Button>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Stage({ shot, index, playing, subs }: { shot: Shot; index: number; playing: boolean; subs: boolean }) {
  const videoUrl = useMediaUrl(shot.videoKey);
  const imageUrl = useMediaUrl(shot.imageKey);
  const audioUrl = useMediaUrl(shot.audioKey);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => { if (playing && audioUrl) audioRef.current?.play().catch(() => {}); }, [playing, audioUrl]);

  return (
    <div className="relative size-full">
      {videoUrl ? <video src={videoUrl} className="size-full object-cover" autoPlay={playing} muted={!!audioUrl} loop playsInline />
        : imageUrl ? <img src={imageUrl} className="size-full object-cover" style={playing ? { animation: `kenburns ${shot.duration}s ease-out forwards` } : undefined} />
        : <div className="grid size-full place-items-center p-6 text-center text-sm text-faint">{shot.description}</div>}
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}
      <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] text-amber">SHOT {String(index + 1).padStart(2, '0')}</span>
      {subs && shot.dialogue && (
        <div className="absolute inset-x-0 bottom-[8%] px-6 text-center">
          {shot.speaker && shot.speaker !== '旁白' && <div className="text-xs font-semibold text-amber drop-shadow">{shot.speaker}</div>}
          <div className="text-lg font-bold text-white [text-shadow:0_0_4px_#000,0_2px_6px_#000]">{shot.dialogue}</div>
        </div>
      )}
    </div>
  );
}

function toSrt(ep: Episode) {
  let t = 0, n = 0;
  const out: string[] = [];
  for (const s of ep.shots) {
    if (s.dialogue) out.push(`${++n}\n${srtTime(t)} --> ${srtTime(t + s.duration)}\n${s.speaker && s.speaker !== '旁白' ? `${s.speaker}：` : ''}${s.dialogue}\n`);
    t += s.duration;
  }
  return out.join('\n');
}

function toMarkdown(p: Project) {
  const names = (ids: string[]) => p.characters.filter((c) => ids.includes(c.id)).map((c) => c.name).join('、');
  const scene = (id?: string) => p.scenes.find((s) => s.id === id)?.name ?? '';
  return [`# ${p.name}`, p.logline ? `> ${p.logline}` : '', '',
    ...p.episodes.flatMap((e, i) => [
      `## E${i + 1} ${e.title}`, e.summary, '',
      '| # | 景别 | 运镜 | 场景 | 角色 | 画面 | 台词 | 时长 |', '|---|---|---|---|---|---|---|---|',
      ...e.shots.map((s, j) => `| ${j + 1} | ${s.scale} | ${s.camera} | ${scene(s.sceneId)} | ${names(s.characterIds)} | ${s.description.replace(/\|/g, '/')} | ${s.dialogue ? `${s.speaker ?? ''}：${s.dialogue}`.replace(/\|/g, '/') : ''} | ${s.duration}s |`),
      '',
    ])].join('\n');
}
