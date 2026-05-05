import type { CustomTrainingPlan, ExerciseLog, Logs, TrainingDay, WeekId } from "../types/training";

export const STORAGE_KEY = "treino-loloa-logs-v2";
export const START_DATE_KEY = "treino-loloa-start-week-a";
export const AUTO_WEEK_KEY = "treino-loloa-auto-week";
export const CUSTOM_PLANS_KEY = "treino-loloa-custom-plans-v1";
export const ACTIVE_PLAN_KEY = "treino-loloa-active-plan-v1";
export const PAIN_LOG_KEY = "treino-loloa-pain-v1";
export const CARDIO_LOG_KEY = "treino-loloa-cardio-v1";

export function emptyLog(): ExerciseLog {
  return { done: false, load: "", reps1: "", reps2: "", reps3: "", note: "" };
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
  const block = calculateWeekBlockFromStart(startDate);
  return normalizedWeeks[block % normalizedWeeks.length];
}

export function calculateWeekBlockFromStart(startDate: string) {
  if (!startDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (Number.isNaN(start.getTime())) return 0;
  const diffDays = Math.floor((current.getTime() - start.getTime()) / 86400000);
  return Math.floor(Math.max(0, diffDays) / 7);
}

export function getTodayName() {
  const names = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return names[new Date().getDay()];
}

export function exerciseKey(plan: TrainingDay, exercise: { id?: string; order: number | string; name: string }) {
  return `${plan.id}::${exercise.id ?? exercise.order}::${exercise.name}`;
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
