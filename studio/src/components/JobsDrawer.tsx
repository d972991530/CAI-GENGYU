import { X, Loader2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { clearFinishedJobs, useStore } from '../store/store';
import { Button } from './ui';

export function JobsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const jobs = useStore((s) => s.jobs);
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <aside className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-line bg-ink-1 transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-serif text-lg font-bold">生成任务</h2>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={clearFinishedJobs}>清除已完成</Button>
            <button onClick={onClose} className="cursor-pointer p-1 text-dim hover:text-paper"><X className="size-5" /></button>
          </div>
        </div>
        <div className="flex-1 space-y-2 overflow-auto p-4">
          {jobs.length === 0 && <p className="py-10 text-center text-sm text-faint">暂无任务</p>}
          {jobs.map((j) => (
            <div key={j.id} className="rounded-xl border border-line bg-ink-0 p-3">
              <div className="flex items-center gap-2 text-sm">
                {j.status === 'running' ? <Loader2 className="size-4 animate-spin text-amber" />
                  : j.status === 'done' ? <CheckCircle2 className="size-4 text-jade" />
                  : j.status === 'error' ? <AlertTriangle className="size-4 text-vermilion" />
                  : <Clock className="size-4 text-faint" />}
                <span className="flex-1 truncate">{j.label}</span>
                {j.finishedAt && j.startedAt && <span className="font-mono text-[10px] text-faint">{((j.finishedAt - j.startedAt) / 1000).toFixed(1)}s</span>}
              </div>
              {j.error && <p className="mt-1.5 break-all text-xs text-vermilion/80">{j.error}</p>}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
