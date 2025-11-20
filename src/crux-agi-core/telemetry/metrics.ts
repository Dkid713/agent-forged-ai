import {
  CompressionKPI,
  ConceptKPI,
  FeedbackKPI,
} from "../types/telemetry";

export class Telemetry {
  private compressionSamples: Map<string, number[]> = new Map();

  recordCompression(layer: string, savings: number): void {
    const key = `compression:${layer}`;
    const list = this.compressionSamples.get(key) ?? [];
    list.push(savings);
    this.compressionSamples.set(key, list);
  }

  computeCompressionKPI(layer: string, windowSize: number): CompressionKPI {
    const key = `compression:${layer}`;
    const samples = this.compressionSamples.get(key) ?? [];
    const latest = samples.slice(-windowSize).sort((a, b) => a - b);
    const docsSeen = latest.length;

    const p50 = docsSeen ? latest[Math.floor(docsSeen * 0.5)] : 0;
    const p90 = docsSeen ? latest[Math.floor(docsSeen * 0.9)] : 0;

    return {
      layer: layer as any,
      windowSize,
      docsSeen,
      p50Savings: p50,
      p90Savings: p90,
      expansionRate: 0, // TODO: populate
      errorFreeRate: 1, // TODO: populate
    };
  }

  // Stubs – fill with your Gen3 + feedback stats
  computeConceptKPI(): ConceptKPI {
    return {
      conceptsTracked: 0,
      avgCohesionScore: 0,
      avgTransferScore: 0,
      strongConcepts: 0,
    };
  }

  computeFeedbackKPI(): FeedbackKPI {
    return {
      cyclesRun: 0,
      g2UpdatesApplied: 0,
      g1UpdatesApplied: 0,
      avgDeltaSavingsTokens: 0,
      regressionsDetected: 0,
    };
  }
}
