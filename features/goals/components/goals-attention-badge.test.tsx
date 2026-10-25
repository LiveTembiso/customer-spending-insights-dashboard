import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeGoal } from "@/test-utils/fixtures";

import type { Goal, GoalStatus } from "../schemas";
import { getCurrentGoals } from "../server/current";
import { GoalsAttentionBadge } from "./goals-attention-badge";

vi.mock("../server/current", () => ({ getCurrentGoals: vi.fn() }));

const goal = (status: GoalStatus): Goal =>
  makeGoal({ id: `goal_${status}`, status });

async function renderBadge(statuses: GoalStatus[]) {
  vi.mocked(getCurrentGoals).mockResolvedValue({ goals: statuses.map(goal) });
  const { container } = render(await GoalsAttentionBadge());
  return container;
}

describe("GoalsAttentionBadge", () => {
  beforeEach(() => vi.mocked(getCurrentGoals).mockReset());

  it("shows nothing when every goal is on track", async () => {
    const container = await renderBadge(["on_track", "on_track"]);
    expect(container).toBeEmptyDOMElement();
  });

  it("counts warnings and overspent goals, not goals on track", async () => {
    const container = await renderBadge(["warning", "exceeded", "on_track"]);
    expect(container).toHaveTextContent(/^2, 2 goals need attention$/);
  });

  it("uses the singular for one goal", async () => {
    await renderBadge(["warning"]);
    expect(screen.getByText(", 1 goal needs attention")).toBeInTheDocument();
  });

  it("hides the bare number from screen readers", async () => {
    await renderBadge(["warning"]);
    expect(screen.getByText("1")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows nothing for an unknown customer", async () => {
    vi.mocked(getCurrentGoals).mockResolvedValue(undefined);
    const { container } = render(await GoalsAttentionBadge());
    expect(container).toBeEmptyDOMElement();
  });
});
