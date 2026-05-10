import type { ExerciseTimerSession, WeightEntry } from "../types/training";
import type { CardioPerformanceLog } from "./performance";

export type WeightMode = "day" | "week" | "month" | "year";

export type WeightPoint = {
  date: string;
  label: string;
  weightKg: number;
  projected?: boolean;
  lowKg?: number;
  highKg?: number;
};

export type ProjectionResult = {
  points: WeightPoint[];
  reliability: "none" | "low" | "medium";
  weeklyDeltaKg: number;
  averageWeeklyKcal: number;
  monthsToHealthy: number | null;
  monthsToTarget: number | null;
};

const DAY_MS = 86400000;

export function parseDecimalNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) return NaN;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function sortWeightHistory(history: WeightEntry[], direction: "asc" | "desc" = "asc") {
  return [...history].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    const result = byDate || (Date.parse(a.updatedAt ?? "") - Date.parse(b.updatedAt ?? ""));
    return direction === "asc" ? result : -result;
  });
}

export function updateWeightEntry(history: WeightEntry[], entryId: string, patch: Partial<Omit<WeightEntry, "id" | "createdAt">>) {
  const now = new Date().toISOString();
  return sortWeightHistory(history.map((entry) => entry.id === entryId ? { ...entry, ...patch, updatedAt: now } : entry));
}

export function deleteWeightEntry(history: WeightEntry[], entryId: string) {
  const now = new Date().toISOString();
  return sortWeightHistory(history.map((entry) => entry.id === entryId ? { ...entry, deletedAt: now, updatedAt: now } : entry));
}

export function validateWeightEntry(entry: Partial<WeightEntry>) {
  const errors: string[] = [];
  const dateTime = Date.parse(`${entry.date ?? ""}T12:00:00Z`);
  if (!entry.date || !Number.isFinite(dateTime)) errors.push("Informe uma data válida.");
  if (!Number.isFinite(entry.weightKg)) errors.push("Informe um peso válido.");
  if (Number.isFinite(entry.weightKg) && Number(entry.weightKg) <= 20) errors.push("Peso precisa ser maior que 20 kg.");
  if (Number.isFinite(entry.weightKg) && Number(entry.weightKg) >= 350) errors.push("Peso precisa ser menor que 350 kg.");
  if (entry.heightCm !== undefined && entry.heightCm !== null && Number.isFinite(entry.heightCm) && (entry.heightCm < 100 || entry.heightCm > 230)) errors.push("Altura precisa ficar entre 100 e 230 cm.");
  return { valid: errors.length === 0, errors };
}

export function normalizeWeightHistory(history: WeightEntry[]) {
  const map = new Map<string, WeightEntry>();
  for (const entry of history) {
    if (!entry.date || !Number.isFinite(entry.weightKg) || entry.weightKg <= 0) continue;
    if (entry.deletedAt) continue;
    const now = new Date().toISOString();
    const normalizedEntry = {
      ...entry,
      id: entry.id || `${entry.date}-${entry.weightKg}-${entry.createdAt ?? now}`,
      createdAt: entry.createdAt ?? now,
      updatedAt: entry.updatedAt ?? entry.createdAt ?? now,
    };
    const key = normalizedEntry.id || `${normalizedEntry.date}:${normalizedEntry.weightKg}`;
    const current = map.get(key);
    if (!current || Date.parse(normalizedEntry.updatedAt) >= Date.parse(current.updatedAt)) map.set(key, normalizedEntry);
  }
  return sortWeightHistory([...map.values()]);
}

export function getHealthyWeightRange(heightCm?: number | null) {
  if (!heightCm || heightCm <= 0) return null;
  const meters = heightCm / 100;
  return {
    min: Math.round(18.5 * meters * meters * 10) / 10,
    max: Math.round(24.9 * meters * meters * 10) / 10,
  };
}

