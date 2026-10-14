import type { Category, CategoryName } from "./schemas";

// Colours and icons
export const CATEGORIES: readonly Category[] = [
  { name: "Groceries", color: "#FF6B6B", icon: "shopping-cart" },
  { name: "Entertainment", color: "#4ECDC4", icon: "film" },
  { name: "Transportation", color: "#45B7D1", icon: "car" },
  { name: "Dining", color: "#F7DC6F", icon: "utensils" },
  { name: "Shopping", color: "#BB8FCE", icon: "shopping-bag" },
  { name: "Utilities", color: "#85C1E9", icon: "zap" },
];

const byName = new Map(CATEGORIES.map((category) => [category.name, category]));

export function getCategory(name: CategoryName): Category {
  return byName.get(name)!;
}
