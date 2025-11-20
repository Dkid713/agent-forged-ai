import type { CompressionInput, CompressionOutput, LayerContext } from "./core";

export interface Gen1Engine {
  name: "gen1";
  compress(input: CompressionInput, ctx: LayerContext): Promise<CompressionOutput>;
  updateRuleset(update: Gen1RulesetUpdate): Promise<void>;
}

export interface Gen1RulesetUpdate {
  rulesetVersion: string;
  mergesToPromote: string[]; // tokens/subwords to merge
  mergesToDemote: string[]; // merges to remove
  forbiddenSplits: string[]; // subwords not to split
}
