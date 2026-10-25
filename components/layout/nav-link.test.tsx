import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NavLink } from "./nav-link";
import { SidebarProvider } from "@/components/ui/sidebar";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

function renderLink(href: string) {
  render(
    <SidebarProvider>
      <NavLink href={href} label="Link" icon={null} variant="sidebar" />
    </SidebarProvider>,
  );
  return screen.getByRole("link", { name: "Link" });
}

describe("NavLink", () => {
  it.each([
    ["/", "/", true],
    ["/transactions", "/", false],
    ["/transactions", "/transactions", true],
    ["/transactions?category=Dining", "/transactions", true],
    ["/goals", "/transactions", false],
    ["/transactions/txn_001", "/transactions", true],
    ["/goals-history", "/goals", false],
  ])("on %s, the %s link is current: %s", (path, href, expected) => {
    pathname.current = path.split("?")[0];
    const link = renderLink(href);

    if (expected) expect(link).toHaveAttribute("aria-current", "page");
    else expect(link).not.toHaveAttribute("aria-current");
  });

  it("includes the badge in the link's accessible name", () => {
    pathname.current = "/";
    render(
      <SidebarProvider>
        <NavLink
          href="/goals"
          label="Goals"
          icon={null}
          variant="sidebar"
          badge={<span className="sr-only">, 2 goals need attention</span>}
        />
      </SidebarProvider>,
    );

    expect(
      screen.getByRole("link", { name: /^Goals\s*, 2 goals need attention$/ }),
    ).toBeInTheDocument();
  });
});
