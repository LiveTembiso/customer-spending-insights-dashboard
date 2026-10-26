import { afterEach, describe, expect, it, vi } from "vitest";

import { makeProfile } from "@/test-utils/fixtures";

import { getCurrentProfile } from "./current";
import { getProfile } from "./repository";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "customer-test" },
}));
vi.mock("./repository", () => ({ getProfile: vi.fn() }));
afterEach(() => vi.useRealTimers());

describe("getCurrentProfile", () => {
  it("uses the configured account and request time when retrieving lifetime spending", async () => {
    const now = new Date("2026-10-20T12:00:00Z");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    const profile = makeProfile({ customerId: "customer-test" });
    vi.mocked(getProfile).mockReturnValue(profile);
    expect(await getCurrentProfile()).toBe(profile);
    expect(getProfile).toHaveBeenCalledWith("customer-test", now);
  });

  it("returns unavailable for an account that cannot be loaded", async () => {
    vi.mocked(getProfile).mockReturnValue(undefined);
    expect(await getCurrentProfile()).toBeUndefined();
  });
});
