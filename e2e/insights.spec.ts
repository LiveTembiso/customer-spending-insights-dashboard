import { expect, test } from "@playwright/test";
import { selectOption } from "./helpers/select";

test.describe("insights", () => {
  test("shows spending for the period, by month and by category", async ({
    page,
  }) => {
    await page.goto("/insights");

    await expect(
      page.getByRole("heading", { level: 1, name: "Insights" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Compared with the previous 30 days" }),
    ).toContainText("Total spent");
    await expect(
      page.getByRole("img", { name: /^Total spent by month/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Category breakdown" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "What stands out" }),
    ).toBeVisible();
  });

  test("changes the period and chart without leaving the page", async ({
    page,
  }) => {
    await page.goto("/insights");

    await page.getByRole("button", { name: "90 days" }).click();
    await expect(page).toHaveURL(/\?period=90d$/);
    await expect(
      page.getByRole("region", { name: "Compared with the previous 90 days" }),
    ).toBeVisible();

    await selectOption(page, "Show", "Transaction count");
    await expect(page).toHaveURL(/metric=count/);
    await selectOption(page, "Months", "12");
    await expect(page).toHaveURL(/\?period=90d&months=12&metric=count$/);
    await expect(
      page.getByRole("img", { name: /^Transaction count by month/ }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("button", { name: "90 days", pressed: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Months", { exact: true })).toHaveText("12");
  });
});
