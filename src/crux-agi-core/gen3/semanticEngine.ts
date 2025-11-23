import { Gen3Engine, Gen3AnalysisResult, Gen3Concept } from "../types/gen3";
import { CompressionInput, LayerContext } from "../types/core";
import { logInfo } from "../util/logger";

export class DefaultGen3Engine implements Gen3Engine {
  readonly name = "gen3" as const;

  async analyzeBatch(
    inputs: CompressionInput[],
    ctx: LayerContext
  ): Promise<Gen3AnalysisResult> {
    if (!ctx.config.gen3.enabled || inputs.length === 0) {
      return { concepts: [] };
    }

    // TODO: embed inputs, run clustering, compute gains, cohesion, etc.
    logInfo("GEN3", `Analyzing batch of ${inputs.length} docs`);

    const dummyConcept: Gen3Concept = {
      id: "concept-0",
      center: [0, 0, 0],
      supportTemplateIds: [],
      supportExamples: inputs.slice(0, 3).map(i => i.text),
      gainTokens: 0,
      cohesionScore: 0.0,
      transferScore: 0.0,
    };

    return {
      concepts: [dummyConcept],
    };
  }
}
