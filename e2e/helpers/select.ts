import type { Page } from "@playwright/test";

export async function selectOption(
  page: Page,
  label: string,
  option: string,
  index = 0,
) {
  await page
    .getByRole("combobox", { name: label, exact: true })
    .nth(index)
    .click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
