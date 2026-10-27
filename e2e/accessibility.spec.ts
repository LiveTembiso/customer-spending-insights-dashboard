import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const PAGES = [
  { path: "/", heading: /^Understand your\s*spending$/ },
  { path: "/transactions", heading: "Transactions" },
  { path: "/insights", heading: "Insights" },
];

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page, disabledRules: string[] = []) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .disableRules(disabledRules)
    .analyze();
  expect(
    violations.map(({ id, help, nodes }) => ({
      id,
      help,
      targets: nodes.map((node) => node.target.join(" ")),
    })),
  ).toEqual([]);
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished)),
  );
}

test.describe("accessibility", () => {
  for (const { path, heading } of PAGES) {
    test(`${path} has no WCAG violations`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
      await settle(page);
      await expectNoViolations(page);
    });
  }

  test("transaction details have no WCAG violations", async ({ page }) => {
    await page.goto("/transactions");
    await page
      .getByRole("region", { name: "All categories" })
      .getByRole("button")
      .filter({ visible: true })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Transaction details" }),
    ).toBeVisible();
    await settle(page);
    await expectNoViolations(page);
  });

  test("the custom date picker has no WCAG violations", async ({ page }) => {
    await page.goto("/transactions");
    await page
      .getByRole("button", { name: "Custom range", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Custom date range" }),
    ).toBeVisible();
    await settle(page);
    // react-day-picker names day "1" as "Tuesday, September 1st, 2026".
    await expectNoViolations(page, ["label-content-name-mismatch"]);
  });

  test("charts and controls stay visible in forced colours", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    await settle(page);

    const bars = page
      .getByRole("region", { name: "Monthly spending", exact: true })
      .locator(".recharts-bar-rectangle path");
    await expect(bars.first()).toBeVisible();
    const fill = await bars
      .first()
      .evaluate((bar) => getComputedStyle(bar).fill);
    expect(fill).not.toBe("none");

    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement!);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });
    expect(outline.style).not.toBe("none");
    expect(parseFloat(outline.width)).toBeGreaterThan(0);
  });
});
