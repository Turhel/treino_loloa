import type { ReactNode } from "react";

export function PerformanceMetricCard({ title, value, description, icon }: { title: string; value: string; description: string; icon?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{title}</p>
        {icon && <span className="text-zinc-400">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-black text-zinc-50">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}
