import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  Dumbbell,
  ExternalLink,
  FileText,
  HeartPulse,
  ImageOff,
  Library,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Settings,
  Sparkles,
  TimerReset,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AuthModal } from "./components/AuthModal";
import { UserMenu } from "./components/UserMenu";
import { ExerciseTimerModal } from "./components/timer/ExerciseTimerModal";
import { cardio, defaultTrainingPlan, getPlanDays, getPlanWeeks, overview, progression, recovery } from "./data/trainingPlans";
import { exerciseLibrary, exerciseLibraryList, findExerciseLibraryItem, toPlanExercise } from "./data/exerciseLibrary";
import { muscleImages } from "./data/muscleData";
import type { CustomTrainingPlan, Exercise, ExerciseLog, ExerciseTimerSession, Logs, MuscleInfo, Phase, TrainingDay, TrainingType, TrainingWeek, WeightEntry } from "./types/training";
import { focusToKey, focusToTargets } from "./utils/focus";
import { getManualVideoLinks, videoKey, youtubeSearch } from "./utils/video";
import { estimateKcalFromLoggedExercise } from "./utils/energy";
import { filterAvailableExercises, getEquipmentName, getMissingEquipment, isExerciseAvailable } from "./utils/equipment";
import { deleteWeightEntry, normalizeWeightHistory, sortWeightHistory } from "./utils/weight";
import { getCurrentSession, onAuthSessionChange, signOut } from "./services/authService";
import { getUserAppData, hasRemoteData, mergeUserAppData, normalizeUserAppData, saveUserAppData, type UserAppData } from "./services/userDataService";
import { PerformancePage } from "./pages/PerformancePage";
import {
  ACTIVE_PLAN_KEY,
  AUTO_WEEK_KEY,
  CARDIO_LOG_KEY,
  PAIN_LOG_KEY,
  START_DATE_KEY,
  STORAGE_KEY,
  calculateWeekFromStart,
  emptyLog,
  exerciseKey,
  getCurrentDayLogKey,
  getLastExerciseHistory,
  getTodayName,
  readCustomPlans,
  readJson,
  saveCustomPlans,
  shouldIncrease,
  todayDateKey,
  writeJson,
} from "./utils/storage";
import { addDays, getBusinessWeekBlock, getSessionDateForWeekDay, getWeekdayName, getWeekBlockStartDate } from "./utils/schedule";

const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const trainingWeekdays = weekdays.slice(0, 5);
type PainLog = { id?: string; date: string; level: string; text: string };
type CardioLog = { id?: string; date: string; minutes: string; type: string; intensity: string; lightMinutes?: string; moderateMinutes?: string; hardMinutes?: string };
type SyncStatus = "Local" | "Sincronizado" | "Sincronizando" | "Erro ao sincronizar";
type MediaTarget = { name: string; videoKey?: string; source?: Exercise };
type AppView = "training" | "performance";
type ScheduledTrainingDay = TrainingDay & {
  scheduledDate: string;
  scheduledDayName: string;
  blockIndex: number;
  blockTotal: number;
};
type ExtraWorkout = {
  id: string;
  planId: string;
  week: string;
  date: string;
  title: string;
  exercises: Exercise[];
  createdAt: string;
};
type WeeklySummary = {
  id: string;
  generatedAt: string;
  startDate: string;
  weekBlock: number;
  weekId: string;
  dateRange: string;
  done: number;
  total: number;
  calories: number;
  cardioCalories: number;
  progress: string[];
  reduce: string[];
  skipped: string[];
  pain: string[];
  recommendations: string[];
  bestExercise?: string;
  topCalorieExercise?: string;
  improveExercise?: string;
  weeklyLoads?: { label: string; totalLoad: number; calories?: number }[];
};
type TimerTarget = {
  plan: ScheduledTrainingDay;
  exercise: Exercise;
};

const WEEKLY_SUMMARY_KEY = "treino-loloa-weekly-summaries-v1";
const TIMER_SESSION_KEY = "treino-loloa-timer-sessions-v1";
const BODY_WEIGHT_KEY = "treino-loloa-body-weight-v1";
const BODY_HEIGHT_KEY = "treino-loloa-body-height-v1";
const BODY_WEIGHT_WEEK_KEY = "treino-loloa-body-weight-week-v1";
const EXTRA_WORKOUT_KEY = "treino-loloa-extra-workouts-v1";
const WEIGHT_HISTORY_KEY = "treino-loloa-weight-history-v1";
const cardioTypeOptions = ["Caminhada", "Esteira", "Corrida", "Bicicleta", "Outro"];

const typeStyle: Record<TrainingType, { label: string; chip: string; border: string; soft: string; icon: string }> = {
  puxar: { label: "Puxar", chip: "bg-blue-950/70 text-blue-200 ring-blue-800", border: "border-blue-500", soft: "bg-blue-950/30", icon: "" },
  empurrar: { label: "Empurrar", chip: "bg-rose-950/70 text-rose-200 ring-rose-800", border: "border-rose-500", soft: "bg-rose-950/30", icon: "" },
  gluteo: { label: "Posterior/glúteos", chip: "bg-orange-950/70 text-orange-200 ring-orange-800", border: "border-orange-500", soft: "bg-orange-950/30", icon: "" },
  inferior: { label: "Inferiores", chip: "bg-emerald-950/70 text-emerald-200 ring-emerald-800", border: "border-emerald-500", soft: "bg-emerald-950/30", icon: "" },
  superior: { label: "Superiores/acessórios", chip: "bg-violet-950/70 text-violet-200 ring-violet-800", border: "border-violet-500", soft: "bg-violet-950/30", icon: "" },
  core: { label: "Core", chip: "bg-fuchsia-950/70 text-fuchsia-200 ring-fuchsia-800", border: "border-fuchsia-500", soft: "bg-fuchsia-950/30", icon: "" },
  mobilidade: { label: "Mobilidade", chip: "bg-sky-950/70 text-sky-200 ring-sky-800", border: "border-sky-500", soft: "bg-sky-950/30", icon: "" },
  cardio: { label: "Cardio/mobilidade", chip: "bg-teal-950/70 text-teal-200 ring-teal-800", border: "border-teal-500", soft: "bg-teal-950/30", icon: "" },
  descanso: { label: "Descanso", chip: "bg-zinc-800 text-zinc-300 ring-zinc-700", border: "border-zinc-500", soft: "bg-zinc-800/70", icon: "" },
};

function useLocalStorageLogs() {
  const [logs, setLogs] = useState<Logs>(() => readJson(STORAGE_KEY, {}));
  useEffect(() => writeJson(STORAGE_KEY, logs), [logs]);
  function updateLog(key: string, patch: Partial<ExerciseLog>) {
    setLogs((current) => ({ ...current, [key]: { ...(current[key] ?? emptyLog()), ...patch, updatedAt: new Date().toISOString() } }));
  }
  return { logs, setLogs, updateLog, clearLogs: () => setLogs({}) };
}

