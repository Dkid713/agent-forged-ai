// codex/compressMessage.ts
// --------------------------------------------------------
// Public API entrypoint for Codex compression.
// - Determines μ-class (efficient/balanced/resistant)
// - Selects codec (hex | bracket | hybrid | codex)
// - Validates telemetry
// - Returns strongly typed response
// --------------------------------------------------------

import { z } from "zod";
import { runHexCodec } from "./codecs/hexCodec";
import { runBracketCodec } from "./codecs/bracketCodec";
import { runHybridCodec } from "./codecs/hybridCodec";
import { runCodexCodec } from "./codecs/codexCodec";

// =============================================================
// 0. TYPES
// =============================================================

export type MuClass = "e" | "b" | "r"; // efficient | balanced | resistant

export interface CompressMessageOptions {
  codec?: "hex" | "bracket" | "hybrid" | "codex";
  muClass?: MuClass;
  telemetry?: any;
}

export interface CompressionResult {
  original: string;
  compressed: string;
  codec: string;
  muClass: MuClass;
  bytesSaved: number;
  ratio: number;
  telemetry: any;
}

// =============================================================
// 1. TELEMETRY SCHEMA (STRICT)
// =============================================================

export const TelemetrySchema = z.object({
  timestamp: z.number().optional(),
  source: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

// -------------------------------------------------------------
// μ-class classifier (placeholder – upgradeable)
// -------------------------------------------------------------

function classifyMu(input: string): MuClass {
  if (!input) return "e";
  if (input.length < 64) return "e";
  if (input.length < 256) return "b";
  return "r";
}

// -------------------------------------------------------------
// Codec router
// -------------------------------------------------------------

function runCodec(codec: string, text: string): string {
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

// =============================================================
// 2. PUBLIC ENTRYPOINT
// =============================================================

export function compressMessage(
  message: string,
  opts: CompressMessageOptions = {}
): CompressionResult {
  if (!message || typeof message !== "string") {
    throw new Error("compressMessage: message must be a non-empty string.");
  }

  // Determine μ-class
  const muClass = opts.muClass ?? classifyMu(message);

  // Determine codec
  const codec = opts.codec ?? "codex";

  // Validate telemetry (never trust input)
  const validatedTelemetry = (() => {
    try {
      return TelemetrySchema.parse(opts.telemetry ?? {});
    } catch (err) {
      return { error: "invalid_telemetry" };
    }
  })();

  // Execute codec
  const compressed = runCodec(codec, message);

  // Calculate performance metrics
  const bytesSaved = Buffer.byteLength(message) - Buffer.byteLength(compressed);
  const ratio = Buffer.byteLength(compressed) / Buffer.byteLength(message);

  return {
    original: message,
    compressed,
    codec,
    muClass,
    bytesSaved,
    ratio,
    telemetry: validatedTelemetry,
  };
}
