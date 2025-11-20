import { Gen2Engine, Gen2TemplateUpdate } from "../types/gen2";
import { Gen3Engine, Gen3AnalysisResult } from "../types/gen3";
import { Gen1Engine, Gen1RulesetUpdate } from "../types/gen1";
import { CompressionInput, LayerContext } from "../types/core";
import { logInfo } from "../util/logger";

export interface FeedbackManager {
  runCycle(batch: CompressionInput[], ctx: LayerContext): Promise<void>;
}

export class DefaultFeedbackManager implements FeedbackManager {
  constructor(
    private gen1: Gen1Engine,
    private gen2: Gen2Engine,
    private gen3: Gen3Engine
  ) {}

  async runCycle(batch: CompressionInput[], ctx: LayerContext): Promise<void> {
    if (!ctx.config.feedback.enabled) return;

    // 1) Gen3 analyzes concepts
    const analysis: Gen3AnalysisResult = await this.gen3.analyzeBatch(batch, ctx);

    // 2) Decide updates for Gen2 templates
    const g2Update = await this.buildGen2Update(analysis, ctx);

    // 3) Decide updates for Gen1 token rules
    const g1Update = await this.buildGen1Update(analysis, ctx);

    // 4) Apply updates (safely, small steps)
    if (g2Update) {
      logInfo("FEEDBACK", "Applying Gen2 template update");
      await this.gen2.applyTemplateUpdate(g2Update);
    }

    if (g1Update) {
      logInfo("FEEDBACK", "Applying Gen1 ruleset update");
      await this.gen1.updateRuleset(g1Update);
    }
  }

  private async buildGen2Update(
    analysis: Gen3AnalysisResult,
    ctx: LayerContext
  ): Promise<Gen2TemplateUpdate | null> {
    const { minConceptGain } = ctx.config.gen3;
    const strongConcepts = analysis.concepts.filter(
      c =>
        c.gainTokens >= minConceptGain &&
        c.cohesionScore >= 0.7
    );
    if (strongConcepts.length === 0) return null;

    // NOTE: here you'd build actual template additions/merges
    // For now, we just log that we'd promote them
    logInfo("FEEDBACK", `Strong concepts detected: ${strongConcepts.length}`);

    return {
      add: [], // concepts -> new templates
      merge: [], // overlapping templates
      removeIds: [],
    };
  }

  private async buildGen1Update(
    analysis: Gen3AnalysisResult,
    ctx: LayerContext
  ): Promise<Gen1RulesetUpdate | null> {
    // Example: promote stable tokens from concepts into non-split list
    const forbiddenSplits: string[] = [];
    const mergesToPromote: string[] = [];
    const mergesToDemote: string[] = [];

    // TODO: infer merges from concept patterns / embeddings

    if (
      forbiddenSplits.length === 0 &&
      mergesToPromote.length === 0 &&
      mergesToDemote.length === 0
    ) {
      return null;
    }

    return {
      rulesetVersion: `auto-${Date.now()}`,
      mergesToPromote,
      mergesToDemote,
      forbiddenSplits,
    };
  }
}
