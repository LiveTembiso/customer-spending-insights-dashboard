import { queryOptions } from "@tanstack/react-query";

import { customerQuery } from "@/lib/api/queries";

import { filtersResponseSchema } from "./schemas";

export const filtersQuery = (customerId: string) =>
  queryOptions({
    ...customerQuery(customerId, "filters", filtersResponseSchema),
    // Categories and presets are fixed for the session.
    staleTime: Infinity,
  });
