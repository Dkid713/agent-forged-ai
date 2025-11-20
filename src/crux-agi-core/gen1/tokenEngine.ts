import { Gen1Engine, Gen1RulesetUpdate } from "../types/gen1";
import { CompressionInput, CompressionOutput, LayerContext } from "../types/core";
import { ok, err, Result } from "../util/result";
import { logInfo } from "../util/logger";

export class DefaultGen1Engine implements Gen1Engine {
  readonly name = "gen1" as const;

  constructor(private rulesetVersion: string) {}

  async compress(
    input: CompressionInput,
    ctx: LayerContext
  ): Promise<CompressionOutput> {
    const originalTokens = this.countTokens(input.text);

    // TODO: plug in your actual Gen1 logic (BPE, bracket, hex, etc.)
    const compressedText = input.text; // placeholder
    const compressedTokens = this.countTokens(compressedText);

    const savings = originalTokens - compressedTokens;
    const ratio = compressedTokens / Math.max(1, originalTokens);

    const expansion = ratio > ctx.config.gen1.maxExpansionRatio;
    if (expansion) {
      logInfo(ctx.requestId, "[Gen1] expansion blocked, returning original text");
      return {
        id: input.id,
        originalTokens,
        compressedTokens: originalTokens,
        savings: 0,
        ratio: 1,
        codecTrace: [
          {
            layer: "gen1",
            codec: "none",
            applied: false,
            tokensBefore: originalTokens,
            tokensAfter: originalTokens,
            notes: "Expansion blocked",
          },
        ],
      };
    }

    return {
      id: input.id,
      originalTokens,
      compressedTokens,
      savings,
      ratio,
      codecTrace: [
        {
          layer: "gen1",
          codec: "gen1-core",
          applied: true,
          tokensBefore: originalTokens,
          tokensAfter: compressedTokens,
        },
      ],
    };
  }

  async updateRuleset(update: Gen1RulesetUpdate): Promise<void> {
    // TODO: write ruleset to disk / DB or refresh in-memory structures
    this.rulesetVersion = update.rulesetVersion;
  }

  private countTokens(text: string): number {
    // Replace with your real tokenizer
    return text.split(/\s+/).filter(Boolean).length;
  }
}
