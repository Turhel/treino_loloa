import { useMemo, useState } from "react";
import type { ExerciseTimerSession, WeightEntry } from "../../types/training";
import type { CardioPerformanceLog } from "../../utils/performance";
import { buildWeightChartSeries, getHealthyWeightRange, normalizeWeightHistory, type WeightMode } from "../../utils/weight";

type Props = {
  history: WeightEntry[];
  heightCm?: number | null;
  timerSessions: ExerciseTimerSession[];
  cardioLogs: CardioPerformanceLog[];
};

const modeLabels: { id: WeightMode; label: string }[] = [
  { id: "day", label: "Dia" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
  { id: "year", label: "Ano" },
];

export function WeightProjectionChart({ history, heightCm, timerSessions, cardioLogs }: Props) {
  const [mode, setMode] = useState<WeightMode>("month");
  const healthy = useMemo(() => getHealthyWeightRange(heightCm), [heightCm]);
  const series = useMemo(() => buildWeightChartSeries({ history, heightCm, timerSessions, cardioLogs, mode }), [history, heightCm, timerSessions, cardioLogs, mode]);
  const allPoints = [...series.actual, ...series.projected];
  const latest = series.actual[series.actual.length - 1];
  const projected3 = closestProjection(series.projected, 90);
  const projected6 = closestProjection(series.projected, 180);
  const monthVariation = calculateRecentVariation(history, 31);
  const hasProjection = series.projected.length > 1;

  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="cute-eyebrow">Peso corporal</p>
          <h2 className="text-2xl font-black text-zinc-50">Histórico e projeção</h2>
          <p className="mt-1 text-sm font-bold text-zinc-400">Linha sólida é peso real. Linha tracejada é estimativa, não promessa.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {modeLabels.map((item) => <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl px-4 py-2 text-sm font-black ring-1 ${mode === item.id ? "bg-zinc-100 text-zinc-950 ring-zinc-100" : "bg-zinc-950 text-zinc-300 ring-zinc-800"}`}>{item.label}</button>)}
      </div>

      {history.length === 0 ? (
        <div className="cute-empty mt-5">Registre seu peso ao longo das semanas para acompanhar a evolução 💗</div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <WeightSvg points={allPoints} actualCount={series.actual.length} healthy={healthy} />
          <div className="grid gap-2">
            <Metric label="Peso atual" value={latest ? `${latest.weightKg.toFixed(1)} kg` : "-"} />
            <Metric label="Variação no mês" value={monthVariation === null ? "-" : `${monthVariation > 0 ? "+" : ""}${monthVariation.toFixed(1)} kg`} />
            <Metric label="Gasto médio semanal" value={series.projection.averageWeeklyKcal ? `~${series.projection.averageWeeklyKcal} kcal` : "-"} />
            <Metric label="Em 3 meses" value={projected3 ? `${projected3.weightKg.toFixed(1)} kg` : "-"} />
            <Metric label="Em 6 meses" value={projected6 ? `${projected6.weightKg.toFixed(1)} kg` : "-"} />
            <Metric label="Faixa saudável" value={healthy ? `${healthy.min.toFixed(1)}-${healthy.max.toFixed(1)} kg` : "Adicione altura"} />
            <Metric label="Até faixa saudável" value={series.projection.monthsToHealthy ? `${series.projection.monthsToHealthy} mês(es)` : hasProjection ? "Sem previsão segura" : "Dados insuficientes"} />
            {series.projection.reliability === "low" && <p className="rounded-2xl bg-amber-950/50 p-3 text-xs font-bold text-amber-200 ring-1 ring-amber-800">Projeção com baixa confiabilidade. Ela melhora com mais registros de peso.</p>}
          </div>
        </div>
      )}

    </section>
  );
}

function WeightSvg({ points, actualCount, healthy }: { points: ReturnType<typeof buildWeightChartSeries>["actual"]; actualCount: number; healthy: { min: number; max: number } | null }) {
  const width = 720;
  const height = 320;
  const pad = { left: 48, right: 22, top: 24, bottom: 42 };
  const values = points.flatMap((point) => [point.weightKg, point.lowKg ?? point.weightKg, point.highKg ?? point.weightKg, healthy?.min ?? point.weightKg, healthy?.max ?? point.weightKg]);
  const min = Math.floor(Math.min(...values) - 3);
  const max = Math.ceil(Math.max(...values) + 3);
  const x = (index: number) => pad.left + (index / Math.max(1, points.length - 1)) * (width - pad.left - pad.right);
  const y = (weight: number) => pad.top + ((max - weight) / Math.max(1, max - min)) * (height - pad.top - pad.bottom);
  const actual = points.slice(0, actualCount);
  const projected = points.slice(Math.max(0, actualCount - 1));
  const uncertainty = projected.filter((point) => point.lowKg && point.highKg);
  const healthyTop = healthy ? y(healthy.max) : 0;
  const healthyBottom = healthy ? y(healthy.min) : 0;
  const path = (list: typeof points, offset = 0) => list.map((point, index) => `${index ? "L" : "M"} ${x(index + offset)} ${y(point.weightKg)}`).join(" ");
  const band = uncertainty.length ? `${uncertainty.map((point, index) => `${index ? "L" : "M"} ${x(actualCount - 1 + index)} ${y(point.highKg ?? point.weightKg)}`).join(" ")} ${[...uncertainty].reverse().map((point, index) => `L ${x(points.length - 1 - index)} ${y(point.lowKg ?? point.weightKg)}`).join(" ")} Z` : "";
  const todayX = actual.length ? x(actual.length - 1) : pad.left;

  return (
    <div className="overflow-hidden rounded-3xl bg-zinc-950/80 p-3 ring-1 ring-zinc-800">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
        <rect x="0" y="0" width={width} height={height} rx="24" fill="rgba(20,18,26,0.65)" />
        {healthy && <rect x={pad.left} y={healthyTop} width={width - pad.left - pad.right} height={healthyBottom - healthyTop} fill="rgba(158,216,181,0.13)" />}
        {band && <path d={band} fill="rgba(201,182,255,0.12)" />}
        <line x1={pad.left} x2={width - pad.right} y1={y(min)} y2={y(min)} stroke="rgba(255,255,255,0.08)" />
        <line x1={todayX} x2={todayX} y1={pad.top} y2={height - pad.bottom} stroke="rgba(255,255,255,0.32)" strokeDasharray="4 5" />
        <text x={todayX + 6} y={pad.top + 14} fill="#d7cadc" fontSize="12" fontWeight="800">Hoje</text>
        {actual.length > 1 && <path d={path(actual)} fill="none" stroke="#F4A6C1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
        {projected.length > 1 && <path d={path(projected, actualCount - 1)} fill="none" stroke="#9ED8B5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 8" />}
        {points.map((point, index) => <g key={`${point.date}-${index}`}><circle cx={x(index)} cy={y(point.weightKg)} r={point.projected ? 3 : 4.5} fill={point.projected ? "#9ED8B5" : "#F4A6C1"} /><title>{point.label}: {point.weightKg.toFixed(1)} kg{point.projected ? " projetado" : " real"}</title></g>)}
        {points.map((point, index) => index % Math.ceil(points.length / 7 || 1) === 0 ? <text key={point.date} x={x(index)} y={height - 16} textAnchor="middle" fill="#9E91A8" fontSize="11" fontWeight="700">{point.label}</text> : null)}
        <text x={8} y={y(max) + 5} fill="#9E91A8" fontSize="11">{max}kg</text>
        <text x={8} y={y(min)} fill="#9E91A8" fontSize="11">{min}kg</text>
      </svg>
      {!healthy && <p className="mt-2 text-xs font-bold text-zinc-500">Adicione altura para mostrar a faixa de IMC saudável.</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-zinc-950/80 p-3 ring-1 ring-zinc-800"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p><p className="mt-1 text-lg font-black text-zinc-50">{value}</p></div>;
}

function closestProjection(points: ReturnType<typeof buildWeightChartSeries>["projected"], targetDays: number) {
  if (points.length <= 1) return null;
  const start = points[0].date;
  return points.slice(1).reduce((best, point) => Math.abs(daysBetween(start, point.date) - targetDays) < Math.abs(daysBetween(start, best.date) - targetDays) ? point : best, points[1]);
}

function calculateRecentVariation(history: WeightEntry[], days: number) {
  const sorted = normalizeWeightHistory(history);
  if (sorted.length < 2) return null;
  const last = sorted[sorted.length - 1];
  const cutoff = addDays(last.date, -days);
  const first = sorted.find((entry) => entry.date >= cutoff) ?? sorted[0];
  return Math.round((last.weightKg - first.weightKg) * 10) / 10;
}

function daysBetween(start: string, end: string) {
  return Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000);
}

function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}
