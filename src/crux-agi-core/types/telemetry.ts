import type { LayerName } from "./core";

export interface CompressionKPI {
  layer: LayerName;
  windowSize: number;
  docsSeen: number;
  p50Savings: number; // tokens
  p90Savings: number;
  expansionRate: number; // fraction of docs with expansion blocked
  errorFreeRate: number; // reversibility checks
}

export interface ConceptKPI {
  conceptsTracked: number;
  avgCohesionScore: number;
  avgTransferScore: number;
  strongConcepts: number;
}

export interface FeedbackKPI {
  cyclesRun: number;
  g2UpdatesApplied: number;
  g1UpdatesApplied: number;
  avgDeltaSavingsTokens: number;
  regressionsDetected: number;
}
