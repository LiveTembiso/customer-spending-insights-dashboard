import { expect, test } from "@playwright/test";

test.describe("goals", () => {
  test("shows each goal with its progress", async ({ page }) => {
    await page.goto("/goals");

    await expect(
      page.getByRole("heading", { level: 1, name: "Spending goals" }),
    ).toBeVisible();
    for (const category of ["Groceries", "Entertainment", "Dining"]) {
      await expect(
        page
          .getByRole("link", { name: new RegExp(`^${category}`) })
          .or(page.getByRole("heading", { level: 2, name: category })),
      ).toBeVisible();
    }
  });

  test("opens this month's purchases for a goal", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/goals");
    // Groceries is a card when it needs attention and a list row otherwise.
    await page
      .getByRole("link", { name: /^(See purchases in groceries|Groceries\b)/ })
      .click();

    await expect(page).toHaveURL(
      /\/transactions\?category=Groceries&period=custom&from=\d{4}-\d{2}-01&to=/,
    );
    if (isMobile) {
      await expect(
        page.getByRole("combobox", { name: "Category" }),
      ).toHaveValue("Groceries");
    } else {
      await expect(
        page.getByRole("button", {
          name: "Groceries",
          exact: true,
          pressed: true,
        }),
      ).toBeVisible();
    }
  });
});
