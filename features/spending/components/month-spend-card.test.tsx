import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MonthToDate } from "../server/repository";
import { getCurrentMonthToDate } from "../server/current";
import { MonthSpendCard } from "./month-spend-card";

vi.mock("../server/current", () => ({ getCurrentMonthToDate: vi.fn() }));

const month = (changes: MonthToDate["comparedToPrevious"]): MonthToDate => ({
  range: { start: "2026-10-01", end: "2026-10-18" },
  previousRange: { start: "2026-09-01", end: "2026-09-18" },
  totalSpent: 2140.35,
  transactionCount: 31,
  comparedToPrevious: changes,
});

async function renderCard(data: MonthToDate | undefined) {
  vi.mocked(getCurrentMonthToDate).mockResolvedValue(data);
  return render(await MonthSpendCard());
}

const text = (element: HTMLElement) => element.textContent?.replace(/\s/g, " ");

describe("MonthSpendCard", () => {
  it("shows this month's total and transaction count", async () => {
    await renderCard(month({ spentChange: 5.2, transactionChange: -3.1 }));
    const card = screen.getByRole("region", { name: "Total spend this month" });

    expect(text(card)).toContain("R2 140.35");
    expect(text(card)).toContain("31transactions");
  });

  it("says which way each figure moved and against which days", async () => {
    await renderCard(month({ spentChange: 5.2, transactionChange: -3.1 }));

    expect(screen.getByText("vs 1–18 Sep")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByText("up")).toBeInTheDocument();
    expect(screen.getByText("down")).toBeInTheDocument();
    expect(
      screen.getAllByText("compared with 1 to 18 September last month"),
    ).toHaveLength(2);
  });

  it("explains when there's nothing last month to compare with", async () => {
    await renderCard(month({ spentChange: null, transactionChange: null }));

    expect(
      screen.getByText("Nothing spent 1–18 Sep to compare with"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/compared with/)).not.toBeInTheDocument();
  });

  it("renders nothing for an unknown customer", async () => {
    const { container } = await renderCard(undefined);
    expect(container).toBeEmptyDOMElement();
  });
});
