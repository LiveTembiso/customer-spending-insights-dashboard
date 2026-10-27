import { expect, test } from "@playwright/test";
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
import { apiErrorBodySchema } from "@/lib/api/errors";

const BASE = "/api/customers/12345";

const ENDPOINTS: { path: string; schema: z.ZodType }[] = [
  { path: "/profile", schema: profileResponseSchema },
  { path: "/spending/summary?period=90d", schema: summaryResponseSchema },
  {
    path: "/spending/categories?startDate=2026-01-01&endDate=2026-01-31",
    schema: categoriesResponseSchema,
  },
  { path: "/spending/trends?months=24", schema: trendsResponseSchema },
  {
    path: "/transactions?limit=5&offset=5&category=Groceries&sortBy=amount_desc",
    schema: transactionsResponseSchema,
  },
  { path: "/goals", schema: goalsResponseSchema },
  { path: "/filters", schema: filtersResponseSchema },
];

test.describe("API contract", () => {
  // The API behaves the same on every device; run it once.
  test.skip(({ isMobile }) => isMobile, "device independent");

  for (const { path, schema } of ENDPOINTS) {
    test(`GET ${path} matches its schema`, async ({ request }) => {
      const response = await request.get(`${BASE}${path}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");
      expect(response.headers()["cache-control"]).toBe("private, no-store");

      const result = schema.safeParse(await response.json());
      expect(result.error?.issues ?? []).toEqual([]);
    });
  }

  test("transactions honour limit, offset and category", async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE}/transactions?limit=5&offset=5&category=Groceries`,
    );
    const body = transactionsResponseSchema.parse(await response.json());
    expect(body.transactions).toHaveLength(5);
    expect(body.pagination).toMatchObject({ limit: 5, offset: 5 });
    expect(
      body.transactions.every(
        (transaction) => transaction.category === "Groceries",
      ),
    ).toBe(true);
  });

  for (const query of [
    "/spending/summary?period=2w",
    "/spending/trends?months=25",
    "/transactions?limit=101",
    "/transactions?sortBy=sideways",
    "/transactions?limit=5&limit=6",
  ]) {
    test(`GET ${query} is rejected as invalid`, async ({ request }) => {
      const response = await request.get(`${BASE}${query}`);
      expect(response.status()).toBe(400);
      const body = apiErrorBodySchema.parse(await response.json());
      expect(body.error.code).toBe("invalid_query");
      expect(body.error.issues?.length).toBeGreaterThan(0);
    });
  }

  test("an unknown customer is not found", async ({ request }) => {
    const response = await request.get("/api/customers/99999/profile");
    expect(response.status()).toBe(404);
    const body = apiErrorBodySchema.parse(await response.json());
    expect(body.error.code).toBe("customer_not_found");
  });

  test("echoes a valid request ID and replaces an unsafe one", async ({
    request,
  }) => {
    const sent = await request.get(`${BASE}/profile`, {
      headers: { "X-Request-Id": "trace-123.abc" },
    });
    expect(sent.headers()["x-request-id"]).toBe("trace-123.abc");

    const unsafe = await request.get(`${BASE}/profile`, {
      headers: { "X-Request-Id": "bad id with spaces" },
    });
    const generated = unsafe.headers()["x-request-id"];
    expect(generated).toBeTruthy();
    expect(generated).not.toBe("bad id with spaces");
  });
});
