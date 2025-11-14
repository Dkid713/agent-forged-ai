import { Hypothesis } from "./hypothesis-engine.js";
import { ShadowRunResult } from "./shadow-runner.js";

export interface Scorecard {
  hypothesis: Hypothesis;
  complexityDelta: number;
  performanceGain: number;
  risk: number;
  improvement: number;
  narrative: string[];
}

export async function evaluate(result: ShadowRunResult): Promise<Scorecard> {
  const { hypothesis } = result;
  const complexityDelta = -Math.min(0.3, (hypothesis.expectedImpact.duplicationDrop ?? 0) * 0.8);
  const performanceGain = Math.max(0, -(result.syntheticLoad.latencyDelta) + -(result.syntheticLoad.errorDelta) * 0.5);
  const riskBase = result.tests.failed > 0 ? 0.4 : 0.1;
  const risk = Math.max(0.05, riskBase - (hypothesis.expectedImpact.errorReduction ?? 0) * 0.2);
  const improvement = performanceGain + Math.abs(complexityDelta) - risk;

  const narrative = [
    `Tests: ${result.tests.passed} passed / ${result.tests.failed} failed in ${(result.tests.durationMs / 1000).toFixed(1)}s`,
    `Synthetic load: ${result.syntheticLoad.requestsPerSecond} req/s, latency delta ${formatDelta(result.syntheticLoad.latencyDelta)} ms, error delta ${formatDelta(result.syntheticLoad.errorDelta)}%`,
    `Risk score ${risk.toFixed(2)}, projected improvement ${improvement.toFixed(2)}`,
    ...result.notes,
  ];

  return {
    hypothesis,
    complexityDelta,
    performanceGain,
    risk,
    improvement,
    narrative,
  };
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : value.toString();
}
