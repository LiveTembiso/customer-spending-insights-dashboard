import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/transactions" }));

describe("AppShell", () => {
  it("provides a focusable skip destination and consistent navigation in both layouts", () => {
    render(
      <AppShell
        account={<p>Lerato Mokoena</p>}
        accountCompact={<span aria-label="Lerato Mokoena">LM</span>}
        badges={{ "/goals": <span>1 needs attention</span> }}
      >
        <h1>Transactions</h1>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", `#${main.id}`);
    main.focus();
    expect(main).toHaveFocus();
    expect(within(main).getByRole("heading", { level: 1 })).toHaveTextContent(
      "Transactions",
    );

    for (const nav of screen.getAllByRole("navigation", { name: "Main" })) {
      expect(
        within(nav).getByRole("link", { name: "Transactions" }),
      ).toHaveAttribute("aria-current", "page");
      expect(
        within(nav).getByRole("link", { name: /Goals.*1 needs attention/ }),
      ).toHaveAttribute("href", "/goals");
    }
    expect(screen.getByText("Lerato Mokoena")).toBeInTheDocument();
    expect(screen.getByText("LM")).toHaveAttribute(
      "aria-label",
      "Lerato Mokoena",
    );
  });
});
