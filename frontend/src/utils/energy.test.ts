import { describe, expect, it } from "vitest";
import { estimateKcalFromLoggedExercise, estimateKcalFromMet, metForExercise } from "./energy";

describe("energy", () => {
  it("calcula kcal aproximadas com MET, peso, tempo ativo e descanso", () => {
    const kcal = estimateKcalFromMet({ met: 4.5, bodyWeightKg: 70, activeSeconds: 120, restSeconds: 180 });
    expect(kcal).toBeGreaterThan(0);
    expect(kcal).toBeCloseTo(16.5, 1);
  });

  it("retorna null sem peso corporal", () => {
    expect(estimateKcalFromMet({ met: 4.5, bodyWeightKg: null, activeSeconds: 120 })).toBeNull();
  });

  it("usa MET padrão por tipo de exercício", () => {
    expect(metForExercise("isolador")).toBe(3.5);
    expect(metForExercise("composto")).toBe(4.5);
    expect(metForExercise("cardio")).toBe(6);
    expect(metForExercise("composto", 5.2)).toBe(5.2);
  });

  it("estima kcal de log manual por MET quando há carga e reps", () => {
    const kcal = estimateKcalFromLoggedExercise({
      exerciseId: "supino_reto_maquina_ou_chest_press",
      bodyWeightKg: 70,
      log: { done: true, load: "20", reps1: "10", reps2: "10", reps3: "10", note: "" },
    });
    expect(kcal).toBeGreaterThan(5);
  });

  it("não estima kcal de log manual sem carga", () => {
    const kcal = estimateKcalFromLoggedExercise({
      bodyWeightKg: 70,
      log: { done: true, load: "", reps1: "10", reps2: "", reps3: "", note: "" },
    });
    expect(kcal).toBe(0);
  });
});
