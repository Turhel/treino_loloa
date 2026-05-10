import type { ReactNode } from "react";

export function PerformanceMetricCard({ title, value, description, icon }: { title: string; value: string; description: string; icon?: ReactNode }) {
  return (
    <div title={description} className="cute-pop group inline-flex min-h-12 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-2 shadow-sm transition hover:border-zinc-600 hover:bg-zinc-900">
      {icon && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-950/70 text-rose-200 ring-1 ring-rose-800 transition group-hover:text-zinc-50">{icon}</span>}
      <div className="min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{title}</p>
        <div className="flex items-baseline gap-2">
          <strong className="text-base font-black text-zinc-50">{value}</strong>
          <span className="hidden max-w-[14rem] truncate text-xs font-semibold text-zinc-500 sm:inline">{description}</span>
        </div>
      </div>
    </div>
  );
}
