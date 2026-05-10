import type { WeeklyCaloriesItem } from "../../utils/performance";

export function WeeklyCaloriesChart({ items }: { items: WeeklyCaloriesItem[] }) {
  const visibleItems = items.slice(-12);
  const maxCalories = Math.max(...visibleItems.map((item) => item.totalCalories), 1);

  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-zinc-50">Queima calórica semanal</h2>
          <p className="mt-1 text-sm text-zinc-400">Estimativa somando treino e cardio registrados.</p>
        </div>
        <span className="rounded-full bg-amber-950/70 px-3 py-1 text-xs font-black text-amber-200 ring-1 ring-amber-800">
          {visibleItems.reduce((sum, item) => sum + item.totalCalories, 0)} kcal
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {visibleItems.length ? (
          visibleItems.map((item) => {
            const trainingPercent = item.totalCalories ? Math.round((item.trainingCalories / item.totalCalories) * 100) : 0;
            const cardioPercent = item.totalCalories ? 100 - trainingPercent : 0;
            const width = Math.max((item.totalCalories / maxCalories) * 100, 8);

            return (
              <div key={item.weekStart} className="grid gap-2 sm:grid-cols-[4.5rem_1fr_5rem] sm:items-center">
                <div className="text-xs font-black text-zinc-500">{item.label}</div>
                <div title={`${item.totalCalories} kcal`} className="h-5 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-zinc-800">
                  <div className="flex h-full rounded-full" style={{ width: `${width}%` }}>
                    <div className="h-full bg-amber-400" style={{ width: `${trainingPercent}%` }} />
                    <div className="h-full bg-teal-400" style={{ width: `${cardioPercent}%` }} />
                  </div>
                </div>
                <div className="text-sm font-black text-zinc-200">{item.totalCalories} kcal</div>
              </div>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-4 text-sm font-bold text-zinc-500">Sem calorias estimadas no período.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-zinc-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" />Treino</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal-400" />Cardio</span>
      </div>
    </section>
  );
}
