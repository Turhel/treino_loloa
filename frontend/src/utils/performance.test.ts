import { describe, expect, it } from "vitest";
import { makeFakePerformanceData } from "./performanceFixtures";
import { calculateCardioStats, calculateConsistency, calculateMuscleVolume, calculatePersonalRecords, filterExerciseEntries, normalizeExerciseHistory } from "./performance";

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
});
