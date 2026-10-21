import { describe, expect, it } from "vitest";

import {
  DEFAULT_FILTERS,
  filtersRange,
  isFiltered,
  parseFilters,
  toSearchParams,
  toTotalsQuery,
  toTransactionsQuery,
} from "./filters";

const parse = (search: string) => parseFilters(new URLSearchParams(search));

describe("parseFilters", () => {
  it("defaults to the last 30 days, newest first", () => {
    expect(parse("")).toEqual(DEFAULT_FILTERS);
  });

  it("reads every filter", () => {
    expect(
      parse("q=pick&category=Groceries&period=90d&sort=amount_desc&page=3"),
    ).toEqual({
      q: "pick",
      category: "Groceries",
      period: "90d",
      range: undefined,
      sortBy: "amount_desc",
      page: 3,
    });
  });

  it("falls back to defaults for values it can't use", () => {
    expect(parse("q=%20%20&category=Pets&period=2w&sort=name&page=-1")).toEqual(
      DEFAULT_FILTERS,
    );
  });

  it("reads a custom range", () => {
    const filters = parse("period=custom&from=2026-09-01&to=2026-09-30");
    expect(filters.period).toBe("custom");
    expect(filters.range).toEqual({ start: "2026-09-01", end: "2026-09-30" });
  });

  it("drops a custom range that runs backwards", () => {
    const filters = parse("period=custom&from=2026-09-30&to=2026-09-01");
    expect(filters.period).toBe("30d");
    expect(filters.range).toBeUndefined();
  });

  it("drops a custom range that starts before the data could", () => {
    expect(parse("period=custom&from=0002-09-01&to=2026-09-30").period).toBe(
      "30d",
    );
  });

  it("reads the page's searchParams prop the same way", () => {
    expect(parseFilters({ category: ["Dining", "Shopping"] }).category).toBe(
      "Dining",
    );
  });
});

describe("toSearchParams", () => {
  it("leaves defaults out of the URL", () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe("");
    expect(isFiltered(DEFAULT_FILTERS)).toBe(false);
  });

  it("round-trips through parseFilters", () => {
    const search =
      "q=pick&category=Groceries&period=custom&from=2026-09-01&to=2026-09-30&sort=date_asc&page=2";
    expect(toSearchParams(parse(search)).toString()).toBe(search);
  });

  it("doesn't count the page as a filter", () => {
    expect(isFiltered({ ...DEFAULT_FILTERS, page: 4 })).toBe(false);
  });
});

describe("API queries", () => {
  const today = "2026-10-20";

  it("stops a custom range at today", () => {
    expect(
      filtersRange(
        {
          ...DEFAULT_FILTERS,
          period: "custom",
          range: { start: "2026-10-01", end: "2026-12-31" },
        },
        today,
      ),
    ).toEqual({ start: "2026-10-01", end: "2026-10-20" });
  });

  it("asks for one page of the chosen dates", () => {
    expect(toTransactionsQuery({ ...DEFAULT_FILTERS, page: 3 }, today)).toEqual(
      {
        limit: 10,
        offset: 20,
        category: undefined,
        startDate: "2026-09-21",
        endDate: "2026-10-20",
        sortBy: "date_desc",
        q: undefined,
      },
    );
  });

  it("asks for totals by period, or by dates for a custom range", () => {
    expect(toTotalsQuery({ ...DEFAULT_FILTERS, period: "7d" }, today)).toEqual({
      period: "7d",
    });
    expect(
      toTotalsQuery(
        {
          ...DEFAULT_FILTERS,
          period: "custom",
          range: { start: "2026-09-01", end: "2026-09-30" },
        },
        today,
      ),
    ).toMatchObject({ startDate: "2026-09-01", endDate: "2026-09-30" });
  });
});
