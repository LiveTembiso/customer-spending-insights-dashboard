import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuietBoundary } from "./quiet-boundary";

function UnavailableWidget(): never {
  throw new Error("Optional widget unavailable");
}

describe("QuietBoundary", () => {
  it("renders optional content when it is available", () => {
    render(
      <QuietBoundary>
        <span>Account summary</span>
      </QuietBoundary>,
    );
    expect(screen.getByText("Account summary")).toBeVisible();
  });

  it("hides a failed optional widget without taking down the surrounding page", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <>
        <h1>Spending insights</h1>
        <QuietBoundary>
          <UnavailableWidget />
        </QuietBoundary>
      </>,
    );
    expect(
      screen.getByRole("heading", { name: "Spending insights" }),
    ).toBeVisible();
    expect(
      screen.queryByText("Optional widget unavailable"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
