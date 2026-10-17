import { describe, expect, it } from "vitest";
import type { z } from "zod";

import { filtersResponseSchema } from "@/features/categories/schemas";
import { goalsResponseSchema } from "@/features/goals/schemas";
import { profileResponseSchema } from "@/features/profile/schemas";
import {
  categoriesResponseSchema,
  summaryResponseSchema,
  trendsResponseSchema,
} from "@/features/spending/schemas";
import { transactionsResponseSchema } from "@/features/transactions/schemas";

import { GET as filters } from "./filters/route";
import { GET as goals } from "./goals/route";
import { GET as profile } from "./profile/route";
import { GET as categories } from "./spending/categories/route";
import { GET as summary } from "./spending/summary/route";
import { GET as trends } from "./spending/trends/route";
import { GET as transactions } from "./transactions/route";

type Handler = (
  request: Request,
  context: { params: Promise<{ customerId: string }> },
) => Promise<Response>;

const endpoints: [string, Handler, z.ZodType][] = [
  ["profile", profile, profileResponseSchema],
  ["spending/summary", summary, summaryResponseSchema],
  ["spending/categories", categories, categoriesResponseSchema],
  ["spending/trends", trends, trendsResponseSchema],
  ["transactions", transactions, transactionsResponseSchema],
  ["goals", goals, goalsResponseSchema],
  ["filters", filters, filtersResponseSchema],
];

function call(handler: Handler, customerId: string, path: string) {
  return handler(
    new Request(`http://localhost/api/customers/${customerId}/${path}`),
    { params: Promise.resolve({ customerId }) },
  );
}

describe.each(endpoints)("GET %s", (path, handler, schema) => {
  it("returns a response matching the contract", async () => {
    const response = await call(handler, "12345", path);

    expect(response.status).toBe(200);
    expect(schema.safeParse(await response.json()).success).toBe(true);
  });

  it("returns 404 for an unknown customer", async () => {
    const response = await call(handler, "99999", path);

    expect(response.status).toBe(404);
  });
});

describe("query handling", () => {
  it.each([
    ["spending/summary?period=2w", summary],
    ["spending/categories?startDate=2024-09-01", categories],
    ["spending/trends?months=25", trends],
    ["transactions?limit=101", transactions],
    ["transactions?sortBy=merchant", transactions],
  ])("rejects %s with 400", async (path, handler) => {
    const response = await call(handler, "12345", path);

    expect(response.status).toBe(400);
  });

  it("applies the contract defaults", async () => {
    const summaryBody = await (
      await call(summary, "12345", "spending/summary")
    ).json();
    const trendsBody = await (
      await call(trends, "12345", "spending/trends")
    ).json();
    const transactionsBody = await (
      await call(transactions, "12345", "transactions")
    ).json();

    expect(summaryBody.period).toBe("30d");
    expect(trendsBody.trends).toHaveLength(12);
    expect(transactionsBody.pagination).toMatchObject({ limit: 20, offset: 0 });
  });
});
