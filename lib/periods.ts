import { addDays, type DayKey } from "./dates";
import type { Period } from "./schemas";

export interface DayRange {
  start: DayKey;
  end: DayKey;
}

export const DEFAULT_PERIOD: Period = "30d";

export const PERIOD_LABELS: Record<
  Period,
  { short: string; current: string; previous: string }
> = {
  "7d": {
    short: "7 days",
    current: "Last 7 days",
    previous: "previous 7 days",
  },
  "30d": {
    short: "30 days",
    current: "Last 30 days",
    previous: "previous 30 days",
  },
  "90d": {
    short: "90 days",
    current: "Last 90 days",
    previous: "previous 90 days",
  },
  "1y": { short: "1 year", current: "Last year", previous: "previous year" },
};

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
