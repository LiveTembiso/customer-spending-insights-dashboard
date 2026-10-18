import { describe, expect, it } from "vitest";

import {
  formatDay,
  formatDayRange,
  formatDayRangeLong,
  formatMonthLong,
  formatMonthShort,
  formatPercent,
  formatRands,
} from "./format";

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

describe("month names", () => {
  it("names a month key short and long", () => {
    expect(formatMonthShort("2026-09")).toBe("Sep");
    expect(formatMonthLong("2026-09")).toBe("September");
  });
});
