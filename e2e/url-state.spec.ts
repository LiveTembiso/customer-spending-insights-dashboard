import { expect, type Page, test } from "@playwright/test";

import { expectCategorySelected } from "./helpers/transactions";

// Role queries skip the hidden copies of earlier views that Next keeps mounted.
const pages = (page: Page) => page.getByRole("navigation", { name: "Pages" });
const list = (page: Page) =>
  page.getByRole("region", { name: /categories|Groceries/ });

test.describe("state in the URL", () => {
  test("a shared transactions link opens with every filter applied", async ({
    page,
  }) => {
    await page.goto(
      "/transactions?q=a&category=Groceries&period=1y&sort=amount_desc&page=2",
    );

    await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue(
      "a",
    );
    await expectCategorySelected(page, "Groceries");
    await expect(
      page.getByRole("button", { name: /Last year/, pressed: true }),
    ).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Sort by" })).toHaveText(
      "Highest amount",
    );
    await expect(pages(page).getByText(/^Page 2 of \d+$/)).toBeVisible();
    await expect(
      list(page).getByText(/^Last year · .* · matching “a”$/),
    ).toBeVisible();
  });

  test("Back and Forward step through filter changes", async ({ page }) => {
    await page.goto("/transactions");
    await page.getByRole("button", { name: /Last 7 days/ }).click();
    await expect(page).toHaveURL(/\?period=7d$/);
    await page.getByRole("button", { name: /Last 90 days/ }).click();
    await expect(page).toHaveURL(/\?period=90d$/);

    await page.goBack();
    await expect(page).toHaveURL(/\?period=7d$/);
    await expect(
      page.getByRole("button", { name: /Last 7 days/, pressed: true }),
    ).toBeVisible();
    await expect(list(page).getByText(/^Last 7 days · /)).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/transactions$/);
    await expect(list(page).getByText(/^Last 30 days · /)).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\?period=7d$/);
    await expect(list(page).getByText(/^Last 7 days · /)).toBeVisible();
  });

  test("invalid transaction filters fall back to defaults", async ({
    page,
  }) => {
    const response = await page.goto(
      "/transactions?period=xyz&page=-3&sort=sideways&category=Nope&from=2026-99-01",
    );
    expect(response?.ok()).toBe(true);

    await expect(
      page.getByRole("button", { name: /Last 30 days/, pressed: true }),
    ).toBeVisible();
    await expectCategorySelected(page, "All categories");
    await expect(page.getByRole("combobox", { name: "Sort by" })).toHaveText(
      "Newest first",
    );
    await expect(pages(page).getByText(/^Page 1 of \d+$/)).toBeVisible();
  });

  test("insights settings open from a link and survive Back", async ({
    page,
  }) => {
    await page.goto("/insights?period=1y&months=24&metric=count");
    await expect(
      page.getByRole("img", { name: /^Transaction count by month/ }),
    ).toBeVisible();
    await expect(page.getByLabel("Months", { exact: true })).toHaveText("24");

    await page.getByRole("button", { name: "7 days" }).click();
    await expect(page).toHaveURL(/period=7d/);
    await page.goBack();
    await expect(
      page.getByRole("button", { name: "1 year", pressed: true }),
    ).toBeVisible();
  });

  test("invalid insights settings fall back to defaults", async ({ page }) => {
    const response = await page.goto("/insights?period=2w&months=7&metric=x");
    expect(response?.ok()).toBe(true);

    await expect(
      page.getByRole("button", { name: "30 days", pressed: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: /^Total spent by month/ }),
    ).toBeVisible();
  });
});
