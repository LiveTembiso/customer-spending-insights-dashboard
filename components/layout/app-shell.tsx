import type { CSSProperties, ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

import { MobileHeader } from "./mobile-header";
import type { NavBadges } from "./nav-items";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";

interface AppShellProps {
  children: ReactNode;
  account: ReactNode;
  accountCompact: ReactNode;
  badges?: NavBadges;
}

export function AppShell({
  children,
  account,
  accountCompact,
  badges,
}: AppShellProps) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "15rem" } as CSSProperties}
      className="block min-h-dvh md:grid md:grid-cols-[15rem_minmax(0,1fr)]"
    >
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-card px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar account={account} badges={badges} />
      <div className="min-w-0">
        <MobileHeader account={accountCompact} />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] outline-none md:px-8 md:pt-7 md:pb-12"
        >
          {children}
        </main>
      </div>
      <TabBar badges={badges} />
    </SidebarProvider>
  );
}
