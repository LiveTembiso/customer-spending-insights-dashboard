import { readFile } from "node:fs/promises";

import { expect, type Page, test } from "@playwright/test";

import { expectCategorySelected } from "./helpers/transactions";

const visibleRowButtons = (page: Page) =>
  page
    .getByRole("region", { name: /All categories|Groceries/ })
    .getByRole("button")
    .filter({ visible: true });

test.describe("transactions", () => {
  test("filters by category and keeps it in the link", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/transactions");
    if (isMobile) {
      await page
        .getByRole("combobox", { name: "Category" })
        .selectOption("Groceries");
    } else {
      await page
        .getByRole("button", { name: "Groceries", exact: true })
        .click();
    }

    await expect(page).toHaveURL(/category=Groceries/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Groceries" }),
    ).toBeVisible();

    await page.reload();
    await expectCategorySelected(page, "Groceries", isMobile);
  });

  test("changes the period", async ({ page }) => {
    await page.goto("/transactions");
    await page.getByRole("button", { name: "Last 7 days" }).click();

    await expect(page).toHaveURL(/period=7d/);
    await expect(page.getByText(/^Last 7 days · /)).toBeVisible();
  });

  test("searches by merchant", async ({ page }) => {
    await page.goto("/transactions?period=1y");
    await page.getByRole("searchbox", { name: "Search" }).fill("Netflix");

    await expect(page).toHaveURL(/q=Netflix/);
    await expect(page.getByText(/matching “Netflix”/)).toBeVisible();
    const merchants = page
      .getByRole("button", { name: /Netflix/ })
      .filter({ visible: true });
    await expect(merchants.first()).toBeVisible();
    await expect(page.getByText("Spent", { exact: true })).toHaveCount(0);
  });

  test("opens a transaction's details", async ({ page }) => {
    await page.goto("/transactions");
    await visibleRowButtons(page).first().click();

    const details = page.getByRole("heading", { name: "Transaction details" });
    await expect(details).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
  });
});

test.describe("transactions on a wide screen", () => {
  test.skip(({ isMobile }) => isMobile, "desktop layout only");
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows details beside the list and returns focus on Escape", async ({
    page,
  }) => {
    await page.goto("/transactions");
    const row = page.locator("table tbody button").first();
    await row.click();

    const details = page.getByRole("complementary", {
      name: "Transaction details",
    });
    await expect(details).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
    await expect(row).toBeFocused();
  });

  test("exports the filtered transactions as CSV", async ({ page }) => {
    await page.goto("/transactions?category=Groceries");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();

    const file = await download;
    expect(file.suggestedFilename()).toMatch(
      /^transactions-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/,
    );
    const text = await readFile(await file.path(), "utf8");
    const lines = text.trim().split("\r\n");
    expect(lines[0]).toContain("Date,Time,Merchant");
    expect(lines.slice(1).every((line) => line.includes(",Groceries,"))).toBe(
      true,
    );
  });
});
