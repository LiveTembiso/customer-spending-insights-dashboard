import { describe, expect, it } from "vitest";

import { ApiError } from "./api/errors";
import { makeQueryClient } from "./query-client";

const retry = makeQueryClient().getDefaultOptions().queries!.retry as (
  failureCount: number,
  error: unknown,
) => boolean;

describe("query retry policy", () => {
  it.each([
    [new ApiError(500, "internal_error", ""), true],
    [new ApiError(0, "network_error", ""), true],
    [new Error("unexpected"), true],
    [new ApiError(404, "customer_not_found", ""), false],
    [new ApiError(400, "invalid_query", ""), false],
    [new ApiError(200, "invalid_response", ""), false],
  ])("retries %o: %s", (error, expected) => {
    expect(retry(0, error)).toBe(expected);
  });

  it("gives up after two retries", () => {
    expect(retry(2, new ApiError(500, "internal_error", ""))).toBe(false);
  });
});
