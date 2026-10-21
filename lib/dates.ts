const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DayKey = string;

export type MonthKey = string;

function sastWallClock(instant: Date | number): Date {
  return new Date(new Date(instant).getTime() + SAST_OFFSET_MS);
}

export function toDayKey(instant: Date | number): DayKey {
  return sastWallClock(instant).toISOString().slice(0, 10);
}

/** SAST time of day as HH:MM. */
export function toTimeOfDay(instant: Date | number): string {
  return sastWallClock(instant).toISOString().slice(11, 16);
}

export function toMonthKey(instant: Date | number): MonthKey {
  return toDayKey(instant).slice(0, 7);
}

export function startOfDay(day: DayKey): Date {
  return new Date(Date.parse(`${day}T00:00:00Z`) - SAST_OFFSET_MS);
}

export function addDays(day: DayKey, amount: number): DayKey {
  return new Date(Date.parse(`${day}T00:00:00Z`) + amount * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;
}

export function addMonths(month: MonthKey, amount: number): MonthKey {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

export function daysInMonth(month: MonthKey): number {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(day: DayKey): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

export function dayOfMonth(day: DayKey): number {
  return Number(day.slice(8, 10));
}
