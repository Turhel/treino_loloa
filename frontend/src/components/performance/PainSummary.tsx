import { useEffect, useMemo, useState } from "react";
import type { PainStats } from "../../utils/performance";

const pageSize = 6;

export function PainSummary({ stats }: { stats: PainStats }) {
  const [areaPage, setAreaPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const areaPages = Math.max(1, Math.ceil(stats.areas.length / pageSize));
  const recentPages = Math.max(1, Math.ceil(stats.recent.length / pageSize));
  const visibleAreas = useMemo(() => stats.areas.slice((areaPage - 1) * pageSize, areaPage * pageSize), [areaPage, stats.areas]);
  const visibleRecent = useMemo(() => stats.recent.slice((recentPage - 1) * pageSize, recentPage * pageSize), [recentPage, stats.recent]);

  useEffect(() => {
    setAreaPage(1);
    setRecentPage(1);
  }, [stats.areas, stats.recent]);

  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <h2 className="text-xl font-black text-zinc-50">Dor/desconforto</h2>
      {stats.alerts.length > 0 && <div className="mt-4 grid gap-2">{stats.alerts.map((alert) => <p key={alert} className="rounded-2xl border border-orange-900 bg-orange-950/40 px-4 py-3 text-sm font-bold text-orange-100">{alert}</p>)}</div>}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-500">Áreas frequentes</h3>
          <div className="mt-2 grid gap-2">{visibleAreas.length ? visibleAreas.map((area) => <p key={area.label} className="flex justify-between rounded-xl bg-zinc-950 px-3 py-2 text-sm text-zinc-300"><span>{area.label}</span><strong>{area.count}</strong></p>) : <p className="text-sm text-zinc-500">Sem registros de dor no período.</p>}</div>
          <Pagination page={areaPage} totalPages={areaPages} onPageChange={setAreaPage} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-500">Últimos registros</h3>
          <div className="mt-2 grid gap-2">{visibleRecent.length ? visibleRecent.map((entry) => <p key={entry.id ?? `${entry.date}-${entry.text}`} className="rounded-xl bg-zinc-950 px-3 py-2 text-sm text-zinc-300">{entry.date} · nível {entry.level} · {entry.text || "sem área informada"}</p>) : <p className="text-sm text-zinc-500">Nada para listar.</p>}</div>
          <Pagination page={recentPage} totalPages={recentPages} onPageChange={setRecentPage} />
        </div>
      </div>
    </section>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="text-xs font-bold text-zinc-500">Página {page} de {totalPages}</p>
      <div className="flex gap-2">
        <button type="button" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))} className="cute-button cute-button-secondary min-h-0 px-3 py-2 text-xs disabled:opacity-40">Anterior</button>
        <button type="button" disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} className="cute-button cute-button-secondary min-h-0 px-3 py-2 text-xs disabled:opacity-40">Próxima</button>
      </div>
    </div>
  );
}
