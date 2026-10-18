import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./logo";

export function MobileHeader({ account }: { account: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-4 md:hidden">
      <Link
        href="/"
        className="rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Logo />
      </Link>
      {account}
    </header>
  );
}
