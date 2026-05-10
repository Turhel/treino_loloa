import { findExerciseLibraryItem } from "../data/exerciseLibrary";
import type { ExerciseLog } from "../types/training";

export type EstimateKcalInput = {
  met: number;
  bodyWeightKg?: number | null;
  activeSeconds: number;
  restSeconds?: number;
};

export function estimateKcalFromMet({ met, bodyWeightKg, activeSeconds, restSeconds = 0 }: EstimateKcalInput) {
  if (!bodyWeightKg || bodyWeightKg <= 0) return null;
  const activeKcal = met * 3.5 * bodyWeightKg / 200 * (activeSeconds / 60);
  const restKcal = 1.5 * 3.5 * bodyWeightKg / 200 * (restSeconds / 60);
  return Math.max(0, Math.round((activeKcal + restKcal) * 10) / 10);
}

export function metForExercise(kind?: string, explicitMet?: number) {
  if (explicitMet && explicitMet > 0) return explicitMet;
  if (kind === "isolador") return 3.5;
  if (kind === "cardio") return 6;
  if (kind === "mobilidade") return 2.5;
  return 4.5;
}

function parsePositiveNumber(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function estimateKcalFromLoggedExercise({
  log,
  exerciseId,
  exerciseName,
  bodyWeightKg,
  secondsPerRep = 4,
}: {
  log?: ExerciseLog;
  exerciseId?: string;
  exerciseName?: string;
  bodyWeightKg?: number | null;
  secondsPerRep?: number;
}) {
  if (!log) return 0;
  const load = parsePositiveNumber(log.load);
  const reps = [log.reps1, log.reps2, log.reps3].reduce((sum, value) => sum + parsePositiveNumber(value), 0);
  if (!load || !reps) return 0;
  const item = findExerciseLibraryItem(exerciseId ?? "") ?? findExerciseLibraryItem(exerciseName ?? "");
  const met = metForExercise(item?.exerciseKind, item?.met);
  const kcal = estimateKcalFromMet({
    met,
    bodyWeightKg: bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : 70,
    activeSeconds: reps * secondsPerRep,
    restSeconds: 0,
  });
  return Math.max(1, Math.round(kcal ?? 0));
}
