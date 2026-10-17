import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { apiGet, customerPath, withQuery } from "./client";
import { ApiError } from "./errors";

const schema = z.object({ total: z.number() });

function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("paths", () => {
  it("encodes the customer id", () => {
    expect(customerPath("a/b", "goals")).toBe("/api/customers/a%2Fb/goals");
  });

  it("skips undefined query values", () => {
    expect(
      withQuery("/x", { limit: 20, q: undefined, sortBy: "date_asc" }),
    ).toBe("/x?limit=20&sortBy=date_asc");
    expect(withQuery("/x", {})).toBe("/x");
  });
});

describe("apiGet", () => {
  it("returns the validated body", async () => {
    const fetchMock = mockFetch({ total: 42 });

    await expect(apiGet("/x", schema, { query: { a: 1 } })).resolves.toEqual({
      total: 42,
    });
    expect(fetchMock).toHaveBeenCalledWith("/x?a=1", expect.anything());
  });

  it("throws the API's error details", async () => {
    mockFetch(
      { error: { code: "customer_not_found", message: "Customer not found." } },
      404,
    );

    const error = await apiGet("/x", schema).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      code: "customer_not_found",
      isRetryable: false,
    });
  });

  it("keeps the details of an error code it doesn't know yet", async () => {
    mockFetch({ error: { code: "rate_limited", message: "Slow down." } }, 429);

    await expect(apiGet("/x", schema)).rejects.toMatchObject({
      status: 429,
      code: "rate_limited",
      message: "Slow down.",
    });
  });

  it("rejects a response that breaks the contract", async () => {
    mockFetch({ total: "lots" });

    await expect(apiGet("/x", schema)).rejects.toMatchObject({
      code: "invalid_response",
      isRetryable: false,
    });
  });

  it("handles an error response that isn't JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Bad gateway", { status: 502 })),
    );

    await expect(apiGet("/x", schema)).rejects.toMatchObject({
      status: 502,
      code: "unexpected_status",
      isRetryable: true,
    });
  });

  it("reports a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    await expect(apiGet("/x", schema)).rejects.toMatchObject({
      status: 0,
      code: "network_error",
      isRetryable: true,
    });
  });

  it("rethrows an abort that happens while reading the body", async () => {
    const controller = new AbortController();
    const abort = new DOMException("Aborted", "AbortError");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          controller.abort();
          throw abort;
        },
      })),
    );

    await expect(
      apiGet("/x", schema, { signal: controller.signal }),
    ).rejects.toBe(abort);
  });
});
