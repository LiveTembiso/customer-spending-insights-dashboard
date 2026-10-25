import Link from "next/link";
import type { ReactNode } from "react";
import {
  Sidebar as UiSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Logo } from "./logo";
import { type NavBadges, NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

interface SidebarProps {
  account: ReactNode;
  badges?: NavBadges;
}

export function Sidebar({ account, badges }: SidebarProps) {
  return (
    <UiSidebar
      collapsible="none"
      role="complementary"
      className="sticky top-0 hidden h-dvh flex-col gap-7 overflow-y-auto bg-sidebar px-4 py-6 text-white md:flex"
    >
      <SidebarHeader className="p-0">
        <Link
          href="/"
          className="rounded-[10px] px-1 outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-none">
        <nav aria-label="Main" className="flex flex-col gap-1">
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  icon={<item.icon aria-hidden className="size-5 shrink-0" />}
                  variant="sidebar"
                  badge={badges?.[item.href]}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border p-0 pt-4">
        {account}
      </SidebarFooter>
    </UiSidebar>
  );
}
