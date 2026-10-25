"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { SidebarMenuButton } from "@/components/ui/sidebar";

interface NavLinkProps {
  href: string;
  label: string;
  /** Rendered by the caller: components can't be passed to a Client Component. */
  icon: ReactNode;
  variant: "sidebar" | "tabbar";
  badge?: ReactNode;
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({ href, label, icon, variant, badge }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  if (variant === "sidebar") {
    return (
      <SidebarMenuButton
        render={<Link href={href} aria-current={active ? "page" : undefined} />}
        isActive={active}
        className={cn(
          "h-auto min-h-11 gap-3 rounded-[10px] px-3.5 py-3 text-[15px] font-medium text-sidebar-foreground [&_svg]:size-5",
          active &&
            "bg-sidebar-primary font-bold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground data-active:bg-sidebar-primary data-active:font-bold data-active:text-sidebar-primary-foreground",
        )}
      >
        {icon}
        <span>{label}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </SidebarMenuButton>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-sidebar-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "font-bold text-white",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-14 items-center justify-center rounded-full",
          active && "bg-nav-active",
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
      {badge && <span className="absolute top-1 left-1/2 ml-1.5">{badge}</span>}
    </Link>
  );
}
