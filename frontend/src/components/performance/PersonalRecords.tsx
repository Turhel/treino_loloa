import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PersonalRecord } from "../../utils/performance";

const pageSize = 5;

function PaginationControls({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs font-bold text-zinc-500">Página {page} de {totalPages}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página anterior de recordes"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Próxima página de recordes"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PersonalRecords({ records }: { records: PersonalRecord[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const visibleRecords = useMemo(() => records.slice((page - 1) * pageSize, page * pageSize), [page, records]);

  useEffect(() => {
    setPage(1);
  }, [records]);

  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-zinc-50">Recordes</h2>
          {!!records.length && <p className="mt-1 text-xs font-bold text-zinc-500">{records.length} recorde(s) encontrados</p>}
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {visibleRecords.length ? visibleRecords.map((record) => (
          <article key={`${record.exerciseId}-${record.type}-${record.date}`} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-950 px-4 py-3">
            <div className="min-w-0">
              <p className="break-words font-black text-zinc-50">{record.exerciseName}</p>
              <p className="text-sm text-zinc-500">{record.type} · {record.date}</p>
            </div>
            <strong className="shrink-0 rounded-full bg-violet-950/70 px-3 py-1 text-xs text-violet-100 ring-1 ring-violet-800">{record.value}</strong>
          </article>
        )) : <p className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-4 text-sm font-bold text-zinc-400">Sem recordes suficientes ainda.</p>}
      </div>
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}
