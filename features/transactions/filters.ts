import { z } from "zod";

import {
  type CategoryName,
  categoryNameSchema,
} from "@/features/categories/schemas";
import type { CategoriesQuery } from "@/features/spending/schemas";
import type { DayKey } from "@/lib/dates";
import { DEFAULT_PERIOD, type DayRange, periodRange } from "@/lib/periods";
import { isoDateSchema, type Period, periodSchema } from "@/lib/schemas";
import { type ParamSource, readSearchParam } from "@/lib/search-params";

import { MAX_SEARCH_LENGTH, PAGE_SIZE } from "./constants";
import { type SortBy, sortBySchema, type TransactionsQuery } from "./schemas";

export const SORT_LABELS: Record<SortBy, string> = {
  date_desc: "Newest first",
  date_asc: "Oldest first",
  amount_desc: "Highest amount",
  amount_asc: "Lowest amount",
};

export type PeriodChoice = Period | "custom";

export interface TransactionFilters {
  q?: string;
  category?: CategoryName;
  period: PeriodChoice;
  /** The chosen dates when `period` is "custom". */
  range?: DayRange;
  sortBy: SortBy;
  page: number;
}

export const DEFAULT_FILTERS: TransactionFilters = {
  period: DEFAULT_PERIOD,
  sortBy: "date_desc",
  page: 1,
};

const pageSchema = z.coerce.number().int().min(1).catch(1);

/** Custom ranges can't start earlier than this. */
export const EARLIEST_DAY: DayKey = "2000-01-01";

// Values that don't parse fall back to defaults, so an edited link still opens.
export function parseFilters(source: ParamSource): TransactionFilters {
  const from = isoDateSchema.safeParse(readSearchParam(source, "from")).data;
  const to = isoDateSchema.safeParse(readSearchParam(source, "to")).data;
  const custom =
    readSearchParam(source, "period") === "custom" &&
    from &&
    to &&
    from >= EARLIEST_DAY &&
    from <= to
      ? { start: from, end: to }
      : undefined;

  return {
    q:
      readSearchParam(source, "q")?.trim().slice(0, MAX_SEARCH_LENGTH) ||
      undefined,
    category: categoryNameSchema.safeParse(readSearchParam(source, "category"))
      .data,
    period: custom
      ? "custom"
      : (periodSchema.safeParse(readSearchParam(source, "period")).data ??
        DEFAULT_PERIOD),
    range: custom,
    sortBy:
      sortBySchema.safeParse(readSearchParam(source, "sort")).data ??
      "date_desc",
    page: pageSchema.parse(readSearchParam(source, "page")),
  };
}

export function toSearchParams(filters: TransactionFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.period === "custom" && filters.range) {
    params.set("period", "custom");
    params.set("from", filters.range.start);
    params.set("to", filters.range.end);
  } else if (filters.period !== DEFAULT_FILTERS.period) {
    params.set("period", filters.period);
  }
  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) {
    params.set("sort", filters.sortBy);
  }
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function isFiltered(filters: TransactionFilters): boolean {
  return toSearchParams({ ...filters, page: 1 }).size > 0;
}

export function filtersRange(
  filters: TransactionFilters,
  today: DayKey,
): DayRange {
  if (filters.period === "custom" && filters.range) {
    const end = filters.range.end > today ? today : filters.range.end;
    return {
      start: filters.range.start > end ? end : filters.range.start,
      end,
    };
  }
  if (filters.period === "custom") return periodRange(DEFAULT_PERIOD, today);
  return periodRange(filters.period, today);
}

export function toTransactionsQuery(
  filters: TransactionFilters,
  today: DayKey,
): TransactionsQuery {
  const range = filtersRange(filters, today);
  return {
    limit: PAGE_SIZE,
    offset: (filters.page - 1) * PAGE_SIZE,
    category: filters.category,
    startDate: range.start,
    endDate: range.end,
    sortBy: filters.sortBy,
    q: filters.q,
  };
}

/** The category breakdown query that gives totals for the same dates. */
export function toTotalsQuery(
  filters: TransactionFilters,
  today: DayKey,
): CategoriesQuery {
  if (filters.period !== "custom") return { period: filters.period };
  const range = filtersRange(filters, today);
  return {
    period: DEFAULT_PERIOD,
    startDate: range.start,
    endDate: range.end,
  };
}
