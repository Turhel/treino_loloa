import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ExerciseProgressRow } from "../../utils/performance";

const pageSize = 6;

function formatLoad(value: number | null) {
  return value ? `${value} kg` : "-";
}

function PaginationControls({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs font-bold text-zinc-500">Página {page} de {totalPages}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ExerciseProgressTable({ rows }: { rows: ExerciseProgressRow[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, rows]);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  if (!rows.length) return <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-6 text-sm font-bold text-zinc-400">Sem exercícios para os filtros atuais.</div>;
  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-zinc-50">Evolução por exercício</h2>
          <p className="mt-1 text-xs font-bold text-zinc-500">{rows.length} exercício(s) nos filtros atuais</p>
        </div>
      </div>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-y border-zinc-800 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-400">
            <tr><th className="px-4 py-3">Exercício</th><th className="px-4 py-3">Última carga</th><th className="px-4 py-3">Últimas reps</th><th className="px-4 py-3">Melhor carga</th><th className="px-4 py-3">Melhor volume</th><th className="px-4 py-3">Sessões</th><th className="px-4 py-3">Sugestão</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {visibleRows.map((row) => <tr key={row.exerciseId} className="hover:bg-zinc-800/40"><td className="px-4 py-3 font-black text-zinc-100">{row.exerciseName}</td><td className="px-4 py-3 text-zinc-300">{formatLoad(row.lastLoad)}</td><td className="px-4 py-3 text-zinc-300">{row.lastReps}</td><td className="px-4 py-3 text-zinc-300">{formatLoad(row.bestLoad)}</td><td className="px-4 py-3 text-zinc-300">{row.bestVolume} kg</td><td className="px-4 py-3 text-zinc-300">{row.sessions}</td><td className="px-4 py-3"><span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-zinc-200 ring-1 ring-zinc-800">{row.suggestion}</span></td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {visibleRows.map((row) => (
          <article key={row.exerciseId} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 break-words font-black text-zinc-50">{row.exerciseName}</h3>
              <span className="shrink-0 rounded-full bg-zinc-900 px-3 py-1 text-xs font-black text-zinc-300">{row.sessions} sessões</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-300">
              <p><span className="text-zinc-500">Última carga</span><br />{formatLoad(row.lastLoad)}</p>
              <p><span className="text-zinc-500">Reps</span><br />{row.lastReps}</p>
              <p><span className="text-zinc-500">Melhor carga</span><br />{formatLoad(row.bestLoad)}</p>
              <p><span className="text-zinc-500">Melhor volume</span><br />{row.bestVolume} kg</p>
            </div>
            <p className="mt-3 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-black text-zinc-200">{row.suggestion}</p>
          </article>
        ))}
      </div>

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}
