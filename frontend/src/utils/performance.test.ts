import { describe, expect, it } from "vitest";
import { makeFakePerformanceData } from "./performanceFixtures";
import { calculateCardioStats, calculateConsistency, calculateMuscleVolume, calculatePersonalRecords, calculateTimerStats, calculateWeeklyCalories, filterExerciseEntries, normalizeExerciseHistory } from "./performance";

describe("performance calculations", () => {
  it("processa dados longos sem NaN ou undefined", () => {
    const startedAt = performance.now();
    const data = makeFakePerformanceData("2024-01-01", 104);
    const entries = normalizeExerciseHistory(data.logs);
    const filtered = filterExerciseEntries(entries, { period: "all", exerciseId: "", muscle: "", trainingType: "", onlyWithHistory: true });
    const muscleVolume = calculateMuscleVolume(filtered);
    const records = calculatePersonalRecords(filtered);
    const consistency = calculateConsistency(filtered, data.cardioLogs, "all");
    const cardio = calculateCardioStats(data.cardioLogs, "all");
    expect(filtered.length).toBe(104 * 5 * 7);
    expect(muscleVolume.every((item) => Number.isFinite(item.volume) && Number.isFinite(item.percent))).toBe(true);
    expect(records.length).toBeGreaterThan(0);
    expect(consistency.days.length).toBeGreaterThan(0);
    expect(cardio.totalMinutes).toBeGreaterThan(0);
    expect(performance.now() - startedAt).toBeLessThan(12000);
  }, 15000);

  it("mostra nomes amigáveis para logs datados", () => {
    const entries = normalizeExerciseHistory({
      "local:treino-base-loloa:2026-05-04:A:Segunda:puxada_na_frente_pegada_neutra_ou_aberta": {
        done: true,
        load: "20",
        reps1: "10",
        reps2: "10",
        reps3: "10",
        note: "",
      },
    });

    expect(entries[0].exerciseName).not.toContain("local:");
    expect(entries[0].exerciseName.toLowerCase()).toContain("puxada");
  });

  it("calcula queima calórica semanal com treino e cardio", () => {
    const entries = normalizeExerciseHistory({
      "local:treino-base-loloa:2026-05-04:A:Segunda:puxada_na_frente_pegada_neutra_ou_aberta": {
        done: true,
        load: "30",
        reps1: "12",
        reps2: "12",
        reps3: "12",
        note: "",
      },
    });
    const weekly = calculateWeeklyCalories(entries, [{ id: "cardio-1", date: "2026-05-06", minutes: "20", type: "Esteira", intensity: "Moderado" }], "all");

    expect(weekly).toHaveLength(1);
    expect(weekly[0].trainingCalories).toBeGreaterThan(0);
    expect(weekly[0].cardioCalories).toBeGreaterThan(0);
    expect(weekly[0].totalCalories).toBe(weekly[0].trainingCalories + weekly[0].cardioCalories);
  });

  it("prioriza kcal do timer no gráfico semanal quando existir", () => {
    const entries = normalizeExerciseHistory({
      "local:treino-base-loloa:2026-05-04:A:Segunda:hip_thrust": {
        done: true,
        load: "30",
        reps1: "12",
        reps2: "12",
        reps3: "12",
        note: "",
      },
    });
    const weekly = calculateWeeklyCalories(entries, [], "all", 70, [{
      id: "timer-1",
      dateKey: "2026-05-04",
      planId: "p",
      weekId: "A",
      dayName: "Segunda",
      exerciseId: "hip_thrust",
      exerciseName: "Hip thrust",
      status: "completed",
      preparationSeconds: 7,
      defaultRestSeconds: 90,
      currentSet: 3,
      targetSets: 3,
      sameLoadForAllSets: true,
      sets: [],
      totalTensionSeconds: 90,
      totalRestSeconds: 180,
      estimatedKcal: 42,
      createdAt: "",
      updatedAt: "",
    }]);

    expect(weekly[0].trainingCalories).toBe(42);
  });

  it("calcula métricas do timer sem NaN", () => {
    const stats = calculateTimerStats([{
      id: "timer-1",
      dateKey: "2026-05-04",
      planId: "p",
      weekId: "A",
      dayName: "Segunda",
      exerciseId: "hip_thrust",
      exerciseName: "Hip thrust",
      status: "completed",
      preparationSeconds: 7,
      defaultRestSeconds: 90,
      currentSet: 3,
      targetSets: 3,
      sameLoadForAllSets: true,
      sets: [{ setNumber: 1, loadKg: 20, reps: 10, startedAt: "", endedAt: "", tensionSeconds: 30, restSeconds: 90 }],
      totalTensionSeconds: 30,
      totalRestSeconds: 90,
      estimatedKcal: 3,
      createdAt: "",
      updatedAt: "",
    }], "all");

    expect(stats.sessions).toBe(1);
    expect(stats.totalTensionSeconds).toBe(30);
    expect(stats.topByTension[0].averageSecondsPerRep).toBe(3);
  });
});
