import type { CategoryName } from "@/features/categories/schemas";
import {
  DEFAULT_FILTERS,
  toSearchParams,
} from "@/features/transactions/filters";
import type { DayKey } from "@/lib/dates";

/** The Transactions page showing this month's purchases in a category. */
export function purchasesHref(category: CategoryName, today: DayKey): string {
  const search = toSearchParams({
    ...DEFAULT_FILTERS,
    category,
    period: "custom",
    range: { start: `${today.slice(0, 7)}-01`, end: today },
  });
  return `/transactions?${search}`;
}
