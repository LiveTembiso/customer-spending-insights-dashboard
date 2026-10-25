import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, "e2e/**", ".next/**"],
    restoreMocks: true,
    env: { LOG_LEVEL: "silent" },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      include: ["**/*.{ts,tsx}"],
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        "**/*.config.*",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "vitest.setup.ts",
        "e2e/**",
        ".next/**",
      ],
    },
  },
});
