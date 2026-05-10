import { describe, expect, it } from "vitest";
import type { ExerciseTimerSession, ExerciseTimerSet } from "../types/training";
import { applySameLoadToSets, completeTimerSession, latestLoadAndReps, sumRestSeconds, sumTensionSeconds } from "./timer";

const sets: ExerciseTimerSet[] = [
  { setNumber: 1, loadKg: 20, reps: 12, startedAt: "", endedAt: "", tensionSeconds: 32, restSeconds: 90 },
  { setNumber: 2, loadKg: 20, reps: 11, startedAt: "", endedAt: "", tensionSeconds: 30, restSeconds: 75 },
  { setNumber: 3, loadKg: 18, reps: 10, startedAt: "", endedAt: "", tensionSeconds: 28, restSeconds: 0 },
];

function session(overrides: Partial<ExerciseTimerSession> = {}): ExerciseTimerSession {
  return {
    id: "timer-1",
    dateKey: "2026-05-04",
    planId: "treino",
    weekId: "A",
    dayName: "Segunda",
    exerciseId: "hip_thrust",
    exerciseName: "Hip thrust",
    status: "working",
    preparationSeconds: 7,
    defaultRestSeconds: 90,
    currentSet: 3,
    targetSets: 3,
    sameLoadForAllSets: true,
    sets,
    totalTensionSeconds: 0,
    totalRestSeconds: 0,
    estimatedKcal: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("timer helpers", () => {
  it("soma tempo sob tensão e descanso", () => {
    expect(sumTensionSeconds(sets)).toBe(90);
    expect(sumRestSeconds(sets)).toBe(165);
  });

  it("aplica mesma carga em todas as séries", () => {
    expect(applySameLoadToSets(sets, 22).map((set) => set.loadKg)).toEqual([22, 22, 22]);
  });

  it("mantém carga individual por série quando não aplica carga comum", () => {
    expect(sets.map((set) => set.loadKg)).toEqual([20, 20, 18]);
  });

  it("sessão concluída calcula totais corretamente", () => {
    const completed = completeTimerSession(session());
    expect(completed.status).toBe("completed");
    expect(completed.totalTensionSeconds).toBe(90);
    expect(completed.totalRestSeconds).toBe(165);
  });

  it("gera patch de carga e reps finais para o log atual", () => {
    expect(latestLoadAndReps(sets)).toEqual({ load: "18", reps1: "12", reps2: "11", reps3: "10" });
  });
});
