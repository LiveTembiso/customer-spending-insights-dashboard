import { addDays, type DayKey } from "./dates";
import type { Period } from "./schemas";

export interface DayRange {
  start: DayKey;
  end: DayKey;
}

export const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

/** The period ending on (and including) `today`. */
export function periodRange(period: Period, today: DayKey): DayRange {
  return { start: addDays(today, 1 - PERIOD_DAYS[period]), end: today };
}
