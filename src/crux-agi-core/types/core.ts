export type LayerName = "gen1" | "gen2" | "gen3";

export interface CompressionInput {
  id: string; // request / doc id
  text: string;
  metadata?: Record<string, unknown>;
}

export interface CompressionOutput {
  id: string;
  originalTokens: number;
  compressedTokens: number;
  savings: number; // original - compressed
  ratio: number; // compressed / original
  codecTrace: CodecTrace[];
  logs?: string[];
}

export interface CodecTrace {
  layer: LayerName;
  codec: string;
  applied: boolean;
  tokensBefore: number;
  tokensAfter: number;
  notes?: string;
}

export interface ReversibleCodec {
  name: string;
  encode(input: string): Promise<string>;
  decode(input: string): Promise<string>;
}

export interface LayerContext {
  requestId: string;
  config: AthenaConfig;
  // extensible for caches, embeddings, etc.
}

export interface AthenaConfig {
  gen1: Gen1Config;
  gen2: Gen2Config;
  gen3: Gen3Config;
  feedback: FeedbackConfig;
  telemetry: TelemetryConfig;
}

// Forward declarations to keep this modular
export interface Gen1Config {
  enabled: boolean;
  maxExpansionRatio: number; // e.g. 1.00, 0.8, etc.
  rulesetVersion: string;
}

export interface Gen2Config {
  enabled: boolean;
  dictionaryVersion: string;
  minSavingsTokens: number;
}

export interface Gen3Config {
  enabled: boolean;
  model: "text-embeddings" | "custom";
  minClusterSize: number;
  minConceptGain: number;
}

export interface FeedbackConfig {
  enabled: boolean;
  minDeltaSavingsTokens: number;
  safetyFirst: boolean;
}

export interface TelemetryConfig {
  enabled: boolean;
  sampleRate: number; // 0..1
  kpiWindowSize: number; // e.g. 10_000 docs
}
