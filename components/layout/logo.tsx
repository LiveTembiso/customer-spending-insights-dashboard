import Image from "next/image";

import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** The full Capitec wordmark on its own white panel, with the product name. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-col gap-2", className)}>
      <span className="flex rounded-[12px] bg-white px-3 py-2.5">
        <Image
          src="/brand/capitec-logo.jpeg"
          alt="Capitec Bank"
          width={184}
          height={31}
          className="h-auto w-full"
        />
      </span>
      <span className="px-1 text-[15px] leading-tight font-extrabold tracking-tight">
        {APP_NAME}
      </span>
    </span>
  );
}

/** The Capitec mark and product name, for narrow headers. */
export function LogoCompact({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 font-extrabold", className)}>
      <Image
        src="/brand/capitec-mark.png"
        alt="Capitec Bank"
        width={46}
        height={24}
        className="h-6 w-auto"
      />
      <span className="text-[17px] leading-tight tracking-tight">
        {APP_NAME}
      </span>
    </span>
  );
}
