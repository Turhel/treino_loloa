import type { WeekId } from "../types/training";

const MS_PER_DAY = 86400000;
const weekdayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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

export function getWeekdayName(dateKey: string) {
  const value = parseDateOnly(dateKey);
  if (value === null) return "";
  return weekdayNames[new Date(value).getUTCDay()];
}

export function isWeekend(dateKey: string) {
  const day = getWeekdayName(dateKey);
  return day === "Sábado" || day === "Domingo";
}

export function getFirstBusinessDate(dateKey: string) {
  let current = getLocalDateKey(dateKey);
  while (isWeekend(current)) current = addDays(current, 1);
  return current;
}

export function addBusinessDays(dateKey: string, businessDays: number) {
  let current = dateKey;
  let remaining = Math.max(0, businessDays);
  while (remaining > 0) {
    current = addDays(current, 1);
    if (!isWeekend(current)) remaining -= 1;
  }
  return current;
}

export function getBusinessDaysBetween(startDate: string, currentDate: Date | string = new Date()) {
  const startKey = getFirstBusinessDate(startDate);
  const currentKey = getLocalDateKey(currentDate);
  if (getDaysBetween(startKey, currentKey) <= 0) return 0;
  let current = startKey;
  let count = 0;
  while (current < currentKey) {
    current = addDays(current, 1);
    if (!isWeekend(current)) count += 1;
  }
  return count;
}

export function getBusinessWeekBlock(startDate: string, currentDate: Date | string = new Date(), sessionsPerWeek = 5) {
  if (!startDate) return 0;
  return Math.floor(getBusinessDaysBetween(startDate, currentDate) / Math.max(1, sessionsPerWeek));
}

export function getSessionDateForWeekDay(startDate: string, weekBlock: number, dayIndex: number, sessionsPerWeek = 5) {
  return addBusinessDays(getFirstBusinessDate(startDate), Math.max(0, weekBlock) * sessionsPerWeek + Math.max(0, dayIndex));
}

export function getDaysBetween(startDate: string, currentDate: Date | string = new Date()): number {
  const start = parseDateOnly(getFirstBusinessDate(startDate));
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
  return addBusinessDays(getFirstBusinessDate(startDate), Math.max(0, weekBlock) * 5);
}
