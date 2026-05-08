import type { ExerciseProgressRow } from "../../utils/performance";

function formatLoad(value: number | null) {
  return value ? `${value} kg` : "-";
}

export function ExerciseProgressTable({ rows }: { rows: ExerciseProgressRow[] }) {
  if (!rows.length) return <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-6 text-sm font-bold text-zinc-400">Sem exercícios para os filtros atuais.</div>;
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <h2 className="text-xl font-black text-zinc-50">Evolução por exercício</h2>
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-y border-zinc-800 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-400">
            <tr><th className="px-4 py-3">Exercício</th><th className="px-4 py-3">Última carga</th><th className="px-4 py-3">Últimas reps</th><th className="px-4 py-3">Melhor carga</th><th className="px-4 py-3">Melhor volume</th><th className="px-4 py-3">Sessões</th><th className="px-4 py-3">Sugestão</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((row) => <tr key={row.exerciseId} className="hover:bg-zinc-800/40"><td className="px-4 py-3 font-black text-zinc-100">{row.exerciseName}</td><td className="px-4 py-3 text-zinc-300">{formatLoad(row.lastLoad)}</td><td className="px-4 py-3 text-zinc-300">{row.lastReps}</td><td className="px-4 py-3 text-zinc-300">{formatLoad(row.bestLoad)}</td><td className="px-4 py-3 text-zinc-300">{row.bestVolume} kg</td><td className="px-4 py-3 text-zinc-300">{row.sessions}</td><td className="px-4 py-3"><span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-zinc-200 ring-1 ring-zinc-800">{row.suggestion}</span></td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 md:hidden">
        {rows.map((row) => (
          <article key={row.exerciseId} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-start justify-between gap-3"><h3 className="font-black text-zinc-50">{row.exerciseName}</h3><span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-black text-zinc-300">{row.sessions} sessões</span></div>
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
    </section>
  );
}
