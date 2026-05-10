import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../types/training";
import {
  aggregateWeightHistory,
  buildWeightChartSeries,
  calculateHybridProjection,
  calculateMetBasedProjection,
  calculateWeightTrend,
  deleteWeightEntry,
  getHealthyWeightRange,
  normalizeWeightHistory,
  parseDecimalNumber,
  sortWeightHistory,
  stopProjectionAtHealthyRange,
  updateWeightEntry,
  validateWeightEntry,
} from "./weight";

function entry(date: string, weightKg: number): WeightEntry {
  return { id: `${date}-${weightKg}`, date, weightKg, source: "manual", createdAt: `${date}T00:00:00Z`, updatedAt: `${date}T00:00:00Z` };
}

describe("weight helpers", () => {
  it("interpreta virgula e ponto como decimal no peso", () => {
    expect(parseDecimalNumber("100,1")).toBe(100.1);
    expect(parseDecimalNumber("100.1")).toBe(100.1);
    expect(parseDecimalNumber("100000")).toBe(100000);
  });

  it("calcula faixa saudavel por altura", () => {
    const range = getHealthyWeightRange(175);
    expect(range?.min).toBeCloseTo(56.7, 1);
    expect(range?.max).toBeCloseTo(76.3, 1);
  });

  it("normaliza historico e remove duplicados", () => {
    expect(normalizeWeightHistory([entry("2026-05-01", 90), entry("2026-05-01", 90)])).toHaveLength(1);
  });

  it("edita peso e renova updatedAt", () => {
    const original = entry("2026-05-01", 90);
    const updated = updateWeightEntry([original], original.id, { weightKg: 89.5 });
    expect(updated[0].weightKg).toBe(89.5);
    expect(Date.parse(updated[0].updatedAt)).toBeGreaterThanOrEqual(Date.parse(original.updatedAt));
  });

  it("remove peso com deletedAt e graficos ignoram deletados", () => {
    const removed = deleteWeightEntry([entry("2026-05-01", 90), entry("2026-05-08", 89)], "2026-05-01-90");
    expect(removed.find((item) => item.id === "2026-05-01-90")?.deletedAt).toBeTruthy();
    expect(normalizeWeightHistory(removed)).toHaveLength(1);
    expect(buildWeightChartSeries({ history: removed, timerSessions: [], cardioLogs: [], heightCm: 175, mode: "day" }).actual).toHaveLength(1);
  });

  it("ordena historico corretamente", () => {
    const sorted = sortWeightHistory([entry("2026-05-08", 89), entry("2026-05-01", 90)]);
    expect(sorted.map((item) => item.date)).toEqual(["2026-05-01", "2026-05-08"]);
    expect(sortWeightHistory(sorted, "desc")[0].date).toBe("2026-05-08");
  });

  it("valida peso absurdo", () => {
    expect(validateWeightEntry({ date: "2026-05-01", weightKg: 1005 }).valid).toBe(false);
    expect(validateWeightEntry({ date: "2026-05-01", weightKg: 105 }).valid).toBe(true);
  });

  it("agrega por dia, semana, mes e ano", () => {
    const history = [entry("2026-05-01", 90), entry("2026-05-08", 89), entry("2026-06-01", 88)];
    expect(aggregateWeightHistory(history, "day")).toHaveLength(3);
    expect(aggregateWeightHistory(history, "week").length).toBeGreaterThanOrEqual(2);
    expect(aggregateWeightHistory(history, "month")).toHaveLength(2);
    expect(aggregateWeightHistory(history, "year")).toHaveLength(1);
  });

  it("calcula tendencia semanal de peso", () => {
    const trend = calculateWeightTrend([entry("2026-05-01", 90), entry("2026-05-15", 88)]);
    expect(trend.weeklyDeltaKg).toBeLessThan(0);
  });

  it("calcula projecao MET conservadora", () => {
    const projection = calculateMetBasedProjection([{ id: "t1", dateKey: new Date().toISOString().slice(0, 10), planId: "p", weekId: "A", dayName: "Segunda", exerciseId: "x", exerciseName: "X", status: "completed", preparationSeconds: 7, defaultRestSeconds: 90, currentSet: 3, targetSets: 3, sameLoadForAllSets: true, sets: [], totalTensionSeconds: 90, totalRestSeconds: 90, estimatedKcal: 300, createdAt: "", updatedAt: "" }], [], 90);
    expect(projection.averageWeeklyKcal).toBeGreaterThan(0);
    expect(projection.weeklyDeltaKg).toBeLessThan(0);
  });

  it("gera projecao hibrida e para ao entrar na faixa saudavel", () => {
    const projection = calculateHybridProjection({ history: [entry("2026-01-01", 90), entry("2026-02-01", 84)], timerSessions: [], cardioLogs: [], heightCm: 175, mode: "month" });
    expect(projection.points.length).toBeGreaterThan(0);
    expect(projection.points.at(-1)?.weightKg).toBeGreaterThanOrEqual(76.3);
  });

  it("corta projecao ao entrar na faixa saudavel", () => {
    const points = [{ date: "2026-01-01", label: "01/01", weightKg: 80 }, { date: "2026-02-01", label: "02/01", weightKg: 76 }];
    expect(stopProjectionAtHealthyRange(points, { min: 56, max: 77 })).toHaveLength(2);
  });

  it("com poucos dados retorna baixa confiabilidade", () => {
    const result = buildWeightChartSeries({ history: [entry("2026-05-01", 90)], timerSessions: [], cardioLogs: [], heightCm: 175, mode: "month" });
    expect(result.projection.reliability).toBe("low");
    expect(result.projected).toHaveLength(1);
  });

  it("sem historico nao quebra", () => {
    const result = buildWeightChartSeries({ history: [], timerSessions: [], cardioLogs: [], heightCm: 175, mode: "month" });
    expect(result.actual).toHaveLength(0);
    expect(result.projection.reliability).toBe("none");
  });
});
