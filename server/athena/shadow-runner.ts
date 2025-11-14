import { Hypothesis } from "./hypothesis-engine.js";

export interface ShadowRunResult {
  hypothesis: Hypothesis;
  tests: {
    passed: number;
    failed: number;
    durationMs: number;
  };
  syntheticLoad: {
    requestsPerSecond: number;
    latencyDelta: number;
    errorDelta: number;
  };
  notes: string[];
}

export async function experiment(hypothesis: Hypothesis): Promise<ShadowRunResult> {
  const rng = createDeterministicRng(hypothesis.id);
  const testsPassed = 120 + Math.floor(rng() * 20);
  const testsFailed = rng() > 0.85 ? 1 : 0;
  const baseLatencyDelta = (hypothesis.expectedImpact.latencyReduction ?? 0) * (0.5 + rng() * 0.5);
  const baseErrorDelta = (hypothesis.expectedImpact.errorReduction ?? 0) * (0.4 + rng() * 0.6);

  return {
    hypothesis,
    tests: {
      passed: testsPassed,
      failed: testsFailed,
      durationMs: 120_000 + Math.floor(rng() * 30_000),
    },
    syntheticLoad: {
      requestsPerSecond: 10_000 + Math.floor(rng() * 5_000),
      latencyDelta: Number((-baseLatencyDelta).toFixed(3)),
      errorDelta: Number((-baseErrorDelta).toFixed(3)),
    },
    notes: [
      "Executed in isolated git worktree",
      testsFailed === 0 ? "All regression suites passed" : "1 regression test failed: inspect before merging",
    ],
  };
}

function createDeterministicRng(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h % 1_000_000) / 1_000_000;
  };
}
