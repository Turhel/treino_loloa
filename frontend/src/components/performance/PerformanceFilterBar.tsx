import type { PerformanceFilters, PerformancePeriod } from "../../utils/performance";

const periods: { value: PerformancePeriod; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Tudo" },
];

export function PerformanceFilterBar({
  filters,
  onChange,
  exercises,
  muscles,
}: {
  filters: PerformanceFilters;
  onChange: (filters: PerformanceFilters) => void;
  exercises: { id: string; name: string }[];
  muscles: { id: string; label: string }[];
}) {
  const fieldClass = "rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 outline-none focus:border-zinc-400";
  return (
    <section className="cute-card grid gap-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm lg:grid-cols-[auto_1fr_1fr_auto_auto] lg:items-center">
      <select value={filters.period} onChange={(event) => onChange({ ...filters, period: event.target.value as PerformancePeriod })} className={fieldClass}>
        {periods.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}
      </select>
      <select value={filters.exerciseId} onChange={(event) => onChange({ ...filters, exerciseId: event.target.value })} className={fieldClass}>
        <option value="">Todos os exercícios</option>
        {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
      </select>
      <select value={filters.muscle} onChange={(event) => onChange({ ...filters, muscle: event.target.value })} className={fieldClass}>
        <option value="">Todos os músculos</option>
        {muscles.map((muscle) => <option key={muscle.id} value={muscle.id}>{muscle.label}</option>)}
      </select>
      <select value={filters.trainingType} onChange={(event) => onChange({ ...filters, trainingType: event.target.value })} className={fieldClass}>
        <option value="">Todos os tipos</option>
        <option value="glúteo">Glúteos</option>
        <option value="quadríceps">Inferiores</option>
        <option value="dorsal">Puxar</option>
        <option value="peito">Empurrar</option>
        <option value="core">Core</option>
      </select>
      <label className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300">
        <input type="checkbox" checked={filters.onlyWithHistory} onChange={(event) => onChange({ ...filters, onlyWithHistory: event.target.checked })} className="h-4 w-4 rounded border-zinc-700 accent-emerald-500" />
        Com histórico
      </label>
    </section>
  );
}
