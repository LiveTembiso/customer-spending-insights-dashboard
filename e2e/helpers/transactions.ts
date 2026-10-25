import { expect, type Page } from "@playwright/test";

/** Category uses the same native select at every screen size. */
export async function expectCategorySelected(page: Page, category: string) {
  await expect(page.getByRole("combobox", { name: "Category" })).toHaveValue(
    category,
  );
}
