import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useToday } from "./use-today";

afterEach(() => {
  vi.useRealTimers();
});

describe("useToday", () => {
  it("moves on to the next day after midnight in SAST", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T21:59:00Z")); // 23:59 SAST
    const { result } = renderHook(() => useToday("2026-10-20"));
    expect(result.current).toBe("2026-10-20");

    act(() => {
      vi.advanceTimersByTime(2 * 60_000);
    });
    expect(result.current).toBe("2026-10-21");
  });
});
