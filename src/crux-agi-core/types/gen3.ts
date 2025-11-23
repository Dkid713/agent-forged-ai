import type { CompressionInput, LayerContext } from "./core";

export interface Gen3Engine {
  name: "gen3";
  analyzeBatch(
    inputs: CompressionInput[],
    ctx: LayerContext
  ): Promise<Gen3AnalysisResult>;
}

export interface Gen3Concept {
  id: string;
  center: number[]; // embedding centroid
  supportTemplateIds: string[];
  supportExamples: string[];
  gainTokens: number; // total savings attributable
  cohesionScore: number; // 0..1
  transferScore: number; // 0..1 cross-domain ability
}

export interface Gen3AnalysisResult {
  concepts: Gen3Concept[];
  rawEmbeddings?: number[][];
}
