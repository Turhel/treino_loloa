import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Clock3, Dumbbell, Flame, HeartPulse, TimerReset, TrendingUp } from "lucide-react";
import { muscleImages } from "../data/muscleData";
import type { ExerciseTimerSession, Logs, WeightEntry } from "../types/training";
import { CardioProgressChart } from "../components/performance/CardioProgressChart";
import { ConsistencyCalendar } from "../components/performance/ConsistencyCalendar";
import { ExerciseProgressTable } from "../components/performance/ExerciseProgressTable";
import { MuscleVolumeChart } from "../components/performance/MuscleVolumeChart";
import { PainSummary } from "../components/performance/PainSummary";
import { PerformanceFilterBar } from "../components/performance/PerformanceFilterBar";
import { PerformanceMetricCard } from "../components/performance/PerformanceMetricCard";
import { PersonalRecords } from "../components/performance/PersonalRecords";
import { WeeklyCaloriesChart } from "../components/performance/WeeklyCaloriesChart";
import { WeightHistoryManager } from "../components/performance/WeightHistoryManager";
import { WeightProjectionChart } from "../components/performance/WeightProjectionChart";
import { CuteEmptyState } from "../components/ui/CuteEmptyState";
import {
  buildExerciseProgressRows,
  buildPerformanceInsights,
  calculateCardioStats,
  calculateConsistency,
  calculateMuscleVolume,
  calculatePainSummary,
  calculatePersonalRecords,
  calculateTimerStats,
  calculateWeeklyCalories,
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
  timerSessions,
  weightHistory,
  bodyWeightKg,
  bodyHeightCm,
  targetWeightKg,
  onTargetWeightChange,
  onSaveWeightEntry,
  onDeleteWeightEntry,
  loading = false,
}: {
  logs: Logs;
  cardioLogs: CardioPerformanceLog[];
  painLogs: PainPerformanceLog[];
  timerSessions: ExerciseTimerSession[];
  weightHistory: WeightEntry[];
  bodyWeightKg?: number | null;
  bodyHeightCm?: number | null;
  targetWeightKg?: number | null;
  onTargetWeightChange: (value: number | "") => void;
  onSaveWeightEntry: (entry: WeightEntry) => void;
  onDeleteWeightEntry: (entryId: string) => void;
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
  const weeklyCalories = useMemo(() => calculateWeeklyCalories(filteredEntries, cardioLogs, filters.period, bodyWeightKg, timerSessions), [filteredEntries, cardioLogs, filters.period, bodyWeightKg, timerSessions]);
  const timerStats = useMemo(() => calculateTimerStats(timerSessions, filters.period), [timerSessions, filters.period]);
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
  const hasAnyData = allEntries.length > 0 || cardioLogs.length > 0 || painLogs.length > 0 || timerSessions.length > 0 || weightHistory.length > 0;

  if (loading) {
    return <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center text-sm font-bold text-zinc-400">Carregando desempenho...</section>;
  }

  return (
    <div className="grid gap-6">
      <PerformanceFilterBar filters={filters} onChange={setFilters} exercises={exerciseOptions} muscles={muscleOptions} />
      <WeightProjectionChart history={weightHistory} heightCm={bodyHeightCm} timerSessions={timerSessions} cardioLogs={cardioLogs} targetWeightKg={targetWeightKg} onTargetWeightChange={onTargetWeightChange} />
      <WeightHistoryManager history={weightHistory} heightCm={bodyHeightCm} onSave={onSaveWeightEntry} onDelete={onDeleteWeightEntry} />

      {!hasAnyData ? (
        <CuteEmptyState icon={<Dumbbell className="h-6 w-6" />} title="Registre algumas sessões para ver sua evolução ✨" description="Assim que houver treino, cardio ou dor salvos, esta página ganha vida." />
      ) : (
        <>
          <section className="flex flex-wrap gap-2">
            <PerformanceMetricCard title="Treinos registrados" value={String(uniqueTrainingDays)} description="Dias únicos com exercícios feitos." icon={<Dumbbell className="h-4 w-4" />} />
            <PerformanceMetricCard title="Exercícios feitos" value={String(doneEntries)} description="Entradas marcadas como feitas." icon={<Activity className="h-4 w-4" />} />
            <PerformanceMetricCard title="Volume estimado" value={`${totalVolume} kg`} description="Carga x soma das repetições." icon={<Flame className="h-4 w-4" />} />
            <PerformanceMetricCard title="Progressões" value={String(progressionCount)} description="Entradas que bateram 3x15." icon={<TrendingUp className="h-4 w-4" />} />
            <PerformanceMetricCard title="Cardio total" value={`${cardioStats.totalMinutes} min`} description="Minutos registrados no período." icon={<Activity className="h-4 w-4" />} />
            <PerformanceMetricCard title="Dor/desconforto" value={String(painCount)} description="Registros no período." icon={<HeartPulse className="h-4 w-4" />} />
            {timerStats.sessions > 0 && <PerformanceMetricCard title="Tempo sob tensão" value={`${Math.round(timerStats.totalTensionSeconds / 60)} min`} description="Soma do tempo medido nas séries." icon={<TimerReset className="h-4 w-4" />} />}
            {timerStats.sessions > 0 && <PerformanceMetricCard title="Kcal estimadas" value={`~${timerStats.estimatedKcal} kcal`} description="Estimativa aproximada pelo timer e peso informado." icon={<Flame className="h-4 w-4" />} />}
            {timerStats.sessions > 0 && <PerformanceMetricCard title="Descanso médio" value={`${timerStats.averageRestSeconds}s`} description="Média de descanso por sessão cronometrada." icon={<Clock3 className="h-4 w-4" />} />}
          </section>

          <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-300" /><h2 className="text-xl font-black text-zinc-50">Resumo inteligente</h2></div>
            <div className="mt-4 grid gap-2">
              {insights.length ? insights.map((insight) => <p key={insight} className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300">{insight}</p>) : <p className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-500">Ainda faltam dados para gerar insights úteis.</p>}
            </div>
          </section>

          <WeeklyCaloriesChart items={weeklyCalories} />

          {timerStats.sessions > 0 && (
            <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
              <div className="flex items-center gap-2"><TimerReset className="h-5 w-5 text-violet-200" /><h2 className="text-xl font-black text-zinc-50">Timer de séries</h2></div>
              <div className="mt-4 grid gap-2">
                {timerStats.topByTension.length ? timerStats.topByTension.map((item) => (
                  <div key={item.exerciseName} className="rounded-2xl bg-zinc-950/80 p-3 ring-1 ring-zinc-800">
                    <div className="flex items-center justify-between gap-3 text-sm font-black text-zinc-100"><span>{item.exerciseName}</span><span>{Math.round(item.seconds / 60)} min</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-violet-300" style={{ width: `${Math.min(100, Math.round((item.seconds / Math.max(timerStats.topByTension[0]?.seconds ?? 1, 1)) * 100))}%` }} /></div>
                    {item.averageSecondsPerRep !== null && <p className="mt-2 text-xs font-bold text-zinc-500">Média aproximada: {item.averageSecondsPerRep}s por repetição.</p>}
                  </div>
                )) : <p className="cute-empty">Sem sessões cronometradas no período.</p>}
              </div>
            </section>
          )}

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
