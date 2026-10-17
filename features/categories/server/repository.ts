import "server-only";

import { findCustomer } from "@/features/profile/server/customers";

import { CATEGORIES } from "../catalogue";
import type { FiltersResponse } from "../schemas";

const DATE_RANGE_PRESETS: FiltersResponse["dateRangePresets"] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last year", value: "1y" },
];

export function getFilters(customerId: string): FiltersResponse | undefined {
  if (!findCustomer(customerId)) return undefined;

  return {
    categories: [...CATEGORIES],
    dateRangePresets: DATE_RANGE_PRESETS,
  };
}
