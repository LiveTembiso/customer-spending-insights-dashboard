import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Goal } from "@/features/goals/schemas";
import { useState } from "react";
import { makeGoal, makeTransaction } from "@/test-utils/fixtures";

import type { Transaction } from "../schemas";
import {
  TransactionDetailsDialog,
  TransactionDetailsPanel,
} from "./transaction-details";

const transaction: Transaction = makeTransaction();

describe("TransactionDetailsDialog", () => {
  it("opens for a selected purchase and closes when the selection clears", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <TransactionDetailsDialog transaction={transaction} onClose={onClose} />,
    );
    expect(
      screen.getByRole("dialog", { name: "Transaction details" }),
    ).toBeVisible();
    expect(screen.getByText("−R245.80")).toBeVisible();
    rerender(<TransactionDetailsDialog onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps content clicks open and dismisses on a backdrop click", async () => {
    const onClose = vi.fn();
    function Selection() {
      const [selected, setSelected] = useState<typeof transaction | undefined>(
        transaction,
      );
      return (
        <TransactionDetailsDialog
          transaction={selected}
          onClose={() => {
            onClose();
            setSelected(undefined);
          }}
        />
      );
    }
    render(<Selection />);
    await userEvent.click(screen.getByText("Weekly groceries"));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(
      document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!,
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses from the close button", async () => {
    const onClose = vi.fn();
    render(
      <TransactionDetailsDialog transaction={transaction} onClose={onClose} />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Close details" }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("TransactionDetailsPanel", () => {
  it("focuses the heading and closes on Escape without consuming other keys", () => {
    const onClose = vi.fn();
    render(
      <TransactionDetailsPanel
        id="details"
        transaction={transaction}
        onClose={onClose}
      />,
    );
    const panel = screen.getByRole("complementary", {
      name: "Transaction details",
    });
    expect(within(panel).getByRole("heading")).toHaveFocus();
    fireEvent.keyDown(panel, { key: "ArrowDown" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it.each(["on_track", "exceeded"] as const)(
    "describes the goal impact for %s budgets",
    (status) => {
      const goal: Goal = makeGoal({
        currentSpent: status === "exceeded" ? 1120 : 500,
        percentageUsed: status === "exceeded" ? 112 : 50,
        status,
      });
      render(
        <TransactionDetailsPanel
          id="details"
          transaction={transaction}
          goal={goal}
          onClose={vi.fn()}
        />,
      );
      const bar = screen.getByRole("progressbar", {
        name: "Groceries budget used",
      });
      expect(bar).toHaveAttribute(
        "aria-valuenow",
        status === "exceeded" ? "100" : "50",
      );
      expect(bar).toHaveAttribute(
        "aria-valuetext",
        `${status === "exceeded" ? 112 : 50} percent of the groceries budget used`,
      );
      expect(screen.getByText(/This purchase is 24.6% of your/)).toBeVisible();
      expect(
        screen.getByRole("link", { name: "View groceries goal" }),
      ).toHaveAttribute("href", "/goals");
    },
  );
});
