import { describe, expect, it } from "vitest";
import type { Logs } from "../types/training";
import { getCurrentDayLogKey, getLastExerciseHistory } from "./storage";

describe("storage log keys", () => {
  it("gera chaves diferentes para Semana 1 A e Semana 3 A", () => {
    const week1 = getCurrentDayLogKey({ userIdOrLocal: "local", planId: "base", dateKey: "2026-05-04", weekId: "A", dayName: "Segunda", exerciseId: "hip-thrust" });
    const week3 = getCurrentDayLogKey({ userIdOrLocal: "local", planId: "base", dateKey: "2026-05-18", weekId: "A", dayName: "Segunda", exerciseId: "hip-thrust" });
    expect(week1).not.toBe(week3);
  });

  it("não carrega checkbox antigo como estado atual", () => {
    const week1 = getCurrentDayLogKey({ userIdOrLocal: "local", planId: "base", dateKey: "2026-05-04", weekId: "A", dayName: "Segunda", exerciseId: "hip-thrust" });
    const week3 = getCurrentDayLogKey({ userIdOrLocal: "local", planId: "base", dateKey: "2026-05-18", weekId: "A", dayName: "Segunda", exerciseId: "hip-thrust" });
    const logs: Logs = { [week1]: { done: true, load: "40", reps1: "12", reps2: "12", reps3: "10", note: "", updatedAt: "2026-05-04T12:00:00Z" } };
    expect(logs[week3]?.done).toBeUndefined();
    expect(getLastExerciseHistory("hip-thrust", logs, week3)?.load).toBe("40");
  });

  it("separa Semana 1 A e Semana 5 A em A/B/C/D", () => {
    const week1 = getCurrentDayLogKey({ userIdOrLocal: "local", planId: "custom", dateKey: "2026-05-04", weekId: "A", dayName: "Segunda", exerciseId: "leg-press" });
    const week5 = getCurrentDayLogKey({ userIdOrLocal: "local", planId: "custom", dateKey: "2026-06-01", weekId: "A", dayName: "Segunda", exerciseId: "leg-press" });
    expect(week1).not.toBe(week5);
  });
});
