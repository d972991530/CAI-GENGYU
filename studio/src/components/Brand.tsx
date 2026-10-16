export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid size-9 place-items-center rounded-lg bg-amber text-ink-0">
        <span className="font-serif text-lg font-black leading-none">镜</span>
        <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-ink-0 bg-vermilion" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-serif text-base font-black tracking-wider">镜坊</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">AI Film Atelier</div>
        </div>
      )}
    </div>
  );
}
