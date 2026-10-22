/**
 * Tests for the vitest worker sizing in vitest.workers.mjs.
 *
 * The cgroup files are faked through the injectable reader, so these cases do
 * not depend on whether the suite itself happens to run under capped.sh.
 */

import { describe, expect, it } from "vitest";
import { cgroupMaxWorkers, readOptional } from "../../vitest.workers.mjs";

const SCOPE = "/user.slice/capped.slice/capped-1.scope";

/**
 * A reader over an in-memory file table; absent paths read as missing.
 *
 * @param files - Path to contents.
 * @returns A reader for cgroupMaxWorkers.
 */
const fakeFs =
  (files: Record<string, string>) =>
  (path: string): string | undefined =>
    files[path];

/**
 * A process in SCOPE whose cgroup levels carry the given cpu.max contents.
 *
 * @param cpuMax - cgroup directory to cpu.max contents.
 * @returns A reader for cgroupMaxWorkers.
 */
const capped = (cpuMax: Record<string, string>) =>
  fakeFs({
    "/proc/self/cgroup": `0::${SCOPE}\n`,
    ...Object.fromEntries(
      Object.entries(cpuMax).map(([dir, value]) => [`/cg${dir}/cpu.max`, value]),
    ),
  });

describe("cgroupMaxWorkers", () => {
  it("keeps vitest's default when no level sets a quota", () => {
    const read = capped({ [SCOPE]: "max 100000\n", "/user.slice": "max 100000\n" });
    expect(cgroupMaxWorkers({ read, root: "/cg" })).toBeUndefined();
  });

  it("gives 3 workers for a 10 % cap of 24 cores (2.4 CPUs)", () => {
    const read = capped({ [SCOPE]: "240000 100000\n" });
    expect(cgroupMaxWorkers({ read, root: "/cg" })).toBe(3);
  });

  it("gives 5 workers for a 20 % cap of 24 cores (4.8 CPUs)", () => {
    const read = capped({ [SCOPE]: "480000 100000\n" });
    expect(cgroupMaxWorkers({ read, root: "/cg" })).toBe(5);
  });

  it("takes the tightest quota on any ancestor", () => {
    const read = capped({ [SCOPE]: "480000 100000", "/user.slice/capped.slice": "240000 100000" });
    expect(cgroupMaxWorkers({ read, root: "/cg" })).toBe(3);
  });

  it("never drops below one worker", () => {
    const read = capped({ [SCOPE]: "10000 100000" });
    expect(cgroupMaxWorkers({ read, root: "/cg" })).toBe(1);
  });

  it("keeps the default when cpu.max is malformed", () => {
    expect(cgroupMaxWorkers({ read: capped({ [SCOPE]: "garbage" }), root: "/cg" })).toBeUndefined();
    expect(cgroupMaxWorkers({ read: capped({ [SCOPE]: "240000 0" }), root: "/cg" })).toBeUndefined();
  });

  it("keeps the default when the cgroup files are missing", () => {
    expect(cgroupMaxWorkers({ read: fakeFs({}), root: "/cg" })).toBeUndefined();
    expect(cgroupMaxWorkers({ read: capped({}), root: "/cg" })).toBeUndefined();
  });

  it("keeps the default on cgroup v1, which has no unified 0:: line", () => {
    const read = fakeFs({ "/proc/self/cgroup": "4:cpu,cpuacct:/user.slice\n" });
    expect(cgroupMaxWorkers({ read, root: "/cg" })).toBeUndefined();
  });

  it("reads the real system when nothing is injected", () => {
    const workers = cgroupMaxWorkers();
    // Undefined uncapped (CI), a positive count under capped.sh.
    expect(workers === undefined || (Number.isInteger(workers) && workers >= 1)).toBe(true);
  });
});

describe("readOptional", () => {
  it("returns a file's contents", () => {
    // vitest runs from the repo root, so a relative path resolves there.
    expect(readOptional("package.json")).toContain('"name": "kcd2-dice-solver"');
  });

  it("returns undefined for a missing file", () => {
    expect(readOptional("/nonexistent/kcd2/cpu.max")).toBeUndefined();
  });
});
