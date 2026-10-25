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

test("monthly spending fills its card at phone, tablet and desktop widths", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.getByRole("region", {
    name: "Monthly spending",
    exact: true,
  });
  await expect(
    card.getByRole("img", { name: /^Monthly spending/ }),
  ).toBeVisible();

  for (const width of [360, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(async () => {
      const layout = await card.evaluate((element) => {
        const content = element.querySelector('[data-slot="card-content"]')!;
        const chart = element.querySelector('[role="img"]')!;
        const svg = chart.querySelector(".recharts-surface")!;
        const cardBox = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const contentBox = content.getBoundingClientRect();
        const chartBox = chart.getBoundingClientRect();
        const svgBox = svg.getBoundingClientRect();
        return {
          availableWidth:
            cardBox.width -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight),
          bottom: cardBox.bottom - parseFloat(style.paddingBottom),
          contentWidth: contentBox.width,
          contentBottom: contentBox.bottom,
          contentHeight: contentBox.height,
          chartWidth: chartBox.width,
          chartHeight: chartBox.height,
          svgWidth: svgBox.width,
          svgHeight: svgBox.height,
        };
      });
      expect(
        Math.abs(layout.contentWidth - layout.availableWidth),
      ).toBeLessThan(1);
      expect(Math.abs(layout.contentBottom - layout.bottom)).toBeLessThan(1);
      expect(Math.abs(layout.chartWidth - layout.contentWidth)).toBeLessThan(1);
      expect(Math.abs(layout.chartHeight - layout.contentHeight)).toBeLessThan(
        1,
      );
      expect(Math.abs(layout.svgWidth - layout.chartWidth)).toBeLessThan(1);
      expect(Math.abs(layout.svgHeight - layout.chartHeight)).toBeLessThan(1);
    }).toPass();
  }
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
