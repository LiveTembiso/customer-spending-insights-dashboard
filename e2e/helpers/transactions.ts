import { expect, type Page } from "@playwright/test";

/** Category uses the same shadcn dropdown at every screen size. */
export async function expectCategorySelected(page: Page, category: string) {
  await expect(page.getByRole("combobox", { name: "Category" })).toHaveText(
    category,
  );
}
