import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";
import { selectOption } from "@/test-utils/select";
import { TransactionDateRange } from "./transaction-date-range";

const selectedRange = () =>
  screen.getByRole("status", { name: "Selected date range" });

const range = { start: "2026-09-21", end: "2026-10-20" };

async function setup() {
  const onApply = vi.fn();
  render(
    <TransactionDateRange
      range={range}
      today="2026-10-20"
      onApply={onApply}
      trigger={<Button>Custom range</Button>}
    />,
  );
  const trigger = screen.getByRole("button", { name: "Custom range" });
  await userEvent.click(trigger);
  return {
    onApply,
    trigger,
    dialog: screen.getByRole("dialog", { name: "Custom date range" }),
  };
}

afterEach(() => vi.restoreAllMocks());

// Each calendar interaction re-renders two month grids, slow in jsdom under load.
describe("TransactionDateRange", { timeout: 15_000 }, () => {
  it("moves day focus with arrow keys and selects the focused date", async () => {
    await setup();
    const day = screen.getByRole("button", { name: /September 22/ });
    day.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /September 23/ })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(selectedRange()).toHaveTextContent(
      "23 Sep 2026 – Choose an end date.",
    );
  });

  it("jumps by month and year in either calendar without changing dates until selected", async () => {
    const { onApply } = await setup();
    await selectOption("Choose the Year", "2020");
    await selectOption("Choose the Month", "February");
    expect(selectedRange()).toHaveTextContent("21 Sep 2026 – 20 Oct 2026");
    await userEvent.click(screen.getByRole("button", { name: /February 10/ }));
    await selectOption("Choose the Year", "2021", 1);
    await selectOption("Choose the Month", "June", 1);
    await userEvent.click(screen.getByRole("button", { name: /June 12/ }));
    expect(onApply).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Apply range" }));
    expect(onApply).toHaveBeenCalledWith({
      start: "2020-02-10",
      end: "2021-06-12",
    });
  });

  it("keeps future months disabled in the current year", async () => {
    await setup();
    screen.getAllByRole("combobox", { name: "Choose the Month" })[1].focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(
      await screen.findByRole("option", { name: "November" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("option", { name: "December" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows two adjacent months and applies a calendar range only on confirmation", async () => {
    const { onApply, dialog } = await setup();
    expect(within(dialog).getAllByRole("grid")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: /September 22/ }));
    expect(selectedRange()).toHaveTextContent(
      "22 Sep 2026 – Choose an end date.",
    );
    expect(screen.getByRole("button", { name: "Apply range" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /October 12/ }));
    expect(onApply).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Apply range" }));
    expect(onApply).toHaveBeenCalledWith({
      start: "2026-09-22",
      end: "2026-10-12",
    });
  });

  it("orders backwards calendar clicks and allows a single-day range", async () => {
    await setup();
    await userEvent.click(screen.getByRole("button", { name: /October 12/ }));
    await userEvent.click(screen.getByRole("button", { name: /September 22/ }));
    expect(selectedRange()).toHaveTextContent("22 Sep 2026 – 12 Oct 2026");
    await userEvent.click(screen.getByRole("button", { name: /October 12/ }));
    await userEvent.click(screen.getByRole("button", { name: /October 12/ }));
    expect(selectedRange()).toHaveTextContent("12 Oct 2026 – 12 Oct 2026");
  });

  it.each(["Cancel", "Close date picker"])(
    "discards edits through %s and reopens the applied dates",
    async (action) => {
      const { onApply, trigger } = await setup();
      await userEvent.click(
        screen.getByRole("button", { name: /September 25/ }),
      );
      await userEvent.click(screen.getByRole("button", { name: action }));
      expect(onApply).not.toHaveBeenCalled();
      await userEvent.click(trigger);
      expect(selectedRange()).toHaveTextContent("21 Sep 2026 – 20 Oct 2026");
    },
  );

  it("uses a bottom sheet on mobile and prevents future calendar selection", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query === "(max-width: 767px)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );
    const { dialog } = await setup();
    expect(dialog).toHaveAttribute("data-slot", "sheet-content");
    expect(dialog).toHaveAttribute("data-side", "bottom");
    expect(screen.getByRole("button", { name: /October 21/ })).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    expect(
      screen.queryByRole("status", { name: "Selected date range" }),
    ).not.toBeInTheDocument();
  });
});
