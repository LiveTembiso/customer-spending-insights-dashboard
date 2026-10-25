import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeTransaction } from "@/test-utils/fixtures";
import { downloadCsv, fetchAllTransactions } from "../export";
import type { Transaction } from "../schemas";
import { ExportButton } from "./export-button";

vi.mock("../export", () => ({
  downloadCsv: vi.fn(),
  fetchAllTransactions: vi.fn(),
}));

const props = {
  customerId: "12345",
  query: {
    category: "Groceries" as const,
    limit: 10,
    offset: 0,
    sortBy: "date_desc" as const,
    q: undefined,
  },
  range: { start: "2026-10-01", end: "2026-10-20" },
};
beforeEach(() => vi.clearAllMocks());

describe("ExportButton", () => {
  it("prevents export when there are no results", async () => {
    render(<ExportButton {...props} disabled />);
    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(fetchAllTransactions).not.toHaveBeenCalled();
  });

  it("keeps focus while exporting and prevents duplicate requests", async () => {
    const pending = Promise.withResolvers<Transaction[]>();
    vi.mocked(fetchAllTransactions).mockReturnValue(pending.promise);
    render(<ExportButton {...props} />);
    const button = screen.getByRole("button", { name: "Export CSV" });
    await userEvent.click(button);
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(button);
    expect(fetchAllTransactions).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve([makeTransaction()]));
    expect(downloadCsv).toHaveBeenCalledWith(
      [makeTransaction()],
      "transactions-2026-10-01-to-2026-10-20.csv",
    );
    expect(button).not.toHaveAttribute("aria-disabled", "true");
  });

  it("announces a failed export and allows retry", async () => {
    vi.mocked(fetchAllTransactions)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([makeTransaction()]);
    render(<ExportButton {...props} />);
    const button = screen.getByRole("button", { name: "Export CSV" });
    await userEvent.click(button);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Export failed. Try again.",
    );
    await userEvent.click(button);
    await waitFor(() => expect(downloadCsv).toHaveBeenCalledOnce());
    expect(screen.getByRole("status")).not.toHaveTextContent("Export failed");
  });

  it("cancels an in-flight export on unmount", async () => {
    const pending = Promise.withResolvers<Transaction[]>();
    vi.mocked(fetchAllTransactions).mockReturnValue(pending.promise);
    const { unmount } = render(<ExportButton {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    const signal = vi.mocked(fetchAllTransactions).mock.calls[0][2];
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => pending.reject(new Error("aborted")));
    expect(downloadCsv).not.toHaveBeenCalled();
  });
});
