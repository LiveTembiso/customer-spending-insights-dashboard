import "server-only";

import { addDays, DAY_MS, type DayKey, toDayKey } from "@/lib/dates";
import {
  type DayRange,
  PERIOD_DAYS,
  periodRange as periodRangeEnding,
} from "@/lib/periods";
import type { Period } from "@/lib/schemas";

export type { DayRange };

export function periodRange(period: Period, now: Date): DayRange {
  return periodRangeEnding(period, toDayKey(now));
}

export function previousPeriodRange(period: Period, now: Date): DayRange {
  const current = periodRange(period, now);
  const end = addDays(current.start, -1);
  return { start: addDays(end, 1 - PERIOD_DAYS[period]), end };
}

// The current period is only partly over, so the previous one is cut off at
// the same time of day: exactly one period length before now.
export function previousPeriodCutoff(period: Period, now: Date): number {
  return now.getTime() - PERIOD_DAYS[period] * DAY_MS;
}

export function isInRange(day: DayKey, range: DayRange): boolean {
  return day >= range.start && day <= range.end;
}
