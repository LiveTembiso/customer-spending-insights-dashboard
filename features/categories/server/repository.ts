import "server-only";

import { findCustomer } from "@/features/profile/server/customers";
import { PERIOD_LABELS } from "@/lib/periods";
import { PERIODS } from "@/lib/schemas";

import { CATEGORIES } from "../catalogue";
import type { FiltersResponse } from "../schemas";

const DATE_RANGE_PRESETS: FiltersResponse["dateRangePresets"] = PERIODS.map(
  (value) => ({ label: PERIOD_LABELS[value].current, value }),
);

export function getFilters(customerId: string): FiltersResponse | undefined {
  if (!findCustomer(customerId)) return undefined;

  return {
    categories: [...CATEGORIES],
    dateRangePresets: DATE_RANGE_PRESETS,
  };
}
