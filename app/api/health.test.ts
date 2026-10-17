import { describe, expect, it, vi } from "vitest";

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
});
