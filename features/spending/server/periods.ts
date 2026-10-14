import "server-only";

import { addDays, type DayKey, toDayKey } from "@/lib/dates";
import type { Period } from "@/lib/schemas";

export interface DayRange {
  start: DayKey;
  end: DayKey;
}

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

export function periodRange(period: Period, now: Date): DayRange {
  const end = toDayKey(now);
  return { start: addDays(end, 1 - PERIOD_DAYS[period]), end };
}

export function previousPeriodRange(period: Period, now: Date): DayRange {
  const current = periodRange(period, now);
  const end = addDays(current.start, -1);
  return { start: addDays(end, 1 - PERIOD_DAYS[period]), end };
}

export function isInRange(day: DayKey, range: DayRange): boolean {
  return day >= range.start && day <= range.end;
}
