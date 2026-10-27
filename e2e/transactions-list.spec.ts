import { expect, type Page, test } from "@playwright/test";

import { selectOption } from "./helpers/select";

interface Transaction {
  date: string;
  merchant: string;
  amount: number;
}

const list = (page: Page) =>
  page.getByRole("region", { name: "All categories" });

test.describe("transaction list", () => {
  test("pages forward and back, with the page in the URL", async ({ page }) => {
    await page.goto("/transactions");
    const pages = page.getByRole("navigation", { name: "Pages" });
    const previous = pages.getByRole("button", { name: "Previous" });
    const next = pages.getByRole("button", { name: "Next" });

    await expect(previous).toBeDisabled();
    await expect(pages.getByText(/^Showing 1–10 of \d+$/)).toBeVisible();

    await next.click();
    await expect(page).toHaveURL(/\?page=2$/);
    await expect(pages.getByText(/^Showing 11–20 of \d+$/)).toBeVisible();
    await expect(pages.getByText(/^Page 2 of \d+$/)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "All categories" }),
    ).toBeFocused();

    await previous.click();
    await expect(page).toHaveURL(/\/transactions$/);
    await expect(pages.getByText(/^Showing 1–10 of \d+$/)).toBeVisible();
  });

  test("the last page disables Next", async ({ page }) => {
    await page.goto("/transactions");
    const pages = page.getByRole("navigation", { name: "Pages" });
    const label = await pages.getByText(/^Page 1 of \d+$/).textContent();
    const last = Number(label!.match(/of (\d+)$/)![1]);

    await page.goto(`/transactions?page=${last}`);
    await expect(pages.getByRole("button", { name: "Next" })).toBeDisabled();
    await expect(pages.getByRole("button", { name: "Previous" })).toBeEnabled();
  });

  for (const { option, sortBy, compare } of [
    {
      option: "Oldest first",
      sortBy: "date_asc",
      compare: (a: Transaction, b: Transaction) => a.date.localeCompare(b.date),
    },
    {
      option: "Highest amount",
      sortBy: "amount_desc",
      compare: (a: Transaction, b: Transaction) => b.amount - a.amount,
    },
    {
      option: "Lowest amount",
      sortBy: "amount_asc",
      compare: (a: Transaction, b: Transaction) => a.amount - b.amount,
    },
  ]) {
    test(`sorts by ${option.toLowerCase()}`, async ({ page }) => {
      await page.goto("/transactions");
      const response = page.waitForResponse(
        (res) =>
          res.url().includes("/transactions?") &&
          res.url().includes(`sortBy=${sortBy}`),
      );
      await selectOption(page, "Sort by", option);
      await expect(page).toHaveURL(new RegExp(`sort=${sortBy}`));

      const { transactions } = (await (await response).json()) as {
        transactions: Transaction[];
      };
      expect(transactions.length).toBeGreaterThan(1);
      expect(transactions).toEqual([...transactions].sort(compare));

      await expect(list(page)).toHaveAttribute("aria-busy", "false");
      const rows = list(page).getByRole("button").filter({ visible: true });
      for (const [index, { merchant }] of transactions.entries()) {
        await expect(rows.nth(index)).toContainText(merchant);
      }
    });
  }

  test("a search with no results offers to clear the filters", async ({
    page,
  }) => {
    await page.goto("/transactions?q=zzzzzz");

    await expect(
      list(page).getByText("No transactions match these filters."),
    ).toBeVisible();
    await expect(list(page).getByRole("status")).toHaveText(
      "0 transactions found",
    );

    await list(page).getByRole("button", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/transactions$/);
    await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue(
      "",
    );
    await expect(
      page
        .getByRole("navigation", { name: "Pages" })
        .getByText(/^Showing 1–10/),
    ).toBeVisible();
  });

  test("totals hide spend while searching", async ({ page }) => {
    await page.goto("/transactions");
    const totals = page.getByRole("region", {
      name: "Totals for these filters",
    });
    await expect(totals.getByText("Spent", { exact: true })).toBeVisible();

    await page.getByRole("searchbox", { name: "Search" }).fill("Netflix");
    await expect(page).toHaveURL(/q=Netflix/);
    await expect(totals.getByText("Spent", { exact: true })).toHaveCount(0);
    await expect(totals.getByText(/Average/)).toHaveCount(0);
  });
});
