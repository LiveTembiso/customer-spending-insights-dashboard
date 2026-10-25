import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DashboardError from "./error";

describe("DashboardError", () => {
  it("announces the error, focuses the heading and offers a retry", async () => {
    const error = Object.assign(new Error("offline"), { digest: "ref-123" });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    render(<DashboardError error={error} retry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Reference: ref-123");
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    expect(log).toHaveBeenCalledWith(error);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("omits the reference when none is available", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DashboardError error={new Error("offline")} retry={vi.fn()} />);
    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
  });
});
