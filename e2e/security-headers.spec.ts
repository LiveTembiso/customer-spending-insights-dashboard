import { expect, test } from "@playwright/test";

test("pages send security headers and load without CSP violations", async ({
  page,
}) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy/i.test(message.text())) {
      violations.push(message.text());
    }
  });

  for (const path of ["/", "/transactions", "/goals", "/insights"]) {
    const response = await page.goto(path);
    const headers = response!.headers();
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-powered-by"]).toBeUndefined();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  expect(violations).toEqual([]);
});

test("API docs render Swagger UI under their own policy", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy/i.test(message.text())) {
      violations.push(message.text());
    }
  });

  const response = await page.goto("/api/docs");
  expect(response!.headers()["content-security-policy"]).toContain(
    "https://cdn.jsdelivr.net",
  );
  await expect(
    page.getByRole("heading", { name: /Customer Spending Insights/ }),
  ).toBeVisible();
  expect(violations).toEqual([]);
});
