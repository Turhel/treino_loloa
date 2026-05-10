import { describe, expect, it } from "vitest";
import type { UserAppData } from "./userDataService";
import { isMissingTimerSessionsColumn, mergeUserAppData } from "./userDataService";

const empty = (overrides: Partial<UserAppData>): UserAppData => ({
  logs: {},
  history: [],
  pain_logs: [],
  cardio_logs: [],
  timer_sessions: [],
  weight_history: [],
  custom_plans: [],
  settings: {},
  ...overrides,
});

describe("mergeUserAppData", () => {
  it("mantem logs com chaves diferentes", () => {
    const merged = mergeUserAppData(empty({ logs: { a: { done: true, load: "1", reps1: "", reps2: "", reps3: "", note: "", updatedAt: "2026-01-01T00:00:00Z" } } }), empty({ logs: { b: { done: true, load: "2", reps1: "", reps2: "", reps3: "", note: "", updatedAt: "2026-01-02T00:00:00Z" } } }));
    expect(Object.keys(merged.logs).sort()).toEqual(["a", "b"]);
  });

  it("usa updatedAt mais recente para mesma chave", () => {
    const merged = mergeUserAppData(empty({ logs: { a: { done: true, load: "1", reps1: "", reps2: "", reps3: "", note: "", updatedAt: "2026-01-03T00:00:00Z" } } }), empty({ logs: { a: { done: true, load: "2", reps1: "", reps2: "", reps3: "", note: "", updatedAt: "2026-01-02T00:00:00Z" } } }));
    expect(merged.logs.a.load).toBe("1");
  });

  it("nao duplica ids e nao apaga startDate local", () => {
    const merged = mergeUserAppData(
      empty({ history: [{ id: "h1" }], custom_plans: [{ id: "p1", name: "Plano", phase: "custom", createdAt: "", updatedAt: "", weeks: [] }], settings: { startDate: "2026-05-04" } }),
      empty({ history: [{ id: "h1" }], custom_plans: [{ id: "p1", name: "Plano remoto", phase: "custom", createdAt: "", updatedAt: "", weeks: [] }], settings: { startDate: "" } })
    );
    expect(merged.history).toHaveLength(1);
    expect(merged.custom_plans).toHaveLength(1);
    expect(merged.settings.startDate).toBe("2026-05-04");
  });

  it("mescla sessoes de timer por id sem duplicar", () => {
    const localSession = { id: "timer-1", dateKey: "2026-05-04", planId: "p", weekId: "A", dayName: "Segunda", exerciseId: "hip_thrust", exerciseName: "Hip thrust", status: "completed" as const, preparationSeconds: 7, defaultRestSeconds: 90, currentSet: 3, targetSets: 3, sameLoadForAllSets: true, sets: [], totalTensionSeconds: 40, totalRestSeconds: 90, estimatedKcal: 4, createdAt: "", updatedAt: "" };
    const remoteSession = { ...localSession, totalTensionSeconds: 55 };
    const merged = mergeUserAppData(empty({ timer_sessions: [localSession] }), empty({ timer_sessions: [remoteSession] }));
    expect(merged.timer_sessions).toHaveLength(1);
    expect(merged.timer_sessions[0].totalTensionSeconds).toBe(55);
  });

  it("identifica erro de schema cache sem coluna timer_sessions", () => {
    expect(isMissingTimerSessionsColumn({ code: "PGRST204", message: "Could not find the 'timer_sessions' column of 'user_app_data' in the schema cache" })).toBe(true);
    expect(isMissingTimerSessionsColumn({ code: "PGRST204", message: "Could not find another column" })).toBe(false);
  });

  it("mescla historico de peso por id sem duplicar", () => {
    const base = { id: "w1", date: "2026-05-04", weightKg: 90, source: "manual" as const, createdAt: "2026-05-04T00:00:00Z", updatedAt: "2026-05-04T00:00:00Z" };
    const remote = { ...base, note: "remoto", updatedAt: "2026-05-05T00:00:00Z" };
    const merged = mergeUserAppData(empty({ weight_history: [base] }), empty({ weight_history: [remote] }));
    expect(merged.weight_history).toHaveLength(1);
    expect(merged.weight_history[0].note).toBe("remoto");
  });

  it("nao ressuscita peso deletado com updatedAt mais recente", () => {
    const remote = { id: "w1", date: "2026-05-04", weightKg: 90, source: "manual" as const, createdAt: "2026-05-04T00:00:00Z", updatedAt: "2026-05-04T00:00:00Z" };
    const localDeleted = { ...remote, deletedAt: "2026-05-06T00:00:00Z", updatedAt: "2026-05-06T00:00:00Z" };
    const merged = mergeUserAppData(empty({ weight_history: [localDeleted] }), empty({ weight_history: [remote] }));
    expect(merged.weight_history).toHaveLength(1);
    expect(merged.weight_history[0].deletedAt).toBeTruthy();
  });
});
