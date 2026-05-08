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
import { cardio, defaultTrainingPlan, getPlanDays, getPlanWeeks, overview, progression, recovery } from "./data/trainingPlans";
import { exerciseLibrary, exerciseLibraryList, findExerciseLibraryItem, toPlanExercise } from "./data/exerciseLibrary";
import { muscleImages } from "./data/muscleData";
import type { CustomTrainingPlan, Exercise, ExerciseLog, Logs, Phase, TrainingDay, TrainingType, TrainingWeek } from "./types/training";
import { focusToKey, focusToTargets } from "./utils/focus";
import { getManualVideoLinks, videoKey, youtubeSearch } from "./utils/video";
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
import { getBusinessWeekBlock, getSessionDateForWeekDay, getWeekdayName } from "./utils/schedule";

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

const WEEKLY_SUMMARY_KEY = "treino-loloa-weekly-summaries-v1";
const cardioTypeOptions = ["Caminhada", "Esteira", "Corrida", "Bicicleta", "Elíptico", "Escada", "Outro"];

const typeStyle: Record<TrainingType, { label: string; chip: string; border: string; soft: string; icon: string }> = {
  puxar: { label: "Puxar", chip: "bg-blue-950/70 text-blue-200 ring-blue-800", border: "border-blue-500", soft: "bg-blue-950/30", icon: "" },
  empurrar: { label: "Empurrar", chip: "bg-rose-950/70 text-rose-200 ring-rose-800", border: "border-rose-500", soft: "bg-rose-950/30", icon: "" },
  gluteo: { label: "Posterior/glúteos", chip: "bg-orange-950/70 text-orange-200 ring-orange-800", border: "border-orange-500", soft: "bg-orange-950/30", icon: "" },
  inferior: { label: "Inferiores", chip: "bg-emerald-950/70 text-emerald-200 ring-emerald-800", border: "border-emerald-500", soft: "bg-emerald-950/30", icon: "" },
  superior: { label: "Superiores/acessórios", chip: "bg-violet-950/70 text-violet-200 ring-violet-800", border: "border-violet-500", soft: "bg-violet-950/30", icon: "" },
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
      scheduledDayName: getWeekdayName(scheduledDate) || day.day,
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

function estimateExerciseCalories(log?: ExerciseLog) {
  if (!log) return 0;
  const load = numericValue(log.load);
  const reps = [log.reps1, log.reps2, log.reps3].reduce((sum, value) => sum + numericValue(value), 0);
  if (!load || !reps) return 0;
  return Math.round(Math.max(1, load * reps * 0.005 + reps * 0.08));
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

function estimateCardioCalories(entry: { minutes?: string; type: string; intensity?: string; lightMinutes?: string; moderateMinutes?: string; hardMinutes?: string }) {
  const lightMinutes = numericValue(entry.lightMinutes ?? "");
  const moderateMinutes = numericValue(entry.moderateMinutes ?? "");
  const hardMinutes = numericValue(entry.hardMinutes ?? "");
  const splitTotal = lightMinutes + moderateMinutes + hardMinutes;
  const fallbackMinutes = numericValue(entry.minutes ?? "");
  if (!splitTotal && !fallbackMinutes) return 0;
  const type = entry.type.toLowerCase();
  const baseMet = type.includes("corrida") ? 8 : type.includes("bike") || type.includes("bicicleta") ? 5.8 : type.includes("elíptico") || type.includes("eliptico") ? 5 : 3.8;
  const referenceWeightKg = 70;
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
  const start = new Date(`${startDate}T00:00:00`);
  start.setDate(start.getDate() + weekBlock * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("pt-BR")} - ${end.toLocaleDateString("pt-BR")}`;
}

function isDateInWeek(date: string, startDate: string, weekBlock: number) {
  const start = new Date(`${startDate}T00:00:00`);
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(value.getTime())) return false;
  const diffDays = Math.floor((value.getTime() - start.getTime()) / 86400000);
  return diffDays >= weekBlock * 7 && diffDays < weekBlock * 7 + 7;
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
    <div className="inline-flex max-w-full overflow-x-auto rounded-2xl bg-zinc-950 p-1 ring-1 ring-zinc-800">
      {options.map((option) => (
        <button key={option.value} onClick={() => setValue(option.value)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${value === option.value ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-100"}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function StatBadge({ icon, title, value, tooltip }: { icon: React.ReactNode; title: string; value: string; tooltip: string }) {
  return <span title={tooltip} className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs font-black text-zinc-200 shadow-sm shadow-black/20"><span className="text-zinc-400">{icon}</span><span className="text-zinc-500">{title}</span><span className="text-zinc-50">{value}</span></span>;
}

function LogInputs({ log, onLog, compact = false }: { log: ExerciseLog; onLog: (patch: Partial<ExerciseLog>) => void; compact?: boolean }) {
  const inputClass = "min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-400";
  return (
    <div className="grid gap-2">
      <div className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
        <input value={log.load} onChange={(event) => onLog({ load: event.target.value })} placeholder="kg" inputMode="decimal" className={inputClass} />
        <input value={log.reps1} onChange={(event) => onLog({ reps1: event.target.value })} placeholder="R1" inputMode="numeric" className={inputClass} />
        <input value={log.reps2} onChange={(event) => onLog({ reps2: event.target.value })} placeholder="R2" inputMode="numeric" className={inputClass} />
        <input value={log.reps3} onChange={(event) => onLog({ reps3: event.target.value })} placeholder="R3" inputMode="numeric" className={inputClass} />
      </div>
      <input value={log.note} onChange={(event) => onLog({ note: event.target.value })} placeholder="Observação" className={inputClass} />
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
      <button onClick={() => setRunning((value) => !value)} className={`rounded-xl px-3 py-2 text-xs font-black ${running ? "bg-orange-950/70 text-orange-200" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"}`}>
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
      </button>
      {[60, 90, 120].map((preset) => <button key={preset} onClick={() => { setSeconds(preset); setRunning(true); }} className="rounded-lg bg-zinc-950 px-2 py-1 text-[11px] font-bold text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800">{preset}s</button>)}
    </div>
  );
}

function FocusLinks({ focus, onMuscleClick, compact = false }: { focus: string; onMuscleClick: (muscleKey: string) => void; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-3" : ""}`}>
      {focusToTargets(focus).map((target) => (
        <button key={`${focus}-${target.key}`} onClick={() => onMuscleClick(target.key)} className={`${compact ? "rounded-xl bg-blue-950/40 px-3 py-2 text-left text-sm font-black text-blue-200 ring-1 ring-blue-800" : "rounded-full bg-blue-950/40 px-3 py-1 text-xs font-black text-blue-200 ring-1 ring-blue-800 transition hover:bg-blue-900/60 hover:text-blue-100"}`}>
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
      className={`${compact ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-0" : "inline-flex h-10 items-center gap-2 rounded-full px-3"} border border-zinc-700/80 bg-zinc-950/95 text-xs font-black text-zinc-100 shadow-sm shadow-black/20 outline-none ring-1 ring-white/5 transition hover:border-zinc-500 hover:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400`}
    >
      <span className={`${compact ? "" : "flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-950"}`}>
        <Play className={`${compact ? "h-4 w-4" : "h-3.5 w-3.5"} translate-x-px fill-current`} />
      </span>
      {!compact && <span>Ver exercício</span>}
    </button>
  );
}
function AlternativeChips({ exercise, onAlternativeClick }: { exercise: Exercise; onAlternativeClick: (idOrName: string, source: Exercise) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {(exercise.alternatives ?? []).map((alt) => {
        const item = findExerciseLibraryItem(alt);
        return <button key={alt} type="button" onClick={(event) => { event.stopPropagation(); onAlternativeClick(alt, exercise); }} className="min-h-8 rounded-full bg-zinc-800 px-3 py-1 text-left text-xs font-bold text-zinc-200 transition hover:bg-zinc-700 hover:text-white">{item?.name ?? alt}</button>;
      })}
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

function ExerciseRow({ exercise, log, logs, onLog, onMuscleClick, onAlternativeClick, onMediaOpen, lightMode, exerciseDomKey, registerExerciseRef, highlighted, currentLogKey }: { exercise: Exercise; log: ExerciseLog; logs: Logs; onLog: (patch: Partial<ExerciseLog>) => void; onMuscleClick: (muscleKey: string) => void; onAlternativeClick: (idOrName: string, source: Exercise) => void; onMediaOpen: (target: MediaTarget) => void; lightMode: boolean; exerciseDomKey: string; registerExerciseRef: (key: string, element: HTMLElement | null) => void; highlighted: boolean; currentLogKey: string }) {
  const increase = shouldIncrease(log);
  return (
    <tr ref={(element) => registerExerciseRef(exerciseDomKey, element)} className={`scroll-mt-28 align-top transition ${highlighted ? "bg-blue-950/60 ring-2 ring-blue-400" : log.done ? "bg-emerald-950/30" : "hover:bg-zinc-800/50"}`}>
      <td className="px-4 py-3 font-semibold text-zinc-400"><label className="flex items-center gap-2"><input type="checkbox" checked={log.done} onChange={(event) => onLog({ done: event.target.checked })} className="h-4 w-4 rounded border-zinc-700 accent-emerald-500" />{exercise.order}</label></td>
      <td className="px-4 py-3"><p className="font-bold text-zinc-100">{exercise.name}</p><details className="mt-2 text-xs text-zinc-400"><summary className="cursor-pointer font-bold text-zinc-300">Alternativas</summary><AlternativeChips exercise={exercise} onAlternativeClick={onAlternativeClick} /></details><ExerciseHistory logs={logs} exercise={exercise} currentLogKey={currentLogKey} /></td>
      <td className="px-4 py-3"><FocusLinks focus={`${exercise.name} ${exercise.focus}`} onMuscleClick={onMuscleClick} /></td>
      <td className="px-4 py-3"><LogInputs log={log} onLog={onLog} />{increase && <p className="mt-2 rounded-xl bg-emerald-950/70 px-2 py-1 text-xs font-black text-emerald-200">Bateu 3x15. Próximo treino: aumentar carga.</p>}{lightMode && <p className="mt-2 text-xs font-semibold text-orange-300">Modo leve ativo: foco em execução limpa.</p>}</td>
      <td className="px-4 py-3"><RestTimer defaultSeconds={exercise.rest ?? 60} /></td>
      <td className="px-4 py-3"><VideoButton name={exercise.name} videoKey={exercise.videoKey} onOpen={onMediaOpen} /></td>
    </tr>
  );
}

function ExerciseMobileCard(props: Parameters<typeof ExerciseRow>[0]) {
  const { exercise, log, logs, onLog, onMuscleClick, onAlternativeClick, onMediaOpen, lightMode, exerciseDomKey, registerExerciseRef, highlighted, currentLogKey } = props;
  const increase = shouldIncrease(log);
  return (
    <article ref={(element) => registerExerciseRef(exerciseDomKey, element)} className={`scroll-mt-28 rounded-2xl border p-4 shadow-sm transition ${highlighted ? "border-blue-400 bg-blue-950/50 ring-2 ring-blue-400" : log.done ? "border-emerald-800 bg-emerald-950/30" : "border-zinc-800 bg-zinc-950/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <label className="flex min-w-0 items-start gap-3"><input type="checkbox" checked={log.done} onChange={(event) => onLog({ done: event.target.checked })} className="mt-1 h-5 w-5 shrink-0 rounded border-zinc-700 accent-emerald-500" /><span className="min-w-0"><span className="block text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{exercise.order}</span><span className="block text-base font-black leading-snug text-zinc-50">{exercise.name}</span></span></label>
        <VideoButton name={exercise.name} videoKey={exercise.videoKey} compact onOpen={onMediaOpen} />
      </div>
      <FocusLinks focus={`${exercise.name} ${exercise.focus}`} onMuscleClick={onMuscleClick} compact />
      <div className="mt-4 grid gap-3">
        <div><p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Carga e reps</p><LogInputs log={log} onLog={onLog} compact /></div>
        {increase && <p className="rounded-xl bg-emerald-950/70 px-3 py-2 text-xs font-black text-emerald-200">Bateu 3x15. Próximo treino: aumentar carga.</p>}
        {lightMode && <p className="text-xs font-semibold text-orange-300">Modo leve ativo: foco em execução limpa.</p>}
        <div><p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Descanso</p><RestTimer defaultSeconds={exercise.rest ?? 60} /></div>
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
  isOpen,
  onToggle,
  getExerciseDomKey,
  getCurrentLogKey,
  registerExerciseRef,
  highlightedExerciseKey,
  lightMode,
}: {
  plan: ScheduledTrainingDay;
  logs: Logs;
  getLog: (plan: ScheduledTrainingDay, exercise: Exercise) => ExerciseLog | undefined;
  updateExerciseLog: (plan: ScheduledTrainingDay, exercise: Exercise, patch: Partial<ExerciseLog>) => void;
  onMuscleClick: (focus: string) => void;
  onAlternativeClick: (idOrName: string, source: Exercise) => void;
  onMediaOpen: (target: MediaTarget) => void;
  isOpen: boolean;
  onToggle: () => void;
  getExerciseDomKey: (plan: ScheduledTrainingDay, exercise: Exercise) => string;
  getCurrentLogKey: (plan: ScheduledTrainingDay, exercise: Exercise) => string;
  registerExerciseRef: (key: string, element: HTMLElement | null) => void;
  highlightedExerciseKey: string | null;
  lightMode: boolean;
}) {
  const style = typeStyle[plan.type] ?? typeStyle.superior;
  const exercises = lightMode && plan.exercises.length > 4 ? plan.exercises.slice(0, 4) : plan.exercises;
  const done = exercises.filter((exercise) => getLog(plan, exercise)?.done).length;
  const hasProgression = exercises.some((exercise) => shouldIncrease(getLog(plan, exercise)));
  const estimatedCalories = exercises.reduce((sum, exercise) => sum + estimateExerciseCalories(getLog(plan, exercise)), 0);
  const sessionDateKey = plan.scheduledDate;
  const calorieTooltip = "Estimativa simples baseada em volume registrado: carga x repetições x fator metabólico. Só entra no cálculo quando há carga e pelo menos 1 repetição.";
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`overflow-hidden rounded-3xl border-l-8 ${style.border} border-y border-r border-zinc-800 bg-zinc-900 shadow-sm`}>
      <div className={`grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start ${style.soft}`}>
        <div className="min-w-0 pr-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">{plan.scheduledDayName}</p>
          <h3 className="mt-1 text-lg font-black leading-snug text-zinc-50 sm:text-xl">{plan.title}</h3>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
          <span className="rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-black text-zinc-300 ring-1 ring-zinc-800">{done}/{exercises.length} feitos</span>
          {hasProgression && <span className="rounded-full bg-emerald-950/70 px-3 py-1 text-xs font-black text-emerald-200 ring-1 ring-emerald-800">Progressão</span>}
          {estimatedCalories > 0 && <span title={calorieTooltip} className="rounded-full bg-amber-950/70 px-3 py-1 text-xs font-black text-amber-200 ring-1 ring-amber-800">~{formatCalories(estimatedCalories)}</span>}
          <span title="Data usada na chave desta sessão" className="rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-black text-zinc-300 ring-1 ring-zinc-800">{sessionDateKey === todayDateKey() ? "Hoje" : sessionDateKey}</span>
          <span className="rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-black text-zinc-300 ring-1 ring-zinc-800">Bloco {plan.blockIndex}/{plan.blockTotal}</span>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${style.chip}`}>{style.label}</span>
          <button type="button" onClick={onToggle} className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-black text-zinc-200 transition hover:bg-zinc-800">
            {isOpen ? "Recolher" : "Expandir"} <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {isOpen && <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="border-y border-zinc-800 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-400"><tr><th className="w-24 px-4 py-3">Feito</th><th className="px-4 py-3">Exercício</th><th className="px-4 py-3">Foco</th><th className="w-80 px-4 py-3">Carga/reps</th><th className="w-52 px-4 py-3">Descanso</th><th className="w-28 px-4 py-3">Vídeo</th></tr></thead><tbody className="divide-y divide-zinc-800">{exercises.map((exercise) => { const key = exerciseKey(plan, exercise); const domKey = getExerciseDomKey(plan, exercise); const currentLogKey = getCurrentLogKey(plan, exercise); return <ExerciseRow key={key} currentLogKey={currentLogKey} exerciseDomKey={domKey} registerExerciseRef={registerExerciseRef} highlighted={highlightedExerciseKey === domKey} exercise={exercise} log={getLog(plan, exercise) ?? emptyLog()} logs={logs} onLog={(patch) => updateExerciseLog(plan, exercise, patch)} onMuscleClick={onMuscleClick} onAlternativeClick={onAlternativeClick} onMediaOpen={onMediaOpen} lightMode={lightMode} />; })}</tbody></table></div>
      <div className="grid gap-3 p-4 md:hidden">{exercises.map((exercise) => { const key = exerciseKey(plan, exercise); const domKey = getExerciseDomKey(plan, exercise); const currentLogKey = getCurrentLogKey(plan, exercise); return <ExerciseMobileCard key={key} currentLogKey={currentLogKey} exerciseDomKey={domKey} registerExerciseRef={registerExerciseRef} highlighted={highlightedExerciseKey === domKey} exercise={exercise} log={getLog(plan, exercise) ?? emptyLog()} logs={logs} onLog={(patch) => updateExerciseLog(plan, exercise, patch)} onMuscleClick={onMuscleClick} onAlternativeClick={onAlternativeClick} onMediaOpen={onMediaOpen} lightMode={lightMode} />; })}</div>
      {plan.optional && <div className="border-t border-zinc-800 px-5 py-4 text-sm text-zinc-400"><span className="font-black text-zinc-100">Opcionais:</span> {plan.optional}</div>}</>}
    </motion.section>
  );
}

function ModalShell({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}><motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl ${wide ? "max-w-6xl" : "max-w-4xl"}`} onClick={(event) => event.stopPropagation()}>{children}</motion.div></div>;
}

function MuscleModal({ focus, onClose }: { focus: string | null; onClose: () => void }) {
  if (!focus) return null;
  const info = muscleImages[focus] ?? muscleImages[focusToKey(focus)] ?? muscleImages.core;
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Foco selecionado</p><h2 className="mt-1 text-2xl font-black text-zinc-50">{info.title}</h2><p className="mt-2 text-sm text-zinc-400">Imagem do músculo trabalhado</p></div><button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button></div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_1.1fr]"><div className="overflow-hidden rounded-2xl bg-zinc-950 p-3"><img src={info.image} alt={info.title} className="h-full max-h-[420px] w-full object-contain" /></div><div><p className="text-base leading-relaxed text-zinc-300">{info.description}</p><ul className="mt-4 space-y-2 text-sm text-zinc-300">{info.tips.map((tip) => <li key={tip} className="rounded-xl bg-zinc-950 px-3 py-2">• {tip}</li>)}</ul></div></div>
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
  return (
    <ModalShell onClose={onClose}>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900/95 p-5 backdrop-blur"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Alternativa</p><h2 className="mt-1 text-2xl font-black text-zinc-50">{name}</h2><p className="mt-2 text-sm text-zinc-400">{focus}</p></div><button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button></div>
      <div className="grid gap-5 p-5 md:grid-cols-[0.9fr_1.1fr]"><div className="rounded-2xl bg-zinc-950 p-3"><img src={primaryMuscle.image} alt={primaryMuscle.title} className="h-full max-h-[360px] w-full object-contain" /></div><div><p className="text-base leading-relaxed text-zinc-300">{item?.description ?? "Informações completas ainda não cadastradas. Use esta alternativa como variação próxima ao exercício original e confirme a execução com um profissional."}</p><div className="mt-4 flex flex-wrap gap-2">{muscles.map((muscle) => <button key={muscle} onClick={() => onMuscleClick(muscle)} className="rounded-full bg-blue-950/40 px-3 py-1 text-xs font-black text-blue-200 ring-1 ring-blue-800">{muscleImages[muscle]?.title ?? muscle}</button>)}</div><ul className="mt-4 space-y-2 text-sm text-zinc-300">{(item?.tips ?? ["Controle o movimento.", "Use carga confortável.", "Pare se sentir dor articular."]).map((tip) => <li key={tip} className="rounded-xl bg-zinc-950 px-3 py-2">• {tip}</li>)}</ul><div className="mt-5 flex flex-wrap gap-2"><VideoButton name={name} videoKey={item?.videoKey ?? item?.id ?? name} onOpen={onMediaOpen} /></div></div></div>
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
  return (
    <ModalShell onClose={onClose} wide>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900/95 p-5 backdrop-blur">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Ver exercício</p><h2 className="mt-1 text-2xl font-black text-zinc-50">{name}</h2><p className="mt-2 text-sm text-zinc-400">{focus}</p></div>
        <button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3">
          <div className="rounded-2xl bg-zinc-950 p-3"><img src={primaryMuscle.image} alt={primaryMuscle.title} className="h-full max-h-[320px] w-full object-contain" /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {illustrations.length ? illustrations.map((src, index) => <div key={src} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"><img src={src} alt={`${name} passo ${index + 1}`} className="aspect-[4/3] w-full object-cover" /></div>) : <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-4 text-sm font-bold text-zinc-400 sm:col-span-3">Ilustrações ainda não cadastradas</div>}
          </div>
        </div>
        <div>
          <p className="text-base leading-relaxed text-zinc-300">{item?.description ?? "Informações completas ainda não cadastradas. Use os vídeos e o foco muscular como referência inicial."}</p>
          <div className="mt-4 flex flex-wrap gap-2">{muscles.map((muscle) => <button key={muscle} onClick={() => onMuscleClick(muscle)} className="rounded-full bg-blue-950/40 px-3 py-1 text-xs font-black text-blue-200 ring-1 ring-blue-800">{muscleImages[muscle]?.title ?? muscle}</button>)}</div>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">{(item?.tips ?? ["Controle o movimento.", "Use carga confortável.", "Pare se sentir dor articular."]).map((tip) => <li key={tip} className="rounded-xl bg-zinc-950 px-3 py-2">• {tip}</li>)}</ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {youtubeUrl && <a href={youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white"><Play className="h-4 w-4 fill-current" /> YouTube</a>}
            {tiktokUrl && <a href={tiktokUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-zinc-950"><ExternalLink className="h-4 w-4" /> TikTok</a>}
            <a href={searchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-black text-zinc-100 hover:bg-zinc-800"><Search className="h-4 w-4" /> Buscar no YouTube</a>
          </div>
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
  const [selectedExercise, setSelectedExercise] = useState(exerciseLibraryList[0]?.id ?? "");
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
        <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-[1fr_auto]"><select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)} className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 outline-none">{exerciseLibraryList.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.focus}</option>)}</select><p className="text-sm text-zinc-400 md:self-center">Escolha um exercício e toque em Adicionar no dia desejado.</p></div>
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
  const cardioCalories = estimateCardioCalories(cardioToEstimate);
  const lastCardioCalories = cardioLogs[0] ? estimateCardioCalories(cardioLogs[0]) : 0;
  const cardioTooltip = "Estimativa por MET usando tipo, intensidade, minutos e peso de referência de 70 kg. Pode variar conforme peso, condicionamento e aparelho.";
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
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("Local");
  const [appView, setAppView] = useState<AppView>("training");
  const [selectedMedia, setSelectedMedia] = useState<MediaTarget | null>(null);
  const [quickLogModal, setQuickLogModal] = useState<"pain" | "cardio" | null>(null);
  const [openDayIds, setOpenDayIds] = useState<Record<string, boolean>>({});
  const [highlightedExerciseKey, setHighlightedExerciseKey] = useState<string | null>(null);
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
      custom_plans: customPlans,
      settings: { phase, startDate, autoWeekEnabled, activePlanId: activePlan.id },
    });
  }

  function applySyncPayload(data: UserAppData) {
    setLogs(data.logs);
    setWeeklySummaries(data.history as WeeklySummary[]);
    setPainLogs(data.pain_logs as PainLog[]);
    setCardioLogs(data.cardio_logs as CardioLog[]);
    setCustomPlans(data.custom_plans);
    if (data.settings.phase === "fase1" || data.settings.phase === "fase2") setPhase(data.settings.phase);
    if (typeof data.settings.week === "string") setWeek(data.settings.week);
    if (typeof data.settings.startDate === "string") setStartDate(data.settings.startDate);
    if (typeof data.settings.autoWeekEnabled === "boolean") setAutoWeekEnabled(data.settings.autoWeekEnabled);
    if (typeof data.settings.activePlanId === "string") setActivePlanId(data.settings.activePlanId);
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
  }, [user, logs, painLogs, cardioLogs, customPlans, weeklySummaries, phase, week, startDate, autoWeekEnabled, activePlan.id]);

  const filteredPlans = useMemo(() => {
    const days = getPlanDays(activePlan, activePlan.id === defaultTrainingPlan.id ? phase : undefined, week);
    const scheduledDays = scheduleTrainingDays(days, startDate, selectedWeekBlock(startDate, week));
    return scheduledDays.filter((plan) => {
      const searchable = `${plan.day} ${plan.title} ${plan.type} ${plan.exercises.map((exercise) => `${exercise.name} ${exercise.focus}`).join(" ")}`.toLowerCase();
      return searchable.includes(query.toLowerCase()) && (!onlyToday || plan.scheduledDate === todayDateKey());
    });
  }, [activePlan, phase, week, query, onlyToday, startDate, todayName, weekIds.join("|")]);

  const visibleExercises = filteredPlans.flatMap((plan) => (lightMode ? plan.exercises.slice(0, 4) : plan.exercises).map((exercise) => ({ plan, exercise })));
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
    if (weekIds[currentBlock % weekIds.length] === selectedWeek) return currentBlock;
    for (let offset = 1; offset <= weekIds.length; offset += 1) {
      const candidate = Math.max(0, currentBlock - offset);
      if (weekIds[candidate % weekIds.length] === selectedWeek) return candidate;
    }
    return currentBlock;
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
    const shouldSetStartDate = !startDate && patch.done;
    const effectiveStartDate = shouldSetStartDate ? todayInputValue() : startDate;
    if (shouldSetStartDate) setStartDate(effectiveStartDate);
    updateLog(logKeyFor(plan, exercise), patch);
  }

  function goToNextExercise() {
    const navigationExercises = query.trim() ? visibleExercises : visibleExercises.filter(({ plan }) => plan.scheduledDate >= todayDateKey());
    const target = navigationExercises.find(({ plan, exercise }) => !getLog(plan, exercise)?.done);
    if (!target) {
      setWorkoutMessage("Todos os exercícios visíveis foram concluídos.");
      window.setTimeout(() => setWorkoutMessage(""), 2500);
      return;
    }
    const domKey = getExerciseDomKey(target.plan, target.exercise);
    setWorkoutMessage("");
    setOpenDayIds((current) => ({ ...current, [target.plan.id]: true }));
    setHighlightedExerciseKey(domKey);
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
    const calories = exercises.reduce((sum, item) => sum + estimateExerciseCalories(item.log), 0);
    const cardioCalories = weekCardioLogs.reduce((sum, entry) => sum + estimateCardioCalories(entry), 0);
    const notePain = doneExercises.filter(({ log }) => log?.note.toLowerCase().includes("dor") || log?.note.toLowerCase().includes("desconforto")).map(({ exercise }) => exercise.name);
    const exerciseStats = doneExercises.map(({ exercise, log }) => ({ exercise, log, volume: exerciseVolume(log), calories: estimateExerciseCalories(log), avgReps: averageReps(log) }));
    const best = [...exerciseStats].sort((a, b) => b.volume - a.volume)[0];
    const topCalories = [...exerciseStats].sort((a, b) => b.calories - a.calories)[0];
    const improve = [...exerciseStats].filter((item) => item.avgReps > 0).sort((a, b) => a.avgReps - b.avgReps)[0];
    const allWeeklyLoads = Array.from({ length: Math.max(block + 1, 1) }, (_, index) => {
      const weekId = weekIds[index % Math.max(weekIds.length, 1)] ?? "A";
      const weekDays = getPlanDays(activePlan, activePlan.id === defaultTrainingPlan.id ? phase : undefined, weekId);
      const weeklyEntries = weekDays.flatMap((day) => day.exercises.map((exercise) => logs[exactLogKeyFor(day, exercise, index)]));
      const totalLoad = weeklyEntries.reduce((sum, log) => sum + exerciseVolume(log), 0);
      const calories = weeklyEntries.reduce((sum, log) => sum + estimateExerciseCalories(log), 0);
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1e293b,transparent_34%),linear-gradient(180deg,#09090b,#18181b)] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 shadow-sm shadow-black/30"><Dumbbell className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="truncate text-sm font-black text-zinc-50">Treino Loloa</p><p className="truncate text-xs font-bold text-zinc-500">{activePlan.name} · Semana {week}</p></div>
            </div>
            <nav className="hidden rounded-xl bg-zinc-900 p-1 ring-1 ring-zinc-800 md:flex">
              {([{ id: "training", label: "Treino" }, { id: "performance", label: "Desempenho" }] as const).map((item) => (
                <button key={item.id} onClick={() => setAppView(item.id)} className={`rounded-lg px-4 py-2 text-sm font-black transition ${appView === item.id ? "bg-zinc-100 text-zinc-950 shadow-sm" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>{item.label}</button>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              <UserMenu user={user} syncStatus={syncStatus} onOpenAuth={() => setAuthOpen(true)} onSignOut={() => void signOut()} onSyncNow={() => void syncWithSupabase(user, "merge")} />
              <details className="group relative">
                <summary className="list-none"><span className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800"><Settings className="h-5 w-5" /></span></summary>
                <div className="absolute right-0 mt-3 max-h-[calc(100vh-7rem)] w-[min(92vw,520px)] overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl shadow-black/60">
                  <div className="grid gap-3">
                    <div className="rounded-2xl bg-zinc-900/70 p-3 ring-1 ring-zinc-800">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Ajustes do treino</p>
                      <div className="grid gap-3">
                        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Plano<select value={activePlan.id} onChange={(event) => setActivePlanId(event.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-black normal-case tracking-normal text-zinc-100 outline-none"><option value={defaultTrainingPlan.id}>Treino padrão</option>{customPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
                        {activePlan.id === defaultTrainingPlan.id ? <Segmented value={phase} setValue={setPhase} options={[{ value: "fase1", label: "Meses 1-6" }, { value: "fase2", label: "Após 6 meses" }]} /> : <button onClick={() => setEditorOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm font-black text-zinc-200"><Library className="h-4 w-4" /> Editar personalizado</button>}
                        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Data de início<span className="grid gap-2 sm:grid-cols-[1fr_auto]"><input ref={startDateInputRef} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-zinc-100 outline-none focus:border-zinc-400" /><button type="button" onClick={openStartDatePicker} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-black normal-case tracking-normal text-zinc-200 hover:bg-zinc-800"><CalendarDays className="h-4 w-4" /> Selecionar</button></span></label>
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
              </details>
            </div>
          </div>
          <nav className="grid grid-cols-2 rounded-xl bg-zinc-900 p-1 ring-1 ring-zinc-800 md:hidden">
            {([{ id: "training", label: "Treino" }, { id: "performance", label: "Desempenho" }] as const).map((item) => (
              <button key={item.id} onClick={() => setAppView(item.id)} className={`rounded-lg px-3 py-2 text-sm font-black transition ${appView === item.id ? "bg-zinc-100 text-zinc-950 shadow-sm" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>{item.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {appView === "training" ? <>
        <section className="grid gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">Começar treino</p><h2 className="mt-1 text-xl font-black text-zinc-50">{activePlan.name} · Semana {week}</h2><p className="mt-2 text-sm text-zinc-400">Use "Só hoje" para focar no treino do dia, ou busque qualquer exercício da semana selecionada.</p></div><button onClick={startWorkout} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-white"><CalendarDays className="h-4 w-4" /> Começar treino</button></div>
          <div className="flex flex-wrap gap-2">
            <StatBadge icon={<CheckCircle2 className="h-4 w-4" />} title="Feitos" value={`${doneCount}/${totalCount}`} tooltip="Exercícios marcados como feitos na tela atual." />
            <StatBadge icon={<Activity className="h-4 w-4" />} title="Progressão" value={`${increaseCount}`} tooltip="Registros que bateram 3x15 e sugerem aumento de carga." />
            <StatBadge icon={<TimerReset className="h-4 w-4" />} title="Descanso" value="60-120s" tooltip="Timer por exercício, com presets rápidos." />
            <StatBadge icon={<RotateCcw className="h-4 w-4" />} title="Plano" value={activePlan.name} tooltip={`Semana automática alterna entre ${weekIds.join(", ") || "A"}; ocorrência atual: ${weekBlock + 1}.`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setQuickLogModal("cardio")} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-black text-zinc-200 hover:bg-zinc-800"><Activity className="h-4 w-4" /> Registrar cardio</button>
            <button onClick={() => setQuickLogModal("pain")} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-black text-zinc-200 hover:bg-zinc-800"><HeartPulse className="h-4 w-4" /> Check de dor</button>
          </div>
        </section>
        <section className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">Treinos</p><h2 className="text-2xl font-black text-zinc-50">{activePlan.id === defaultTrainingPlan.id ? (phase === "fase1" ? "Fase 1: meses 1 a 6" : "Fase 2: após 6 meses") : activePlan.name} · Semana {week}</h2><p className="mt-1 text-sm text-zinc-500">{filteredPlans.length} bloco(s) encontrado(s)</p></div><div className="flex flex-wrap items-center gap-2"><button onClick={goToNextExercise} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-white"><ClipboardCheck className="h-4 w-4" /> Próximo exercício</button>{workoutMessage && <span className="rounded-2xl bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-300 ring-1 ring-zinc-800">{workoutMessage}</span>}</div></div>{filteredPlans.length > 0 ? filteredPlans.map((plan) => <DayCard key={plan.id} plan={plan} logs={logs} getLog={getLog} updateExerciseLog={updateExerciseLog} onMuscleClick={setSelectedMuscle} onAlternativeClick={(idOrName, source) => setSelectedAlternative({ idOrName, source })} onMediaOpen={setSelectedMedia} isOpen={isDayOpen(plan)} onToggle={() => setOpenDayIds((current) => ({ ...current, [plan.id]: !isDayOpen(plan) }))} getExerciseDomKey={getExerciseDomKey} getCurrentLogKey={logKeyFor} registerExerciseRef={registerExerciseRef} highlightedExerciseKey={highlightedExerciseKey} lightMode={lightMode} />) : <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center text-zinc-400">Nada encontrado para esta busca.</div>}</section>
        </> : <PerformancePage logs={logs} cardioLogs={cardioLogs} painLogs={painLogs} loading={syncStatus === "Sincronizando" && Boolean(user)} />}
      </main>

      <InfoModal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
      <MuscleModal focus={selectedMuscle} onClose={() => setSelectedMuscle(null)} />
      <AlternativeModal alternative={selectedAlternative} onClose={() => setSelectedAlternative(null)} onMuscleClick={setSelectedMuscle} onMediaOpen={setSelectedMedia} />
      <ExerciseMediaModal target={selectedMedia} onClose={() => setSelectedMedia(null)} onMuscleClick={setSelectedMuscle} />
      {quickLogModal && <ModalShell onClose={() => setQuickLogModal(null)} wide><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900/95 p-5 backdrop-blur"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Registro rápido</p><h2 className="mt-1 text-2xl font-black text-zinc-50">{quickLogModal === "cardio" ? "Cardio diário" : "Check de dor/desconforto"}</h2></div><button onClick={() => setQuickLogModal(null)} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button></div><div className="p-5"><QuickLogs painLogs={painLogs} setPainLogs={setPainLogs} cardioLogs={cardioLogs} setCardioLogs={setCardioLogs} mode={quickLogModal} /></div></ModalShell>}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <TrainingEditor open={editorOpen} plans={customPlans} activePlanId={activePlanId} onClose={() => setEditorOpen(false)} onSave={saveCustomPlan} onDelete={deleteCustomPlan} />
    </div>
  );
}
