import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { agentReadySite } from "./src/site/vitePlugin.ts";

export default defineConfig({
  plugins: [react(), agentReadySite()],
  server: {
    port: 5174,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // main.tsx is the DOM bootstrap and solver.worker.ts is the worker
      // entrypoint: both are pure wiring with no branches worth asserting, and
      // neither can run under jsdom without mocking away the thing under test.
      // site/vitePlugin.ts is the same kind of wiring (Rollup hooks around the
      // tested site/build.ts); the AgentReady dist check exercises it for real.
      exclude: ["src/main.tsx", "src/worker/solver.worker.ts", "src/site/vitePlugin.ts", "src/test/**"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
