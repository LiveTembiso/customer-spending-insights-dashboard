import { expect, type Page, test } from "@playwright/test";

const TRANSACTIONS = "**/api/customers/12345/transactions?*";
const CATEGORIES = "**/api/customers/12345/spending/categories?*";

const serverError = {
  status: 500,
  contentType: "application/json",
  body: JSON.stringify({
    error: { code: "internal_error", message: "Something went wrong." },
  }),
};

const list = (page: Page) =>
  page.getByRole("region", { name: "All categories" });

test.describe("when the API fails", () => {
  test("the list explains the failure and recovers on Try again", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expect(list(page)).toHaveAttribute("aria-busy", "false");

    let failures = 0;
    await page.route(TRANSACTIONS, (route) => {
      failures++;
      return route.fulfill(serverError);
    });
    await page.getByRole("button", { name: /Last 7 days/ }).click();

    const alert = list(page).getByRole("alert");
    await expect(alert).toContainText("Your transactions didn't load.", {
      timeout: 15_000,
    });
    // Server errors are retried before giving up.
    expect(failures).toBe(3);

    await page.unrouteAll();
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(alert).toBeHidden();
    await expect(list(page).getByRole("status")).toHaveText(
      /^\d+ transactions? found$/,
    );
  });

  test("a client error is not retried", async ({ page }) => {
    await page.goto("/transactions");
    let requests = 0;
    await page.route(TRANSACTIONS, (route) => {
      requests++;
      return route.fulfill({
        ...serverError,
        status: 400,
        body: JSON.stringify({
          error: { code: "invalid_query", message: "Bad query." },
        }),
      });
    });
    await page.getByRole("button", { name: /Last 7 days/ }).click();

    await expect(list(page).getByRole("alert")).toBeVisible();
    expect(requests).toBe(1);
  });

  test("totals show as not available", async ({ page }) => {
    await page.goto("/transactions");
    await page.route(CATEGORIES, (route) => route.fulfill(serverError));
    await page.getByRole("button", { name: /Last 7 days/ }).click();

    const totals = page.getByRole("region", {
      name: "Totals for these filters",
    });
    await expect(totals.getByText("Not available").first()).toBeAttached({
      timeout: 15_000,
    });
    await expect(totals).toContainText("—");
    await expect(list(page).getByRole("alert")).toHaveCount(0);
  });
});

test.describe("when the API is slow", () => {
  test("keeps the previous results on screen and marks the list busy", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expect(list(page)).toHaveAttribute("aria-busy", "false");
    const before = await list(page).getByRole("button").first().textContent();

    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(TRANSACTIONS, async (route) => {
      await held;
      await route.continue();
    });
    await page.getByRole("button", { name: /Last 90 days/ }).click();

    await expect(list(page)).toHaveAttribute("aria-busy", "true");
    await expect(list(page).getByRole("button").first()).toHaveText(before!);
    await expect(list(page).getByRole("status")).toHaveText("");

    release();
    await expect(list(page)).toHaveAttribute("aria-busy", "false");
    await expect(list(page).getByRole("status")).toHaveText(
      /^\d+ transactions? found$/,
    );
  });
});
