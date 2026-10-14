import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("applies defaults when optional values are missing or blank", () => {
    expect(parseEnv({ LOG_LEVEL: "" })).toEqual({
      NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "12345",
      LOG_LEVEL: "info",
      MOCK_DATA_SEED: 20240916,
      MOCK_API_LATENCY_MS: 0,
    });
  });

  it("coerces numeric values", () => {
    const env = parseEnv({
      NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "12345",
      MOCK_DATA_SEED: "42",
      MOCK_API_LATENCY_MS: "250",
    });

    expect(env.MOCK_DATA_SEED).toBe(42);
    expect(env.MOCK_API_LATENCY_MS).toBe(250);
  });

  it("rejects a whitespace-only customer id", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "  " })).toThrow(
      /NEXT_PUBLIC_DEFAULT_CUSTOMER_ID/,
    );
  });

  it("rejects an unknown log level", () => {
    expect(() =>
      parseEnv({ NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "12345", LOG_LEVEL: "loud" }),
    ).toThrow(/LOG_LEVEL/);
  });

  it("rejects a negative latency", () => {
    expect(() =>
      parseEnv({
        NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "12345",
        MOCK_API_LATENCY_MS: "-1",
      }),
    ).toThrow(/MOCK_API_LATENCY_MS/);
  });
});
