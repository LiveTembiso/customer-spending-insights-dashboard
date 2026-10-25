import { expect, type Page } from "@playwright/test";

/** The selected category is exposed by a native select on phones and chips on desktop. */
export async function expectCategorySelected(
  page: Page,
  category: string,
  isMobile: boolean,
) {
  if (isMobile) {
    await expect(page.getByRole("combobox", { name: "Category" })).toHaveValue(
      category,
    );
  } else {
    await expect(
      page.getByRole("button", { name: category, exact: true, pressed: true }),
    ).toBeVisible();
  }
}
