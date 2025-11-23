import type {
  AthenaConfig,
  FeedbackConfig,
  Gen1Config,
  Gen2Config,
  Gen3Config,
  TelemetryConfig
} from "../../shared/athena-core/config";
import type { AthenaOmegaParams } from "../../shared/athena-core/athenaOmegaBaseline";

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
  omegaPsiKuramoto: AthenaOmegaParams;
}

export type {
  AthenaConfig,
  FeedbackConfig,
  Gen1Config,
  Gen2Config,
  Gen3Config,
  TelemetryConfig
};
