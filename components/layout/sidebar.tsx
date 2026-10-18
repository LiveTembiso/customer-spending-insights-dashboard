import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./logo";
import { type NavBadges, NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

interface SidebarProps {
  account: ReactNode;
  badges?: NavBadges;
}

export function Sidebar({ account, badges }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-7 bg-sidebar px-4 py-6 text-white md:flex">
      <Link
        href="/"
        className="rounded-[10px] px-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <Logo />
      </Link>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon aria-hidden className="size-5 shrink-0" />}
            variant="sidebar"
            badge={badges?.[item.href]}
          />
        ))}
      </nav>
      <div className="mt-auto border-t border-sidebar-border pt-4">
        {account}
      </div>
    </aside>
  );
}
