import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { agentReadySite } from "./src/site/vitePlugin.ts";
import { cgroupMaxWorkers } from "./vitest.workers.mjs";

// One worker per CPU the cgroup may use (see vitest.workers.mjs); unset, and so
// vitest's default, when nothing caps the CPU.
const maxWorkers = cgroupMaxWorkers();

export default defineConfig({
  plugins: [react(), agentReadySite()],
  server: {
    port: 5174,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    ...(maxWorkers === undefined ? {} : { maxWorkers }),
    coverage: {
      provider: "v8",
      // vitest.workers.mjs sits at the root because vite.config.ts imports it,
      // but it is real logic and is tested like the rest.
      include: ["src/**/*.{ts,tsx}", "vitest.workers.mjs"],
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
