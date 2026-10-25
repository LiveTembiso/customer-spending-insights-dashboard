import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCurrentProfile } from "../server/current";
import {
  AccountAvatar,
  AccountAvatarSkeleton,
  AccountSummary,
  AccountSummarySkeleton,
} from "./account-summary";

vi.mock("../server/current", () => ({ getCurrentProfile: vi.fn() }));
const profile = {
  customerId: "12345",
  name: "Lerato Mokoena",
  accountType: "premium",
  email: "lerato@example.com",
  joinDate: "2020-01-01",
  totalSpent: 1000,
  currency: "ZAR" as const,
};

describe("account presentation", () => {
  it("shows the customer name, account type and initials fallback", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(profile);
    render(await AccountSummary());
    expect(screen.getByText("Lerato Mokoena")).toBeVisible();
    expect(screen.getByText("Premium account")).toBeVisible();
    expect(screen.getByText("LM")).toBeVisible();
  });

  it("names the compact avatar for screen readers", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(profile);
    render(await AccountAvatar());
    expect(screen.getByText("Signed in as Lerato Mokoena")).toBeInTheDocument();
    expect(screen.getByText("LM")).toHaveAttribute("aria-hidden", "true");
  });

  it("omits account details when the profile is unavailable", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(undefined);
    const { container } = render(
      <>
        {await AccountSummary()}
        {await AccountAvatar()}
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps account placeholders free of customer information", () => {
    const { container } = render(
      <>
        <AccountSummarySkeleton />
        <AccountAvatarSkeleton />
      </>,
    );
    expect(container).not.toBeEmptyDOMElement();
    expect(container).toHaveTextContent("");
  });
});
