import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import RootLayout, { metadata, viewport } from "./layout";
import manifest from "./manifest";

vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({ variable: "font-jakarta" }),
}));

describe("application identity", () => {
  it("keeps the installed app and browser metadata consistent", () => {
    const installed = manifest();
    expect(installed.name).toBe("Spending Insights");
    expect(metadata.title).toEqual({
      default: installed.name,
      template: `%s · ${installed.name}`,
    });
    expect(metadata.description).toBe(installed.description);
    expect(viewport.themeColor).toBe(installed.theme_color);
    expect(installed.start_url).toBe("/");
    expect(installed.icons).toContainEqual(
      expect.objectContaining({ purpose: "maskable" }),
    );
  });

  it("renders the page in a South African document with its data provider", () => {
    const html = renderToStaticMarkup(
      <RootLayout params={Promise.resolve({})}>
        <h1>Transactions</h1>
      </RootLayout>,
    );
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.documentElement.lang).toBe("en-ZA");
    expect(document.body.querySelector("h1")?.textContent).toBe("Transactions");
  });
});
