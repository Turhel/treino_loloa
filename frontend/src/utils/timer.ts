import type { ExerciseTimerSession, ExerciseTimerSet } from "../types/training";

export function sumTensionSeconds(sets: Pick<ExerciseTimerSet, "tensionSeconds">[]) {
  return sets.reduce((sum, set) => sum + Math.max(0, set.tensionSeconds || 0), 0);
}

export function sumRestSeconds(sets: Pick<ExerciseTimerSet, "restSeconds">[]) {
  return sets.reduce((sum, set) => sum + Math.max(0, set.restSeconds || 0), 0);
}

export function applySameLoadToSets(sets: ExerciseTimerSet[], loadKg: number | null) {
  return sets.map((set) => ({ ...set, loadKg }));
}

export function completeTimerSession(session: ExerciseTimerSession): ExerciseTimerSession {
  return {
    ...session,
    status: "completed",
    totalTensionSeconds: sumTensionSeconds(session.sets),
    totalRestSeconds: sumRestSeconds(session.sets),
    updatedAt: new Date().toISOString(),
  };
}

export function latestLoadAndReps(sets: ExerciseTimerSet[]) {
  const completed = sets.filter((set) => set.reps || set.loadKg);
  const last = completed[completed.length - 1];
  return {
    load: last?.loadKg ? String(last.loadKg) : "",
    reps1: sets[0]?.reps ? String(sets[0].reps) : "",
    reps2: sets[1]?.reps ? String(sets[1].reps) : "",
    reps3: sets[2]?.reps ? String(sets[2].reps) : "",
  };
}
