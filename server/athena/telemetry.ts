import { getSummary, TelemetrySummary } from "../telemetry/index.js";

export interface Observation extends TelemetrySummary {
  hotspots: string[];
  unstablePaths: string[];
}

const HOT_PATH_THRESHOLD_MS = 250;
const ERROR_RATE_THRESHOLD = 0.05;

export async function observe(windowMs?: number): Promise<Observation> {
  const summary = getSummary(windowMs);
  const hotspots: string[] = [];
  const unstable: string[] = [];

  for (const [path, stats] of Object.entries(summary.byPath)) {
    if (stats.avgLatency >= HOT_PATH_THRESHOLD_MS || stats.p95Latency >= HOT_PATH_THRESHOLD_MS * 1.2) {
      hotspots.push(path);
    }
    if (stats.errorRate >= ERROR_RATE_THRESHOLD) {
      unstable.push(path);
    }
  }

  return {
    ...summary,
    hotspots,
    unstablePaths: unstable,
  };
}
