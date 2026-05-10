import type { CustomTrainingPlan, ExerciseLog, Logs, TrainingDay, WeekId } from "../types/training";
import { getBusinessWeekBlock, getLocalDateKey } from "./schedule";

export const STORAGE_KEY = "treino-loloa-logs-v2";
export const START_DATE_KEY = "treino-loloa-start-week-a";
export const AUTO_WEEK_KEY = "treino-loloa-auto-week";
export const CUSTOM_PLANS_KEY = "treino-loloa-custom-plans-v1";
export const ACTIVE_PLAN_KEY = "treino-loloa-active-plan-v1";
export const PAIN_LOG_KEY = "treino-loloa-pain-v1";
export const CARDIO_LOG_KEY = "treino-loloa-cardio-v1";

export function emptyLog(): ExerciseLog {
  return { done: false, skipped: false, load: "", reps1: "", reps2: "", reps3: "", note: "" };
}

export function shouldIncrease(log?: ExerciseLog) {
  if (!log) return false;
  const reps = [log.reps1, log.reps2, log.reps3].map((value) => Number(value));
  return reps.every((value) => Number.isFinite(value) && value >= 15);
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function calculateWeekFromStart(startDate: string, weekIds: WeekId[]): WeekId {
  const normalizedWeeks = weekIds.length > 0 ? weekIds : ["A"];
  if (!startDate) return normalizedWeeks[0];
  return normalizedWeeks[getBusinessWeekBlock(startDate, new Date()) % normalizedWeeks.length] ?? normalizedWeeks[0];
}

export function calculateWeekBlockFromStart(startDate: string) {
  return startDate ? getBusinessWeekBlock(startDate, new Date()) : 0;
}

export function getTodayName() {
  const names = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return names[new Date().getDay()];
}

export function exerciseKey(plan: TrainingDay, exercise: { id?: string; order: number | string; name: string }) {
  return `${plan.id}::${exercise.id ?? exercise.order}::${exercise.name}`;
}

export function getCurrentDayLogKey({
  userIdOrLocal,
  planId,
  dateKey,
  weekId,
  dayName,
  exerciseId,
}: {
  userIdOrLocal: string;
  planId: string;
  dateKey: string;
  weekId: string;
  dayName: string;
  exerciseId: string | number;
}) {
  return `${userIdOrLocal}:${planId}:${dateKey}:${weekId}:${dayName}:${exerciseId}`;
}

export function getExerciseHistoryKey(exerciseId: string | number) {
  return `history:${exerciseId}`;
}

export function isDatedExerciseLogKey(key: string) {
  return /^[^:]+:[^:]+:\d{4}-\d{2}-\d{2}:[^:]+:[^:]+:.+/.test(key);
}

export function getLastExerciseHistory(exerciseId: string | number, logs: Logs, excludeKey?: string) {
  const id = String(exerciseId);
  return Object.entries(logs)
    .filter(([key, log]) => key !== excludeKey && Boolean(log.load || log.reps1 || log.reps2 || log.reps3 || log.done))
    .filter(([key]) => {
      if (isDatedExerciseLogKey(key)) return key.split(":").at(-1) === id;
      const parts = key.split("::");
      return parts.at(-2) === id || parts.at(-1) === id;
    })
    .sort(([, a], [, b]) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .at(0)?.[1];
}

export function todayDateKey() {
  return getLocalDateKey(new Date());
}

export function readCustomPlans() {
  return readJson<CustomTrainingPlan[]>(CUSTOM_PLANS_KEY, []);
}

export function saveCustomPlans(plans: CustomTrainingPlan[]) {
  writeJson(CUSTOM_PLANS_KEY, plans);
}

export function readLogs() {
  return readJson<Logs>(STORAGE_KEY, {});
}
