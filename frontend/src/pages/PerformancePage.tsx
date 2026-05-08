import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Dumbbell, Flame, HeartPulse, TrendingUp } from "lucide-react";
import { muscleImages } from "../data/muscleData";
import type { Logs } from "../types/training";
import { CardioProgressChart } from "../components/performance/CardioProgressChart";
import { ConsistencyCalendar } from "../components/performance/ConsistencyCalendar";
import { ExerciseProgressTable } from "../components/performance/ExerciseProgressTable";
import { MuscleVolumeChart } from "../components/performance/MuscleVolumeChart";
import { PainSummary } from "../components/performance/PainSummary";
import { PerformanceFilterBar } from "../components/performance/PerformanceFilterBar";
import { PerformanceMetricCard } from "../components/performance/PerformanceMetricCard";
import { PersonalRecords } from "../components/performance/PersonalRecords";
import {
  buildExerciseProgressRows,
  buildPerformanceInsights,
  calculateCardioStats,
  calculateConsistency,
  calculateMuscleVolume,
  calculatePainSummary,
  calculatePersonalRecords,
  filterExerciseEntries,
  normalizeExerciseHistory,
  parseNumber,
  type CardioPerformanceLog,
  type PainPerformanceLog,
  type PerformanceFilters,
} from "../utils/performance";
import { shouldIncrease } from "../utils/storage";

const periodLabels: Record<PerformanceFilters["period"], string> = {
  "7d": "nos últimos 7 dias",
  "30d": "nos últimos 30 dias",
  "90d": "nos últimos 90 dias",
  all: "em todo o histórico",
};

export function PerformancePage({
  logs,
  cardioLogs,
  painLogs,
  loading = false,
}: {
  logs: Logs;
  cardioLogs: CardioPerformanceLog[];
  painLogs: PainPerformanceLog[];
  loading?: boolean;
}) {
  const [filters, setFilters] = useState<PerformanceFilters>({ period: "30d", exerciseId: "", muscle: "", trainingType: "", onlyWithHistory: true });

  const allEntries = useMemo(() => normalizeExerciseHistory(logs), [logs]);
  const filteredEntries = useMemo(() => filterExerciseEntries(allEntries, filters), [allEntries, filters]);
  const exerciseRows = useMemo(() => buildExerciseProgressRows(filteredEntries), [filteredEntries]);
  const muscleVolume = useMemo(() => calculateMuscleVolume(filteredEntries), [filteredEntries]);
  const cardioStats = useMemo(() => calculateCardioStats(cardioLogs, filters.period), [cardioLogs, filters.period]);
  const consistency = useMemo(() => calculateConsistency(filteredEntries, cardioLogs, filters.period), [filteredEntries, cardioLogs, filters.period]);
  const painStats = useMemo(() => calculatePainSummary(painLogs, filters.period), [painLogs, filters.period]);
  const records = useMemo(() => calculatePersonalRecords(filteredEntries), [filteredEntries]);
  const insights = useMemo(() => buildPerformanceInsights({ entries: filteredEntries, muscleVolume, cardioStats, painStats, periodLabel: periodLabels[filters.period] }), [filteredEntries, muscleVolume, cardioStats, painStats, filters.period]);

  const exerciseOptions = useMemo(() => {
    const unique = new Map<string, string>();
    for (const entry of allEntries) unique.set(entry.exerciseId, entry.exerciseName);
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")).map(([id, name]) => ({ id, name }));
  }, [allEntries]);

  const muscleOptions = useMemo(() => Object.entries(muscleImages).map(([id, info]) => ({ id, label: info.title })).sort((a, b) => a.label.localeCompare(b.label, "pt-BR")), []);

  const uniqueTrainingDays = new Set(filteredEntries.filter((entry) => entry.log.done).map((entry) => entry.date).filter(Boolean)).size;
  const doneEntries = filteredEntries.filter((entry) => entry.log.done).length;
  const totalVolume = filteredEntries.reduce((sum, entry) => sum + entry.volume, 0);
  const progressionCount = filteredEntries.filter((entry) => shouldIncrease(entry.log)).length;
  const painCount = painStats.total;
  const hasAnyData = allEntries.length > 0 || cardioLogs.length > 0 || painLogs.length > 0;

  if (loading) {
    return <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center text-sm font-bold text-zinc-400">Carregando desempenho...</section>;
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">Desempenho</p>
        <h1 className="mt-1 text-3xl font-black text-zinc-50">Evolução do treino</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Leitura dos dados já salvos no app: carga, reps, cardio e desconfortos registrados. Nada é salvo automaticamente nesta tela.</p>
      </section>

      <PerformanceFilterBar filters={filters} onChange={setFilters} exercises={exerciseOptions} muscles={muscleOptions} />

      {!hasAnyData ? (
        <section className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
          <Dumbbell className="mx-auto h-10 w-10 text-zinc-500" />
          <h2 className="mt-4 text-xl font-black text-zinc-50">Ainda não há dados suficientes.</h2>
          <p className="mt-2 text-sm text-zinc-400">Salve sessões de treino para acompanhar desempenho.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <PerformanceMetricCard title="Treinos registrados" value={String(uniqueTrainingDays)} description="Dias únicos com exercícios feitos." icon={<Dumbbell className="h-5 w-5" />} />
            <PerformanceMetricCard title="Exercícios feitos" value={String(doneEntries)} description="Entradas marcadas como feitas." icon={<Activity className="h-5 w-5" />} />
            <PerformanceMetricCard title="Volume estimado" value={`${totalVolume} kg`} description="Carga x soma das repetições." icon={<Flame className="h-5 w-5" />} />
            <PerformanceMetricCard title="Progressões" value={String(progressionCount)} description="Entradas que bateram 3x15." icon={<TrendingUp className="h-5 w-5" />} />
            <PerformanceMetricCard title="Cardio total" value={`${cardioStats.totalMinutes} min`} description="Minutos registrados no período." icon={<Activity className="h-5 w-5" />} />
            <PerformanceMetricCard title="Dor/desconforto" value={String(painCount)} description="Registros no período." icon={<HeartPulse className="h-5 w-5" />} />
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-300" /><h2 className="text-xl font-black text-zinc-50">Resumo inteligente</h2></div>
            <div className="mt-4 grid gap-2">
              {insights.length ? insights.map((insight) => <p key={insight} className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300">{insight}</p>) : <p className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-500">Ainda faltam dados para gerar insights úteis.</p>}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <MuscleVolumeChart items={muscleVolume} />
            <ConsistencyCalendar stats={consistency} />
          </div>

          <ExerciseProgressTable rows={exerciseRows} />

          <div className="grid gap-6 xl:grid-cols-2">
            <CardioProgressChart stats={cardioStats} />
            <PainSummary stats={painStats} />
          </div>

          <PersonalRecords records={records.filter((record) => parseNumber(record.value.replace(/[^\d,.]/g, "")) !== null)} />
        </>
      )}
    </div>
  );
}
