import { expect, test } from "@playwright/test";

test("home page responds", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page.locator("main")).toBeVisible();
});

for (const width of [360, 768]) {
  test(`dashboard pages fit a ${width}px screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });

    for (const path of ["/", "/transactions", "/goals", "/insights"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(async () => {
        const fits = await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        );
        expect(fits, `${path} should fit without horizontal scrolling`).toBe(
          true,
        );
      }).toPass();
    }
  });
}

test("opens spending insights from the overview", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("region", { name: "Where it went" })
    .getByRole("link", { name: "View details of spending by category" })
    .click();

  await expect(page).toHaveURL(/\/insights$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Insights" }),
  ).toBeVisible();
});

test("custom date fields fit side by side on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Custom range", exact: true }).click();

  const start = await page.getByLabel("From", { exact: true }).boundingBox();
  const end = await page.getByLabel("To", { exact: true }).boundingBox();
  expect(start).not.toBeNull();
  expect(end).not.toBeNull();
  expect(start!.y).toBe(end!.y);
  expect(end!.x).toBeGreaterThan(start!.x + start!.width);
  expect(end!.x + end!.width).toBeLessThanOrEqual(360);
});
