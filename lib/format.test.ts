import { describe, expect, it } from "vitest";

import {
  formatCompactRands,
  formatDateRange,
  formatDay,
  formatDayHeading,
  formatDayRange,
  formatDayRangeLong,
  formatMonthLong,
  formatMonthShort,
  formatPercent,
  formatRands,
} from "./format";

describe("formatCompactRands", () => {
  it("shortens thousands, millions and billions to 3 significant digits", () => {
    expect(formatCompactRands(10000)).toBe("R10K");
    expect(formatCompactRands(100000)).toBe("R100K");
    expect(formatCompactRands(2500)).toBe("R2.5K");
    expect(formatCompactRands(22456)).toBe("R22.5K");
    expect(formatCompactRands(1000000)).toBe("R1M");
    expect(formatCompactRands(1250000)).toBe("R1.25M");
    expect(formatCompactRands(3_000_000_000)).toBe("R3B");
  });

  it("carries into the next unit when rounding reaches 1 000", () => {
    expect(formatCompactRands(999_950)).toBe("R1M");
    expect(formatCompactRands(999_400)).toBe("R999K");
  });

  it("leaves amounts under 1 000 as they are", () => {
    expect(formatCompactRands(0)).toBe("R0");
    expect(formatCompactRands(750)).toBe("R750");
    expect(formatCompactRands(999.4)).toBe("R999");
  });

  it("carries amounts that round to 1 000 into thousands", () => {
    expect(formatCompactRands(999.6)).toBe("R1K");
  });

  it("keeps the sign of negative amounts", () => {
    expect(formatCompactRands(-2500)).toBe("-R2.5K");
    expect(formatCompactRands(-750)).toBe("-R750");
  });

  it("shows a dash for values that aren't numbers", () => {
    expect(formatCompactRands(Number.NaN)).toBe("—");
    expect(formatCompactRands(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatRands", () => {
  it("groups thousands with a space and keeps a decimal point", () => {
    expect(formatRands(4250.75).replace(/\s/g, " ")).toBe("R4 250.75");
  });

  it("always shows cents", () => {
    expect(formatRands(199)).toBe("R199.00");
  });

  it("can leave the cents off, for axis labels", () => {
    expect(formatRands(5000, { cents: false }).replace(/\s/g, " ")).toBe(
      "R5 000",
    );
  });

  it("puts the sign before the currency", () => {
    expect(formatRands(-12.5)).toBe("-R12.50");
  });
});

describe("formatPercent", () => {
  it("drops the sign, which the arrow carries", () => {
    expect(formatPercent(-3.24)).toBe("3.2%");
  });
});

describe("formatDayRange", () => {
  it("shows the month once", () => {
    expect(formatDayRange("2026-09-01", "2026-09-14")).toBe("1–14 Sep");
  });

  it("collapses a single day", () => {
    expect(formatDayRange("2026-09-01", "2026-09-01")).toBe("1 Sep");
  });

  it("spells the range out for screen readers", () => {
    expect(formatDayRangeLong("2026-09-01", "2026-09-14")).toBe(
      "1 to 14 September",
    );
  });
});

describe("formatDay", () => {
  it("writes a short date with the year", () => {
    expect(formatDay("2026-09-16")).toBe("16 Sep 2026");
  });
});

describe("formatDateRange", () => {
  it("names the year once when both ends share it", () => {
    expect(formatDateRange("2026-09-21", "2026-10-20")).toBe(
      "21 Sep – 20 Oct 2026",
    );
  });

  it("names both years across a new year", () => {
    expect(formatDateRange("2025-12-20", "2026-01-05")).toBe(
      "20 Dec 2025 – 5 Jan 2026",
    );
  });

  it("collapses a single day", () => {
    expect(formatDateRange("2026-10-20", "2026-10-20")).toBe("20 Oct 2026");
  });
});

describe("formatDayHeading", () => {
  const today = "2026-10-20";

  it("says today and yesterday", () => {
    expect(formatDayHeading("2026-10-20", today)).toBe("Today");
    expect(formatDayHeading("2026-10-19", today)).toBe("Yesterday");
  });

  it("names the weekday for older days", () => {
    expect(formatDayHeading("2026-10-18", today)).toBe("Sun 18 Oct");
  });

  it("adds the year when it isn't this year", () => {
    expect(formatDayHeading("2025-10-18", today)).toBe("Sat 18 Oct 2025");
  });
});

describe("month names", () => {
  it("names a month key short and long", () => {
    expect(formatMonthShort("2026-09")).toBe("Sep");
    expect(formatMonthLong("2026-09")).toBe("September");
  });
});
