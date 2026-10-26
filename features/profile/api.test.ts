import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { makeProfile } from "@/test-utils/fixtures";
import { createTestQueryClient } from "@/test-utils/query-client";

import { profileQuery } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("profileQuery", () => {
  it("fetches an encoded customer URL and keeps accounts in separate caches", async () => {
    const profile = makeProfile({ customerId: "customer/a" });
    const fetch = vi.fn(async () => Response.json(profile));
    vi.stubGlobal("fetch", fetch);
    const client = createTestQueryClient();

    expect(await client.fetchQuery(profileQuery("customer/a"))).toEqual(
      profile,
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/customers/customer%2Fa/profile",
      expect.objectContaining({
        headers: { Accept: "application/json" },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(
      client.getQueryData(profileQuery("customer/b").queryKey),
    ).toBeUndefined();
  });

  it("rejects a successful HTTP response that violates the profile contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ...makeProfile(), currency: "USD" })),
    );
    await expect(
      createTestQueryClient().fetchQuery(profileQuery("12345")),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("preserves a missing customer's API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            error: {
              code: "customer_not_found",
              message: "Customer not found.",
            },
          },
          { status: 404 },
        ),
      ),
    );
    await expect(
      createTestQueryClient().fetchQuery(profileQuery("missing")),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