function useStoredArray<T>(key: string) {
  const [items, setItems] = useState<T[]>(() => readJson<T[]>(key, []));
  useEffect(() => writeJson(key, items), [key, items]);
  const setAndStore: React.Dispatch<React.SetStateAction<T[]>> = (value) => {
    setItems((current) => {
      const next = typeof value === "function" ? (value as (current: T[]) => T[])(current) : value;
      writeJson(key, next);
      return next;
    });
  };
  return [items, setAndStore] as const;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getDayIndex(dayName: string) {
  return weekdays.findIndex((day) => day.toLowerCase() === dayName.toLowerCase());
}

function shouldDayStartOpen(dayName: string, todayName: string, query: string, onlyToday: boolean) {
  if (query.trim()) return true;
  if (onlyToday) return dayName === todayName;
  return getDayIndex(dayName) === getDayIndex(todayName);
}

function scheduleTrainingDays(days: TrainingDay[], startDate: string, weekBlock: number): ScheduledTrainingDay[] {
  const blockTotal = days.length;
  return days.map((day, index) => {
    const scheduledDate = startDate ? getSessionDateForWeekDay(startDate, weekBlock, index, blockTotal) : todayDateKey();
    return {
      ...day,
      scheduledDate,
      scheduledDayName: startDate ? getWeekdayName(scheduledDate) || day.day : `Dia ${index + 1}`,
      blockIndex: index + 1,
      blockTotal,
    };
  });
}

function makeEntryId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function numericValue(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function textInputValue(value: unknown) {
  if (typeof value === "number" && Number.isNaN(value)) return "";
  return String(value ?? "");
}

function estimateExerciseCalories(log?: ExerciseLog, exercise?: Exercise, bodyWeightKg?: number | null) {
  return estimateKcalFromLoggedExercise({ log, exerciseId: exercise?.id, exerciseName: exercise?.name, bodyWeightKg });
}

function exerciseVolume(log?: ExerciseLog) {
  if (!log) return 0;
  const load = numericValue(log.load);
  const reps = [log.reps1, log.reps2, log.reps3].reduce((sum, value) => sum + numericValue(value), 0);
  return Math.round(load * reps);
}

function averageReps(log?: ExerciseLog) {
  if (!log) return 0;
  const reps = [log.reps1, log.reps2, log.reps3].map((value) => numericValue(value)).filter(Boolean);
  return reps.length ? reps.reduce((sum, value) => sum + value, 0) / reps.length : 0;
}

function cardioMinutes(entry: { minutes?: string; lightMinutes?: string; moderateMinutes?: string; hardMinutes?: string }) {
  const splitTotal = numericValue(entry.lightMinutes ?? "") + numericValue(entry.moderateMinutes ?? "") + numericValue(entry.hardMinutes ?? "");
  return splitTotal || numericValue(entry.minutes ?? "");
}

function estimateCardioCalories(entry: { minutes?: string; type: string; intensity?: string; lightMinutes?: string; moderateMinutes?: string; hardMinutes?: string }, bodyWeightKg?: number | null) {
  const lightMinutes = numericValue(entry.lightMinutes ?? "");
  const moderateMinutes = numericValue(entry.moderateMinutes ?? "");
  const hardMinutes = numericValue(entry.hardMinutes ?? "");
  const splitTotal = lightMinutes + moderateMinutes + hardMinutes;
  const fallbackMinutes = numericValue(entry.minutes ?? "");
  if (!splitTotal && !fallbackMinutes) return 0;
  const type = entry.type.toLowerCase();
  const baseMet = type.includes("corrida") ? 8 : type.includes("bike") || type.includes("bicicleta") ? 5.8 : type.includes("elíptico") || type.includes("eliptico") ? 5 : 3.8;
  const referenceWeightKg = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : 70;
  const caloriesFor = (minutes: number, multiplier: number) => ((baseMet * multiplier * 3.5 * referenceWeightKg) / 200) * minutes;
  if (splitTotal) return Math.round(caloriesFor(lightMinutes, 0.85) + caloriesFor(moderateMinutes, 1.1) + caloriesFor(hardMinutes, 1.35));
  const intensity = (entry.intensity ?? "Leve").toLowerCase();
  const intensityMultiplier = intensity.includes("forte") ? 1.35 : intensity.includes("moderado") ? 1.1 : 0.85;
  return Math.round(caloriesFor(fallbackMinutes, intensityMultiplier));
}

function formatCalories(value: number) {
  return `${Math.round(value)} kcal`;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function weeklySummaryReportHtml(summary: WeeklySummary) {
  const list = (items: string[], fallback: string) => (items.length ? items : [fallback]).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Resumo semanal ${escapeHtml(summary.weekId)}</title>
  <style>
    @page { margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #18181b; font-family: Inter, Arial, sans-serif; background: #fff; }
    .hero { border: 1px solid #d4d4d8; border-radius: 16px; padding: 16px; background: #f4f4f5; }
    .eyebrow { color: #71717a; font-size: 11px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 6px 0; font-size: 24px; line-height: 1.1; }
    .muted { color: #52525b; font-size: 12px; line-height: 1.4; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
    .metric { border: 1px solid #e4e4e7; border-radius: 14px; padding: 10px; }
    .metric span { display: block; color: #71717a; font-size: 10px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 5px; font-size: 18px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .chart { margin-bottom: 10px; border: 1px solid #e4e4e7; border-radius: 14px; padding: 10px; break-inside: avoid; }
    section { border: 1px solid #e4e4e7; border-radius: 14px; padding: 10px; break-inside: avoid; }
    h2 { margin: 0 0 6px; font-size: 13px; }
    ul { margin: 0; padding-left: 16px; color: #3f3f46; font-size: 11px; line-height: 1.35; }
    footer { margin-top: 10px; color: #71717a; font-size: 10px; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="eyebrow">Treino Loloa · Resumo semanal</div>
    <h1>Semana ${escapeHtml(summary.weekId)} · ${escapeHtml(summary.dateRange)}</h1>
    <p class="muted">Gerado em ${new Date(summary.generatedAt).toLocaleString("pt-BR")}. Estimativas calóricas são aproximações, não medição clínica.</p>
  </div>
  <div class="metrics">
    <div class="metric"><span>Exercícios</span><strong>${summary.done}/${summary.total}</strong></div>
    <div class="metric"><span>Treino</span><strong>${formatCalories(summary.calories)}</strong></div>
    <div class="metric"><span>Cardio</span><strong>${formatCalories(summary.cardioCalories)}</strong></div>
    <div class="metric"><span>Total</span><strong>${formatCalories(summary.calories + summary.cardioCalories)}</strong></div>
  </div>
  <div class="chart"><h2>Carga levantada por semana · últimas 4 semanas</h2>${svgLineChart((summary.weeklyLoads ?? []).slice(-4))}</div>
  <div class="grid">
    <section><h2>Melhores destaques</h2><ul>${list([summary.bestExercise ?? "Sem destaque suficiente.", summary.topCalorieExercise ?? "Sem cálculo de kcal por exercício.", summary.improveExercise ?? "Sem ponto crítico claro."], "Sem destaques.")}</ul></section>
    <section><h2>Progredir carga</h2><ul>${list(summary.progress, "Nenhum exercício bateu critério de progressão.")}</ul></section>
    <section><h2>Diminuir ou ajustar</h2><ul>${list(summary.reduce, "Sem sinais claros de redução por carga/reps.")}</ul></section>
    <section><h2>Dor/desconforto</h2><ul>${list(summary.pain, "Sem desconforto registrado na semana.")}</ul></section>
    <section><h2>Próxima semana</h2><ul>${list(summary.recommendations, "Manter consistência e técnica limpa.")}</ul></section>
  </div>
  <footer>Abra este arquivo no navegador e use Ctrl+P / Salvar como PDF para gerar o PDF.</footer>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 350));</script>
</body>
</html>`;
}

function downloadWeeklySummaryPdf(summary: WeeklySummary) {
  const html = weeklySummaryReportHtml(summary);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resumo-semanal-${summary.weekId}-${summary.weekBlock + 1}-abrir-para-salvar-pdf.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDateRange(startDate: string, weekBlock: number) {
  const startKey = getWeekBlockStartDate(startDate, weekBlock);
  const nextStartKey = getWeekBlockStartDate(startDate, weekBlock + 1);
  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${addDays(nextStartKey, -1)}T00:00:00`);
  return `${start.toLocaleDateString("pt-BR")} - ${end.toLocaleDateString("pt-BR")}`;
}

function isDateInWeek(date: string, startDate: string, weekBlock: number) {
  const startKey = getWeekBlockStartDate(startDate, weekBlock);
  const nextStartKey = getWeekBlockStartDate(startDate, weekBlock + 1);
  return date >= startKey && date < nextStartKey;
}

function svgLineChart(points: { label: string; totalLoad: number; calories?: number }[]) {
  const width = 560;
  const height = 120;
  const padding = 18;
  const values = points.length ? points : [{ label: "Semana 1", totalLoad: 0 }];
  const max = Math.max(...values.map((point) => point.totalLoad), 1);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  const coords = values.map((point, index) => {
    const x = values.length > 1 ? padding + index * step : width / 2;
    const y = height - padding - (point.totalLoad / max) * (height - padding * 2);
    return { ...point, x, y };
  });
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="120" role="img" aria-label="Carga levantada por semana">
    <rect x="0" y="0" width="${width}" height="${height}" rx="14" fill="#f4f4f5" />
    <polyline points="${polyline}" fill="none" stroke="#18181b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    ${coords.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#18181b" /><text x="${point.x}" y="${height - 6}" font-size="10" text-anchor="middle" fill="#52525b">${escapeHtml(point.label.replace("Semana ", "S"))}</text><text x="${point.x}" y="${Math.max(12, point.y - 18)}" font-size="10" text-anchor="middle" fill="#18181b">${point.totalLoad}kg</text><text x="${point.x}" y="${Math.max(24, point.y - 6)}" font-size="9" text-anchor="middle" fill="#b45309">~${Math.round(point.calories ?? 0)}kcal</text>`).join("")}
  </svg>`;
}

function makeCustomWeek(id: string): TrainingWeek {
  return {
    id,
    label: `Semana ${id}`,
    days: trainingWeekdays.map((day) => ({
      id: `custom-${id.toLowerCase()}-${videoKey(day)}`,
      week: id,
      day,
      title: day,
      type: "superior",
      exercises: [],
    })),
  };
}

function makeCustomPlan(name = "Meu treino personalizado"): CustomTrainingPlan {
  const now = new Date().toISOString();
  return { id: `custom-${Date.now()}`, name, phase: "custom", createdAt: now, updatedAt: now, weeks: [makeCustomWeek("A")] };
}

function nextWeekId(weeks: TrainingWeek[]) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[weeks.length] ?? `W${weeks.length + 1}`;
}

function Segmented<T extends string>({ value, setValue, options }: { value: T; setValue: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="cute-segmented inline-flex max-w-full overflow-x-auto p-1">
      {options.map((option) => (
        <button key={option.value} onClick={() => setValue(option.value)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black transition ${value === option.value ? "cute-primary shadow-sm" : "text-zinc-400 hover:text-zinc-100"}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function StatBadge({ icon, title, value, tooltip }: { icon: React.ReactNode; title: string; value: string; tooltip: string }) {
  return <span title={tooltip} className="cute-pop inline-flex min-w-0 max-w-full items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs font-black text-zinc-200 shadow-sm shadow-black/20"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-950/70 text-rose-200 ring-1 ring-rose-800">{icon}</span><span className="grid min-w-0"><span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{title}</span><span className="min-w-0 truncate text-sm text-zinc-50">{value}</span></span></span>;
}

function LogInputs({ log, onLog, compact = false }: { log: ExerciseLog; onLog: (patch: Partial<ExerciseLog>) => void; compact?: boolean }) {
  const inputClass = "cute-input px-2 py-2 text-xs placeholder:text-zinc-500 focus:border-zinc-400";
  return (
    <div className="grid gap-2">
      <div className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
        <input value={textInputValue(log.load)} onChange={(event) => onLog({ load: event.target.value })} placeholder="kg" inputMode="decimal" className={inputClass} />
        <input value={textInputValue(log.reps1)} onChange={(event) => onLog({ reps1: event.target.value })} placeholder="R1" inputMode="numeric" className={inputClass} />
        <input value={textInputValue(log.reps2)} onChange={(event) => onLog({ reps2: event.target.value })} placeholder="R2" inputMode="numeric" className={inputClass} />
        <input value={textInputValue(log.reps3)} onChange={(event) => onLog({ reps3: event.target.value })} placeholder="R3" inputMode="numeric" className={inputClass} />
      </div>
      <input value={textInputValue(log.note)} onChange={(event) => onLog({ note: event.target.value })} placeholder="Observação" className={`${inputClass} col-span-full`} />
    </div>
  );
}

function RestTimer({ defaultSeconds }: { defaultSeconds: number }) {
  const [seconds, setSeconds] = useState(defaultSeconds || 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      return;
    }
    const id = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [running, seconds]);
  if (!defaultSeconds) return <span className="text-zinc-500">-</span>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => setRunning((value) => !value)} className={`rounded-full px-3 py-2 text-xs font-black shadow-sm ${running ? "bg-orange-950/70 text-orange-200 ring-1 ring-orange-800" : "cute-secondary hover:bg-zinc-800"}`}>
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
      </button>
      {[60, 90, 120].map((preset) => <button key={preset} onClick={() => { setSeconds(preset); setRunning(true); }} className="rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-bold text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800">{preset}s</button>)}
    </div>
  );
}

function FocusLinks({ focus, onMuscleClick, compact = false }: { focus: string; onMuscleClick: (muscleKey: string) => void; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-3" : ""}`}>
      {focusToTargets(focus).map((target) => (
        <button key={`${focus}-${target.key}`} onClick={() => onMuscleClick(target.key)} className={`${compact ? "rounded-2xl bg-blue-950/40 px-3 py-2 text-left text-sm font-black text-blue-200 ring-1 ring-blue-800" : "cute-badge cute-badge-blue transition"}`}>
          {target.label}
        </button>
      ))}
    </div>
  );
}

function VideoButton({ name, videoKey: explicitVideoKey, compact = false, onOpen }: { name: string; videoKey?: string; compact?: boolean; onOpen: (target: MediaTarget) => void }) {
  if (explicitVideoKey === "-") return compact ? null : <span className="text-zinc-500">-</span>;
  return (
    <button
      type="button"
      onClick={() => onOpen({ name, videoKey: explicitVideoKey })}
      aria-label={`Ver exercício ${name}`}
      className={`${compact ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0" : "cute-button cute-button-primary h-11 px-4"} text-xs outline-none focus-visible:ring-2 focus-visible:ring-zinc-400`}
    >
      <span className={`${compact ? "grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-950" : "flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-950"}`}>
        <Play className={`${compact ? "h-4 w-4" : "h-3.5 w-3.5"} translate-x-px fill-current`} />
      </span>
      {!compact && <span>Ver exercício</span>}
    </button>
  );
}
function AlternativeChips({ exercise, onAlternativeClick }: { exercise: Exercise; onAlternativeClick: (idOrName: string, source: Exercise) => void }) {
  const alternatives = (exercise.alternatives ?? []).map((alt) => ({ id: alt, item: findExerciseLibraryItem(alt) }));
  const available = alternatives.filter(({ item }) => !item || isExerciseAvailable(item));
  const unavailableCount = alternatives.length - available.length;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {available.map(({ id, item }) => <button key={id} type="button" onClick={(event) => { event.stopPropagation(); onAlternativeClick(id, exercise); }} className="cute-badge cute-badge-lavender min-h-8 text-left transition">{item?.name ?? id}</button>)}
      {alternatives.length > 0 && available.length === 0 && <span className="rounded-2xl border border-dashed border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-400">Sem alternativas disponíveis cadastradas para esta academia.</span>}
      {unavailableCount > 0 && available.length > 0 && <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-zinc-500">{unavailableCount} indisponível(is)</span>}
    </div>
  );
}

function ExerciseHistory({ logs, exercise, currentLogKey }: { logs: Logs; exercise: Exercise; currentLogKey: string }) {
  const last = getLastExerciseHistory(exercise.id, logs, currentLogKey);
  const rows = Object.entries(logs).filter(([key]) => key !== currentLogKey && (key.includes(`::${exercise.id}::`) || key.endsWith(`::${exercise.name}`) || key.endsWith(`:${exercise.id}`))).slice(-3);
  if (rows.length === 0) return null;
  return (
    <details className="mt-2 text-xs text-zinc-400">
      <summary className="cursor-pointer font-bold text-zinc-300">Histórico</summary>
      {last && <p className="mt-2 rounded-xl bg-blue-950/40 px-2 py-1 font-bold text-blue-100">Última vez: {last.load || "sem carga"} kg · {last.reps1 || "-"}/{last.reps2 || "-"}/{last.reps3 || "-"} reps</p>}
      <div className="mt-2 grid gap-1">{rows.map(([key, log]) => <p key={key} className="rounded-xl bg-zinc-950 px-2 py-1">{log.load || "sem carga"} kg · {log.reps1 || "-"}/{log.reps2 || "-"}/{log.reps3 || "-"} reps{log.note ? ` · ${log.note}` : ""}</p>)}</div>
    </details>
  );
}

function ExerciseRow({ exercise, log, logs, onLog, onMuscleClick, onAlternativeClick, onMediaOpen, onTimerOpen, lightMode, exerciseDomKey, registerExerciseRef, highlighted, currentLogKey }: { exercise: Exercise; log: ExerciseLog; logs: Logs; onLog: (patch: Partial<ExerciseLog>) => void; onMuscleClick: (muscleKey: string) => void; onAlternativeClick: (idOrName: string, source: Exercise) => void; onMediaOpen: (target: MediaTarget) => void; onTimerOpen: () => void; lightMode: boolean; exerciseDomKey: string; registerExerciseRef: (key: string, element: HTMLElement | null) => void; highlighted: boolean; currentLogKey: string }) {
  const increase = shouldIncrease(log);
  return (
    <tr ref={(element) => registerExerciseRef(exerciseDomKey, element)} className={`scroll-mt-28 align-top transition ${highlighted ? "bg-blue-950/60 ring-2 ring-blue-400" : log.done ? "bg-emerald-950/30" : "hover:bg-zinc-800/50"}`}>
      <td className="px-4 py-3 font-semibold text-zinc-400"><label className="flex items-center gap-2"><input type="checkbox" checked={log.done} onChange={(event) => onLog({ done: event.target.checked, skipped: event.target.checked ? false : log.skipped })} className="h-5 w-5 rounded-lg border-zinc-700 accent-emerald-500" /><span className="cute-badge cute-badge-neutral px-2">{exercise.order}</span></label></td>
      <td className="px-4 py-3"><p className="font-bold text-zinc-100">{exercise.name}</p>{log.skipped && !log.done && <span className="mt-2 inline-flex rounded-full bg-zinc-800 px-3 py-1 text-xs font-black text-zinc-300 ring-1 ring-zinc-700">Pulado por enquanto</span>}<details className="mt-2 text-xs text-zinc-400"><summary className="cursor-pointer font-bold text-zinc-300">Alternativas</summary><AlternativeChips exercise={exercise} onAlternativeClick={onAlternativeClick} /></details><ExerciseHistory logs={logs} exercise={exercise} currentLogKey={currentLogKey} /></td>
      <td className="px-4 py-3"><FocusLinks focus={`${exercise.name} ${exercise.focus}`} onMuscleClick={onMuscleClick} /></td>
      <td className="px-4 py-3"><LogInputs log={log} onLog={onLog} />{increase && <p className="mt-2 rounded-xl bg-emerald-950/70 px-2 py-1 text-xs font-black text-emerald-200">Bateu 3x15. Próximo treino: aumentar carga.</p>}{lightMode && <p className="mt-2 text-xs font-semibold text-orange-300">Modo leve ativo: foco em execução limpa.</p>}</td>
      <td className="px-4 py-3"><RestTimer defaultSeconds={exercise.rest ?? 60} /></td>
      <td className="px-4 py-3"><div className="grid gap-2"><button onClick={onTimerOpen} className="cute-button cute-button-secondary min-h-0 px-3 py-2 text-xs"><TimerReset className="h-3.5 w-3.5" /> Iniciar</button><button type="button" onClick={() => onLog({ skipped: !log.skipped, done: false })} className="cute-button cute-button-secondary min-h-0 px-3 py-2 text-xs">{log.skipped ? "Retomar" : "Pular"}</button><VideoButton name={exercise.name} videoKey={exercise.videoKey} onOpen={onMediaOpen} /></div></td>
    </tr>
  );
}

function ExerciseMobileCard(props: Parameters<typeof ExerciseRow>[0]) {
  const { exercise, log, logs, onLog, onMuscleClick, onAlternativeClick, onMediaOpen, onTimerOpen, lightMode, exerciseDomKey, registerExerciseRef, highlighted, currentLogKey } = props;
  const increase = shouldIncrease(log);
  return (
    <article ref={(element) => registerExerciseRef(exerciseDomKey, element)} className={`cute-exercise-card cute-pop scroll-mt-28 rounded-2xl border p-4 shadow-sm transition ${highlighted ? "border-blue-400 bg-blue-950/50 ring-2 ring-blue-400" : log.done ? "border-emerald-800 bg-emerald-950/30" : log.skipped ? "border-zinc-700 bg-zinc-900/60 opacity-80" : "border-zinc-800 bg-zinc-950/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <label className="flex min-w-0 items-start gap-3"><input type="checkbox" checked={log.done} onChange={(event) => onLog({ done: event.target.checked, skipped: event.target.checked ? false : log.skipped })} className="mt-1 h-6 w-6 shrink-0 rounded-lg border-zinc-700 accent-emerald-500" /><span className="min-w-0"><span className="cute-badge cute-badge-pink mb-2 px-2 py-0.5">{exercise.order}</span><span className="block text-base font-black leading-snug text-zinc-50">{exercise.name}</span>{log.skipped && !log.done && <span className="mt-2 inline-flex rounded-full bg-zinc-800 px-3 py-1 text-xs font-black text-zinc-300 ring-1 ring-zinc-700">Pulado por enquanto</span>}</span></label>
        <div className="flex shrink-0 gap-2"><button onClick={onTimerOpen} className="grid h-11 w-11 place-items-center rounded-full bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-800"><TimerReset className="h-4 w-4" /></button><VideoButton name={exercise.name} videoKey={exercise.videoKey} compact onOpen={onMediaOpen} /></div>
      </div>
      <FocusLinks focus={`${exercise.name} ${exercise.focus}`} onMuscleClick={onMuscleClick} compact />
      <div className="mt-4 grid gap-3">
        <div><p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Carga e reps</p><LogInputs log={log} onLog={onLog} compact /></div>
        {increase && <p className="rounded-xl bg-emerald-950/70 px-3 py-2 text-xs font-black text-emerald-200">Bateu 3x15. Próximo treino: aumentar carga.</p>}
        {lightMode && <p className="text-xs font-semibold text-orange-300">Modo leve ativo: foco em execução limpa.</p>}
        <div><p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Descanso</p><RestTimer defaultSeconds={exercise.rest ?? 60} /></div>
        <button type="button" onClick={() => onLog({ skipped: !log.skipped, done: false })} className="cute-button cute-button-secondary w-full">{log.skipped ? "Retomar exercício" : "Pular por enquanto"}</button>
        <details className="text-xs text-zinc-400"><summary className="cursor-pointer font-bold text-zinc-300">Alternativas se a máquina estiver ocupada</summary><AlternativeChips exercise={exercise} onAlternativeClick={onAlternativeClick} /></details>
        <ExerciseHistory logs={logs} exercise={exercise} currentLogKey={currentLogKey} />
      </div>
    </article>
  );
}

function DayCard({
  plan,
  logs,
  getLog,
  updateExerciseLog,
  onMuscleClick,
  onAlternativeClick,
  onMediaOpen,
  onTimerOpen,
  isOpen,
  onToggle,
  getExerciseDomKey,
  getCurrentLogKey,
  registerExerciseRef,
  highlightedExerciseKey,
  lightMode,
  bodyWeightKg,
  timerSessions,
}: {
  plan: ScheduledTrainingDay;
  logs: Logs;
  getLog: (plan: ScheduledTrainingDay, exercise: Exercise) => ExerciseLog | undefined;
  updateExerciseLog: (plan: ScheduledTrainingDay, exercise: Exercise, patch: Partial<ExerciseLog>) => void;
  onMuscleClick: (focus: string) => void;
  onAlternativeClick: (idOrName: string, source: Exercise) => void;
  onMediaOpen: (target: MediaTarget) => void;
  onTimerOpen: (plan: ScheduledTrainingDay, exercise: Exercise) => void;
  isOpen: boolean;
  onToggle: () => void;
  getExerciseDomKey: (plan: ScheduledTrainingDay, exercise: Exercise) => string;
  getCurrentLogKey: (plan: ScheduledTrainingDay, exercise: Exercise) => string;
  registerExerciseRef: (key: string, element: HTMLElement | null) => void;
  highlightedExerciseKey: string | null;
  lightMode: boolean;
  bodyWeightKg: number | null;
  timerSessions: ExerciseTimerSession[];
}) {
  const style = typeStyle[plan.type] ?? typeStyle.superior;
  const exercises = lightMode && plan.exercises.length > 4 ? plan.exercises.slice(0, 4) : plan.exercises;
  const done = exercises.filter((exercise) => getLog(plan, exercise)?.done).length;
  const hasProgression = exercises.some((exercise) => shouldIncrease(getLog(plan, exercise)));
  const estimatedCalories = exercises.reduce((sum, exercise) => {
    const timerCalories = timerSessions
      .filter((session) => session.status === "completed" && session.dateKey === plan.scheduledDate && session.exerciseId === exercise.id)
      .reduce((total, session) => total + (session.estimatedKcal ?? 0), 0);
    return sum + (timerCalories || estimateExerciseCalories(getLog(plan, exercise), exercise, bodyWeightKg));
  }, 0);
  const sessionDateKey = plan.scheduledDate;
  const progressPercent = exercises.length ? Math.round((done / exercises.length) * 100) : 0;
  const calorieTooltip = "Usa kcal do timer quando existir. Sem timer, estima por MET com peso corporal atual, carga e repetições.";
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`cute-day-card cute-pop overflow-hidden rounded-3xl border-l-8 ${style.border} border-y border-r border-zinc-800 bg-zinc-900 shadow-sm`}>
      <div className={`cute-day-header grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start ${style.soft}`}>
        <div className="min-w-0 pr-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">{plan.scheduledDayName}</p>
          <h3 className="mt-1 text-lg font-black leading-snug text-zinc-50 sm:text-xl">{plan.title}</h3>
          <div className="cute-progress mt-3">
            <div className="cute-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
          <span className="cute-badge cute-badge-lavender">{done}/{exercises.length} feitos</span>
          {hasProgression && <span className="rounded-full bg-emerald-950/70 px-3 py-1 text-xs font-black text-emerald-200 ring-1 ring-emerald-800">Progressão</span>}
          {estimatedCalories > 0 && <span title={calorieTooltip} className="rounded-full bg-amber-950/70 px-3 py-1 text-xs font-black text-amber-200 ring-1 ring-amber-800">~{formatCalories(estimatedCalories)}</span>}
          <span title="Data usada na chave desta sessão" className={`${sessionDateKey === todayDateKey() ? "bg-rose-950/70 text-rose-200 ring-rose-800" : "bg-zinc-950/80 text-zinc-300 ring-zinc-800"} rounded-full px-3 py-1 text-xs font-black ring-1`}>{sessionDateKey === todayDateKey() ? "Hoje" : sessionDateKey}</span>
          <span className="cute-badge cute-badge-neutral">Bloco {plan.blockIndex}/{plan.blockTotal}</span>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${style.chip}`}>{style.label}</span>
          <button type="button" onClick={onToggle} className="cute-button cute-button-secondary min-h-0 px-3 py-1 text-xs">
            {isOpen ? "Recolher" : "Expandir"} <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {isOpen && <><div className="hidden overflow-x-auto md:block"><table className="cute-table w-full min-w-[1080px] text-left text-sm"><thead className="border-y border-zinc-800 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-400"><tr><th className="w-24 px-4 py-3">Feito</th><th className="px-4 py-3">Exercício</th><th className="px-4 py-3">Foco</th><th className="w-80 px-4 py-3">Carga/reps</th><th className="w-52 px-4 py-3">Descanso</th><th className="w-28 px-4 py-3">Vídeo</th></tr></thead><tbody className="divide-y divide-zinc-800">{exercises.map((exercise) => { const key = exerciseKey(plan, exercise); const domKey = getExerciseDomKey(plan, exercise); const currentLogKey = getCurrentLogKey(plan, exercise); return <ExerciseRow key={key} currentLogKey={currentLogKey} exerciseDomKey={domKey} registerExerciseRef={registerExerciseRef} highlighted={highlightedExerciseKey === domKey} exercise={exercise} log={getLog(plan, exercise) ?? emptyLog()} logs={logs} onLog={(patch) => updateExerciseLog(plan, exercise, patch)} onMuscleClick={onMuscleClick} onAlternativeClick={onAlternativeClick} onMediaOpen={onMediaOpen} onTimerOpen={() => onTimerOpen(plan, exercise)} lightMode={lightMode} />; })}</tbody></table></div>
      <div className="grid gap-3 p-4 md:hidden">{exercises.map((exercise) => { const key = exerciseKey(plan, exercise); const domKey = getExerciseDomKey(plan, exercise); const currentLogKey = getCurrentLogKey(plan, exercise); return <ExerciseMobileCard key={key} currentLogKey={currentLogKey} exerciseDomKey={domKey} registerExerciseRef={registerExerciseRef} highlighted={highlightedExerciseKey === domKey} exercise={exercise} log={getLog(plan, exercise) ?? emptyLog()} logs={logs} onLog={(patch) => updateExerciseLog(plan, exercise, patch)} onMuscleClick={onMuscleClick} onAlternativeClick={onAlternativeClick} onMediaOpen={onMediaOpen} onTimerOpen={() => onTimerOpen(plan, exercise)} lightMode={lightMode} />; })}</div>
      {plan.optional && <div className="border-t border-zinc-800 px-5 py-4 text-sm text-zinc-400"><span className="font-black text-zinc-100">Opcionais:</span> {plan.optional}</div>}</>}
    </motion.section>
  );
}

function ModalShell({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}><motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={`cute-card-elevated max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl ${wide ? "max-w-6xl" : "max-w-4xl"}`} onClick={(event) => event.stopPropagation()}>{children}</motion.div></div>;
}

function MuscleFigure({ info, compact = false }: { info: MuscleInfo; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-zinc-950/90 p-3 ring-1 ring-zinc-800/80 ${compact ? "min-h-[15rem]" : "min-h-[18rem] sm:min-h-[22rem]"}`}>
      {!failed ? (
        <img
          src={info.image}
          alt={info.title}
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
          className={`block h-auto w-full object-contain ${compact ? "max-h-[18rem]" : "max-h-[min(58vh,420px)]"}`}
        />
      ) : (
        <div className="grid place-items-center gap-3 text-center text-sm font-bold text-zinc-400">
          <ImageOff className="h-8 w-8 text-zinc-500" />
          <span>Imagem indisponível no momento.</span>
        </div>
      )}
    </div>
  );
}

function MuscleModal({ focus, onClose }: { focus: string | null; onClose: () => void }) {
  if (!focus) return null;
  const info = muscleImages[focus] ?? muscleImages[focusToKey(focus)] ?? muscleImages.core;
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Foco selecionado</p><h2 className="mt-1 text-2xl font-black text-zinc-50">{info.title}</h2><p className="mt-2 text-sm text-zinc-400">Imagem do músculo trabalhado</p></div><button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button></div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_1.1fr]"><MuscleFigure info={info} /><div><p className="text-base leading-relaxed text-zinc-300">{info.description}</p><ul className="mt-4 space-y-2 text-sm text-zinc-300">{info.tips.map((tip) => <li key={tip} className="rounded-xl bg-zinc-950 px-3 py-2">• {tip}</li>)}</ul></div></div>
    </ModalShell>
  );
}

function AlternativeModal({ alternative, onClose, onMuscleClick, onMediaOpen }: { alternative: { idOrName: string; source: Exercise } | null; onClose: () => void; onMuscleClick: (focus: string) => void; onMediaOpen: (target: MediaTarget) => void }) {
  if (!alternative) return null;
  const item = findExerciseLibraryItem(alternative.idOrName);
  const name = item?.name ?? alternative.idOrName;
  const focus = item?.focus ?? alternative.source.focus;
  const muscles = item?.muscles?.length ? item.muscles : focusToTargets(focus).map((target) => target.key);
  const primaryMuscle = muscleImages[muscles[0]] ?? muscleImages[focusToKey(focus)] ?? muscleImages.core;
  const equipment = item?.equipment ?? [];
  const missingEquipment = getMissingEquipment(item);
  const available = isExerciseAvailable(item);
  return (
    <ModalShell onClose={onClose}>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900/95 p-5 backdrop-blur"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Alternativa</p><h2 className="mt-1 text-2xl font-black text-zinc-50">{name}</h2><p className="mt-2 text-sm text-zinc-400">{focus}</p></div><button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button></div>
      <div className="grid gap-5 p-5 md:grid-cols-[0.9fr_1.1fr]"><MuscleFigure info={primaryMuscle} compact /><div><p className="text-base leading-relaxed text-zinc-300">{item?.description ?? "Informações completas ainda não cadastradas. Use esta alternativa como variação próxima ao exercício original e confirme a execução com um profissional."}</p><div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${available ? "bg-emerald-950/60 text-emerald-200 ring-emerald-800" : "bg-red-950/60 text-red-200 ring-red-800"}`}>{available ? "Disponível nesta academia" : "Não disponível nesta academia"}</span>{equipment.map((id) => <span key={id} className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-zinc-300 ring-1 ring-zinc-800">{getEquipmentName(id)}</span>)}</div>{missingEquipment.length > 0 && <p className="mt-3 rounded-2xl bg-red-950/40 px-3 py-2 text-sm font-bold text-red-100">Faltando: {missingEquipment.map(getEquipmentName).join(", ")}</p>}<div className="mt-4 flex flex-wrap gap-2">{muscles.map((muscle) => <button key={muscle} onClick={() => onMuscleClick(muscle)} className="rounded-full bg-blue-950/40 px-3 py-1 text-xs font-black text-blue-200 ring-1 ring-blue-800">{muscleImages[muscle]?.title ?? muscle}</button>)}</div><ul className="mt-4 space-y-2 text-sm text-zinc-300">{(item?.tips ?? ["Controle o movimento.", "Use carga confortável.", "Pare se sentir dor articular."]).map((tip) => <li key={tip} className="rounded-xl bg-zinc-950 px-3 py-2">• {tip}</li>)}</ul><div className="mt-5 flex flex-wrap gap-2"><VideoButton name={name} videoKey={item?.videoKey ?? item?.id ?? name} onOpen={onMediaOpen} /></div></div></div>
    </ModalShell>
  );
}

function BodyCheckModal({
  mode,
  initialWeight,
  initialHeight,
  weekLabel,
  onSave,
  onClose,
}: {
  mode: "signup" | "weekly";
  initialWeight: number | "";
  initialHeight: number | "";
  weekLabel: string;
  onSave: (values: { weightKg: number; heightCm?: number }) => void;
  onClose?: () => void;
}) {
  const [weight, setWeight] = useState(initialWeight === "" ? "" : String(initialWeight));
  const [height, setHeight] = useState(initialHeight === "" ? "" : String(initialHeight));
  const parsedWeight = numericValue(weight);
  const parsedHeight = numericValue(height);
  const needsHeight = mode === "signup";
  const canSave = parsedWeight > 0 && (!needsHeight || parsedHeight > 0);
  const title = mode === "signup" ? "Dados iniciais" : "Peso da semana";
  const description = mode === "signup"
    ? "Informe peso e altura para personalizar melhor as estimativas do app."
    : `Atualize o peso atual para liberar a ${weekLabel}.`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="cute-card-elevated w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="cute-modal-header flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
          <div><p className="cute-eyebrow">Atualização corporal</p><h2 className="mt-1 text-2xl font-black text-zinc-50">{title}</h2><p className="mt-2 text-sm text-zinc-400">{description}</p></div>
          {onClose && <button type="button" onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button>}
        </div>
        <div className="grid gap-4 p-5">
          <label className="grid gap-1 text-sm font-bold text-zinc-300">Peso corporal atual<input value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="decimal" placeholder="kg" className="cute-input" /></label>
          {mode === "signup" && <label className="grid gap-1 text-sm font-bold text-zinc-300">Altura<input value={height} onChange={(event) => setHeight(event.target.value)} inputMode="decimal" placeholder="cm" className="cute-input" /></label>}
          <button type="button" disabled={!canSave} onClick={() => onSave({ weightKg: parsedWeight, heightCm: parsedHeight || undefined })} className="cute-button cute-button-primary disabled:cursor-not-allowed disabled:opacity-50">Salvar</button>
        </div>
      </div>
    </div>
  );
}

function ExtraWorkoutModal({
  open,
  activePlanId,
  week,
  onClose,
  onSave,
}: {
  open: boolean;
  activePlanId: string;
  week: string;
  onClose: () => void;
  onSave: (workout: ExtraWorkout) => void;
}) {
  const [date, setDate] = useState(todayDateKey());
  const [title, setTitle] = useState("Treino extra");
  const [selectedExercise, setSelectedExercise] = useState(exerciseLibraryList[0]?.id ?? "");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const exerciseOptions = showUnavailable ? exerciseLibraryList : filterAvailableExercises(exerciseLibraryList);

  useEffect(() => {
    if (!open) return;
    setDate(todayDateKey());
    setTitle("Treino extra");
    setSelectedExercise(filterAvailableExercises(exerciseLibraryList)[0]?.id ?? "");
    setExercises([]);
    setShowUnavailable(false);
  }, [open]);

  if (!open) return null;

  function addExercise() {
    const item = exerciseLibrary[selectedExercise];
    if (!item) return;
    setExercises((current) => [...current, toPlanExercise(item, current.length + 1)]);
  }

  function removeExercise(index: number) {
    setExercises((current) => current.filter((_, itemIndex) => itemIndex !== index).map((exercise, orderIndex) => ({ ...exercise, order: orderIndex + 1 })));
  }

  function save() {
    if (!exercises.length) return;
    onSave({
      id: makeEntryId("extra-workout"),
      planId: activePlanId,
      week,
      date,
      title: title.trim() || "Treino extra",
      exercises,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="cute-modal-header flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
        <div><p className="cute-eyebrow">Dia extra</p><h2 className="mt-1 text-2xl font-black text-zinc-50">Adicionar exercícios extras</h2><p className="mt-2 text-sm text-zinc-400">Use para sábado, domingo ou qualquer treino fora do plano da semana.</p></div>
        <button type="button" onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button>
      </div>
      <div className="grid gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold text-zinc-300">Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="cute-input" /></label>
          <label className="grid gap-1 text-sm font-bold text-zinc-300">Nome do bloco<input value={title} onChange={(event) => setTitle(event.target.value)} className="cute-input" /></label>
        </div>
        <div className="grid gap-2 rounded-2xl bg-zinc-950/70 p-3 ring-1 ring-zinc-800">
          <label className="grid gap-1 text-sm font-bold text-zinc-300">Exercício<select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)} className="cute-input">{exerciseOptions.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.focus}{isExerciseAvailable(item) ? "" : " · indisponível"}</option>)}</select></label>
          <label className="flex items-center gap-2 rounded-2xl bg-zinc-950 px-3 py-2 text-sm font-bold text-zinc-300"><input type="checkbox" checked={showUnavailable} onChange={(event) => setShowUnavailable(event.target.checked)} /> Mostrar indisponíveis</label>
          {selectedExercise && !isExerciseAvailable(exerciseLibrary[selectedExercise]) && <p className="rounded-2xl bg-red-950/40 px-3 py-2 text-sm font-bold text-red-100">Atenção: este exercício usa equipamento indisponível nesta academia.</p>}
          <button type="button" onClick={addExercise} className="cute-button cute-button-secondary"><Plus className="h-4 w-4" /> Adicionar exercício</button>
        </div>
        <div className="grid gap-2">
          {exercises.length ? exercises.map((exercise, index) => (
            <div key={`${exercise.id}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-950 px-3 py-2 ring-1 ring-zinc-800">
              <div className="min-w-0"><p className="truncate text-sm font-black text-zinc-100">{index + 1}. {exercise.name}</p><p className="truncate text-xs font-bold text-zinc-500">{exercise.focus}</p></div>
              <button type="button" onClick={() => removeExercise(index)} className="rounded-xl px-2 py-1 text-xs font-black text-red-200 hover:bg-red-950/40">Remover</button>
            </div>
          )) : <p className="cute-empty">Escolha pelo menos um exercício para criar o bloco extra.</p>}
        </div>
        <button type="button" disabled={!exercises.length} onClick={save} className="cute-button cute-button-primary disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" /> Criar bloco extra</button>
      </div>
    </ModalShell>
  );
}

function ExerciseMediaModal({ target, onClose, onMuscleClick }: { target: MediaTarget | null; onClose: () => void; onMuscleClick: (focus: string) => void }) {
  if (!target) return null;
  const item = findExerciseLibraryItem(target.videoKey ?? target.name) ?? (target.source ? findExerciseLibraryItem(target.source.id) : undefined);
  const name = item?.name ?? target.name;
  const focus = item?.focus ?? target.source?.focus ?? "Foco não cadastrado";
  const muscles = item?.muscles?.length ? item.muscles : focusToTargets(`${name} ${focus}`).map((entry) => entry.key);
  const primaryMuscle = muscleImages[muscles[0]] ?? muscleImages[focusToKey(focus)] ?? muscleImages.core;
  const manual = getManualVideoLinks(name, item?.videoKey ?? target.videoKey);
  const validUrl = (value?: string) => value?.trim() && /^https?:\/\//i.test(value) ? value.trim() : "";
  const youtubeUrl = validUrl(manual?.youtube);
  const tiktokUrl = validUrl(manual?.tiktok);
  const searchUrl = youtubeSearch(item?.videoKey ?? target.videoKey ?? name);
  const illustrations = item?.illustrations ?? [];
  const equipment = item?.equipment ?? [];
  const missingEquipment = getMissingEquipment(item);
  const available = isExerciseAvailable(item);
  return (
    <ModalShell onClose={onClose} wide>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900/95 p-5 backdrop-blur">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Ver exercício</p><h2 className="mt-1 text-2xl font-black text-zinc-50">{name}</h2><p className="mt-2 text-sm text-zinc-400">{focus}</p></div>
        <button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3">
          <MuscleFigure info={primaryMuscle} compact />
          <div className="grid gap-3 sm:grid-cols-3">
            {illustrations.length ? illustrations.map((src, index) => <div key={src} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"><img src={src} alt={`${name} passo ${index + 1}`} className="aspect-[4/3] w-full object-cover" /></div>) : <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-4 text-sm font-bold text-zinc-400 sm:col-span-3">Ilustrações ainda não cadastradas</div>}
          </div>
        </div>
        <div>
          <p className="text-base leading-relaxed text-zinc-300">{item?.description ?? "Informações completas ainda não cadastradas. Use os vídeos e o foco muscular como referência inicial."}</p>
          <div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${available ? "bg-emerald-950/60 text-emerald-200 ring-emerald-800" : "bg-red-950/60 text-red-200 ring-red-800"}`}>{available ? "Disponível nesta academia" : "Não disponível nesta academia"}</span>{equipment.map((id) => <span key={id} className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-zinc-300 ring-1 ring-zinc-800">{getEquipmentName(id)}</span>)}</div>
          {missingEquipment.length > 0 && <p className="mt-3 rounded-2xl bg-red-950/40 px-3 py-2 text-sm font-bold text-red-100">Equipamento faltando: {missingEquipment.map(getEquipmentName).join(", ")}</p>}
          <div className="mt-4 flex flex-wrap gap-2">{muscles.map((muscle) => <button key={muscle} onClick={() => onMuscleClick(muscle)} className="rounded-full bg-blue-950/40 px-3 py-1 text-xs font-black text-blue-200 ring-1 ring-blue-800">{muscleImages[muscle]?.title ?? muscle}</button>)}</div>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">{(item?.tips ?? ["Controle o movimento.", "Use carga confortável.", "Pare se sentir dor articular."]).map((tip) => <li key={tip} className="rounded-xl bg-zinc-950 px-3 py-2">• {tip}</li>)}</ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {youtubeUrl && <a href={youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white"><Play className="h-4 w-4 fill-current" /> YouTube</a>}
            {tiktokUrl && <a href={tiktokUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-zinc-950"><ExternalLink className="h-4 w-4" /> TikTok</a>}
            <a href={searchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-black text-zinc-100 hover:bg-zinc-800"><Search className="h-4 w-4" /> Buscar no YouTube</a>
          </div>
          {(item?.alternatives ?? []).map((id) => findExerciseLibraryItem(id)).filter((alternative) => alternative && !isExerciseAvailable(alternative)).length > 0 && <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Indisponíveis nesta academia</p><div className="mt-2 flex flex-wrap gap-2">{(item?.alternatives ?? []).map((id) => findExerciseLibraryItem(id)).filter((alternative) => alternative && !isExerciseAvailable(alternative)).map((alternative) => alternative && <span key={alternative.id} className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-400">{alternative.name}</span>)}</div></div>}
        </div>
      </div>
    </ModalShell>
  );
}

function InfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  const tables = [
    ["Divisão muscular", ["Tipo", "Músculos trabalhados"], overview],
    ["Séries e repetições", ["Tipo", "Séries", "Repetições"], progression],
    ["Cardio sugerido", ["Período", "Cardio"], cardio],
    ["Semana regenerativa", ["Variável", "Ajuste"], recovery],
  ] as const;
  return (
    <ModalShell onClose={onClose} wide>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900/95 p-5 backdrop-blur"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Guia rápido</p><h2 className="mt-1 text-2xl font-black text-zinc-50">Informações do treino</h2></div><button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button></div>
      <div className="grid gap-6 p-5 lg:grid-cols-2">{tables.map(([title, headers, rows]) => <div key={title}><h3 className="mb-3 text-xl font-black text-zinc-50">{title}</h3><div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"><table className="w-full text-left text-sm"><thead className="bg-zinc-950 text-zinc-300"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-bold">{header}</th>)}</tr></thead><tbody className="divide-y divide-zinc-800">{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top text-zinc-300">{cell}</td>)}</tr>)}</tbody></table></div></div>)}</div>
    </ModalShell>
  );
}

function TrainingEditor({ open, plans, activePlanId, onClose, onSave, onDelete }: { open: boolean; plans: CustomTrainingPlan[]; activePlanId: string; onClose: () => void; onSave: (plan: CustomTrainingPlan) => void; onDelete: (id: string) => void }) {
  const base = plans.find((plan) => plan.id === activePlanId) ?? plans[0] ?? makeCustomPlan();
  const [draft, setDraft] = useState(base);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const exerciseOptions = showUnavailable ? exerciseLibraryList : filterAvailableExercises(exerciseLibraryList);
  const [selectedExercise, setSelectedExercise] = useState(filterAvailableExercises(exerciseLibraryList)[0]?.id ?? "");
  useEffect(() => { if (open) setDraft(base); }, [open, base]);
  if (!open) return null;
  const patch = (next: CustomTrainingPlan) => setDraft({ ...next, updatedAt: new Date().toISOString() });
  const confirmDelete = () => window.confirm("Excluir este treino personalizado?") && onDelete(draft.id);
  function updateDay(weekIndex: number, dayIndex: number, updater: (day: TrainingDay) => TrainingDay) {
    patch({ ...draft, weeks: draft.weeks.map((week, wi) => wi !== weekIndex ? week : { ...week, days: week.days.map((day, di) => di === dayIndex ? updater(day) : day) }) });
  }
  function addExercise(weekIndex: number, dayIndex: number) {
    const item = exerciseLibrary[selectedExercise];
    if (!item) return;
    updateDay(weekIndex, dayIndex, (day) => ({ ...day, exercises: [...day.exercises, toPlanExercise(item, day.exercises.length + 1)] }));
  }
  function moveExercise(weekIndex: number, dayIndex: number, exerciseIndex: number, delta: number) {
    updateDay(weekIndex, dayIndex, (day) => {
      const next = [...day.exercises];
      const target = exerciseIndex + delta;
      if (target < 0 || target >= next.length) return day;
      [next[exerciseIndex], next[target]] = [next[target], next[exerciseIndex]];
      return { ...day, exercises: next.map((exercise, index) => ({ ...exercise, order: index + 1 })) };
    });
  }
  return (
    <ModalShell onClose={onClose} wide>
      <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur sm:p-5 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Editor de treino</p><input value={draft.name} onChange={(event) => patch({ ...draft, name: event.target.value })} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-xl font-black text-zinc-50 outline-none" /></div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-black text-zinc-100 hover:bg-zinc-800"><X className="h-4 w-4" /> Fechar</button>
          <button onClick={confirmDelete} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm font-black text-red-100 hover:bg-red-950"><Trash2 className="h-4 w-4" /> Excluir</button>
          <button onClick={() => patch({ ...draft, weeks: [...draft.weeks, makeCustomWeek(nextWeekId(draft.weeks))] })} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-black text-zinc-100 hover:bg-zinc-800"><Plus className="h-4 w-4" /> Semana</button>
          <button onClick={() => onSave(draft)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-950"><Save className="h-4 w-4" /> Salvar</button>
        </div>
      </div>
      <div className="grid gap-5 p-5">
        <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-[1fr_auto]"><div className="grid gap-2"><select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)} className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 outline-none">{exerciseOptions.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.focus}{isExerciseAvailable(item) ? "" : " · indisponível"}</option>)}</select><label className="flex items-center gap-2 text-sm font-bold text-zinc-300"><input type="checkbox" checked={showUnavailable} onChange={(event) => setShowUnavailable(event.target.checked)} /> Mostrar indisponíveis</label>{selectedExercise && !isExerciseAvailable(exerciseLibrary[selectedExercise]) && <p className="rounded-2xl bg-red-950/40 px-3 py-2 text-sm font-bold text-red-100">Atenção: este exercício usa equipamento indisponível nesta academia.</p>}</div><p className="text-sm text-zinc-400 md:self-center">Escolha um exercício e toque em Adicionar no dia desejado.</p></div>
        {draft.weeks.map((week, weekIndex) => <section key={week.id} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><input value={week.id} onChange={(event) => patch({ ...draft, weeks: draft.weeks.map((item, index) => index === weekIndex ? { ...item, id: event.target.value.toUpperCase(), label: `Semana ${event.target.value.toUpperCase()}`, days: item.days.map((day) => ({ ...day, week: event.target.value.toUpperCase() })) } : item) })} className="w-36 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-lg font-black text-zinc-50" />{draft.weeks.length > 1 && <button onClick={() => patch({ ...draft, weeks: draft.weeks.filter((_, index) => index !== weekIndex) })} className="rounded-2xl border border-red-900 px-3 py-2 text-sm font-bold text-red-200 hover:bg-red-950">Remover semana</button>}</div><div className="grid gap-3 lg:grid-cols-2">{week.days.map((day, dayIndex) => <div key={day.day} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input value={day.title} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, title: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-black text-zinc-50" /><select value={day.type} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, type: event.target.value as TrainingType }))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100">{Object.keys(typeStyle).map((type) => <option key={type} value={type}>{typeStyle[type as TrainingType].label}</option>)}</select></div><p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{day.day}</p><div className="grid gap-2">{day.exercises.map((exercise, exerciseIndex) => <div key={`${exercise.id}-${exerciseIndex}`} className="flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-sm text-zinc-200"><span className="min-w-0 flex-1 truncate">{exercise.order}. {exercise.name}</span><button onClick={() => moveExercise(weekIndex, dayIndex, exerciseIndex, -1)} className="rounded-lg bg-zinc-800 px-2 py-1 text-xs">↑</button><button onClick={() => moveExercise(weekIndex, dayIndex, exerciseIndex, 1)} className="rounded-lg bg-zinc-800 px-2 py-1 text-xs">↓</button><button onClick={() => updateDay(weekIndex, dayIndex, (current) => ({ ...current, exercises: current.exercises.filter((_, index) => index !== exerciseIndex).map((item, index) => ({ ...item, order: index + 1 })) }))} className="rounded-lg bg-red-950 px-2 py-1 text-xs text-red-100">Remover</button></div>)}<button onClick={() => addExercise(weekIndex, dayIndex)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-black text-zinc-950"><Plus className="h-4 w-4" /> Adicionar</button></div></div>)}</div></section>)}
        <div className="sticky bottom-0 z-10 -mx-5 -mb-5 grid gap-2 border-t border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur sm:hidden">
          <button onClick={() => onSave(draft)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-950"><Save className="h-4 w-4" /> Salvar treino</button>
          <button onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-black text-zinc-100"><X className="h-4 w-4" /> Voltar ao treino</button>
        </div>
      </div>
    </ModalShell>
  );
}

function QuickLogs({ painLogs, setPainLogs, cardioLogs, setCardioLogs, mode = "both" }: { painLogs: PainLog[]; setPainLogs: React.Dispatch<React.SetStateAction<PainLog[]>>; cardioLogs: CardioLog[]; setCardioLogs: React.Dispatch<React.SetStateAction<CardioLog[]>>; mode?: "both" | "pain" | "cardio" }) {
  const today = todayInputValue();
  const [pain, setPain] = useState({ date: today, text: "", level: "0" });
  const [cardioDraft, setCardioDraft] = useState<CardioLog>({ date: today, minutes: "", type: "Caminhada", intensity: "Variável", lightMinutes: "", moderateMinutes: "", hardMinutes: "" });
  const [customCardioType, setCustomCardioType] = useState("");
  const selectedCardioType = cardioDraft.type === "Outro" ? customCardioType.trim() || "Outro" : cardioDraft.type;
  const cardioToEstimate = { ...cardioDraft, type: selectedCardioType, minutes: String(cardioMinutes(cardioDraft)) };
  const currentBodyWeightKg = readJson<number | "">(BODY_WEIGHT_KEY, "");
  const bodyWeightForCardio = typeof currentBodyWeightKg === "number" ? currentBodyWeightKg : null;
  const cardioCalories = estimateCardioCalories(cardioToEstimate, bodyWeightForCardio);
  const lastCardioCalories = cardioLogs[0] ? estimateCardioCalories(cardioLogs[0], bodyWeightForCardio) : 0;
  const cardioTooltip = bodyWeightForCardio
    ? "Estimativa por MET usando tipo, intensidade, minutos e peso corporal atual."
    : "Estimativa por MET usando tipo, intensidade e minutos. Adicione o peso corporal atual para refinar.";
  const totalCardioMinutes = cardioMinutes(cardioDraft);
  return (
    <section className={`grid gap-4 ${mode === "both" ? "lg:grid-cols-2" : ""}`}>
      {mode !== "cardio" && <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5"><h3 className="text-lg font-black text-zinc-50">Check de dor/desconforto</h3><div className="mt-3 grid gap-2 sm:grid-cols-[auto_auto_1fr_auto]"><input type="date" value={pain.date} onChange={(e) => setPain({ ...pain, date: e.target.value })} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" /><select value={pain.level} onChange={(e) => setPain({ ...pain, level: e.target.value })} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"><option value="0">Sem dor</option><option value="1">Leve</option><option value="2">Moderada</option><option value="3">Forte</option></select><input value={pain.text} onChange={(e) => setPain({ ...pain, text: e.target.value })} placeholder="Onde sentiu?" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" /><button onClick={() => { setPainLogs((items) => [{ ...pain, id: makeEntryId("pain") }, ...items].slice(0, 12)); setPain({ date: today, text: "", level: "0" }); }} className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-black text-zinc-950">Salvar</button></div>{painLogs[0] && <p className="mt-3 text-sm text-zinc-400">Último: {painLogs[0].date} · nível {painLogs[0].level} · {painLogs[0].text || "sem observação"}</p>}</div>}
      {mode !== "pain" && <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-black text-zinc-50">Cardio</h3><p className="mt-1 text-xs font-bold text-zinc-500">Hoje · {new Date(`${today}T00:00:00`).toLocaleDateString("pt-BR")}</p></div>{cardioCalories > 0 && <span title={cardioTooltip} className="rounded-full bg-amber-950/70 px-3 py-1 text-xs font-black text-amber-200 ring-1 ring-amber-800">~{formatCalories(cardioCalories)}</span>}</div><div className="mt-3 grid gap-3"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{cardioTypeOptions.map((type) => <button key={type} onClick={() => setCardioDraft({ ...cardioDraft, type })} className={`rounded-2xl px-3 py-2 text-sm font-black ring-1 transition ${cardioDraft.type === type ? "bg-zinc-100 text-zinc-950 ring-zinc-100" : "bg-zinc-950 text-zinc-300 ring-zinc-700 hover:bg-zinc-800"}`}>{type}</button>)}</div>{cardioDraft.type === "Outro" && <input value={customCardioType} onChange={(e) => setCustomCardioType(e.target.value)} placeholder="Qual cardio?" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />}<div className="grid gap-2 sm:grid-cols-3"><label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Leve<input value={cardioDraft.lightMinutes} onChange={(e) => setCardioDraft({ ...cardioDraft, lightMinutes: e.target.value })} placeholder="min" inputMode="numeric" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-zinc-100" /></label><label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Moderado<input value={cardioDraft.moderateMinutes} onChange={(e) => setCardioDraft({ ...cardioDraft, moderateMinutes: e.target.value })} placeholder="min" inputMode="numeric" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-zinc-100" /></label><label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Forte<input value={cardioDraft.hardMinutes} onChange={(e) => setCardioDraft({ ...cardioDraft, hardMinutes: e.target.value })} placeholder="min" inputMode="numeric" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-zinc-100" /></label></div><button disabled={!totalCardioMinutes || cardioDraft.type === "Outro" && !customCardioType.trim()} onClick={() => { setCardioLogs((items) => [{ ...cardioToEstimate, id: makeEntryId("cardio"), date: today, intensity: "Variável" }, ...items].slice(0, 12)); setCardioDraft({ date: today, minutes: "", type: "Caminhada", intensity: "Variável", lightMinutes: "", moderateMinutes: "", hardMinutes: "" }); setCustomCardioType(""); }} className="rounded-xl bg-zinc-100 px-3 py-3 text-sm font-black text-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">Salvar {totalCardioMinutes ? `${totalCardioMinutes} min` : ""}</button></div>{cardioLogs[0] && <p className="mt-3 text-sm text-zinc-400">Último: {cardioLogs[0].date} · {cardioLogs[0].type} · {cardioMinutes(cardioLogs[0]) || "?"} min · variável{lastCardioCalories > 0 ? ` · ~${formatCalories(lastCardioCalories)}` : ""}</p>}</div>}
    </section>
  );
}

export default function TrainingPlanApp() {
  const [phase, setPhase] = useState<Phase>("fase1");
  const [customPlans, setCustomPlans] = useState<CustomTrainingPlan[]>(() => readCustomPlans());
  const [activePlanId, setActivePlanId] = useState(() => localStorage.getItem(ACTIVE_PLAN_KEY) ?? defaultTrainingPlan.id);
  const activePlan = customPlans.find((plan) => plan.id === activePlanId) ?? defaultTrainingPlan;
  const [week, setWeek] = useState("A");
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<{ idOrName: string; source: Exercise } | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [onlyToday, setOnlyToday] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [startDate, setStartDate] = useState(() => localStorage.getItem(START_DATE_KEY) ?? "");
  const [autoWeekEnabled, setAutoWeekEnabled] = useState(() => localStorage.getItem(AUTO_WEEK_KEY) !== "false");
  const { logs, setLogs, updateLog, clearLogs } = useLocalStorageLogs();
  const [painLogs, setPainLogs] = useStoredArray<PainLog>(PAIN_LOG_KEY);
  const [cardioLogs, setCardioLogs] = useStoredArray<CardioLog>(CARDIO_LOG_KEY);
  const [weeklySummaries, setWeeklySummaries] = useStoredArray<WeeklySummary>(WEEKLY_SUMMARY_KEY);
  const [timerSessions, setTimerSessions] = useStoredArray<ExerciseTimerSession>(TIMER_SESSION_KEY);
  const [weightHistory, setWeightHistory] = useStoredArray<WeightEntry>(WEIGHT_HISTORY_KEY);
  const [extraWorkouts, setExtraWorkouts] = useStoredArray<ExtraWorkout>(EXTRA_WORKOUT_KEY);
  const [bodyWeightKg, setBodyWeightKg] = useState<number | "">(() => readJson<number | "">(BODY_WEIGHT_KEY, ""));
  const [bodyHeightCm, setBodyHeightCm] = useState<number | "">(() => readJson<number | "">(BODY_HEIGHT_KEY, ""));
  const [bodyWeightWeekBlock, setBodyWeightWeekBlock] = useState(() => readJson<number>(BODY_WEIGHT_WEEK_KEY, -1));
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("Local");
  const [appView, setAppView] = useState<AppView>("training");
  const [selectedMedia, setSelectedMedia] = useState<MediaTarget | null>(null);
  const [selectedTimer, setSelectedTimer] = useState<TimerTarget | null>(null);
  const [quickLogModal, setQuickLogModal] = useState<"pain" | "cardio" | null>(null);
  const [bodyCheckMode, setBodyCheckMode] = useState<"signup" | "weekly" | null>(null);
  const [extraWorkoutOpen, setExtraWorkoutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openDayIds, setOpenDayIds] = useState<Record<string, boolean>>({});
  const [highlightedExerciseKey, setHighlightedExerciseKey] = useState<string | null>(null);
  const [activeExerciseKey, setActiveExerciseKey] = useState<string | null>(null);
  const [workoutMessage, setWorkoutMessage] = useState("");
  const [pendingWorkoutJump, setPendingWorkoutJump] = useState(false);
  const syncReadyRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);
  const exerciseRefs = useRef<Record<string, HTMLElement | null>>({});
  const startDateInputRef = useRef<HTMLInputElement | null>(null);

  const availableWeeks = useMemo(() => getPlanWeeks(activePlan, activePlan.id === defaultTrainingPlan.id ? phase : undefined), [activePlan, phase]);
  const weekIds = availableWeeks.map((item) => item.id);
  const todayName = getTodayName();
  const autoWeek = calculateWeekFromStart(startDate, weekIds);
  const weekBlock = startDate ? getBusinessWeekBlock(startDate, new Date()) : 0;

  function buildSyncPayload(): UserAppData {
    return normalizeUserAppData({
      logs,
      history: weeklySummaries,
      pain_logs: painLogs,
      cardio_logs: cardioLogs,
      timer_sessions: timerSessions,
      weight_history: weightHistory,
      custom_plans: customPlans,
      settings: {
        phase,
        startDate,
        autoWeekEnabled,
        activePlanId: activePlan.id,
        bodyWeightKg: typeof bodyWeightKg === "number" ? bodyWeightKg : undefined,
        bodyHeightCm: typeof bodyHeightCm === "number" ? bodyHeightCm : undefined,
        bodyWeightWeekBlock,
        extraWorkouts,
      },
    });
  }

  function applySyncPayload(data: UserAppData) {
    setLogs(data.logs);
    setWeeklySummaries(data.history as WeeklySummary[]);
    setPainLogs(data.pain_logs as PainLog[]);
    setCardioLogs(data.cardio_logs as CardioLog[]);
    setTimerSessions(data.timer_sessions);
    setWeightHistory(data.weight_history);
    setCustomPlans(data.custom_plans);
    if (data.settings.phase === "fase1" || data.settings.phase === "fase2") setPhase(data.settings.phase);
    if (typeof data.settings.week === "string") setWeek(data.settings.week);
    if (typeof data.settings.startDate === "string") setStartDate(data.settings.startDate);
    if (typeof data.settings.autoWeekEnabled === "boolean") setAutoWeekEnabled(data.settings.autoWeekEnabled);
    if (typeof data.settings.activePlanId === "string") setActivePlanId(data.settings.activePlanId);
    if (typeof data.settings.bodyWeightKg === "number") setBodyWeightKg(data.settings.bodyWeightKg);
    if (typeof data.settings.bodyHeightCm === "number") setBodyHeightCm(data.settings.bodyHeightCm);
    if (typeof data.settings.bodyWeightWeekBlock === "number") setBodyWeightWeekBlock(data.settings.bodyWeightWeekBlock);
    if (Array.isArray(data.settings.extraWorkouts)) setExtraWorkouts(data.settings.extraWorkouts as ExtraWorkout[]);
  }

  async function syncWithSupabase(currentUser = user, mode: "merge" | "push" = "push") {
    if (!currentUser) {
      setSyncStatus("Local");
      return;
    }
    setSyncStatus("Sincronizando");
    try {
      const local = buildSyncPayload();
      const remote = await getUserAppData(currentUser.id);
      const next = mode === "merge" && hasRemoteData(remote) ? mergeUserAppData(local, remote) : local;
      if (mode === "merge") applySyncPayload(next);
      await saveUserAppData(currentUser.id, next);
      syncReadyRef.current = true;
      setSyncStatus("Sincronizado");
    } catch (error) {
      console.error("[Supabase sync] Não foi possível sincronizar os dados.", error);
      setSyncStatus("Erro ao sincronizar");
    }
  }

  useEffect(() => localStorage.setItem(START_DATE_KEY, startDate), [startDate]);
  useEffect(() => localStorage.setItem(AUTO_WEEK_KEY, String(autoWeekEnabled)), [autoWeekEnabled]);
  useEffect(() => localStorage.setItem(ACTIVE_PLAN_KEY, activePlan.id), [activePlan.id]);
  useEffect(() => writeJson(BODY_WEIGHT_KEY, bodyWeightKg), [bodyWeightKg]);
  useEffect(() => writeJson(BODY_HEIGHT_KEY, bodyHeightCm), [bodyHeightCm]);
  useEffect(() => writeJson(BODY_WEIGHT_WEEK_KEY, bodyWeightWeekBlock), [bodyWeightWeekBlock]);
  useEffect(() => saveCustomPlans(customPlans), [customPlans]);
  useEffect(() => { if (autoWeekEnabled) setWeek(autoWeek); }, [autoWeekEnabled, autoWeek]);
  useEffect(() => { if (weekIds.length && !weekIds.includes(week)) setWeek(weekIds[0]); }, [weekIds.join("|"), week]);
  useEffect(() => {
    setOpenDayIds({});
    setHighlightedExerciseKey(null);
    setWorkoutMessage("");
  }, [week, query, onlyToday, activePlan.id, phase, lightMode]);
  useEffect(() => {
    getCurrentSession().then((session) => {
      setUser(session?.user ?? null);
      if (session?.user) void syncWithSupabase(session.user, "merge");
    }).catch((error) => {
      console.error("[Supabase auth] Não foi possível restaurar a sessão.", error);
      setSyncStatus("Erro ao sincronizar");
    });
    return onAuthSessionChange((session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      syncReadyRef.current = false;
      setSyncStatus(nextUser ? "Sincronizando" : "Local");
      if (nextUser) void syncWithSupabase(nextUser, "merge");
    });
  }, []);
  useEffect(() => {
    if (!user || !syncReadyRef.current) return;
    setSyncStatus("Sincronizando");
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => void syncWithSupabase(user, "push"), 900);
    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [user, logs, painLogs, cardioLogs, timerSessions, weightHistory, extraWorkouts, customPlans, weeklySummaries, phase, week, startDate, autoWeekEnabled, activePlan.id, bodyWeightKg, bodyHeightCm, bodyWeightWeekBlock]);

  const filteredPlans = useMemo(() => {
    const days = getPlanDays(activePlan, activePlan.id === defaultTrainingPlan.id ? phase : undefined, week);
    const scheduledDays = scheduleTrainingDays(days, startDate, selectedWeekBlock(startDate, week));
    const extras: ScheduledTrainingDay[] = extraWorkouts
      .filter((item) => item.planId === activePlan.id && item.week === week)
      .map((item, index) => ({
        id: item.id,
        phase: activePlan.id === defaultTrainingPlan.id ? phase : undefined,
        week,
        day: getWeekdayName(item.date) || "Extra",
        scheduledDayName: getWeekdayName(item.date) || "Extra",
        scheduledDate: item.date,
        title: item.title,
        type: "superior" as TrainingType,
        exercises: item.exercises,
        blockIndex: scheduledDays.length + index + 1,
        blockTotal: scheduledDays.length + extraWorkouts.filter((extra) => extra.planId === activePlan.id && extra.week === week).length,
      }));
    return [...scheduledDays, ...extras].filter((plan) => {
      const searchable = `${plan.day} ${plan.title} ${plan.type} ${plan.exercises.map((exercise) => `${exercise.name} ${exercise.focus}`).join(" ")}`.toLowerCase();
      return searchable.includes(query.toLowerCase()) && (!onlyToday || plan.scheduledDate === todayDateKey());
    });
  }, [activePlan, extraWorkouts, phase, week, query, onlyToday, startDate, todayName, weekIds.join("|")]);

  const visibleExercises = filteredPlans.flatMap((plan) => (lightMode ? plan.exercises.slice(0, 4) : plan.exercises).map((exercise) => ({ plan, exercise })));
  const todayExercises = visibleExercises.filter(({ plan }) => plan.scheduledDate === todayDateKey());
  const allTodayExercisesDone = todayExercises.length > 0 && todayExercises.every(({ plan, exercise }) => getLog(plan, exercise)?.done);
  const allTodayExercisesHandled = todayExercises.length > 0 && todayExercises.every(({ plan, exercise }) => {
    const log = getLog(plan, exercise);
    return Boolean(log?.done || log?.skipped);
  });

  useEffect(() => {
    if (allTodayExercisesHandled) setWorkoutMessage("");
  }, [allTodayExercisesHandled]);

  function getExerciseDomKey(plan: ScheduledTrainingDay, exercise: Exercise) {
    return `${plan.id}::${exercise.id ?? exercise.order}`;
  }

  function isDayOpen(plan: TrainingDay) {
    return openDayIds[plan.id] ?? shouldDayStartOpen(plan.day, todayName, query, onlyToday);
  }

  function registerExerciseRef(key: string, element: HTMLElement | null) {
    exerciseRefs.current[key] = element;
  }

  function selectedWeekBlock(dateValue: string, selectedWeek: string) {
    if (!dateValue || weekIds.length === 0) return 0;
    const currentBlock = getBusinessWeekBlock(dateValue, new Date());
    const selectedIndex = weekIds.findIndex((id) => id === selectedWeek);
    if (selectedIndex < 0) return currentBlock;
    const cycleStart = Math.floor(currentBlock / weekIds.length) * weekIds.length;
    return cycleStart + selectedIndex;
  }

  function logKeyFor(plan: ScheduledTrainingDay, exercise: Exercise) {
    return getCurrentDayLogKey({
      userIdOrLocal: "local",
      planId: activePlan.id,
      dateKey: plan.scheduledDate,
      weekId: plan.week,
      dayName: plan.scheduledDayName,
      exerciseId: exercise.id ?? exercise.order,
    });
  }

  function exactLogKeyFor(plan: TrainingDay, exercise: Exercise, block: number) {
    const days = getPlanDays(activePlan, activePlan.id === defaultTrainingPlan.id ? phase : undefined, plan.week);
    const scheduled = scheduleTrainingDays(days, startDate, block).find((day) => day.id === plan.id);
    return getCurrentDayLogKey({
      userIdOrLocal: "local",
      planId: activePlan.id,
      dateKey: scheduled?.scheduledDate ?? todayDateKey(),
      weekId: plan.week,
      dayName: scheduled?.scheduledDayName ?? plan.day,
      exerciseId: exercise.id ?? exercise.order,
    });
  }

  function getLog(plan: ScheduledTrainingDay, exercise: Exercise) {
    return logs[logKeyFor(plan, exercise)];
  }

  function updateExerciseLog(plan: ScheduledTrainingDay, exercise: Exercise, patch: Partial<ExerciseLog>) {
    const current = getLog(plan, exercise) ?? emptyLog();
    const next = { ...current, ...patch };
    const shouldAutoDone = Boolean(numericValue(next.load) && [next.reps1, next.reps2, next.reps3].some((value) => numericValue(value) > 0));
    const finalPatch = shouldAutoDone ? { ...patch, done: true, skipped: false } : patch;
    const shouldSetStartDate = !startDate && finalPatch.done;
    const effectiveStartDate = shouldSetStartDate ? todayInputValue() : startDate;
    if (shouldSetStartDate) setStartDate(effectiveStartDate);
    updateLog(logKeyFor(plan, exercise), finalPatch);
  }

  function handleTimerComplete(session: ExerciseTimerSession, patch: { load: string; reps1: string; reps2: string; reps3: string; done: boolean; skipped?: boolean }) {
    if (selectedTimer) updateExerciseLog(selectedTimer.plan, selectedTimer.exercise, patch);
    setTimerSessions((current) => [session, ...current.filter((item) => item.id !== session.id)].slice(0, 500));
    setSelectedTimer(null);
  }

  function goToNextExercise() {
    if (todayExercises.length === 0) {
      setWorkoutMessage("Nenhum exercício para hoje.");
      window.setTimeout(() => setWorkoutMessage(""), 2500);
      return;
    }
    const isPending = ({ plan, exercise }: { plan: ScheduledTrainingDay; exercise: Exercise }) => {
      const log = getLog(plan, exercise);
      return !log?.done && !log?.skipped;
    };
    const activeIndex = activeExerciseKey ? todayExercises.findIndex(({ plan, exercise }) => getExerciseDomKey(plan, exercise) === activeExerciseKey) : -1;
    if (activeIndex >= 0) {
      const current = todayExercises[activeIndex];
      const currentLog = getLog(current.plan, current.exercise);
      if (!currentLog?.done && !currentLog?.skipped) updateLog(logKeyFor(current.plan, current.exercise), { skipped: true, done: false });
    }
    const searchStart = activeIndex >= 0 ? activeIndex + 1 : 0;
    const target = todayExercises.slice(searchStart).find(isPending) ?? todayExercises.slice(0, searchStart).find(isPending);
    if (!target) {
      setActiveExerciseKey(null);
      setWorkoutMessage("Sem pendências hoje.");
      window.setTimeout(() => setWorkoutMessage(""), 2500);
      return;
    }
    const domKey = getExerciseDomKey(target.plan, target.exercise);
    setWorkoutMessage("");
    setOpenDayIds((current) => ({ ...current, [target.plan.id]: true }));
    setHighlightedExerciseKey(domKey);
    setActiveExerciseKey(domKey);
    window.setTimeout(() => exerciseRefs.current[domKey]?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    window.setTimeout(() => setHighlightedExerciseKey((current) => current === domKey ? null : current), 1500);
  }

  function startWorkout() {
    setOnlyToday(true);
    setWeek(autoWeek);
    setAutoWeekEnabled(true);
    setPendingWorkoutJump(true);
  }

  useEffect(() => {
    if (!pendingWorkoutJump) return;
    setPendingWorkoutJump(false);
    window.setTimeout(goToNextExercise, 80);
  }, [pendingWorkoutJump, filteredPlans, logs, lightMode]);

  useEffect(() => {
    if (!startDate || weekBlock <= 0) return;
    if (bodyWeightWeekBlock === weekBlock) return;
    setBodyCheckMode("weekly");
  }, [bodyWeightWeekBlock, startDate, weekBlock]);

  function saveBodyCheck(values: { weightKg: number; heightCm?: number }) {
    setBodyWeightKg(values.weightKg);
    if (values.heightCm) setBodyHeightCm(values.heightCm);
    setBodyWeightWeekBlock(weekBlock);
    addWeightEntry({ weightKg: values.weightKg, heightCm: values.heightCm ?? (typeof bodyHeightCm === "number" ? bodyHeightCm : undefined), source: bodyCheckMode === "signup" ? "signup" : "weekly-checkin" });
    setBodyCheckMode(null);
  }

  function addWeightEntry(entry: { weightKg: number; heightCm?: number; source?: WeightEntry["source"]; date?: string; note?: string }) {
    const now = new Date().toISOString();
    const date = entry.date ?? todayDateKey();
    const item: WeightEntry = {
      id: makeEntryId("weight"),
      date,
      weightKg: entry.weightKg,
      heightCm: entry.heightCm,
      source: entry.source,
      note: entry.note,
      createdAt: now,
      updatedAt: now,
    };
    saveWeightEntry(item);
  }

  function updateBodyFromWeightHistory(history: WeightEntry[]) {
    const latest = normalizeWeightHistory(history).at(-1);
    setBodyWeightKg(latest?.weightKg ?? "");
    if (latest?.heightCm) setBodyHeightCm(latest.heightCm);
  }

  function saveWeightEntry(entry: WeightEntry) {
    setWeightHistory((current) => {
      const next = sortWeightHistory([entry, ...current.filter((value) => value.id !== entry.id && !(value.date === entry.date && value.weightKg === entry.weightKg && !value.deletedAt))]);
      updateBodyFromWeightHistory(next);
      return next;
    });
  }

  function removeWeightEntry(entryId: string) {
    setWeightHistory((current) => {
      const next = deleteWeightEntry(current, entryId);
      updateBodyFromWeightHistory(next);
      return next;
    });
  }

  function saveSettingsBodyWeight() {
    if (typeof bodyWeightKg !== "number" || bodyWeightKg <= 0) return;
    addWeightEntry({
      weightKg: bodyWeightKg,
      heightCm: typeof bodyHeightCm === "number" ? bodyHeightCm : undefined,
      source: "manual",
      note: "Atualizado nas configurações",
    });
  }

  function saveExtraWorkout(workout: ExtraWorkout) {
    setExtraWorkouts((current) => [...current, workout]);
    setOpenDayIds((current) => ({ ...current, [workout.id]: true }));
    setExtraWorkoutOpen(false);
  }

  const doneCount = visibleExercises.filter(({ plan, exercise }) => getLog(plan, exercise)?.done).length;
  const increaseCount = Object.values(logs).filter(shouldIncrease).length;
  const totalCount = visibleExercises.length;

  function buildWeeklySummary(block: number): WeeklySummary {
    const summaryWeekId = weekIds[block % Math.max(weekIds.length, 1)] ?? "A";
    const days = getPlanDays(activePlan, activePlan.id === defaultTrainingPlan.id ? phase : undefined, summaryWeekId);
    const exercises = days.flatMap((plan) => plan.exercises.map((exercise) => ({ plan, exercise, log: logs[exactLogKeyFor(plan, exercise, block)] })));
    const doneExercises = exercises.filter(({ log }) => log?.done);
    const progress = doneExercises.filter(({ log }) => shouldIncrease(log)).map(({ exercise, log }) => `Subir carga em ${exercise.name} após bater ${log?.reps1 || "-"}/${log?.reps2 || "-"}/${log?.reps3 || "-"} reps com ${log?.load || "carga registrada"} kg.`);
    const reduce = doneExercises
      .filter(({ log }) => {
        const average = averageReps(log);
        return Boolean(log?.load && average > 0 && average < 8);
      })
      .map(({ exercise, log }) => `Diminuir ou revisar ${exercise.name}: média de ${averageReps(log).toFixed(1)} reps ficou baixa para ${log?.load || "a carga atual"} kg.`);
    const skipped = exercises.filter(({ log }) => !log?.done).slice(0, 12).map(({ exercise }) => exercise.name);
    const pain = painLogs.filter((entry) => isDateInWeek(entry.date, startDate, block) && entry.level !== "0").map((entry) => `${entry.date}: nível ${entry.level}${entry.text ? ` · ${entry.text}` : ""}`);
    const weekCardioLogs = cardioLogs.filter((entry) => isDateInWeek(entry.date, startDate, block));
    const calories = exercises.reduce((sum, item) => sum + estimateExerciseCalories(item.log, item.exercise, typeof bodyWeightKg === "number" ? bodyWeightKg : null), 0);
    const cardioCalories = weekCardioLogs.reduce((sum, entry) => sum + estimateCardioCalories(entry, typeof bodyWeightKg === "number" ? bodyWeightKg : null), 0);
    const notePain = doneExercises.filter(({ log }) => log?.note.toLowerCase().includes("dor") || log?.note.toLowerCase().includes("desconforto")).map(({ exercise }) => exercise.name);
    const exerciseStats = doneExercises.map(({ exercise, log }) => ({ exercise, log, volume: exerciseVolume(log), calories: estimateExerciseCalories(log, exercise, typeof bodyWeightKg === "number" ? bodyWeightKg : null), avgReps: averageReps(log) }));
    const best = [...exerciseStats].sort((a, b) => b.volume - a.volume)[0];
    const topCalories = [...exerciseStats].sort((a, b) => b.calories - a.calories)[0];
    const improve = [...exerciseStats].filter((item) => item.avgReps > 0).sort((a, b) => a.avgReps - b.avgReps)[0];
    const allWeeklyLoads = Array.from({ length: Math.max(block + 1, 1) }, (_, index) => {
      const weekId = weekIds[index % Math.max(weekIds.length, 1)] ?? "A";
      const weekDays = getPlanDays(activePlan, activePlan.id === defaultTrainingPlan.id ? phase : undefined, weekId);
      const weeklyEntries = weekDays.flatMap((day) => day.exercises.map((exercise) => logs[exactLogKeyFor(day, exercise, index)]));
      const totalLoad = weeklyEntries.reduce((sum, log) => sum + exerciseVolume(log), 0);
      const calories = weeklyEntries.reduce((sum, log) => sum + estimateExerciseCalories(log, undefined, typeof bodyWeightKg === "number" ? bodyWeightKg : null), 0);
      return { label: `Semana ${index + 1}`, totalLoad, calories };
    });
    const weeklyLoads = allWeeklyLoads.slice(-4);
    const recommendations = [
      progress.length ? `Progressão sugerida em ${progress.length} exercício(s), sempre mantendo técnica limpa.` : "Manter cargas até bater o critério de progressão.",
      reduce.length ? `${reduce.length} exercício(s) pedem redução/revisão por reps baixas.` : "Sem necessidade clara de reduzir carga pela média de reps.",
      pain.length || notePain.length ? `Maneirar na próxima semana em regiões/exercícios com dor: ${[...pain, ...notePain].slice(0, 4).join("; ")}.` : "Sem alertas fortes de dor registrados.",
      skipped.length ? `Exercícios pulados não são problema; retome prioridade nos primeiros blocos do próximo treino.` : "Boa consistência: nenhum exercício ficou sem registro nesta semana.",
    ];

    return {
      id: `${activePlan.id}-${phase}-${startDate}-${block}`,
      generatedAt: new Date().toISOString(),
      startDate,
      weekBlock: block,
      weekId: summaryWeekId,
      dateRange: formatDateRange(startDate, block),
      done: doneExercises.length,
      total: exercises.length,
      calories,
      cardioCalories,
      progress,
      reduce,
      skipped,
      pain,
      recommendations,
      bestExercise: best && best.volume ? `${best.exercise.name}: ${best.volume} kg totais levantados.` : undefined,
      topCalorieExercise: topCalories && topCalories.calories ? `${topCalories.exercise.name}: ~${formatCalories(topCalories.calories)} estimadas.` : undefined,
      improveExercise: improve ? `${improve.exercise.name}: média de ${improve.avgReps.toFixed(1)} reps; revisar carga, descanso ou técnica.` : undefined,
      weeklyLoads,
    };
  }


  useEffect(() => {
    if (!startDate || weekBlock <= 0 || weekIds.length === 0) return;
    const previousBlock = weekBlock - 1;
    const id = `${activePlan.id}-${phase}-${startDate}-${previousBlock}`;
    if (weeklySummaries.some((summary) => summary.id === id)) return;
    setWeeklySummaries((current) => [buildWeeklySummary(previousBlock), ...current].slice(0, 24));
  }, [startDate, weekBlock, weekIds.join("|"), activePlan.id, phase, logs, painLogs, cardioLogs, weeklySummaries]);

  const canDownloadWeeklySummary = Boolean(startDate && weekBlock > 0 && weekIds.length > 0);

  function downloadLatestWeeklySummary() {
    if (!canDownloadWeeklySummary) return;
    const previousBlock = weekBlock - 1;
    const id = `${activePlan.id}-${phase}-${startDate}-${previousBlock}`;
    const summary = buildWeeklySummary(previousBlock);
    setWeeklySummaries((current) => [summary, ...current.filter((item) => item.id !== id)].slice(0, 24));
    downloadWeeklySummaryPdf(summary);
  }

  function exportData() {
    const payload = { exportedAt: new Date().toISOString(), phase, week, startDate, autoWeekEnabled, activePlanId: activePlan.id, logs, painLogs, cardioLogs, weeklySummaries, customPlans };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progresso-treino-loloa.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const payload = JSON.parse(text);
      if (payload.logs) writeJson(STORAGE_KEY, payload.logs);
      if (payload.customPlans) setCustomPlans(payload.customPlans);
      if (payload.painLogs) setPainLogs(payload.painLogs);
      if (payload.cardioLogs) setCardioLogs(payload.cardioLogs);
      if (payload.weeklySummaries) setWeeklySummaries(payload.weeklySummaries);
      if (payload.startDate) setStartDate(payload.startDate);
      window.location.reload();
    }).catch(() => window.alert("Não foi possível importar este arquivo."));
  }

  function createPlan() {
    const plan = makeCustomPlan();
    setCustomPlans((current) => [...current, plan]);
    setActivePlanId(plan.id);
    setEditorOpen(true);
  }

  function saveCustomPlan(plan: CustomTrainingPlan) {
    setCustomPlans((current) => current.some((item) => item.id === plan.id) ? current.map((item) => item.id === plan.id ? plan : item) : [...current, plan]);
    setActivePlanId(plan.id);
    setEditorOpen(false);
  }

  function deleteCustomPlan(id: string) {
    setCustomPlans((current) => current.filter((plan) => plan.id !== id));
    if (activePlanId === id) setActivePlanId(defaultTrainingPlan.id);
    setEditorOpen(false);
  }

  function openStartDatePicker() {
    const input = startDateInputRef.current;
    if (!input) return;
    const inputWithPicker = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof inputWithPicker.showPicker === "function") {
      inputWithPicker.showPicker();
      return;
    }
    input.focus();
    input.click();
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(201,182,255,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(244,166,193,0.12),transparent_28%),linear-gradient(180deg,#141218,#17131d)] text-zinc-100">
      <header className="cute-topbar sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto grid w-full max-w-7xl gap-3 px-3 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="cute-logo inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950 shadow-sm shadow-black/30"><Dumbbell className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="cute-title-gradient truncate text-base font-black">Treino Loloa</p><p className="truncate text-xs font-bold text-zinc-500">{activePlan.name} · Semana {week}</p></div>
            </div>
            <nav className="cute-segmented hidden p-1 md:flex">
              {([{ id: "training", label: "Treino" }, { id: "performance", label: "Desempenho" }] as const).map((item) => (
                <button key={item.id} onClick={() => setAppView(item.id)} className={`rounded-xl px-4 py-2 text-sm font-black transition ${appView === item.id ? "cute-primary shadow-sm" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>{item.label}</button>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              <UserMenu user={user} syncStatus={syncStatus} onOpenAuth={() => setAuthOpen(true)} onSignOut={() => void signOut()} onSyncNow={() => void syncWithSupabase(user, "merge")} />
              <div className="settings-details relative">
                <button type="button" aria-label="Abrir configurações" onClick={() => setSettingsOpen((value) => !value)} className="cute-pop inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800"><Settings className="h-5 w-5" /></button>
                {settingsOpen && <>
                <button type="button" aria-label="Fechar configurações" onClick={() => setSettingsOpen(false)} className="settings-backdrop" />
                <div className="settings-panel cute-card-elevated rounded-3xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl shadow-black/60">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3 px-1 pb-1">
                      <div><p className="cute-eyebrow">Configurações</p><p className="text-sm font-bold text-zinc-400">Ajustes rápidos do treino</p></div>
                      <button type="button" onClick={() => setSettingsOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="rounded-2xl bg-zinc-900/70 p-3 ring-1 ring-zinc-800">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Ajustes do treino</p>
                      <div className="grid gap-3">
                        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Plano<select value={activePlan.id} onChange={(event) => setActivePlanId(event.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-black normal-case tracking-normal text-zinc-100 outline-none"><option value={defaultTrainingPlan.id}>Treino padrão</option>{customPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
                        {activePlan.id === defaultTrainingPlan.id ? <Segmented value={phase} setValue={setPhase} options={[{ value: "fase1", label: "Meses 1-6" }, { value: "fase2", label: "Após 6 meses" }]} /> : <button onClick={() => setEditorOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm font-black text-zinc-200"><Library className="h-4 w-4" /> Editar personalizado</button>}
                        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Data de início<span className="grid gap-2 sm:grid-cols-[1fr_auto]"><input ref={startDateInputRef} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-zinc-100 outline-none focus:border-zinc-400" /><button type="button" onClick={openStartDatePicker} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-black normal-case tracking-normal text-zinc-200 hover:bg-zinc-800"><CalendarDays className="h-4 w-4" /> Selecionar</button></span></label>
                        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Peso corporal atual<input value={typeof bodyWeightKg === "number" && Number.isFinite(bodyWeightKg) ? bodyWeightKg : ""} onBlur={saveSettingsBodyWeight} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} onChange={(event) => setBodyWeightKg(event.target.value ? Number(event.target.value.replace(",", ".")) : "")} inputMode="decimal" placeholder="kg" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-zinc-100 outline-none focus:border-zinc-400" /></label>
                        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Altura<input value={typeof bodyHeightCm === "number" && Number.isFinite(bodyHeightCm) ? bodyHeightCm : ""} onChange={(event) => setBodyHeightCm(event.target.value ? Number(event.target.value.replace(",", ".")) : "")} inputMode="decimal" placeholder="cm" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-zinc-100 outline-none focus:border-zinc-400" /></label>
                        <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar exercício, músculo ou dia..." className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-zinc-400" /></label>
                        <Segmented value={week} setValue={(next) => { setAutoWeekEnabled(false); setWeek(next); }} options={availableWeeks.map((item) => ({ value: item.id, label: item.label }))} />
                      </div>
                    </div>
                    <div className="grid gap-2 rounded-2xl bg-zinc-900/70 p-3 ring-1 ring-zinc-800">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Preferências</p>
                      <button onClick={() => setAutoWeekEnabled((value) => !value)} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${autoWeekEnabled ? "bg-emerald-950/60 text-emerald-100 ring-1 ring-emerald-800" : "bg-zinc-950 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800"}`}><span className="inline-flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Semana automática</span><span className="text-xs">{autoWeekEnabled ? "ON" : "OFF"}</span></button>
                      <button onClick={() => setOnlyToday((value) => !value)} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${onlyToday ? "bg-blue-950/60 text-blue-100 ring-1 ring-blue-800" : "bg-zinc-950 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800"}`}><span className="inline-flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Mostrar só hoje</span><span className="text-xs">{onlyToday ? "ON" : "OFF"}</span></button>
                      <button onClick={() => setLightMode((value) => !value)} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${lightMode ? "bg-orange-950/60 text-orange-100 ring-1 ring-orange-800" : "bg-zinc-950 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800"}`}><span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> Modo leve</span><span className="text-xs">{lightMode ? "ON" : "OFF"}</span></button>
                    </div>
                    <div className="rounded-2xl bg-zinc-900/70 p-3 ring-1 ring-zinc-800">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Ferramentas</p>
                      <div className="grid gap-1">
                        <button onClick={() => setInfoModalOpen(true)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800"><Activity className="h-4 w-4 text-zinc-400" /> Informações</button>
                        <button onClick={createPlan} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800"><Plus className="h-4 w-4 text-zinc-400" /> Novo treino personalizado</button>
                        <button onClick={exportData} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800"><Download className="h-4 w-4 text-zinc-400" /> Exportar progresso</button>
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800"><Upload className="h-4 w-4 text-zinc-400" /> Importar progresso<input type="file" accept="application/json" onChange={importData} className="hidden" /></label>
                        {canDownloadWeeklySummary && <button onClick={downloadLatestWeeklySummary} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800"><FileText className="h-4 w-4 text-zinc-400" /> Baixar relatório semanal</button>}
                        <button onClick={() => window.print()} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800"><Printer className="h-4 w-4 text-zinc-400" /> Imprimir</button>
                        <button onClick={() => window.confirm("Apagar todo o progresso salvo neste navegador?") && clearLogs()} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-200 hover:bg-red-950/40"><Trash2 className="h-4 w-4" /> Limpar progresso</button>
                      </div>
                    </div>
                  </div>
                </div>
                </>}
              </div>
            </div>
          </div>
          <nav className="cute-segmented grid grid-cols-2 p-1 md:hidden">
            {([{ id: "training", label: "Treino" }, { id: "performance", label: "Desempenho" }] as const).map((item) => (
              <button key={item.id} onClick={() => setAppView(item.id)} className={`rounded-xl px-3 py-2 text-sm font-black transition ${appView === item.id ? "cute-primary shadow-sm" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>{item.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-8 px-3 py-8 sm:px-6 lg:px-8">
        {appView === "training" ? <>
        <section className="cute-hero grid gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="cute-eyebrow">Começar treino</p><h2 className="mt-1 text-2xl font-black leading-tight text-zinc-50 sm:text-3xl">{activePlan.name} · Semana {week}</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Use "Só hoje" para focar no treino do dia, ou busque qualquer exercício da semana selecionada.</p></div><button onClick={startWorkout} className="cute-button cute-button-primary px-5"><CalendarDays className="h-4 w-4" /> Começar treino</button></div>
          <div className="cute-progress">
            <div className="cute-progress-fill" style={{ width: `${totalCount ? Math.round((doneCount / totalCount) * 100) : 0}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatBadge icon={<CheckCircle2 className="h-4 w-4" />} title="Feitos" value={`${doneCount}/${totalCount}`} tooltip="Exercícios marcados como feitos na tela atual." />
            <StatBadge icon={<Activity className="h-4 w-4" />} title="Progressão" value={`${increaseCount}`} tooltip="Registros que bateram 3x15 e sugerem aumento de carga." />
            <StatBadge icon={<TimerReset className="h-4 w-4" />} title="Descanso" value="60-120s" tooltip="Timer por exercício, com presets rápidos." />
            <StatBadge icon={<RotateCcw className="h-4 w-4" />} title="Plano" value={activePlan.name} tooltip={`Semana automática alterna entre ${weekIds.join(", ") || "A"}; ocorrência atual: ${weekBlock + 1}.`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setQuickLogModal("cardio")} className="cute-button cute-button-secondary"><Activity className="h-4 w-4" /> Registrar cardio</button>
            <button onClick={() => setQuickLogModal("pain")} className="cute-button cute-button-secondary"><HeartPulse className="h-4 w-4" /> Check de dor</button>
          </div>
        </section>
        <section className="space-y-5"><div className="cute-section-header flex-col items-start sm:flex-row sm:items-end"><div><p className="cute-eyebrow">Treinos</p><h2>{activePlan.id === defaultTrainingPlan.id ? (phase === "fase1" ? "Fase 1: meses 1 a 6" : "Fase 2: após 6 meses") : activePlan.name} · Semana {week}</h2><p>{filteredPlans.length} bloco(s) encontrado(s)</p></div><div className="next-exercise-actions"><button onClick={goToNextExercise} disabled={todayExercises.length === 0 || allTodayExercisesHandled} className="cute-button cute-button-primary next-exercise-button disabled:cursor-not-allowed disabled:opacity-50"><ClipboardCheck className="h-4 w-4" /> {todayExercises.length === 0 ? "Sem treino hoje" : allTodayExercisesHandled ? (allTodayExercisesDone ? "Dia concluído" : "Sem pendências") : "Próximo exercício"}</button>{!allTodayExercisesHandled && workoutMessage && <span className="cute-badge cute-badge-lavender next-exercise-feedback">{workoutMessage}</span>}</div></div>{filteredPlans.length > 0 ? filteredPlans.map((plan) => <DayCard key={plan.id} plan={plan} logs={logs} getLog={getLog} updateExerciseLog={updateExerciseLog} onMuscleClick={setSelectedMuscle} onAlternativeClick={(idOrName, source) => setSelectedAlternative({ idOrName, source })} onMediaOpen={setSelectedMedia} onTimerOpen={(timerPlan, exercise) => setSelectedTimer({ plan: timerPlan, exercise })} isOpen={isDayOpen(plan)} onToggle={() => setOpenDayIds((current) => ({ ...current, [plan.id]: !isDayOpen(plan) }))} getExerciseDomKey={getExerciseDomKey} getCurrentLogKey={logKeyFor} registerExerciseRef={registerExerciseRef} highlightedExerciseKey={highlightedExerciseKey} lightMode={lightMode} bodyWeightKg={typeof bodyWeightKg === "number" ? bodyWeightKg : null} timerSessions={timerSessions} />) : <div className="cute-empty">Nenhum treino encontrado por aqui 💗</div>}<div className="cute-card rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/70 p-4 text-center"><p className="text-sm font-bold text-zinc-400">Vai treinar fora do plano da semana?</p><button type="button" onClick={() => setExtraWorkoutOpen(true)} className="cute-button cute-button-secondary mx-auto mt-3"><Plus className="h-4 w-4" /> Adicionar exercícios extras</button></div></section>
        </> : <PerformancePage logs={logs} cardioLogs={cardioLogs} painLogs={painLogs} timerSessions={timerSessions} weightHistory={weightHistory} bodyWeightKg={typeof bodyWeightKg === "number" ? bodyWeightKg : null} bodyHeightCm={typeof bodyHeightCm === "number" ? bodyHeightCm : null} onSaveWeightEntry={saveWeightEntry} onDeleteWeightEntry={removeWeightEntry} loading={syncStatus === "Sincronizando" && Boolean(user)} />}
      </main>

      <InfoModal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
      <MuscleModal focus={selectedMuscle} onClose={() => setSelectedMuscle(null)} />
      <AlternativeModal alternative={selectedAlternative} onClose={() => setSelectedAlternative(null)} onMuscleClick={setSelectedMuscle} onMediaOpen={setSelectedMedia} />
      <ExerciseMediaModal target={selectedMedia} onClose={() => setSelectedMedia(null)} onMuscleClick={setSelectedMuscle} />
      <ExerciseTimerModal target={selectedTimer ? { planId: activePlan.id, weekId: selectedTimer.plan.week, dayName: selectedTimer.plan.scheduledDayName, dateKey: selectedTimer.plan.scheduledDate, exercise: selectedTimer.exercise } : null} bodyWeightKg={typeof bodyWeightKg === "number" ? bodyWeightKg : null} onClose={() => setSelectedTimer(null)} onComplete={handleTimerComplete} />
      {quickLogModal && <ModalShell onClose={() => setQuickLogModal(null)} wide><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900/95 p-5 backdrop-blur"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Registro rápido</p><h2 className="mt-1 text-2xl font-black text-zinc-50">{quickLogModal === "cardio" ? "Cardio diário" : "Check de dor/desconforto"}</h2></div><button onClick={() => setQuickLogModal(null)} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button></div><div className="p-5"><QuickLogs painLogs={painLogs} setPainLogs={setPainLogs} cardioLogs={cardioLogs} setCardioLogs={setCardioLogs} mode={quickLogModal} /></div></ModalShell>}
      {bodyCheckMode && <BodyCheckModal mode={bodyCheckMode} initialWeight={bodyWeightKg} initialHeight={bodyHeightCm} weekLabel={`Semana ${week}`} onSave={saveBodyCheck} onClose={bodyCheckMode === "signup" ? () => setBodyCheckMode(null) : undefined} />}
      <ExtraWorkoutModal open={extraWorkoutOpen} activePlanId={activePlan.id} week={week} onClose={() => setExtraWorkoutOpen(false)} onSave={saveExtraWorkout} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSignedUp={() => { setAuthOpen(false); setBodyCheckMode("signup"); }} />
      <TrainingEditor open={editorOpen} plans={customPlans} activePlanId={activePlanId} onClose={() => setEditorOpen(false)} onSave={saveCustomPlan} onDelete={deleteCustomPlan} />
    </div>
  );
}
