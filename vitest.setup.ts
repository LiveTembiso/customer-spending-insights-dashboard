import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Server modules import "server-only", which throws outside a React Server
// Components build.
vi.mock("server-only", () => ({}));
