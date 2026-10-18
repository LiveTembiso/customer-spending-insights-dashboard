import { type NavBadges, NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

export function TabBar({ badges }: { badges?: NavBadges }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 bg-sidebar px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={<item.icon aria-hidden className="size-5 shrink-0" />}
          variant="tabbar"
          badge={badges?.[item.href]}
        />
      ))}
    </nav>
  );
}
