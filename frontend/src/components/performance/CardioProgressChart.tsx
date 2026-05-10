import type { CardioStats } from "../../utils/performance";

export function CardioProgressChart({ stats }: { stats: CardioStats }) {
  const maxDaily = Math.max(...stats.daily.map((item) => item.minutes), 1);
  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black text-zinc-50">Cardio</h2><p className="mt-1 text-sm text-zinc-400">{stats.sessions} sessão(ões), média de {stats.averageMinutes} min</p></div><span className="rounded-full bg-teal-950/70 px-3 py-1 text-xs font-black text-teal-200 ring-1 ring-teal-800">{stats.totalMinutes} min</span></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="grid gap-3">
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-500">Por tipo</h3>
          {stats.byType.length ? stats.byType.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-sm text-zinc-300"><span>{item.label}</span><span>{item.minutes} min</span></div><div className="h-2 rounded-full bg-zinc-950"><div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.max(item.percent, 4)}%` }} /></div></div>) : <p className="text-sm text-zinc-500">Sem cardio no período.</p>}
        </div>
        <div className="grid gap-3">
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-500">Intensidade</h3>
          {stats.byIntensity.length ? stats.byIntensity.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-sm text-zinc-300"><span>{item.label}</span><span>{item.minutes} min</span></div><div className="h-2 rounded-full bg-zinc-950"><div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.max(item.percent, 4)}%` }} /></div></div>) : <p className="text-sm text-zinc-500">Sem intensidade registrada.</p>}
        </div>
      </div>
      <div className="mt-5 flex h-24 items-end gap-1 rounded-2xl bg-zinc-950 p-3 ring-1 ring-zinc-800">
        {stats.daily.length ? stats.daily.slice(-30).map((item) => <div key={item.label} title={`${item.label}: ${item.minutes} min`} className="min-w-2 flex-1 rounded-t bg-teal-500" style={{ height: `${Math.max((item.minutes / maxDaily) * 100, 8)}%` }} />) : <p className="self-center text-sm font-bold text-zinc-500">Sem dados diários.</p>}
      </div>
    </section>
  );
}
