"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

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

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        variant === "sidebar" &&
          "flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 py-3 text-[15px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        variant === "sidebar" &&
          active &&
          "bg-sidebar-primary font-bold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
        variant === "tabbar" &&
          "relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-sidebar-foreground",
        variant === "tabbar" && active && "font-bold text-white",
      )}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={cn(
            variant === "sidebar" && "ml-auto",
            variant === "tabbar" && "absolute top-1 left-1/2 ml-1.5",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
