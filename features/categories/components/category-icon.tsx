import {
  Car,
  Film,
  type LucideIcon,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  Zap,
} from "lucide-react";

import type { CategoryIcon as IconName } from "../schemas";

const ICONS: Record<IconName, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  film: Film,
  car: Car,
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  zap: Zap,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon aria-hidden className={className} />;
}
