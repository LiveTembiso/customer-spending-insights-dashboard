import { readFile } from "node:fs/promises";

import { expect, type Page, test } from "@playwright/test";

import { selectOption } from "./helpers/select";
import { expectCategorySelected } from "./helpers/transactions";

const visibleRowButtons = (page: Page) =>
  page
    .getByRole("region", { name: /All categories|Groceries/ })
    .getByRole("button")
    .filter({ visible: true });

test.describe("transactions", () => {
  test("filters by category and keeps it in the link", async ({ page }) => {
    await page.goto("/transactions");
    await selectOption(page, "Category", "Groceries");

    await expect(page).toHaveURL(/category=Groceries/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Groceries" }),
    ).toBeVisible();

    await page.reload();
    await expectCategorySelected(page, "Groceries");
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

  test("selects a two-month range, applies it and returns focus", async ({
    page,
  }) => {
    await page.goto(
      "/transactions?period=custom&from=2026-09-21&to=2026-10-20",
    );
    const originalUrl = page.url();
    const trigger = page.getByRole("button", {
      name: "Custom range",
      exact: true,
    });
    await trigger.click();
    const picker = page.getByRole("dialog", { name: "Custom date range" });
    await expect(picker).toBeVisible();
    const calendars = picker.getByRole("grid");
    await expect(calendars).toHaveCount(2);
    await expect(picker).not.toHaveAttribute("data-starting-style", "");
    await picker.evaluate(async (element) => {
      await Promise.all(
        element.getAnimations().map((animation) => animation.finished),
      );
    });
    const bounds = await picker.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
    const firstMonth = await calendars.nth(0).boundingBox();
    const secondMonth = await calendars.nth(1).boundingBox();
    if (page.viewportSize()!.width < 768) {
      await expect(picker).toHaveAttribute("data-slot", "sheet-content");
      expect(secondMonth!.y).toBeGreaterThan(firstMonth!.y);
    } else {
      await expect(picker).toHaveAttribute("data-slot", "popover-content");
      expect(Math.abs(firstMonth!.y - secondMonth!.y)).toBeLessThan(1);
      expect(secondMonth!.x).toBeGreaterThan(firstMonth!.x);
    }
    await picker.getByRole("button", { name: /September 22/ }).click();
    await expect(
      picker.getByRole("button", { name: "Apply range" }),
    ).toBeDisabled();
    await picker.getByRole("button", { name: /October 12/ }).click();
    const from = "2026-09-22";
    const to = "2026-10-12";
    expect(page.url()).toBe(originalUrl);
    await picker.getByRole("button", { name: "Apply range" }).click();
    await expect(picker).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(async () => {
      const params = new URL(page.url()).searchParams;
      expect(params.get("period")).toBe("custom");
      expect(params.get("from")).toBe(from);
      expect(params.get("to")).toBe(to);
    }).toPass();
    await page.reload();
    await trigger.click();
    await expect(
      picker.getByRole("status", { name: "Selected date range" }),
    ).toHaveText("22 Sep 2026 – 12 Oct 2026");
  });

  test("jumps to different years and months in each calendar", async ({
    page,
  }) => {
    await page.goto("/transactions");
    const originalUrl = page.url();
    await page
      .getByRole("button", { name: "Custom range", exact: true })
      .click();
    await selectOption(page, "Choose the Year", "2020");
    await selectOption(page, "Choose the Month", "February");
    const picker = page.getByRole("dialog", { name: "Custom date range" });
    await picker.getByRole("button", { name: /February 10/ }).click();
    await selectOption(page, "Choose the Year", "2021", 1);
    await selectOption(page, "Choose the Month", "June", 1);
    await picker.getByRole("button", { name: /June 12/ }).click();
    await expect(
      picker.getByRole("status", { name: "Selected date range" }),
    ).toHaveText("10 Feb 2020 – 12 Jun 2021");
    expect(page.url()).toBe(originalUrl);
    await picker.getByRole("button", { name: "Apply range" }).click();
    await expect(page).toHaveURL(/from=2020-02-10&to=2021-06-12/);
  });

  test("discards an unfinished range on Cancel and Escape", async ({
    page,
  }) => {
    await page.goto("/transactions?period=7d");
    const originalUrl = page.url();
    const trigger = page.getByRole("button", {
      name: "Custom range",
      exact: true,
    });
    for (const action of ["Cancel", "Escape"]) {
      await trigger.click();
      const picker = page.getByRole("dialog", { name: "Custom date range" });
      const summary = picker.getByRole("status", {
        name: "Selected date range",
      });
      const appliedRange = await summary.textContent();
      await picker
        .getByRole("grid")
        .first()
        .locator("button[data-day]:enabled")
        .first()
        .click();
      if (action === "Cancel")
        await picker
          .getByRole("button", { name: "Cancel", exact: true })
          .click();
      else await page.keyboard.press("Escape");
      await expect(picker).toBeHidden();
      await expect(trigger).toBeFocused();
      expect(page.url()).toBe(originalUrl);
      await trigger.click();
      await expect(summary).toHaveText(appliedRange!);
      await picker.getByRole("button", { name: "Close date picker" }).click();
    }
  });

  test("moves between periods with the keyboard", async ({ page }) => {
    await page.goto("/transactions?period=7d");
    const week = page.getByRole("button", { name: /Last 7 days/ });
    const month = page.getByRole("button", { name: /Last 30 days/ });
    await week.focus();
    await page.keyboard.press("ArrowRight");
    await expect(month).toBeFocused();
    await page.keyboard.press("Space");
    await expect(month).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/^Last 30 days · /)).toBeVisible();
  });

  test("opens a transaction's details", async ({ page }) => {
    await page.goto("/transactions");
    const row = visibleRowButtons(page).first();
    await row.click();

    const details = page.getByRole("heading", { name: "Transaction details" });
    await expect(details).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
    await expect(row).toBeFocused();
  });
});

test.describe("transactions on a wide screen", () => {
  test.skip(({ isMobile }) => isMobile, "desktop layout only");
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const width of [1366, 1920]) {
    test(`keeps search on its own row at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/transactions");

      await expect(async () => {
        const panel = page.getByRole("region", {
          name: "Filters",
          exact: true,
        });
        const search = await panel
          .getByRole("search")
          .locator('[data-slot="input-group"]')
          .boundingBox();
        const period = await panel
          .getByRole("group", { name: "Period" })
          .boundingBox();
        const category = await panel
          .getByRole("combobox", { name: "Category" })
          .boundingBox();
        const sort = await panel
          .getByRole("combobox", { name: "Sort by" })
          .boundingBox();

        expect(search).not.toBeNull();
        expect(period).not.toBeNull();
        expect(category).not.toBeNull();
        expect(sort).not.toBeNull();
        expect(search!.y + search!.height).toBeLessThan(period!.y);
        expect(Math.abs(period!.height - category!.height)).toBeLessThan(1);
        expect(Math.abs(category!.height - sort!.height)).toBeLessThan(1);
        expect(Math.abs(period!.y - category!.y)).toBeLessThan(1);
        expect(Math.abs(category!.y - sort!.y)).toBeLessThan(1);
        expect(Math.abs(search!.x - period!.x)).toBeLessThan(1);
        expect(period!.x + period!.width).toBeLessThan(category!.x);
        expect(category!.x + category!.width).toBeLessThan(sort!.x);
        expect(
          Math.abs(search!.x + search!.width - sort!.x - sort!.width),
        ).toBeLessThan(1);
      }).toPass();
    });
  }

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
