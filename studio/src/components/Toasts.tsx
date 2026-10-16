import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useStore } from '../store/store';

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-lg items-center gap-2 rounded-full border border-line bg-ink-2/95 px-4 py-2 text-sm shadow-xl backdrop-blur">
          {t.tone === 'ok' ? <CheckCircle2 className="size-4 text-jade" /> : t.tone === 'error' ? <AlertTriangle className="size-4 text-vermilion" /> : <Info className="size-4 text-amber" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
