/** Types for vitest.workers.mjs; see that file for why it is plain JS. */
export declare function readOptional(path: string): string | undefined;
export declare function cgroupMaxWorkers(source?: {
  read?: (path: string) => string | undefined;
  root?: string;
}): number | undefined;
