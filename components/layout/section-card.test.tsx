import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionCard, SectionCardSkeleton } from "./section-card";

describe("SectionCard", () => {
  it("is a region named by its title", () => {
    render(
      <SectionCard
        id="goals-title"
        title="Spending goals"
        description="This month"
      >
        <p>Body</p>
      </SectionCard>,
    );
    const region = screen.getByRole("region", { name: "Spending goals" });

    expect(region).toHaveTextContent("This month");
    expect(region).toHaveTextContent("Body");
  });

  it("gives its link a full name for screen readers", () => {
    render(
      <SectionCard
        id="trend-title"
        title="Monthly spending"
        link={{
          href: "/insights",
          label: "View insights",
          context: "on monthly spending",
        }}
      >
        <p>Body</p>
      </SectionCard>,
    );
    expect(
      screen.getByRole("link", { name: "View insights on monthly spending" }),
    ).toHaveAttribute("href", "/insights");
  });

  it("can link without extra context", () => {
    render(
      <SectionCard
        id="goals-title"
        title="Spending goals"
        link={{ href: "/goals", label: "View all" }}
      >
        <p>Body</p>
      </SectionCard>,
    );
    expect(screen.getByRole("link", { name: "View all" })).toBeInTheDocument();
  });
});

describe("SectionCardSkeleton", () => {
  it("draws a heading bar and the requested number of lines", () => {
    const { container } = render(<SectionCardSkeleton lines={3} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      4,
    );
  });
});
