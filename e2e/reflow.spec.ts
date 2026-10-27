import { expect, type Page, test } from "@playwright/test";

const PAGES = ["/", "/transactions", "/goals", "/insights"];

async function expectNoSidewaysScroll(page: Page, path: string) {
  await expect(async () => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);
  }).toPass();
}

test.describe("reflow at 320px", () => {
  // 320 CSS pixels is a 1280px window at 400% zoom (WCAG 1.4.10).
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of PAGES) {
    test(`${path} fits without scrolling sideways`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoSidewaysScroll(page, path);

      const nav = page.getByRole("navigation", { name: "Main" });
      for (const link of await nav.getByRole("link").all()) {
        const box = await link.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(320);
      }
    });
  }

  test("transaction filters and details still work", async ({ page }) => {
    await page.goto("/transactions");
    await page.getByRole("button", { name: /Last 7 days/ }).click();
    await expect(page).toHaveURL(/period=7d/);

    await page
      .getByRole("region", { name: "All categories" })
      .getByRole("button")
      .filter({ visible: true })
      .first()
      .click();
    const details = page.getByRole("dialog");
    await expect(details).toBeVisible();
    const box = await details.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    await expectNoSidewaysScroll(page, "/transactions details");
  });
});
