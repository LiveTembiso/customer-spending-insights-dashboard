import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Providers } from "./providers";

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => <span>Query tools</span>,
}));

function Customer() {
  const query = useQuery({
    queryKey: ["providers-test"],
    initialData: "Lerato",
    queryFn: async () => "Lerato",
  });
  return <span>{query.data}</span>;
}

afterEach(() => vi.unstubAllEnvs());

describe("Providers", () => {
  it("provides query data without development controls in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(
      <Providers>
        <Customer />
      </Providers>,
    );
    expect(screen.getByText("Lerato")).toBeVisible();
    expect(screen.queryByText("Query tools")).not.toBeInTheDocument();
  });

  it("includes query tools in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(
      <Providers>
        <Customer />
      </Providers>,
    );
    expect(screen.getByText("Query tools")).toBeVisible();
  });
});
