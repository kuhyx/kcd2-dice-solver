/**
 * Size the vitest worker pool to the CPU quota of the cgroup it runs in.
 *
 * vitest sizes its pool from os.availableParallelism(), which ignores a cgroup
 * CPU quota. Under ~/.claude/scripts/capped.sh (a systemd scope at 10 % of a
 * 24-core machine, i.e. cpu.max = 2.4 CPUs) that meant 11 workers sharing 2.4
 * CPUs: every test ran ~5x slower than alone and whichever ones crossed the
 * 5 s timeout failed, a different one each run. Measured with coverage on:
 * default workers -> slowest test 13.9 s, red; 3 workers -> slowest 0.96 s and
 * a faster run overall (13 s vs 22 s), since the work is CPU-bound either way.
 *
 * Plain .mjs (typed by vitest.workers.d.mts) because the app's tsconfig has no
 * Node types, and adding them would leak Node globals into browser code.
 */

import { readFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Read a file, or return undefined when it is absent or unreadable.
 *
 * @param {string} path - File to read.
 * @returns {string | undefined} Its contents.
 */
export function readOptional(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * The tightest CPU quota on this process's cgroup v2 path, in whole workers.
 *
 * @param {object} [source] - Where the limit is read from; injectable for tests.
 * @param {(path: string) => string | undefined} [source.read] - File reader
 *   returning undefined for a missing file.
 * @param {string} [source.root] - Where the cgroup v2 hierarchy is mounted.
 * @returns {number | undefined} Workers to run, or undefined (vitest's own
 *   default) when no usable quota applies: CI, an uncapped shell, cgroup v1,
 *   non-Linux, or a cpu.max that does not parse.
 */
export function cgroupMaxWorkers({ read = readOptional, root = "/sys/fs/cgroup" } = {}) {
  const membership = read("/proc/self/cgroup")
    ?.split("\n")
    .find((line) => line.startsWith("0::"));
  if (membership === undefined) {
    return undefined;
  }
  let cpus = Infinity;
  // A quota on any ancestor slice limits us too, so take the smallest.
  for (let dir = membership.slice(3); ; dir = dirname(dir)) {
    const [quota, period] = (read(`${root}${dir}/cpu.max`) ?? "max").trim().split(" ");
    if (quota !== "max") {
      cpus = Math.min(cpus, Number(quota) / Number(period));
    }
    if (dir === "/") {
      break;
    }
  }
  return Number.isFinite(cpus) ? Math.max(1, Math.ceil(cpus)) : undefined;
}
