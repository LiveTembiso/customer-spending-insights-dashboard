import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  BarTooltip,
  type MonthBar,
  MonthlyBarChart,
} from "./monthly-bar-chart";

const bar = (
  month: string,
  value: number,
  look: MonthBar["look"],
  strong = false,
): MonthBar => ({
  month,
  label: month.slice(5),
  title: `Month ${month}`,
  value,
  look,
  strong,
});

const bars = [
  bar("2026-07", 21612, "muted"),
  bar("2026-08", 29833, "solid", true),
  bar("2026-09", 22279, "muted"),
  bar("2026-10", 18768, "striped"),
];

const text = (element: Element | null) =>
  element?.textContent?.replace(/\s/g, " ");

describe("MonthlyBarChart", () => {
  it("describes itself and isn't a tab stop", () => {
    const { container } = render(
      <MonthlyBarChart bars={bars} top={30000} metric="total" label="Spend" />,
    );
    expect(screen.getByRole("img", { name: "Spend" })).toBeInTheDocument();
    expect(container.querySelector('[tabindex="0"]')).toBeNull();
  });

  it("shortens rand amounts on the y-axis and keeps counts whole", () => {
    const { container, rerender } = render(
      <MonthlyBarChart bars={bars} top={30000} metric="total" label="Spend" />,
    );
    const ticks = () =>
      [...container.querySelectorAll(".recharts-yAxis-tick-labels text")].map(
        text,
      );
    expect(ticks()).toEqual(["R0", "R15K", "R30K"]);

    rerender(
      <MonthlyBarChart
        bars={bars.map((month) => ({ ...month, value: 40 }))}
        top={60}
        metric="count"
        label="Count"
      />,
    );
    expect(ticks()).toEqual(["0", "30", "60"]);
  });

  it("labels values above the bars only when asked", () => {
    const { container, rerender } = render(
      <MonthlyBarChart bars={bars} top={30000} metric="total" label="Spend" />,
    );
    expect(container.querySelector(".recharts-label-list")).toBeNull();

    rerender(
      <MonthlyBarChart
        bars={bars}
        top={30000}
        metric="total"
        label="Spend"
        showValues
      />,
    );
    const values = [
      ...container.querySelectorAll(".recharts-label-list text"),
    ].map(text);
    expect(values).toEqual(["R21 612", "R29 833", "R22 279", "R18 768"]);
  });

  it("styles the current, standout and other months differently", () => {
    const { container } = render(
      <MonthlyBarChart bars={bars} top={30000} metric="total" label="Spend" />,
    );
    const fills = [
      ...container.querySelectorAll(".recharts-bar-rectangle path"),
    ].map((path) => path.getAttribute("fill"));
    const pattern = container.querySelector("pattern")?.id;

    expect(fills).toEqual([
      "var(--bar-muted)",
      "var(--primary)",
      "var(--bar-muted)",
      `url(#${pattern})`,
    ]);
  });

  it("thins out month labels, counting back from the latest", () => {
    const { container } = render(
      <MonthlyBarChart
        bars={bars}
        top={30000}
        metric="total"
        label="Spend"
        labelEvery={[2, 1]}
      />,
    );
    const hidden = [
      ...container.querySelectorAll(".recharts-xAxis-tick-labels text"),
    ].map((tick) => tick.classList.contains("max-sm:hidden"));

    expect(hidden).toEqual([true, false, true, false]);
  });

  it("holds the space with a placeholder before it can draw", () => {
    const html = renderToString(
      <MonthlyBarChart bars={bars} top={30000} metric="total" label="Spend" />,
    );
    expect(html).toContain('data-slot="skeleton"');
    expect(html).not.toContain("<svg");
  });
});

describe("BarTooltip", () => {
  it("shows the exact amount, or a transaction count", () => {
    const { container, rerender } = render(
      <BarTooltip bar={bars[1]} metric="total" />,
    );
    expect(text(container)).toBe("Month 2026-08R29 833.00");

    rerender(<BarTooltip bar={{ ...bars[1], value: 1 }} metric="count" />);
    expect(text(container)).toBe("Month 2026-081 transaction");

    rerender(<BarTooltip bar={{ ...bars[1], value: 47 }} metric="count" />);
    expect(text(container)).toBe("Month 2026-0847 transactions");
  });

  it("shows nothing without a bar", () => {
    const { container } = render(<BarTooltip metric="total" />);
    expect(container).toBeEmptyDOMElement();
  });
});
