import { expect, test } from "@playwright/test";

const NAV = [
  { name: "Overview", path: "/", heading: /^Understand your\s*spending$/ },
  { name: "Transactions", path: "/transactions", heading: "Transactions" },
  { name: "Goals", path: "/goals", heading: "Spending goals" },
  { name: "Insights", path: "/insights", heading: "Insights" },
];

test.describe("navigation", () => {
  test("the skip link is first and moves focus to the content", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  });

  test("reaches every page and marks the current one", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });

    for (const { name, path, heading } of NAV) {
      await nav.getByRole("link", { name: new RegExp(`^${name}`) }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(
        nav.getByRole("link", { name: new RegExp(`^${name}`) }),
      ).toHaveAttribute("aria-current", "page");
    }
  });

  test("the Goals badge matches the goals that need attention", async ({
    page,
    request,
  }) => {
    const response = await request.get("/api/customers/12345/goals");
    const { goals } = (await response.json()) as {
      goals: { status: string }[];
    };
    const count = goals.filter((goal) => goal.status !== "on_track").length;

    await page.goto("/");
    const link = page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: /^Goals/ });

    // The badge's screen reader text is its own span, hence the optional space.
    await expect(link).toHaveAccessibleName(
      count === 0
        ? "Goals"
        : new RegExp(
            `^Goals ?, ${count} ${count === 1 ? "goal needs" : "goals need"} attention$`,
          ),
    );
  });

  for (const { card, link, path } of [
    {
      card: "Where it went",
      link: "View details of spending by category",
      path: "/insights",
    },
    {
      card: "Monthly spending",
      link: "View insights on monthly spending",
      path: "/insights",
    },
    { card: "Spending goals", link: "View all spending goals", path: "/goals" },
    {
      card: "Recent transactions",
      link: "View all transactions",
      path: "/transactions",
    },
  ]) {
    test(`"${card}" links to ${path}`, async ({ page }) => {
      await page.goto("/");
      await page
        .getByRole("region", { name: card, exact: true })
        .getByRole("link", { name: link })
        .click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    });
  }
});
