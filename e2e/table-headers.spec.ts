import { expect, test } from "@playwright/test";

test.describe("table headers", () => {
  test.skip(({ isMobile }) => isMobile, "tables use lists on phones");
  test.use({ viewport: { width: 1366, height: 800 } });

  for (const { path, name } of [
    { path: "/", name: "Recent transactions" },
    { path: "/transactions", name: "All categories" },
    { path: "/insights?months=12", name: "Category breakdown" },
    { path: "/insights?months=12", name: "Month by month" },
  ]) {
    test(`${name} stays visible while its table scrolls past`, async ({
      page,
    }) => {
      await page.goto(path);
      const table = page.getByRole("table", { name, exact: true });
      await expect(table).toBeVisible();
      const header = table.locator("thead");
      // Allow the final table to scroll completely out of view too.
      await page.evaluate(() => {
        const followingContent = document.createElement("div");
        followingContent.style.height = "100vh";
        document.body.append(followingContent);
      });
      const geometry = await table.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return {
          top: box.top + window.scrollY,
          bottom: box.bottom + window.scrollY,
        };
      });

      await page.evaluate((top) => window.scrollTo(0, top + 60), geometry.top);
      await expect(async () => {
        expect(Math.abs((await header.boundingBox())!.y)).toBeLessThan(1);
      }).toPass();

      const height = (await header.boundingBox())!.height;
      await page.evaluate(
        (top) => window.scrollTo(0, top),
        geometry.bottom - height / 2,
      );
      await expect(async () => {
        const headerBox = (await header.boundingBox())!;
        const tableBox = (await table.boundingBox())!;
        expect(headerBox.y).toBeLessThan(0);
        expect(
          Math.abs(
            headerBox.y + headerBox.height - tableBox.y - tableBox.height,
          ),
        ).toBeLessThan(1);
      }).toPass();

      await page.evaluate(
        (bottom) => window.scrollTo(0, bottom + 10),
        geometry.bottom,
      );
      await expect(async () => {
        const box = (await header.boundingBox())!;
        expect(box.y + box.height).toBeLessThan(0);
      }).toPass();
    });
  }

  test("tables fit a laptop screen, including beside transaction details", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    for (const path of ["/", "/transactions", "/insights"]) {
      await page.goto(path);
      await expect(page.getByRole("table").first()).toBeVisible();
      await expect(async () => {
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(1024);
        for (const table of await page.getByRole("table").all()) {
          const fitsCard = await table.evaluate((element) => {
            const card = element.closest('[data-slot="card"]')!;
            const padding = parseFloat(getComputedStyle(card).paddingRight);
            return (
              element.getBoundingClientRect().right <=
              card.getBoundingClientRect().right - padding + 1
            );
          });
          expect(fitsCard, `${path} table should fit inside its card`).toBe(
            true,
          );
        }
      }).toPass();
    }
    await page.setViewportSize({ width: 1366, height: 800 });
    await page.goto("/transactions");
    await page.locator("table tbody button").first().click();
    await expect(
      page.getByRole("complementary", { name: "Transaction details" }),
    ).toBeVisible();
    const table = page.getByRole("table", {
      name: "All categories",
      exact: true,
    });
    await expect(async () => {
      const bounds = (await table.boundingBox())!;
      const details = (await page
        .getByRole("complementary", { name: "Transaction details" })
        .boundingBox())!;
      expect(bounds.x + bounds.width).toBeLessThan(details.x);
    }).toPass();
  });
});
