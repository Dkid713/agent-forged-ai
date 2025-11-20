import { Gen2Engine, Gen2Template, Gen2TemplateUpdate } from "../types/gen2";
import { CompressionInput, CompressionOutput, LayerContext } from "../types/core";
import { logInfo } from "../util/logger";

export class DefaultGen2Engine implements Gen2Engine {
  readonly name = "gen2" as const;

  private templates: Map<string, Gen2Template> = new Map();

  constructor(initialTemplates: Gen2Template[] = []) {
    for (const t of initialTemplates) {
      this.templates.set(t.id, t);
    }
  }

  async compress(
    input: CompressionInput,
    ctx: LayerContext
  ): Promise<CompressionOutput> {
    const originalTokens = this.countTokens(input.text);

    // TODO: pattern-matching + substitution using this.templates
    const compressedText = input.text;
    const compressedTokens = this.countTokens(compressedText);

    const savings = originalTokens - compressedTokens;
    const ratio = compressedTokens / Math.max(1, originalTokens);

    if (savings < ctx.config.gen2.minSavingsTokens) {
      logInfo(ctx.requestId, "[Gen2] net benefit too small, skipping templates");
      return {
        id: input.id,
        originalTokens,
        compressedTokens: originalTokens,
        savings: 0,
        ratio: 1,
        codecTrace: [
          {
            layer: "gen2",
            codec: "templates",
            applied: false,
            tokensBefore: originalTokens,
            tokensAfter: originalTokens,
            notes: "Net benefit below threshold",
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
          layer: "gen2",
          codec: "templates",
          applied: true,
          tokensBefore: originalTokens,
          tokensAfter: compressedTokens,
        },
      ],
    };
  }

  async getTemplates(): Promise<Gen2Template[]> {
    return [...this.templates.values()];
  }

  async applyTemplateUpdate(update: Gen2TemplateUpdate): Promise<void> {
    if (update.add) {
      for (const t of update.add) {
        this.templates.set(t.id, t);
      }
    }

    if (update.merge) {
      for (const m of update.merge) {
        const into = this.templates.get(m.intoId);
        if (!into) continue;
        for (const fromId of m.fromIds) {
          const from = this.templates.get(fromId);
          if (!from) continue;
          into.usageCount += from.usageCount;
          into.avgSavingsTokens = (into.avgSavingsTokens + from.avgSavingsTokens) / 2;
          this.templates.delete(fromId);
        }
      }
    }

    if (update.removeIds) {
      for (const id of update.removeIds) {
        this.templates.delete(id);
      }
    }
  }

  private countTokens(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }
}
