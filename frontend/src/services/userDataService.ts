import { supabase } from "../lib/supabase";
import type { CustomTrainingPlan, ExerciseTimerSession, Logs, WeightEntry } from "../types/training";

export type SyncSettings = {
  phase?: string;
  week?: string;
  startDate?: string;
  autoWeekEnabled?: boolean;
  activePlanId?: string;
  bodyWeightKg?: number;
  bodyHeightCm?: number;
  targetWeightKg?: number;
  bodyWeightWeekBlock?: number;
  extraWorkouts?: unknown[];
};

export type UserAppData = {
  logs: Logs;
  history: unknown[];
  pain_logs: unknown[];
  cardio_logs: unknown[];
  timer_sessions: ExerciseTimerSession[];
  weight_history: WeightEntry[];
  custom_plans: CustomTrainingPlan[];
  settings: SyncSettings;
};

const emptyData: UserAppData = {
  logs: {},
  history: [],
  pain_logs: [],
  cardio_logs: [],
  timer_sessions: [],
  weight_history: [],
  custom_plans: [],
  settings: {},
};

export async function getUserAppData(userId: string) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase.from("user_app_data").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    logs: data.logs ?? {},
    history: data.history ?? [],
    pain_logs: data.pain_logs ?? [],
    cardio_logs: data.cardio_logs ?? [],
    timer_sessions: data.timer_sessions ?? [],
    weight_history: data.weight_history ?? [],
    custom_plans: data.custom_plans ?? [],
    settings: data.settings ?? {},
  } as UserAppData;
}

export async function saveUserAppData(userId: string, data: UserAppData) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const payload = {
    user_id: userId,
    logs: data.logs,
    history: data.history,
    pain_logs: data.pain_logs,
    cardio_logs: data.cardio_logs,
    timer_sessions: data.timer_sessions,
    weight_history: data.weight_history,
    custom_plans: data.custom_plans,
    settings: data.settings,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_app_data").upsert(payload, { onConflict: "user_id" });
  if (isMissingJsonbColumn(error)) {
    console.warn("[Supabase sync] Há colunas novas pendentes no Supabase. Salvando os demais dados; rode frontend/supabase/schema.sql para ativar o sync completo.");
    const { timer_sessions: _timerSessions, weight_history: _weightHistory, ...fallbackPayload } = payload;
    const { error: fallbackError } = await supabase.from("user_app_data").upsert(fallbackPayload, { onConflict: "user_id" });
    if (fallbackError) throw fallbackError;
    return;
  }
  if (error) throw error;
}

export function isMissingTimerSessionsColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: string; message?: string };
  return record.code === "PGRST204" && Boolean(record.message?.includes("timer_sessions"));
}

export function isMissingJsonbColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: string; message?: string };
  return record.code === "PGRST204" && Boolean(record.message?.includes("timer_sessions") || record.message?.includes("weight_history"));
}

export function mergeUserAppData(local: UserAppData, remote: UserAppData | null): UserAppData {
  if (!remote) return local;
  return {
    logs: mergeLogsByUpdatedAt(local.logs, remote.logs),
    history: mergeById(local.history, remote.history),
    pain_logs: mergeById(local.pain_logs, remote.pain_logs),
    cardio_logs: mergeById(local.cardio_logs, remote.cardio_logs),
    timer_sessions: mergeById(local.timer_sessions, remote.timer_sessions),
    weight_history: mergeWeightHistory(local.weight_history, remote.weight_history),
    custom_plans: mergeById(local.custom_plans, remote.custom_plans),
    settings: mergeSettings(local.settings, remote.settings),
  };
}

export function hasRemoteData(data: UserAppData | null) {
  if (!data) return false;
  return Boolean(
    Object.keys(data.logs ?? {}).length ||
    data.history?.length ||
    data.pain_logs?.length ||
    data.cardio_logs?.length ||
    data.timer_sessions?.length ||
    data.weight_history?.length ||
    data.custom_plans?.length ||
    Object.keys(data.settings ?? {}).length
  );
}

export function normalizeUserAppData(data: Partial<UserAppData>): UserAppData {
  return { ...emptyData, ...data, logs: ensureLogUpdatedAt(data.logs ?? {}), timer_sessions: data.timer_sessions ?? [], weight_history: data.weight_history ?? [] };
}

function ensureLogUpdatedAt(logs: Logs): Logs {
  const now = new Date().toISOString();
  return Object.fromEntries(Object.entries(logs).map(([key, log]) => [key, { ...log, updatedAt: log.updatedAt ?? now }]));
}

function mergeLogsByUpdatedAt(localLogs: Logs = {}, remoteLogs: Logs = {}) {
  const merged: Logs = { ...ensureLogUpdatedAt(localLogs) };
  const remote = ensureLogUpdatedAt(remoteLogs);
  for (const [key, remoteLog] of Object.entries(remote)) {
    const localLog = merged[key];
    if (!localLog) {
      merged[key] = remoteLog;
      continue;
    }
    const localTime = Date.parse(localLog.updatedAt ?? "") || 0;
    const remoteTime = Date.parse(remoteLog.updatedAt ?? "") || 0;
    merged[key] = remoteTime >= localTime ? remoteLog : localLog;
  }
  return merged;
}

function mergeSettings(localSettings: SyncSettings = {}, remoteSettings: SyncSettings = {}) {
  return {
    ...localSettings,
    ...remoteSettings,
    startDate: remoteSettings.startDate || localSettings.startDate,
  };
}

function mergeById<T>(localItems: T[] = [], remoteItems: T[] = []) {
  const map = new Map<string, T>();
  for (const item of localItems) map.set(itemKey(item), item);
  for (const item of remoteItems) map.set(itemKey(item), item);
  return Array.from(map.values());
}

function mergeWeightHistory(localItems: WeightEntry[] = [], remoteItems: WeightEntry[] = []) {
  const map = new Map<string, WeightEntry>();
  for (const item of localItems) map.set(weightEntryKey(item), item);
  for (const item of remoteItems) {
    const key = weightEntryKey(item);
    const current = map.get(key);
    if (!current || Date.parse(item.updatedAt) >= Date.parse(current.updatedAt)) map.set(key, item);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function weightEntryKey(item: WeightEntry) {
  return item.id || `${item.date}:${item.weightKg}`;
}

function itemKey(item: unknown) {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    if (typeof record.id === "string" && record.id) return record.id;
    return JSON.stringify(record);
  }
  return String(item);
}
