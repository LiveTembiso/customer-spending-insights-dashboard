import { CATEGORY_NAMES, type Category, type CategoryName } from "./schemas";

// Colours and icons. Keyed by name so a new category can't be left out.
const CATALOGUE = {
  Groceries: { color: "#FF6B6B", icon: "shopping-cart" },
  Entertainment: { color: "#4ECDC4", icon: "film" },
  Transportation: { color: "#45B7D1", icon: "car" },
  Dining: { color: "#F7DC6F", icon: "utensils" },
  Shopping: { color: "#BB8FCE", icon: "shopping-bag" },
  Utilities: { color: "#85C1E9", icon: "zap" },
} satisfies Record<CategoryName, Omit<Category, "name">>;

export const CATEGORIES: readonly Category[] = CATEGORY_NAMES.map((name) => ({
  name,
  ...CATALOGUE[name],
}));

export function getCategory(name: CategoryName): Category {
  return { name, ...CATALOGUE[name] };
}
