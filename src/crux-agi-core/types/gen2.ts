import type { CompressionInput, CompressionOutput, LayerContext } from "./core";

export interface Gen2Engine {
  name: "gen2";
  compress(input: CompressionInput, ctx: LayerContext): Promise<CompressionOutput>;
  getTemplates(): Promise<Gen2Template[]>;
  applyTemplateUpdate(update: Gen2TemplateUpdate): Promise<void>;
}

export interface Gen2Template {
  id: string;
  pattern: string; // e.g. "Customer {X} ordered {Y} on {DATE}"
  domain?: string;
  usageCount: number;
  avgSavingsTokens: number;
  lastUpdated: string;
}

export interface Gen2TemplateUpdate {
  add?: Gen2Template[];
  merge?: { fromIds: string[]; intoId: string }[];
  removeIds?: string[];
}
