import { exerciseLibrary, exerciseLibraryList, findExerciseLibraryItem } from "../data/exerciseLibrary";
import type { ExerciseLog, ExerciseTimerSession, Logs, TrainingType } from "../types/training";
import { estimateKcalFromLoggedExercise } from "./energy";
import { focusToKey, focusToTargets } from "./focus";
import { shouldIncrease } from "./storage";

export type PerformancePeriod = "7d" | "30d" | "90d" | "all";

export type CardioPerformanceLog = {
  id?: string;
  date: string;
  minutes: string;
  type: string;
  intensity: string;
  lightMinutes?: string;
  moderateMinutes?: string;
  hardMinutes?: string;
};

export type PainPerformanceLog = {
  id?: string;
  date: string;
  level: string;
  text: string;
};

export type PerformanceExerciseEntry = {
  key: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  log: ExerciseLog;
  volume: number;
  repsTotal: number;
  type?: TrainingType;
};

export type PerformanceFilters = {
  period: PerformancePeriod;
  exerciseId: string;
  muscle: string;
  trainingType: string;
  onlyWithHistory: boolean;
};

export type ExerciseProgressRow = {
  exerciseId: string;
  exerciseName: string;
  sessions: number;
  firstLoad: number | null;
  lastLoad: number | null;
  lastReps: string;
  bestLoad: number | null;
  bestVolume: number;
  suggestion: string;
};

export type MuscleVolumeItem = {
  key: string;
  label: string;
  volume: number;
  percent: number;
};

export type CardioStats = {
  totalMinutes: number;
  averageMinutes: number;
  sessions: number;
  byType: { label: string; minutes: number; percent: number }[];
  byIntensity: { label: string; minutes: number; percent: number }[];
  daily: { label: string; minutes: number }[];
};

export type ConsistencyStats = {
  days: { date: string; training: boolean; cardio: boolean }[];
  bestStreak: number;
  currentStreak: number;
  trainedDays: number;
  adherence: number;
};

export type PainStats = {
  total: number;
  areas: { label: string; count: number }[];
  recent: PainPerformanceLog[];
  alerts: string[];
};

export type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  type: "Carga" | "Volume" | "Reps";
  value: string;
  date: string;
};

export type WeeklyCaloriesItem = {
  weekStart: string;
  label: string;
  trainingCalories: number;
  cardioCalories: number;
  totalCalories: number;
};

export type TimerPerformanceStats = {
  sessions: number;
  totalTensionSeconds: number;
  totalRestSeconds: number;
  averageRestSeconds: number;
  estimatedKcal: number;
  topByTension: { exerciseName: string; seconds: number; averageSecondsPerRep: number | null }[];
};

export function parseNumber(value?: string): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function calculateExerciseVolume(log?: ExerciseLog): number {
  if (!log) return 0;
  const load = parseNumber(log.load);
  if (!load) return 0;
  const reps = [log.reps1, log.reps2, log.reps3].reduce((sum, value) => sum + (parseNumber(value) ?? 0), 0);
  return Math.round(load * reps);
}

export function getEntryDate(entry: { updatedAt?: string; date?: string }, key?: string): string {
  if (entry.date) return entry.date;
  if (entry.updatedAt) return entry.updatedAt.slice(0, 10);
  const dailyKeyDate = key?.match(/:(\d{4}-\d{2}-\d{2}):/);
  if (dailyKeyDate) return dailyKeyDate[1];
  const match = key?.match(/start:(\d{4}-\d{2}-\d{2})::block:(\d+)/);
  if (!match) return "";
  const date = new Date(`${match[1]}T00:00:00`);
  date.setDate(date.getDate() + Number(match[2]) * 7);
  return date.toISOString().slice(0, 10);
}

export function isWithinPeriod(date: string, period: PerformancePeriod) {
  if (period === "all") return true;
  if (!date) return false;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  start.setDate(start.getDate() - days + 1);
  const value = new Date(`${date}T00:00:00`);
  return value >= start && value <= end;
}

