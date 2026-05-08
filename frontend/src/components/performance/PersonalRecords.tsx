import type { PersonalRecord } from "../../utils/performance";

export function PersonalRecords({ records }: { records: PersonalRecord[] }) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <h2 className="text-xl font-black text-zinc-50">Recordes</h2>
      <div className="mt-4 grid gap-3">
        {records.length ? records.map((record) => (
          <article key={`${record.exerciseId}-${record.type}-${record.date}`} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-950 px-4 py-3">
            <div><p className="font-black text-zinc-50">{record.exerciseName}</p><p className="text-sm text-zinc-500">{record.type} · {record.date}</p></div>
            <strong className="rounded-full bg-violet-950/70 px-3 py-1 text-xs text-violet-100 ring-1 ring-violet-800">{record.value}</strong>
          </article>
        )) : <p className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-4 text-sm font-bold text-zinc-400">Sem recordes suficientes ainda.</p>}
      </div>
    </section>
  );
}
