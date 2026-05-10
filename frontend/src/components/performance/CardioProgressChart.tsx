import { useEffect, useMemo, useState } from "react";
import type { CardioStats } from "../../utils/performance";

const pageSize = 30;

export function CardioProgressChart({ stats }: { stats: CardioStats }) {
  const [page, setPage] = useState(Math.max(1, Math.ceil(stats.daily.length / pageSize)));
  const totalPages = Math.max(1, Math.ceil(stats.daily.length / pageSize));
  const visibleDaily = useMemo(() => stats.daily.slice((page - 1) * pageSize, page * pageSize), [page, stats.daily]);
  const maxDaily = Math.max(...visibleDaily.map((item) => item.minutes), 1);

  useEffect(() => {
    setPage(Math.max(1, Math.ceil(stats.daily.length / pageSize)));
  }, [stats.daily]);

  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-zinc-50">Cardio</h2>
          <p className="mt-1 text-sm text-zinc-400">{stats.sessions} sessão(ões), média de {stats.averageMinutes} min</p>
        </div>
        <span className="rounded-full bg-teal-950/70 px-3 py-1 text-xs font-black text-teal-200 ring-1 ring-teal-800">{stats.totalMinutes} min</span>
      </div>
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
        {visibleDaily.length ? visibleDaily.map((item) => <div key={item.label} title={`${item.label}: ${item.minutes} min`} className="min-w-2 flex-1 rounded-t bg-teal-500" style={{ height: `${Math.max((item.minutes / maxDaily) * 100, 8)}%` }} />) : <p className="self-center text-sm font-bold text-zinc-500">Sem dados diários.</p>}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs font-bold text-zinc-500">Dias {page}/{totalPages}</p>
      <div className="flex gap-2">
        <button type="button" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))} className="cute-button cute-button-secondary min-h-0 px-3 py-2 text-xs disabled:opacity-40">Anterior</button>
        <button type="button" disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} className="cute-button cute-button-secondary min-h-0 px-3 py-2 text-xs disabled:opacity-40">Próxima</button>
      </div>
    </div>
  );
}