function repsTotal(log: ExerciseLog) {
  return [log.reps1, log.reps2, log.reps3].reduce((sum, value) => sum + (parseNumber(value) ?? 0), 0);
}

function hasExerciseData(log: ExerciseLog) {
  return log.done || Boolean(log.load || log.reps1 || log.reps2 || log.reps3 || log.note);
}

function humanizeExerciseId(value: string) {
  const clean = value
    .replace(/^local:/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "Exercício sem nome";
}

function parseExerciseIdentity(key: string) {
  if (key.includes("::")) {
    const parts = key.split("::");
    const rawName = parts[parts.length - 1] || "Exercício sem nome";
    const rawId = parts[parts.length - 2] || rawName;
    const item = findExerciseLibraryItem(rawId) ?? findExerciseLibraryItem(rawName);
    return { exerciseId: rawId, exerciseName: item?.name ?? humanizeExerciseId(rawName) };
  }

  const parts = key.split(":");
  const dateIndex = parts.findIndex((part) => /^\d{4}-\d{2}-\d{2}$/.test(part));
  const rawId = dateIndex >= 0 && parts.length > dateIndex + 3 ? parts.slice(dateIndex + 3).join(":") : parts[parts.length - 1] || key;
  const item = findExerciseLibraryItem(rawId);
  return { exerciseId: rawId, exerciseName: item?.name ?? humanizeExerciseId(rawId) };
}

export function normalizeExerciseHistory(logs: Logs): PerformanceExerciseEntry[] {
  return Object.entries(logs)
    .filter(([, log]) => hasExerciseData(log))
    .map(([key, log]) => {
      const { exerciseId, exerciseName } = parseExerciseIdentity(key);
      return {
        key,
        exerciseId,
        exerciseName,
        date: getEntryDate(log, key),
        log,
        volume: calculateExerciseVolume(log),
        repsTotal: repsTotal(log),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function filterExerciseEntries(entries: PerformanceExerciseEntry[], filters: PerformanceFilters) {
  return entries.filter((entry) => {
    if (!isWithinPeriod(entry.date, filters.period)) return false;
    if (filters.exerciseId && entry.exerciseId !== filters.exerciseId) return false;
    const item = findExerciseLibraryItem(entry.exerciseId) ?? findExerciseLibraryItem(entry.exerciseName);
    const muscleKeys = getMuscleKeys(entry);
    if (filters.muscle && !muscleKeys.includes(filters.muscle)) return false;
    if (filters.trainingType && item && !item.focus.toLowerCase().includes(filters.trainingType.toLowerCase())) return false;
    if (filters.onlyWithHistory && !hasExerciseData(entry.log)) return false;
    return true;
  });
}

export function groupHistoryByExercise(entries: PerformanceExerciseEntry[]) {
  const groups = new Map<string, PerformanceExerciseEntry[]>();
  for (const entry of entries) {
    const key = entry.exerciseId || entry.exerciseName;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return groups;
}

export function buildExerciseProgressRows(entries: PerformanceExerciseEntry[]): ExerciseProgressRow[] {
  return [...groupHistoryByExercise(entries).entries()].map(([exerciseId, rows]) => {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const loads = sorted.map((entry) => parseNumber(entry.log.load)).filter((value): value is number => value !== null);
    const bestVolume = Math.max(...sorted.map((entry) => entry.volume), 0);
    const firstLoad = parseNumber(first?.log.load);
    const lastLoad = parseNumber(last?.log.load);
    const minLastReps = Math.min(...[last?.log.reps1, last?.log.reps2, last?.log.reps3].map((value) => parseNumber(value) ?? 0).filter(Boolean));
    const suggestion = shouldIncrease(last?.log)
      ? "Aumentar carga"
      : minLastReps > 0 && minLastReps <= 8
        ? "Reduzir ou manter com técnica"
        : firstLoad !== null && lastLoad !== null && lastLoad > firstLoad
          ? "Evoluindo"
          : sorted.length < 2
            ? "Registrar mais sessões"
            : "Manter consistência";
    return {
      exerciseId,
      exerciseName: last?.exerciseName ?? exerciseId,
      sessions: sorted.length,
      firstLoad,
      lastLoad,
      lastReps: `${last?.log.reps1 || "-"}/${last?.log.reps2 || "-"}/${last?.log.reps3 || "-"}`,
      bestLoad: loads.length ? Math.max(...loads) : null,
      bestVolume,
      suggestion,
    };
  }).sort((a, b) => b.sessions - a.sessions || b.bestVolume - a.bestVolume);
}

const muscleGroupLabels: Record<string, string> = {
  gluteos: "Glúteos",
  gluteo_maximo: "Glúteos",
  gluteo_medio: "Glúteos",
  quadriceps: "Quadríceps",
  vasto_lateral: "Quadríceps",
  posterior_coxa: "Posterior de coxa",
  dorsal: "Dorsal",
  costas_medias: "Dorsal",
  costas_superiores: "Dorsal",
  peitoral: "Peitoral",
  peitoral_superior: "Peitoral",
  ombros: "Ombros",
  ombro_lateral: "Ombros",
  deltoide_anterior: "Ombros",
  deltoide_posterior: "Ombros",
  biceps: "Bíceps",
  braquial: "Bíceps",
  triceps: "Tríceps",
  panturrilha: "Panturrilha",
  gastrocnemio: "Panturrilha",
  soleo: "Panturrilha",
  abdomen: "Core/abdômen",
  obliquos: "Core/abdômen",
  core: "Core/abdômen",
};

function getMuscleKeys(entry: PerformanceExerciseEntry) {
  const item = findExerciseLibraryItem(entry.exerciseId) ?? findExerciseLibraryItem(entry.exerciseName);
  if (item?.muscles.length) return item.muscles;
  const targets = focusToTargets(`${entry.exerciseName} ${item?.focus ?? ""}`);
  return targets.length ? targets.map((target) => target.key) : [focusToKey(entry.exerciseName)];
}

export function calculateMuscleVolume(entries: PerformanceExerciseEntry[]): MuscleVolumeItem[] {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.volume) continue;
    const muscles = getMuscleKeys(entry);
    const share = entry.volume / Math.max(muscles.length, 1);
    for (const muscle of muscles) {
      const group = muscleGroupLabels[muscle] ?? "Outros";
      totals.set(group, (totals.get(group) ?? 0) + share);
    }
  }
  const max = Math.max(...totals.values(), 1);
  const preferred = ["Glúteos", "Quadríceps", "Posterior de coxa", "Dorsal", "Peitoral", "Ombros", "Bíceps", "Tríceps", "Panturrilha", "Core/abdômen", "Outros"];
  return preferred.map((label) => {
    const volume = Math.round(totals.get(label) ?? 0);
    return { key: label, label, volume, percent: Math.round((volume / max) * 100) };
  }).filter((item) => item.volume > 0);
}

function cardioMinutes(entry: CardioPerformanceLog) {
  const split = (parseNumber(entry.lightMinutes) ?? 0) + (parseNumber(entry.moderateMinutes) ?? 0) + (parseNumber(entry.hardMinutes) ?? 0);
  return split || parseNumber(entry.minutes) || 0;
}

export function calculateExerciseCalories(entryOrLog?: PerformanceExerciseEntry | ExerciseLog, bodyWeightKg?: number | null) {
  if (!entryOrLog) return 0;
  if ("log" in entryOrLog) {
    return estimateKcalFromLoggedExercise({
      log: entryOrLog.log,
      exerciseId: entryOrLog.exerciseId,
      exerciseName: entryOrLog.exerciseName,
      bodyWeightKg,
    });
  }
  return estimateKcalFromLoggedExercise({ log: entryOrLog, bodyWeightKg });
}

function calculateCardioCalories(entry: CardioPerformanceLog, bodyWeightKg?: number | null) {
  const minutes = cardioMinutes(entry);
  if (!minutes) return 0;
  const type = entry.type.toLowerCase();
  const intensity = entry.intensity.toLowerCase();
  const met = /corrida|running/.test(type)
    ? 8
    : /bike|bicicleta/.test(type)
      ? 5.8
      : /el[ií]ptico/.test(type)
        ? 5
        : /forte/.test(intensity)
          ? 6
          : /leve/.test(intensity)
            ? 3.2
            : 4.2;
  const weight = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : 70;
  return Math.round((met * 3.5 * weight * minutes) / 200);
}

function getMondayKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function formatWeekLabel(weekStart: string) {
  const [, month, day] = weekStart.split("-");
  return `${day}/${month}`;
}

export function calculateWeeklyCalories(entries: PerformanceExerciseEntry[], cardioLogs: CardioPerformanceLog[], period: PerformancePeriod, bodyWeightKg?: number | null, timerSessions: ExerciseTimerSession[] = []): WeeklyCaloriesItem[] {
  const weeks = new Map<string, WeeklyCaloriesItem>();
  const ensureWeek = (date: string) => {
    const weekStart = getMondayKey(date);
    const current = weeks.get(weekStart) ?? { weekStart, label: formatWeekLabel(weekStart), trainingCalories: 0, cardioCalories: 0, totalCalories: 0 };
    weeks.set(weekStart, current);
    return current;
  };
  const timerCalories = new Map<string, number>();
  for (const session of timerSessions) {
    if (session.status !== "completed" || !isWithinPeriod(session.dateKey, period) || !session.estimatedKcal) continue;
    const key = `${session.dateKey}::${session.exerciseId}`;
    timerCalories.set(key, (timerCalories.get(key) ?? 0) + session.estimatedKcal);
  }
  const consumedTimerKeys = new Set<string>();

  for (const entry of entries) {
    if (!isWithinPeriod(entry.date, period)) continue;
    const timerKey = `${entry.date}::${entry.exerciseId}`;
    const calories = timerCalories.get(timerKey) ?? calculateExerciseCalories(entry, bodyWeightKg);
    if (!calories) continue;
    consumedTimerKeys.add(timerKey);
    ensureWeek(entry.date).trainingCalories += calories;
  }

  for (const session of timerSessions) {
    if (session.status !== "completed" || !isWithinPeriod(session.dateKey, period) || !session.estimatedKcal) continue;
    const timerKey = `${session.dateKey}::${session.exerciseId}`;
    if (consumedTimerKeys.has(timerKey)) continue;
    ensureWeek(session.dateKey).trainingCalories += session.estimatedKcal;
  }

  for (const entry of cardioLogs) {
    if (!isWithinPeriod(entry.date, period)) continue;
    const calories = calculateCardioCalories(entry, bodyWeightKg);
    if (!calories) continue;
    ensureWeek(entry.date).cardioCalories += calories;
  }

  return [...weeks.values()]
    .map((week) => ({ ...week, totalCalories: week.trainingCalories + week.cardioCalories }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function calculateTimerStats(timerSessions: ExerciseTimerSession[], period: PerformancePeriod): TimerPerformanceStats {
  const sessions = timerSessions.filter((session) => session.status === "completed" && isWithinPeriod(session.dateKey, period));
  const byExercise = new Map<string, { exerciseName: string; seconds: number; reps: number }>();
  let totalTensionSeconds = 0;
  let totalRestSeconds = 0;
  let estimatedKcal = 0;

  for (const session of sessions) {
    totalTensionSeconds += session.totalTensionSeconds || 0;
    totalRestSeconds += session.totalRestSeconds || 0;
    estimatedKcal += session.estimatedKcal ?? 0;
    const key = session.executedExerciseId || session.exerciseId;
    const current = byExercise.get(key) ?? { exerciseName: session.executedExerciseName || session.exerciseName, seconds: 0, reps: 0 };
    current.seconds += session.totalTensionSeconds || 0;
    current.reps += session.sets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
    byExercise.set(key, current);
  }

  return {
    sessions: sessions.length,
    totalTensionSeconds,
    totalRestSeconds,
    averageRestSeconds: sessions.length ? Math.round(totalRestSeconds / sessions.length) : 0,
    estimatedKcal: Math.round(estimatedKcal),
    topByTension: [...byExercise.values()]
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 5)
      .map((item) => ({ exerciseName: item.exerciseName, seconds: item.seconds, averageSecondsPerRep: item.reps ? Math.round((item.seconds / item.reps) * 10) / 10 : null })),
  };
}

export function calculateCardioStats(cardioLogs: CardioPerformanceLog[], period: PerformancePeriod): CardioStats {
  const logs = cardioLogs.filter((entry) => isWithinPeriod(entry.date, period));
  const totalMinutes = logs.reduce((sum, entry) => sum + cardioMinutes(entry), 0);
  const byType = new Map<string, number>();
  const byIntensity = new Map<string, number>();
  const byDay = new Map<string, number>();
  for (const entry of logs) {
    const minutes = cardioMinutes(entry);
    const type = /bike|bicicleta/i.test(entry.type) ? "Bike" : /esteira|corrida|caminhada/i.test(entry.type) ? "Esteira/caminhada" : /el[ií]ptico/i.test(entry.type) ? "Elíptico" : "Outro";
    byType.set(type, (byType.get(type) ?? 0) + minutes);
    const intensities = [
      ["Leve", parseNumber(entry.lightMinutes) ?? 0],
      ["Moderado", parseNumber(entry.moderateMinutes) ?? 0],
      ["Forte", parseNumber(entry.hardMinutes) ?? 0],
    ] as const;
    if (intensities.some(([, value]) => value > 0)) {
      for (const [label, value] of intensities) byIntensity.set(label, (byIntensity.get(label) ?? 0) + value);
    } else {
      byIntensity.set(entry.intensity || "Variável", (byIntensity.get(entry.intensity || "Variável") ?? 0) + minutes);
    }
    byDay.set(entry.date, (byDay.get(entry.date) ?? 0) + minutes);
  }
  const percentList = (map: Map<string, number>) => [...map.entries()].map(([label, minutes]) => ({ label, minutes, percent: totalMinutes ? Math.round((minutes / totalMinutes) * 100) : 0 })).sort((a, b) => b.minutes - a.minutes);
  return {
    totalMinutes,
    averageMinutes: logs.length ? Math.round(totalMinutes / logs.length) : 0,
    sessions: logs.length,
    byType: percentList(byType),
    byIntensity: percentList(byIntensity),
    daily: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, minutes]) => ({ label: label.slice(5), minutes })),
  };
}

function getPeriodDays(period: PerformancePeriod, entries: { date: string }[], cardioLogs: CardioPerformanceLog[]) {
  const today = new Date();
  const fallbackDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const allDates = [...entries.map((entry) => entry.date), ...cardioLogs.map((entry) => entry.date)].filter(Boolean).sort();
  const start = period === "all" && allDates[0] ? new Date(`${allDates[0]}T00:00:00`) : new Date(today.getFullYear(), today.getMonth(), today.getDate() - fallbackDays + 1);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days: string[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) days.push(cursor.toISOString().slice(0, 10));
  return days.slice(-120);
}

export function calculateConsistency(entries: PerformanceExerciseEntry[], cardioLogs: CardioPerformanceLog[], period: PerformancePeriod): ConsistencyStats {
  const filteredCardio = cardioLogs.filter((entry) => isWithinPeriod(entry.date, period));
  const trainingDays = new Set(entries.filter((entry) => isWithinPeriod(entry.date, period)).map((entry) => entry.date));
  const cardioDays = new Set(filteredCardio.map((entry) => entry.date));
  const days = getPeriodDays(period, entries, cardioLogs).map((date) => ({ date, training: trainingDays.has(date), cardio: cardioDays.has(date) }));
  let current = 0;
  let bestStreak = 0;
  let running = 0;
  for (const day of days) {
    if (day.training || day.cardio) {
      running += 1;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
  }
  for (const day of [...days].reverse()) {
    if (day.training || day.cardio) current += 1;
    else break;
  }
  const activeDays = days.filter((day) => day.training || day.cardio).length;
  return { days, bestStreak, currentStreak: current, trainedDays: activeDays, adherence: days.length ? Math.round((activeDays / days.length) * 100) : 0 };
}

export function calculatePainSummary(painLogs: PainPerformanceLog[], period: PerformancePeriod): PainStats {
  const logs = painLogs.filter((entry) => entry.level !== "0" && isWithinPeriod(entry.date, period));
  const areas = new Map<string, number>();
  for (const entry of logs) {
    const label = entry.text.trim().toLowerCase() || "sem área informada";
    areas.set(label, (areas.get(label) ?? 0) + 1);
  }
  const areaList = [...areas.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  return {
    total: logs.length,
    areas: areaList,
    recent: [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    alerts: areaList.filter((area) => area.count >= 2).map((area) => `Atenção: dor recorrente em ${area.label}. Considere reduzir carga e revisar execução.`),
  };
}

export function calculatePersonalRecords(entries: PerformanceExerciseEntry[]): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  for (const [exerciseId, rows] of groupHistoryByExercise(entries)) {
    const name = rows[0]?.exerciseName ?? exerciseId;
    const bestLoad = [...rows].map((entry) => ({ entry, value: parseNumber(entry.log.load) ?? 0 })).sort((a, b) => b.value - a.value)[0];
    const bestVolume = [...rows].sort((a, b) => b.volume - a.volume)[0];
    const bestReps = [...rows].sort((a, b) => b.repsTotal - a.repsTotal)[0];
    if (bestLoad?.value) records.push({ exerciseId, exerciseName: name, type: "Carga", value: `${bestLoad.value} kg`, date: bestLoad.entry.date });
    if (bestVolume?.volume) records.push({ exerciseId, exerciseName: name, type: "Volume", value: `${bestVolume.volume} kg`, date: bestVolume.date });
    if (bestReps?.repsTotal) records.push({ exerciseId, exerciseName: name, type: "Reps", value: `${bestReps.repsTotal} reps`, date: bestReps.date });
  }
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export function buildPerformanceInsights({
  entries,
  muscleVolume,
  cardioStats,
  painStats,
  periodLabel,
}: {
  entries: PerformanceExerciseEntry[];
  muscleVolume: MuscleVolumeItem[];
  cardioStats: CardioStats;
  painStats: PainStats;
  periodLabel: string;
}) {
  const insights: string[] = [];
  const days = new Set(entries.map((entry) => entry.date).filter(Boolean)).size;
  if (days) insights.push(`Você treinou ${days} dia(s) em ${periodLabel}.`);
  if (muscleVolume[0]) insights.push(`${muscleVolume[0].label} foi o grupo com maior volume no período.`);
  const rows = buildExerciseProgressRows(entries);
  const evolved = rows.find((row) => row.suggestion === "Evoluindo");
  if (evolved) insights.push(`${evolved.exerciseName} teve aumento de carga.`);
  if (cardioStats.totalMinutes) insights.push(`Cardio totalizou ${cardioStats.totalMinutes} minutos no período.`);
  if (painStats.alerts[0]) insights.push(painStats.alerts[0]);
  return insights;
}

export const performanceExerciseOptions = exerciseLibraryList.map((item) => ({ id: item.id, name: item.name }));
export const performanceMuscleOptions = [...new Set(Object.values(exerciseLibrary).flatMap((item) => item.muscles))].sort();
