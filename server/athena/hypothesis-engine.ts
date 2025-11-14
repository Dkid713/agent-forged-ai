import { Observation } from "./telemetry.js";

export interface Hypothesis {
  id: string;
  summary: string;
  description: string;
  targetBranch: string;
  tasks: string[];
  expectedImpact: {
    latencyReduction?: number;
    errorReduction?: number;
    duplicationDrop?: number;
  };
}

let hypothesisCounter = 0;

export async function hypothesize(observation: Observation): Promise<Hypothesis | null> {
  const candidates: Hypothesis[] = [];

  if (observation.hotspots.length > 0) {
    const path = observation.hotspots[0];
    const stats = observation.byPath[path];
    candidates.push(createHypothesis({
      summary: `Split ${path} critical path into modular services`,
      description: `Latency at ${stats.avgLatency.toFixed(0)}ms (${stats.p95Latency.toFixed(0)}ms p95). Propose isolating heavy logic into dedicated module and caching responses.`,
      tasks: [
        `Profile ${path} handler to identify expensive regions`,
        `Extract hot logic into ${normalizePath(path)}-core module`,
        `Add caching layer for idempotent reads`,
      ],
      impact: {
        latencyReduction: Math.min(0.4, stats.avgLatency / 1000),
      },
    }));
  }

  if (observation.unstablePaths.length > 0) {
    const path = observation.unstablePaths[0];
    const stats = observation.byPath[path];
    candidates.push(createHypothesis({
      summary: `Fortify ${path} against regressions`,
      description: `Error rate at ${(stats.errorRate * 100).toFixed(1)}%. Introduce defensive validation and contract tests.`,
      tasks: [
        `Audit ${path} for unhandled exceptions`,
        `Add contract tests covering edge responses`,
        `Instrument retries and fallbacks`,
      ],
      impact: {
        errorReduction: Math.min(0.6, stats.errorRate * 2),
      },
    }));
  }

  if (observation.events.length >= 1000) {
    candidates.push(createHypothesis({
      summary: "Refactor shared modules for duplication",
      description: "Telemetry indicates high volume traffic. Evaluate opportunities to split shared utilities into composable packages to reduce duplication.",
      tasks: [
        "Scan repository for >5 duplicate function definitions",
        "Extract shared helpers into codex-compress package",
        "Update imports across services",
      ],
      impact: {
        duplicationDrop: 0.3,
      },
    }));
  }

  return candidates[0] ?? null;
}

function createHypothesis({
  summary,
  description,
  tasks,
  impact,
}: {
  summary: string;
  description: string;
  tasks: string[];
  impact: Hypothesis["expectedImpact"];
}): Hypothesis {
  const id = `hyp-${++hypothesisCounter}`;
  return {
    id,
    summary,
    description,
    targetBranch: `evo/${slugify(summary)}-${Date.now()}`,
    tasks,
    expectedImpact: impact,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizePath(path: string): string {
  return path
    .replace(/[^a-z0-9/]+/gi, "-")
    .replace(/\/+/, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\//g, "-");
}