export function aggregateWeightHistory(history: WeightEntry[], mode: WeightMode): WeightPoint[] {
  const normalized = normalizeWeightHistory(history);
  if (mode === "day") return normalized.map((entry) => ({ date: entry.date, label: formatLabel(entry.date, mode), weightKg: entry.weightKg }));
  const groups = new Map<string, WeightEntry[]>();
  for (const entry of normalized) {
    const key = aggregateKey(entry.date, mode);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return [...groups.entries()].map(([key, entries]) => {
    const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
    const selected = mode === "month" ? averageLastEntries(sorted, 7) : sorted[sorted.length - 1].weightKg;
    return { date: sorted[sorted.length - 1].date, label: formatLabel(key, mode), weightKg: Math.round(selected * 10) / 10 };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateWeightTrend(history: WeightEntry[], lookbackDays = 42) {
  const normalized = normalizeWeightHistory(history);
  if (normalized.length < 2) return { weeklyDeltaKg: 0, points: normalized.length };
  const last = normalized[normalized.length - 1];
  const cutoff = addDays(last.date, -lookbackDays);
  const scoped = normalized.filter((entry) => entry.date >= cutoff);
  const first = scoped[0] ?? normalized[0];
  const days = Math.max(1, daysBetween(first.date, last.date));
  return {
    weeklyDeltaKg: ((last.weightKg - first.weightKg) / days) * 7,
    points: scoped.length,
  };
}

export function calculateMetBasedProjection(timerSessions: ExerciseTimerSession[], cardioLogs: CardioPerformanceLog[], currentWeightKg: number, lookbackDays = 42) {
  const today = todayKey();
  const cutoff = addDays(today, -lookbackDays);
  const timerKcal = timerSessions
    .filter((session) => session.status === "completed" && session.dateKey >= cutoff && session.dateKey <= today)
    .reduce((sum, session) => sum + (session.estimatedKcal ?? 0), 0);
  const cardioKcal = cardioLogs
    .filter((entry) => entry.date >= cutoff && entry.date <= today)
    .reduce((sum, entry) => sum + estimateCardioKcal(entry, currentWeightKg), 0);
  const averageWeeklyKcal = ((timerKcal + cardioKcal) / lookbackDays) * 7;
  return {
    averageWeeklyKcal,
    weeklyDeltaKg: averageWeeklyKcal > 0 ? -(averageWeeklyKcal / 7700) * 0.65 : 0,
  };
}

export function calculateHybridProjection({
  history,
  timerSessions,
  cardioLogs,
  heightCm,
  targetWeightKg,
  mode,
}: {
  history: WeightEntry[];
  timerSessions: ExerciseTimerSession[];
  cardioLogs: CardioPerformanceLog[];
  heightCm?: number | null;
  targetWeightKg?: number | null;
  mode: WeightMode;
}): ProjectionResult {
  const normalized = normalizeWeightHistory(history);
  if (normalized.length < 2) return { points: [], reliability: normalized.length ? "low" : "none", weeklyDeltaKg: 0, averageWeeklyKcal: 0, monthsToHealthy: null, monthsToTarget: null };
  const current = normalized[normalized.length - 1];
  const trend = calculateWeightTrend(normalized);
  const met = calculateMetBasedProjection(timerSessions, cardioLogs, current.weightKg);
  const rawWeeklyDelta = trend.weeklyDeltaKg * 0.7 + met.weeklyDeltaKg * 0.3;
  const limit = Math.max(0.2, current.weightKg * 0.008);
  const weeklyDeltaKg = Math.max(-limit, Math.min(limit, rawWeeklyDelta));
  const healthy = getHealthyWeightRange(heightCm);
  const target = targetWeightKg && Number.isFinite(targetWeightKg) && targetWeightKg > 20 && targetWeightKg < 350 ? targetWeightKg : null;
  const horizon = projectionHorizon(mode);
  const stepDays = projectionStepDays(mode);
  const points: WeightPoint[] = [];
  let weight = current.weightKg;
  let monthsToHealthy: number | null = null;
  let monthsToTarget: number | null = null;
  for (let day = stepDays; day <= horizon; day += stepDays) {
    weight += weeklyDeltaKg * (stepDays / 7);
    if (target && weeklyDeltaKg < 0 && current.weightKg > target && weight <= target) {
      weight = target;
      monthsToTarget = Math.max(1, Math.round(day / 30));
      points.push(projectedPoint(addDays(current.date, day), weight, mode, points.length));
      break;
    }
    if (target && weeklyDeltaKg > 0 && current.weightKg < target && weight >= target) {
      weight = target;
      monthsToTarget = Math.max(1, Math.round(day / 30));
      points.push(projectedPoint(addDays(current.date, day), weight, mode, points.length));
      break;
    }
    if (!target && healthy && weeklyDeltaKg < 0 && weight <= healthy.max) {
      weight = healthy.max;
      monthsToHealthy = Math.max(1, Math.round(day / 30));
      points.push(projectedPoint(addDays(current.date, day), weight, mode, points.length));
      break;
    }
    if (!target && healthy && weeklyDeltaKg > 0 && weight >= healthy.min && current.weightKg < healthy.min) {
      weight = healthy.min;
      monthsToHealthy = Math.max(1, Math.round(day / 30));
      points.push(projectedPoint(addDays(current.date, day), weight, mode, points.length));
      break;
    }
    points.push(projectedPoint(addDays(current.date, day), weight, mode, points.length));
  }
  return {
    points,
    reliability: trend.points >= 4 ? "medium" : "low",
    weeklyDeltaKg,
    averageWeeklyKcal: Math.round(met.averageWeeklyKcal),
    monthsToHealthy,
    monthsToTarget,
  };
}

export function stopProjectionAtHealthyRange(points: WeightPoint[], range: { min: number; max: number } | null) {
  if (!range) return points;
  const result: WeightPoint[] = [];
  for (const point of points) {
    result.push(point);
    if (point.weightKg >= range.min && point.weightKg <= range.max) break;
  }
  return result;
}

export function buildWeightChartSeries(args: Parameters<typeof calculateHybridProjection>[0]) {
  const actual = aggregateWeightHistory(args.history, args.mode);
  const projection = calculateHybridProjection(args);
  const last = actual[actual.length - 1];
  const projected = last ? [{ ...last, projected: true }, ...projection.points] : projection.points;
  return { actual, projected, projection };
}

function projectedPoint(date: string, weightKg: number, mode: WeightMode, index: number): WeightPoint {
  const uncertainty = Math.min(5, 0.3 + index * 0.18);
  return {
    date,
    label: formatLabel(date, mode),
    weightKg: Math.round(weightKg * 10) / 10,
    projected: true,
    lowKg: Math.round((weightKg - uncertainty) * 10) / 10,
    highKg: Math.round((weightKg + uncertainty) * 10) / 10,
  };
}

function averageLastEntries(entries: WeightEntry[], count: number) {
  const selected = entries.slice(-count);
  return selected.reduce((sum, entry) => sum + entry.weightKg, 0) / Math.max(1, selected.length);
}

function aggregateKey(date: string, mode: WeightMode) {
  if (mode === "week") {
    const parsed = parseDate(date);
    const day = parsed.getUTCDay() || 7;
    parsed.setUTCDate(parsed.getUTCDate() - day + 1);
    return parsed.toISOString().slice(0, 10);
  }
  if (mode === "month") return date.slice(0, 7);
  return date.slice(0, 4);
}

function formatLabel(dateOrKey: string, mode: WeightMode) {
  if (mode === "year") return dateOrKey.slice(0, 4);
  if (mode === "month") {
    const [year, month] = dateOrKey.length === 7 ? dateOrKey.split("-") : dateOrKey.slice(0, 7).split("-");
    return `${month}/${year.slice(2)}`;
  }
  const [, month, day] = dateOrKey.split("-");
  return `${day}/${month}`;
}

function estimateCardioKcal(entry: CardioPerformanceLog, bodyWeightKg: number) {
  const splitMinutes = (positiveNumber(entry.lightMinutes) + positiveNumber(entry.moderateMinutes) + positiveNumber(entry.hardMinutes));
  const minutes = splitMinutes || positiveNumber(entry.minutes);
  if (!minutes) return 0;
  const type = entry.type.toLowerCase();
  const intensity = entry.intensity.toLowerCase();
  const met = /corrida|running/.test(type) ? 8 : /bike|bicicleta/.test(type) ? 5.8 : /el[ií]ptico/.test(type) ? 5 : /forte/.test(intensity) ? 6 : /leve/.test(intensity) ? 3.2 : 4.2;
  return Math.round((met * 3.5 * bodyWeightKg * minutes) / 200);
}

function projectionHorizon(mode: WeightMode) {
  if (mode === "day") return 30;
  if (mode === "week") return 84;
  if (mode === "year") return 730;
  return 183;
}

function projectionStepDays(mode: WeightMode) {
  if (mode === "day") return 1;
  if (mode === "week") return 7;
  if (mode === "year") return 30;
  return 30;
}

function positiveNumber(value?: string) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function daysBetween(start: string, end: string) {
  return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY_MS);
}

function addDays(date: string, days: number) {
  const parsed = parseDate(date);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
