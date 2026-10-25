import type { CategoryName } from "@/features/categories/schemas";
import type { DayKey } from "@/lib/dates";
import type { DayRange } from "@/lib/periods";

import { DEFAULT_FILTERS, toSearchParams } from "./filters";

/** Category purchases for a range, or the month through the supplied day. */
export function purchasesHref(
  category: CategoryName,
  rangeOrToday: DayRange | DayKey,
): string {
  const range =
    typeof rangeOrToday === "string"
      ? { start: `${rangeOrToday.slice(0, 7)}-01`, end: rangeOrToday }
      : rangeOrToday;
  const search = toSearchParams({
    ...DEFAULT_FILTERS,
    category,
    period: "custom",
    range,
  });
  return `/transactions?${search}`;
}
