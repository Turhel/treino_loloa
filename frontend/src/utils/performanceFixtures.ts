import type { ExerciseLog, Logs } from "../types/training";
import { addDays } from "./schedule";
import { getCurrentDayLogKey } from "./storage";
import type { CardioPerformanceLog, PainPerformanceLog } from "./performance";

const exerciseIds = ["hip-thrust", "leg-press", "puxada", "remada", "supino", "desenvolvimento", "triceps"];
const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export function makeFakePerformanceData(startDate = "2024-01-01", weeks = 104) {
  const logs: Logs = {};
  const cardioLogs: CardioPerformanceLog[] = [];
  const painLogs: PainPerformanceLog[] = [];
  const history: { id: string; date: string }[] = [];

  for (let week = 0; week < weeks; week += 1) {
    const weekId = week % 2 === 0 ? "A" : "B";
    for (let day = 0; day < dayNames.length; day += 1) {
      const dateKey = addDays(startDate, week * 7 + day);
      for (const [index, exerciseId] of exerciseIds.entries()) {
        const load = 20 + ((week + index) % 12) * 2;
        const reps = 8 + ((week + day + index) % 8);
        const log: ExerciseLog = {
          done: true,
          load: String(load),
          reps1: String(reps),
          reps2: String(Math.max(6, reps - 1)),
          reps3: String(Math.max(6, reps - 2)),
          note: "",
          updatedAt: `${dateKey}T12:00:00.000Z`,
        };
        logs[getCurrentDayLogKey({ userIdOrLocal: "local", planId: "fixture", dateKey, weekId, dayName: dayNames[day], exerciseId })] = log;
        history.push({ id: `${dateKey}-${exerciseId}`, date: dateKey });
      }
    }
    for (const cardioDay of [1, 3, 5]) {
      const date = addDays(startDate, week * 7 + cardioDay);
      cardioLogs.push({ id: `cardio-${date}`, date, minutes: "30", type: cardioDay === 5 ? "Bicicleta" : "Esteira", intensity: "Moderado", moderateMinutes: "30" });
    }
    if (week % 9 === 0) {
      const date = addDays(startDate, week * 7 + 2);
      painLogs.push({ id: `pain-${date}`, date, level: "1", text: week % 18 === 0 ? "lombar" : "joelho" });
    }
  }

  return { logs, cardioLogs, painLogs, history };
}
