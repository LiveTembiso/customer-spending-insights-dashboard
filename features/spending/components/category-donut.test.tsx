import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { normalizedText as text } from "@/test-utils/text";

import { CategoryDonut, DonutTotal, holeFontSize } from "./category-donut";

const slices = [
  { name: "Groceries", amount: 1250.3, percentage: 73.2, color: "#FF6B6B" },
  { name: "Utilities", amount: 458.7, percentage: 26.8, color: "#85C1E9" },
];

function renderDonut(label?: string) {
  const view = render(
    <CategoryDonut slices={slices} size={180} label={label}>
      <span>centre</span>
    </CategoryDonut>,
  );
  const root = view.container.firstElementChild as HTMLElement;
  vi.spyOn(root, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ x: 0, y: 0, width: 180, height: 180 }),
  );
  // Recharts replaces the sector elements when it re-renders, so look them up each time.
  const sector = (index: number) =>
    view.container.querySelectorAll(".recharts-pie-sector")[index];
  return { ...view, root, sector };
}

const tooltip = (container: HTMLElement) =>
  container.querySelector(".shadow-xl");

describe("CategoryDonut", () => {
  it("is a described image when given a label", () => {
    renderDonut("Spending by category");
    expect(
      screen.getByRole("img", { name: "Spending by category" }),
    ).toBeInTheDocument();
  });

  it("is hidden from screen readers without a label", () => {
    const { root } = renderDonut();
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
  });

  it("isn't a tab stop", () => {
    const { container } = renderDonut("Spending by category");
    expect(container.querySelector('[tabindex="0"]')).toBeNull();
  });

  it("shows the hovered slice and dims the others", () => {
    const { container, root, sector } = renderDonut();
    fireEvent.mouseMove(root, { clientX: 170, clientY: 90 });
    fireEvent.mouseEnter(sector(0));

    const parts = [...tooltip(container)!.querySelectorAll("span")].map(text);
    expect(parts).toEqual(["", "Groceries", "R1 250.30", "73.2%"]);
    expect(sector(1).querySelector("path")).toHaveAttribute(
      "fill-opacity",
      "0.35",
    );
    expect(sector(0).querySelector("path")).toHaveAttribute(
      "fill-opacity",
      "1",
    );
  });

  it("follows the pointer around the ring", () => {
    const { container, root, sector } = renderDonut();
    fireEvent.mouseEnter(sector(0));
    fireEvent.mouseMove(root, { clientX: 10, clientY: 90 });

    expect(tooltip(container)).toHaveStyle({ left: "22px", top: "102px" });
  });

  it("closes over the hole and when the pointer leaves", () => {
    const { container, root, sector } = renderDonut();
    fireEvent.mouseEnter(sector(0));
    fireEvent.mouseMove(root, { clientX: 90, clientY: 90 });
    expect(tooltip(container)).toBeNull();

    fireEvent.mouseEnter(sector(1));
    expect(tooltip(container)).not.toBeNull();
    fireEvent.mouseLeave(root);
    expect(tooltip(container)).toBeNull();
  });
});

describe("DonutTotal", () => {
  it("shows the total in whole rands", () => {
    render(<DonutTotal amount={21538.46} caption="6 categories" />);
    expect(
      screen.getByText(
        (_, el) => el?.textContent?.replace(/\s/g, " ") === "R21 538",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("6 categories")).toBeInTheDocument();
  });
});

describe("holeFontSize", () => {
  it("shrinks the text as it gets longer, up to 18px", () => {
    expect(holeFontSize("R18 768")).toBe("min(18px, 21.6cqi)");
    expect(holeFontSize("R1 234 567 890")).toBe("min(18px, 10.8cqi)");
  });
});
