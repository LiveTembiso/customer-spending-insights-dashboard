import { describe, expect, it, vi } from "vitest";

import * as store from "@/features/transactions/server/store";
import { logger } from "@/lib/logger";

// connection() needs a live request scope, which tests don't have.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

const { GET: health } = await import("./health/route");
const { GET: ready } = await import("./ready/route");

describe("health checks", () => {
  it("reports the process as live", async () => {
    const response = await health();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
  });

  it("reports ready when the data source can serve the default customer", async () => {
    const response = await ready();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready" });
  });

  it.each([undefined, []])(
    "returns an uncached 503 when the data source has no usable customer data (%#)",
    async (records) => {
      vi.spyOn(store, "getCustomerTransactions").mockReturnValue(records);
      const errorLog = vi.spyOn(logger, "error").mockImplementation(() => {});
      const response = await ready();

      expect(response.status).toBe(503);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(await response.json()).toEqual({ status: "not_ready" });
      expect(errorLog).toHaveBeenCalledWith(
        expect.objectContaining({
          route: "/api/ready",
          err: expect.any(Error),
        }),
        "readiness check failed",
      );
    },
  );

  it("reports a data-source exception without leaking internal details into the health response", async () => {
    const error = new Error("Private data source failure");
    vi.spyOn(store, "getCustomerTransactions").mockImplementation(() => {
      throw error;
    });
    const errorLog = vi.spyOn(logger, "error").mockImplementation(() => {});
    const response = await ready();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "not_ready" });
    expect(errorLog).toHaveBeenCalledWith(
      { err: error, route: "/api/ready" },
      "readiness check failed",
    );
  });
});
