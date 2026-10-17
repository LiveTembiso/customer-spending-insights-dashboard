import { queryOptions } from "@tanstack/react-query";
import type { z } from "zod";

import { apiGet, customerPath, type QueryParams } from "./client";

/**
 * Query options for a customer endpoint. The key is built from the same path
 * as the URL, so the two can't drift apart.
 */
export function customerQuery<Schema extends z.ZodType>(
  customerId: string,
  path: string,
  schema: Schema,
  query?: QueryParams,
) {
  return queryOptions({
    queryKey: ["customers", customerId, ...path.split("/"), query ?? {}],
    queryFn: ({ signal }) =>
      apiGet(customerPath(customerId, path), schema, { query, signal }),
  });
}
