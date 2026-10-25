import { addDays, type DayKey, dayOfWeek } from "./dates";

const amount = new Intl.NumberFormat("en-ZA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const wholeAmount = new Intl.NumberFormat("en-ZA", {
  maximumFractionDigits: 0,
});

export function formatRands(
  value: number,
  { cents = true }: { cents?: boolean } = {},
): string {
  const digits = (cents ? amount : wholeAmount)
    .formatToParts(Math.abs(value))
    .map((part) => (part.type === "decimal" ? "." : part.value))
    .join("");
  return `${value < 0 ? "-" : ""}R${digits}`;
}

const UNITS = [
  { size: 1e9, suffix: "B" },
  { size: 1e6, suffix: "M" },
  { size: 1e3, suffix: "K" },
];

/** "R30K", "R2.5K", "R1.25M": at most 3 significant digits, for chart axes. */
export function formatCompactRands(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const size = Math.abs(value);
  const scaled = (unit: number) => Number((size / unit).toPrecision(3));
  // The largest unit the rounded amount reaches, so 999 950 is R1M, not R1000K.
  const unit = UNITS.find(({ size: unitSize }) => scaled(unitSize) >= 1);
  if (!unit) return sign + formatRands(size, { cents: false });
  return `${sign}R${scaled(unit.size)}${unit.suffix}`;
}

export function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`;
}

// Not Intl: ICU's en-ZA gives "01 Sept", and day keys must not pass through a time zone.
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const parts = (day: DayKey) => ({
  day: Number(day.slice(8, 10)),
  month: MONTHS[Number(day.slice(5, 7)) - 1],
});

export function formatDayRange(start: DayKey, end: DayKey): string {
  const from = parts(start);
  const to = parts(end);
  const last = `${to.day} ${to.month.slice(0, 3)}`;
  return start === end ? last : `${from.day}–${last}`;
}

export function formatDayRangeLong(start: DayKey, end: DayKey): string {
  const from = parts(start);
  const to = parts(end);
  return start === end
    ? `${to.day} ${to.month}`
    : `${from.day} to ${to.day} ${to.month}`;
}

export function formatDay(day: DayKey): string {
  const { day: date, month } = parts(day);
  return `${date} ${month.slice(0, 3)} ${day.slice(0, 4)}`;
}

/** "21 Sep - 20 Oct 2026", with both years when they differ. */
export function formatDateRange(start: DayKey, end: DayKey): string {
  if (start === end) return formatDay(end);
  const from = parts(start);
  const startYear = start.slice(0, 4);
  const first =
    startYear === end.slice(0, 4)
      ? `${from.day} ${from.month.slice(0, 3)}`
      : formatDay(start);
  return `${first} – ${formatDay(end)}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Today", "Yesterday", "Sun 18 Oct", or "Sun 18 Oct 2025" for another year. */
export function formatDayHeading(day: DayKey, today: DayKey): string {
  if (day === today) return "Today";
  if (day === addDays(today, -1)) return "Yesterday";
  const { day: date, month } = parts(day);
  const label = `${WEEKDAYS[dayOfWeek(day)]} ${date} ${month.slice(0, 3)}`;
  return day.slice(0, 4) === today.slice(0, 4)
    ? label
    : `${label} ${day.slice(0, 4)}`;
}

export function formatMonthShort(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1].slice(0, 3);
}

export function formatMonthLong(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1];
}
