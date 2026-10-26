import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("pino", () => ({ default: vi.fn(() => ({})) }));
vi.mock("./env", () => ({ env: { LOG_LEVEL: "warn" } }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("logger configuration", () => {
  it.each(["production", "test"])(
    "uses structured output without a development transport in %s",
    async (mode) => {
      vi.stubEnv("NODE_ENV", mode);
      vi.resetModules();
      const { default: pino } = await import("pino");
      await import("./logger");
      expect(pino).toHaveBeenLastCalledWith({ level: "warn" });
    },
  );

  it("uses the readable transport only during local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { default: pino } = await import("pino");
    await import("./logger");
    expect(pino).toHaveBeenLastCalledWith({
      level: "warn",
      transport: { target: "pino-pretty" },
    });
  });
});
