import {
  ChartColumn,
  LayoutDashboard,
  type LucideIcon,
  ReceiptText,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";

export interface NavItem {
  href: "/" | "/transactions" | "/goals" | "/insights";
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/insights", label: "Insights", icon: ChartColumn },
];

export type NavBadges = Partial<Record<NavItem["href"], ReactNode>>;
