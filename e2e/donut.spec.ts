import { expect, test } from "@playwright/test";

test.describe("donut tooltip pointer movement", () => {
  test.skip(({ isMobile }) => isMobile, "mouse hover interaction");

  for (const scenario of [
    { path: "/", card: "Where it went", width: 1366 },
    { path: "/insights", card: "Category breakdown", width: 1366 },
    { path: "/insights", card: "Category breakdown", width: 600 },
  ]) {
    test(`shows segment tooltips from the centre on ${scenario.path} at ${scenario.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: scenario.width, height: 1000 });
      await page.goto(scenario.path);
      const card = page.getByRole("region", {
        name: scenario.card,
        exact: true,
      });
      const chart = card.locator('[data-slot="chart"]');
      const donut = chart.locator("..");
      await expect(chart.locator(".recharts-pie-sector").first()).toBeVisible();
      await donut.scrollIntoViewIfNeeded();
      const bounds = (await donut.boundingBox())!;
      const centre = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      };
      const tooltip = donut.locator('[role="tooltip"]');
      const segments = await donut.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const radius = bounds.width / 2;
        const angles = new Map<string, number[]>();
        // Find painted points near the inner edge, avoiding rounded corners and gaps.
        for (let angle = 0; angle < 360; angle++) {
          const radians = (angle * Math.PI) / 180;
          const categoryAt = (fraction: number) =>
            document
              .elementFromPoint(
                bounds.x + radius + radius * fraction * Math.cos(radians),
                bounds.y + radius + radius * fraction * Math.sin(radians),
              )
              ?.getAttribute("name");
          const category = categoryAt(0.67);
          if (category && category === categoryAt(0.85)) {
            const candidates = angles.get(category) ?? [];
            candidates.push(angle);
            angles.set(category, candidates);
          }
        }
        return [...angles].map(([category, candidates]) => ({
          category,
          angle: candidates[Math.floor(candidates.length / 2)],
        }));
      });
      expect(segments.length).toBeGreaterThan(1);

      for (const { category, angle } of segments) {
        const radians = (angle * Math.PI) / 180;
        const point = (fraction: number) => ({
          x: centre.x + (bounds.width / 2) * fraction * Math.cos(radians),
          y: centre.y + (bounds.height / 2) * fraction * Math.sin(radians),
        });
        await page.mouse.move(centre.x, centre.y);
        await expect(tooltip).toBeHidden();
        // Move through the inner edge in small steps, then stay on the same slice.
        const edge = point(0.67);
        await page.mouse.move(edge.x, edge.y, { steps: 30 });
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText(category);
        const middle = point(0.85);
        await page.mouse.move(middle.x, middle.y, { steps: 12 });
        await expect(tooltip).toContainText(category);
      }
      // Cross the ring directly between segments without leaving the chart.
      for (const { category, angle } of segments) {
        const radians = (angle * Math.PI) / 180;
        await page.mouse.move(
          centre.x + (bounds.width / 2) * 0.85 * Math.cos(radians),
          centre.y + (bounds.height / 2) * 0.85 * Math.sin(radians),
          { steps: 20 },
        );
        await expect(tooltip).toContainText(category);
      }
      await page.mouse.move(centre.x, centre.y);
      await expect(tooltip).toBeHidden();
    });
  }
});
