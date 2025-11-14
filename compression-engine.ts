/* ============================================================
 * 5. TELEMETRY (Zod Schema + Validation)
 * ============================================================ */

import { z } from "zod";

const NonNegInt = z.number().int().min(0);
const NonNegNum = z.number().min(0);

export const AthenaTelemetrySchema = z
  .object({
    event_id: z.string().optional(),
    ts: z.string().datetime().optional(),

    model: z.string().min(1),
    provider: z.string().optional(),

    mu_class: z.enum(["e", "b", "r"]),

    codec_attempted: z.enum(["hex", "bracket", "hybrid", "codex", "off"]),
    codec_decided: z.enum(["hex", "bracket", "hybrid", "codex", "off"]),

    native_tokens_pre: NonNegInt,
    native_tokens_post: NonNegInt,
    tokens_saved: z.number().int(),
    saved_pct: z.number(),

    bytes_pre: NonNegInt,
    bytes_post: NonNegInt,
    bytes_saved: z.number().int(),

    decision: z.enum(["serve", "bypass"]),
    reason: z.string(),

    latency_ms: NonNegInt,
    cost_usd: NonNegNum,
  })
  .superRefine((v, ctx) => {
    // invariant: tokens_saved == pre - post
    const expectedTokens = v.native_tokens_pre - v.native_tokens_post;
    if (v.tokens_saved !== expectedTokens) {
      ctx.addIssue({
        code: "custom",
        path: ["tokens_saved"],
        message: `tokens_saved must equal native_tokens_pre - native_tokens_post (${expectedTokens})`,
      });
    }

    // invariant: bytes_saved == pre - post
    const expectedBytes = v.bytes_pre - v.bytes_post;
    if (v.bytes_saved !== expectedBytes) {
      ctx.addIssue({
        code: "custom",
        path: ["bytes_saved"],
        message: `bytes_saved must equal bytes_pre - bytes_post (${expectedBytes})`,
      });
    }
  });

export type AthenaTelemetry = z.infer<typeof AthenaTelemetrySchema>;

/* ============================================================
 * 6. µ-MODEL CLASSIFICATION
 * ============================================================ */

export type MuClass = "e" | "b" | "r";

export function classifyModel(model: string): MuClass {
  const m = model.toLowerCase();

  // Efficient: known compression champs
  if (
    m.includes("gpt-3.5") ||
    m.includes("3.5-turbo") ||
    m.includes("grok-2") ||
    m.includes("mini") // optional
  ) {
    return "e";
  }

  // Balanced: will compress but not aggressively
  if (
    m.includes("gpt-4o") ||
    m.includes("4o-mini") ||
    m.includes("code") ||
    m.includes("claude") ||
    m.includes("haiku")
  ) {
    return "b";
  }

  // Resistant: GPT-5, Grok-3-Mini, some Llama variants
  return "r";
}

/* ============================================================
 * 7. CODEC RESULT TYPES (Used by compressMessage)
 * ============================================================ */

export type CodecName = "hex" | "bracket" | "hybrid" | "codex" | "off";

export interface CodecResult {
  codec: CodecName;
  text: string;
  preTokens: number;
  postTokens: number;
  preBytes: number;
  postBytes: number;
  meta?: Record<string, unknown>;
}

/* ============================================================
 * 8. ROUTING HELPERS USED BY compressMessage()
 * ============================================================ */

// Token / byte helpers
export function approxTokenCount(text: string): number {
  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean).length;
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function normalizeStats(preTokens: number, postTokens: number) {
  const tokens_saved = preTokens - postTokens;
  const saved_pct = preTokens === 0 ? 0 : (tokens_saved / preTokens) * 100;
  const ratio =
    postTokens === 0
      ? 1
      : preTokens === 0
      ? 1
      : preTokens / postTokens;

  return { tokens_saved, saved_pct, ratio };
}

export function prequalify(text: string) {
  if (!text || !text.trim()) return { ok: false, reason: "empty" };

  if (/```[\s\S]*?```/.test(text)) return { ok: false, reason: "code_block" };
  if (/https?:\/\//i.test(text)) return { ok: false, reason: "urls" };

  if (byteLength(text) < 256) return { ok: false, reason: "short" };

  return { ok: true as const, reason: "ok" };
}

export function benefit(preTokens: number, postTokens: number) {
  if (preTokens === 0) {
    return {
      shouldServe: false,
      eff_percent: 0,
      reason: "no_input_tokens",
    };
  }

  const tokens_saved = preTokens - postTokens;
  const eff = tokens_saved / preTokens;
  const eff_percent = eff * 100;

  if (tokens_saved <= 0) {
    return {
      shouldServe: false,
      eff_percent,
      reason: "expansion_or_no_gain",
    };
  }

  // Default production threshold
  if (eff < 0.1) {
    return {
      shouldServe: false,
      eff_percent,
      reason: `Efficiency too low (${eff_percent.toFixed(1)}% < 10.0%)`,
    };
  }

  return {
    shouldServe: true,
    eff_percent,
    reason: "beneficial",
  };
}
