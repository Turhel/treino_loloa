import type { MuscleVolumeItem } from "../../utils/performance";

export function MuscleVolumeChart({ items }: { items: MuscleVolumeItem[] }) {
  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <h2 className="text-xl font-black text-zinc-50">Volume por grupo muscular</h2>
      <div className="mt-4 grid gap-3">
        {items.length ? items.map((item) => (
          <div key={item.key}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="font-bold text-zinc-200">{item.label}</span><span className="text-zinc-400">{item.volume} kg</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-zinc-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(item.percent, 4)}%` }} /></div>
          </div>
        )) : <p className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-4 text-sm font-bold text-zinc-400">Sem volume registrado com carga e reps.</p>}
      </div>
    </section>
  );
}
