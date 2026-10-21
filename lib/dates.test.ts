import { describe, expect, it } from "vitest";

import {
  addDays,
  addMonths,
  dayOfWeek,
  daysBetween,
  daysInMonth,
  startOfDay,
  toDayKey,
  toMonthKey,
  toTimeOfDay,
} from "./dates";

describe("dates", () => {
  it("counts days in SAST, not UTC", () => {
    // 22:30 UTC on 31 Jan is 00:30 SAST on 1 Feb.
    const instant = new Date("2024-01-31T22:30:00Z");

    expect(toDayKey(instant)).toBe("2024-02-01");
    expect(toMonthKey(instant)).toBe("2024-02");
  });

  it("starts a SAST day at 22:00 UTC the day before", () => {
    expect(startOfDay("2024-09-16").toISOString()).toBe(
      "2024-09-15T22:00:00.000Z",
    );
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
  });

  it("counts days inclusively", () => {
    expect(daysBetween("2024-09-01", "2024-09-30")).toBe(30);
    expect(daysBetween("2024-09-16", "2024-09-16")).toBe(1);
  });

  it("adds months across year boundaries", () => {
    expect(addMonths("2024-01", -1)).toBe("2023-12");
    expect(addMonths("2024-11", 3)).toBe("2025-02");
  });

  it("knows month lengths, including leap years", () => {
    expect(daysInMonth("2024-02")).toBe(29);
    expect(daysInMonth("2025-02")).toBe(28);
    expect(daysInMonth("2024-09")).toBe(30);
  });

  it("returns the weekday of a day", () => {
    expect(dayOfWeek("2024-09-16")).toBe(1); // Monday
  });

  it("tells the time of day in SAST", () => {
    expect(toTimeOfDay(new Date("2026-10-16T22:30:00Z"))).toBe("00:30");
  });
});
