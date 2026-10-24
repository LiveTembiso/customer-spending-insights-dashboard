import Link from "next/link";
import type { ReactNode } from "react";

import { LogoCompact } from "./logo";

export function MobileHeader({ account }: { account: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-4 md:hidden">
      <Link
        href="/"
        className="-mx-1 rounded-[10px] px-1 outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogoCompact />
      </Link>
      {account}
    </header>
  );
}
