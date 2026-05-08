import type { WeekId } from "../types/training";

const MS_PER_DAY = 86400000;

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return Date.UTC(year, month - 1, day, 12, 0, 0, 0);
}

export function getLocalDateKey(date: Date | string = new Date()): string {
  if (typeof date === "string") return date.slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, days: number) {
  const start = parseDateOnly(dateKey);
  if (start === null) return dateKey;
  return new Date(start + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function getDaysBetween(startDate: string, currentDate: Date | string = new Date()): number {
  const start = parseDateOnly(getLocalDateKey(startDate));
  const current = parseDateOnly(getLocalDateKey(currentDate));
  if (start === null || current === null) return 0;
  return Math.floor((current - start) / MS_PER_DAY);
}

export function getWeeksElapsed(startDate: string, currentDate: Date | string = new Date()): number {
  return Math.floor(Math.max(0, getDaysBetween(startDate, currentDate)) / 7);
}

export function getCurrentWeekIndex(startDate: string, currentDate: Date | string, numberOfWeeks: number): number {
  if (numberOfWeeks <= 0) return 0;
  return getWeeksElapsed(startDate, currentDate) % numberOfWeeks;
}

export function getCurrentWeekId(startDate: string, currentDate: Date | string, weeks: WeekId[]): WeekId {
  const normalizedWeeks = weeks.length ? weeks : ["A"];
  return normalizedWeeks[getCurrentWeekIndex(startDate, currentDate, normalizedWeeks.length)] ?? normalizedWeeks[0];
}

export function getCycleIndex(startDate: string, currentDate: Date | string, numberOfWeeks: number): number {
  if (numberOfWeeks <= 0) return 0;
  return Math.floor(getWeeksElapsed(startDate, currentDate) / numberOfWeeks);
}

export function getWeekBlockStartDate(startDate: string, weekBlock: number) {
  return addDays(startDate, Math.max(0, weekBlock) * 7);
}
