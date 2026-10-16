import { type ButtonHTMLAttributes, type ReactNode, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import type { GenStatus } from '../types';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';
export function Button({ variant = 'outline', size = 'md', loading, icon, children, className = '', ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; loading?: boolean; icon?: ReactNode }) {
  const v = {
    primary: 'bg-amber text-ink-0 hover:brightness-110 font-semibold',
    ghost: 'text-dim hover:text-paper hover:bg-ink-3',
    outline: 'border border-line text-paper hover:border-amber/60 hover:bg-ink-2',
    danger: 'text-vermilion hover:bg-vermilion/10',
  }[variant];
  const s = size === 'sm' ? 'h-8 px-3 text-xs gap-1.5' : 'h-10 px-4 text-sm gap-2';
  return (
    <button {...rest} disabled={rest.disabled || loading}
      className={`inline-flex items-center justify-center rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap ${v} ${s} ${className}`}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-xs font-medium tracking-wide text-dim">{children}</span>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-ink-1 ${className}`}>{children}</section>;
}

export function SectionTitle({ no, title, desc, right }: { no?: string; title: string; desc?: string; right?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {no && <div className="font-mono text-xs text-amber">{no}</div>}
        <h1 className="font-serif text-3xl font-black tracking-tight">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-dim">{desc}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </header>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; name: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-ink-0 p-1">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs transition ${value === o.id ? 'bg-paper text-ink-0 font-semibold' : 'text-dim hover:text-paper'}`}>
          {o.name}
        </button>
      ))}
    </div>
  );
}

export function StatusPill({ status, label }: { status?: GenStatus; label: string }) {
  const map: Record<GenStatus, string> = {
    idle: 'text-faint border-line', queued: 'text-dim border-line', running: 'text-amber border-amber/40',
    done: 'text-jade border-jade/40', error: 'text-vermilion border-vermilion/40',
  };
  const st = status ?? 'idle';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${map[st]}`}>
      {st === 'running' && <Loader2 className="size-3 animate-spin" />}
      {label}
    </span>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className={`w-full ${width} max-h-[90vh] overflow-auto rounded-2xl border border-line bg-ink-1 shadow-2xl`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="cursor-pointer text-dim hover:text-paper"><X className="size-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <div className="mb-3 text-faint">{icon}</div>
      <div className="font-serif text-lg font-bold">{title}</div>
      {desc && <p className="mt-1 max-w-md text-sm text-dim">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
