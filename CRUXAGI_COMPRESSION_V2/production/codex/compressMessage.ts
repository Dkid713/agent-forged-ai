// CRUXAGI_COMPRESSION_V2/production/codex/compressMessage.ts
// ------------------------------------------------------------
// Public entrypoint for Codex compression v2
// Provides: compressed text, bytes saved, tokens saved,
// μ-class, compressionPercent, and codec routing.

import { z } from "zod";
import { runHexCodec } from "./codecs/hexCodec.js";
import { runBracketCodec } from "./codecs/bracketCodec.js";
import { runHybridCodec } from "./codecs/hybridCodec.js";
import { runCodexCodec } from "./codecs/codexCodec.js";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export type MuClass = "e" | "b" | "r"; // efficient | balanced | resistant

export interface CompressMessageOptions {
  model?: string; // e.g., "gpt-3.5-turbo"
  codec?: "hex" | "bracket" | "hybrid" | "codex";
  muClass?: MuClass; // Optional override
  telemetry?: unknown;
}

export interface CompressionResult {
  original: string;
  compressed: string;
  codec: string;
  muClass: MuClass;

  // Core metrics
  bytesSaved: number;
  ratio: number; // compressed / original
  compressionPercent: number; // 1 - ratio
  tokensSaved: number; // proxy of improvement

  telemetry: unknown;
}

// ------------------------------------------------------------
// Telemetry schema (strict validation)
// ------------------------------------------------------------

export const TelemetrySchema = z
  .object({
    timestamp: z.number().optional(),
    source: z.string().optional(),
    meta: z.record(z.any()).optional(),
  })
  .strict();

// ------------------------------------------------------------
// μ-class estimator
// ------------------------------------------------------------
function classifyMu(message: string, model?: string): MuClass {
  if (model?.toLowerCase().includes("mini") || message.length < 80) {
    return "e";
  }
  if (message.length < 400) {
    return "b";
  }
  return "r";
}

// ------------------------------------------------------------
// Codec router
// ------------------------------------------------------------
function routeCodec(codec: string, text: string): string {
  switch (codec) {
    case "hex":
      return runHexCodec(text);
    case "bracket":
      return runBracketCodec(text);
    case "hybrid":
      return runHybridCodec(text);
    case "codex":
      return runCodexCodec(text);
    default:
      throw new Error(`Unsupported codec: ${codec}`);
  }
}

// ------------------------------------------------------------
// Helper: Safe byte length for browser + Node
// ------------------------------------------------------------
function byteLen(str: string): number {
  return new TextEncoder().encode(str).length;
}

// ------------------------------------------------------------
// PUBLIC ENTRYPOINT
// ------------------------------------------------------------
export function compressMessage(
  message: string,
  opts: CompressMessageOptions = {}
): CompressionResult {
  if (!message || typeof message !== "string") {
    throw new Error("compressMessage: message must be a non-empty string.");
  }

  const muClass: MuClass = opts.muClass ?? classifyMu(message, opts.model);
  const codec = opts.codec ?? "codex";

  const telemetry = (() => {
    try {
      return TelemetrySchema.parse(opts.telemetry ?? {});
    } catch {
      return { error: "invalid_telemetry" };
    }
  })();

  const compressed = routeCodec(codec, message);

  const originalBytes = byteLen(message);
  const compressedBytes = byteLen(compressed);

  const bytesSaved = originalBytes - compressedBytes;
  const ratio = originalBytes === 0 ? 1 : compressedBytes / originalBytes;
  const tokensSaved = Math.max(0, Math.round(bytesSaved / 4));
  const compressionPercent = Math.round((1 - ratio) * 1000) / 10;

  return {
    original: message,
    compressed,
    codec,
    muClass,
    bytesSaved,
    ratio,
    compressionPercent,
    tokensSaved,
    telemetry,
  };
}
