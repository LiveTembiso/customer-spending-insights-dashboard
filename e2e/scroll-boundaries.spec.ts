import { expect, test } from "@playwright/test";

for (const path of ["/", "/transactions", "/insights", "/goals"]) {
  test(`${path} stays within the viewport during sideways scrolling`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(path);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    const before = (await main.boundingBox())!;
    for (const direction of [-1, 1]) {
      if (isMobile) {
        const session = await page.context().newCDPSession(page);
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: 200, y: 110 }],
        });
        for (let step = 1; step <= 6; step++) {
          await session.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x: 200 + direction * step * 20, y: 110 }],
          });
        }
        await session.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await session.detach();
      } else {
        await page.mouse.move(700, 200);
        await page.mouse.wheel(direction * 1000, 0);
      }
      expect(await page.evaluate(() => window.scrollX)).toBe(0);
      expect((await main.boundingBox())!.x).toBe(before.x);
    }
    expect(
      await page.evaluate(() =>
        [document.documentElement, document.body].map((element) => ({
          horizontalOverscroll: getComputedStyle(element).overscrollBehaviorX,
          overflow: getComputedStyle(element).overflowX,
          verticalOverscroll: getComputedStyle(element).overscrollBehaviorY,
        })),
      ),
    ).toEqual(
      Array(2).fill({
        horizontalOverscroll: "none",
        overflow: "clip",
        verticalOverscroll: "none",
      }),
    );
    await expect(
      page.getByRole("button", { name: "Refresh page" }),
    ).toHaveCount(0);
  });
}
