import type { PainStats } from "../../utils/performance";

export function PainSummary({ stats }: { stats: PainStats }) {
  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <h2 className="text-xl font-black text-zinc-50">Dor/desconforto</h2>
      {stats.alerts.length > 0 && <div className="mt-4 grid gap-2">{stats.alerts.map((alert) => <p key={alert} className="rounded-2xl border border-orange-900 bg-orange-950/40 px-4 py-3 text-sm font-bold text-orange-100">{alert}</p>)}</div>}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div><h3 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-500">Áreas frequentes</h3><div className="mt-2 grid gap-2">{stats.areas.length ? stats.areas.map((area) => <p key={area.label} className="flex justify-between rounded-xl bg-zinc-950 px-3 py-2 text-sm text-zinc-300"><span>{area.label}</span><strong>{area.count}</strong></p>) : <p className="text-sm text-zinc-500">Sem registros de dor no período.</p>}</div></div>
        <div><h3 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-500">Últimos registros</h3><div className="mt-2 grid gap-2">{stats.recent.length ? stats.recent.map((entry) => <p key={entry.id ?? `${entry.date}-${entry.text}`} className="rounded-xl bg-zinc-950 px-3 py-2 text-sm text-zinc-300">{entry.date} · nível {entry.level} · {entry.text || "sem área informada"}</p>) : <p className="text-sm text-zinc-500">Nada para listar.</p>}</div></div>
      </div>
    </section>
  );
}
