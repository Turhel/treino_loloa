import { describe, expect, it } from "vitest";
import type { UserAppData } from "./userDataService";
import { mergeUserAppData } from "./userDataService";

const empty = (overrides: Partial<UserAppData>): UserAppData => ({
  logs: {},
  history: [],
  pain_logs: [],
  cardio_logs: [],
  custom_plans: [],
  settings: {},
  ...overrides,
});

describe("mergeUserAppData", () => {
  it("mantém logs com chaves diferentes", () => {
    const merged = mergeUserAppData(empty({ logs: { a: { done: true, load: "1", reps1: "", reps2: "", reps3: "", note: "", updatedAt: "2026-01-01T00:00:00Z" } } }), empty({ logs: { b: { done: true, load: "2", reps1: "", reps2: "", reps3: "", note: "", updatedAt: "2026-01-02T00:00:00Z" } } }));
    expect(Object.keys(merged.logs).sort()).toEqual(["a", "b"]);
  });

  it("usa updatedAt mais recente para mesma chave", () => {
    const merged = mergeUserAppData(empty({ logs: { a: { done: true, load: "1", reps1: "", reps2: "", reps3: "", note: "", updatedAt: "2026-01-03T00:00:00Z" } } }), empty({ logs: { a: { done: true, load: "2", reps1: "", reps2: "", reps3: "", note: "", updatedAt: "2026-01-02T00:00:00Z" } } }));
    expect(merged.logs.a.load).toBe("1");
  });

  it("não duplica ids e não apaga startDate local", () => {
    const merged = mergeUserAppData(
      empty({ history: [{ id: "h1" }], custom_plans: [{ id: "p1", name: "Plano", phase: "custom", createdAt: "", updatedAt: "", weeks: [] }], settings: { startDate: "2026-05-04" } }),
      empty({ history: [{ id: "h1" }], custom_plans: [{ id: "p1", name: "Plano remoto", phase: "custom", createdAt: "", updatedAt: "", weeks: [] }], settings: { startDate: "" } })
    );
    expect(merged.history).toHaveLength(1);
    expect(merged.custom_plans).toHaveLength(1);
    expect(merged.settings.startDate).toBe("2026-05-04");
  });
});
