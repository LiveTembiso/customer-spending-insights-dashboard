import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Goal } from "@/features/goals/schemas";

import type { Transaction } from "../schemas";
import {
  TransactionDetailsDialog,
  TransactionDetailsPanel,
} from "./transaction-details";

const transaction: Transaction = {
  id: "txn_001",
  date: "2026-10-20T06:14:00Z",
  merchant: "Pick n Pay",
  category: "Groceries",
  amount: 245.8,
  description: "Weekly groceries",
  paymentMethod: "Credit Card",
  icon: "shopping-cart",
  categoryColor: "#FF6B6B",
};

beforeEach(() => {
  // jsdom doesn't implement native modal opening and closing.
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

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
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps content clicks open and dismisses on a backdrop click", async () => {
    const onClose = vi.fn();
    render(
      <TransactionDetailsDialog transaction={transaction} onClose={onClose} />,
    );
    await userEvent.click(screen.getByText("Weekly groceries"));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("dialog"));
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
      const goal: Goal = {
        id: "goal_001",
        category: "Groceries",
        monthlyBudget: 1000,
        currentSpent: status === "exceeded" ? 1120 : 500,
        percentageUsed: status === "exceeded" ? 112 : 50,
        daysRemaining: 10,
        status,
      };
      render(
        <TransactionDetailsPanel
          id="details"
          transaction={transaction}
          goal={goal}
          onClose={vi.fn()}
        />,
      );
      const bar = screen.getByRole("img", {
        name: /percent of the groceries budget used/,
      });
      expect(bar.firstElementChild).toHaveStyle({
        width: status === "exceeded" ? "100%" : "50%",
      });
      expect(screen.getByText(/This purchase is 24.6% of your/)).toBeVisible();
      expect(
        screen.getByRole("link", { name: "View groceries goal" }),
      ).toHaveAttribute("href", "/goals");
    },
  );
});
