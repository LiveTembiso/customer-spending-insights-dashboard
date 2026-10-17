import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { apiErrorBodySchema } from "./errors";
import { customerRoute } from "./route";

const params = (customerId = "12345") => ({
  params: Promise.resolve({ customerId }),
});

const route = customerRoute({
  route: "/test",
  query: z.object({ limit: z.coerce.number().int().min(1).default(20) }),
  handler: ({ customerId, query }) =>
    customerId === "12345" ? { limit: query.limit } : undefined,
});

async function errorOf(response: Response) {
  return apiErrorBodySchema.parse(await response.json()).error;
}

describe("customerRoute", () => {
  it("passes the parsed query to the handler", async () => {
    const response = await route(new Request("http://test/?limit=5"), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ limit: 5 });
  });

  it("treats empty query values as unset", async () => {
    const response = await route(new Request("http://test/?limit="), params());

    expect(await response.json()).toEqual({ limit: 20 });
  });

  it("rejects invalid query values with the failing fields", async () => {
    const response = await route(new Request("http://test/?limit=0"), params());

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toMatchObject({
      code: "invalid_query",
      issues: [{ path: "limit" }],
    });
  });

  it("rejects a repeated query key instead of picking one", async () => {
    const response = await route(
      new Request("http://test/?limit=5&limit=10"),
      params(),
    );

    expect(response.status).toBe(400);
    expect((await errorOf(response)).issues).toEqual([
      { path: "limit", message: "Expected a single value" },
    ]);
  });

  it("returns 404 for an unknown customer", async () => {
    const response = await route(new Request("http://test/"), params("nope"));

    expect(response.status).toBe(404);
    expect((await errorOf(response)).code).toBe("customer_not_found");
  });

  it("returns 500 without leaking the error", async () => {
    const failing = customerRoute({
      route: "/test",
      handler: () => {
        throw new Error("database password is hunter2");
      },
    });

    const response = await failing(new Request("http://test/"), params());
    const error = await errorOf(response);

    expect(response.status).toBe(500);
    expect(error.code).toBe("internal_error");
    expect(error.message).not.toContain("hunter2");
  });

  it("echoes the caller's request id and disables caching", async () => {
    const response = await route(
      new Request("http://test/", { headers: { "x-request-id": "abc-123" } }),
      params(),
    );

    expect(response.headers.get("X-Request-Id")).toBe("abc-123");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it.each(["", "a".repeat(65), "id with spaces; and=punctuation"])(
    "replaces an unsafe request id %j",
    async (header) => {
      const response = await route(
        new Request("http://test/", { headers: { "x-request-id": header } }),
        params(),
      );

      expect(response.headers.get("X-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
    },
  );

  it("generates a request id when none is sent", async () => {
    const uuid = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000000");

    const response = await route(new Request("http://test/"), params());

    expect(uuid).toHaveBeenCalled();
    expect(response.headers.get("X-Request-Id")).toBe(
      "00000000-0000-4000-8000-000000000000",
    );
  });
});
