import { randomUUID } from "crypto";
import { z } from "zod";

/* ============================================================
 * 0. TYPES
 * ============================================================ */

export type MuClass = "e" | "b" | "r"; // efficient | balanced | resistant
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

export interface CompressionDecision {
  used: boolean;
  decision: "serve" | "bypass";
  reason: string;
  eff_percent: number;
  tokens_saved: number;
  bytes_saved: number;
  codec: CodecName;
  text: string;
  telemetry: AthenaTelemetry;
}

export interface CodexEnv {
  // You wire this to your code-focused model (Grok Code, GPT-code, etc.)
  runCodexTransform: (input: string) => Promise<string>;
}

/* ============================================================
 * 1. CORE UTILITIES
 * ============================================================ */

// Approx token counter (you can swap in tiktoken or Anthropic tokenizers)
function approxTokenCount(text: string): number {
  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean).length;
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function normalizeStats(preTokens: number, postTokens: number) {
  const tokens_saved = preTokens - postTokens;
  const saved_pct = preTokens === 0 ? 0 : (tokens_saved / preTokens) * 100;
  const ratio = preTokens === 0 || postTokens === 0 ? 1 : preTokens / postTokens;
  return { tokens_saved, saved_pct, ratio };
}

export function prequalify(text: string) {
  if (!text || !text.trim()) return { ok: false, reason: "empty" };

  // Code blocks, heavy math, etc. often not good candidates
  if (/```[\s\S]*?```/.test(text)) return { ok: false, reason: "code_block" };
  if (/https?:\/\//i.test(text)) return { ok: false, reason: "urls" };

  // Extremely short
  if (byteLength(text) < 256) return { ok: false, reason: "short" };

  return { ok: true as const };
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

  // Default: require ≥10% token savings
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

/* ============================================================
 * 2. CODECS
 * ============================================================ */

// Simple bracket codec: demo implementation (you can make smarter)
async function bracketCodec(text: string): Promise<CodecResult> {
  const preTokens = approxTokenCount(text);
  const preBytes = byteLength(text);

  // Example: collapse multiple spaces, some markdown noise
  const transformed = text.replace(/[ ]{2,}/g, " ");

  const postTokens = approxTokenCount(transformed);
  const postBytes = byteLength(transformed);

  return {
    codec: "bracket",
    text: transformed,
    preTokens,
    postTokens,
    preBytes,
    postBytes,
  };
}

// Hex codec placeholder (you can wire real steno here)
async function hexCodec(text: string): Promise<CodecResult> {
  const preTokens = approxTokenCount(text);
  const preBytes = byteLength(text);

  // For now, just identity; in your system this would be your steno hex transform
  const transformed = text;

  const postTokens = approxTokenCount(transformed);
  const postBytes = byteLength(transformed);

  return {
    codec: "hex",
    text: transformed,
    preTokens,
    postTokens,
    preBytes,
    postBytes,
  };
}

// Codex codec: uses a provided CodexEnv to transform code-heavy text
async function codexCodec(text: string, env?: CodexEnv): Promise<CodecResult> {
  const preTokens = approxTokenCount(text);
  const preBytes = byteLength(text);

  let transformed = text;
  if (env?.runCodexTransform) {
    try {
      transformed = await env.runCodexTransform(text);
    } catch {
      // If Codex fails, just pass original through as no-op
      transformed = text;
    }
  }

  const postTokens = approxTokenCount(transformed);
  const postBytes = byteLength(transformed);

  return {
    codec: "codex",
    text: transformed,
    preTokens,
    postTokens,
    preBytes,
    postBytes,
  };
}

// Hybrid codec: try hex, then bracket, then codex for code-heavy content
async function hybridCodec(
  text: string,
  env?: CodexEnv,
  isCodeHeavy = false
): Promise<CodecResult> {
  const results: CodecResult[] = [];

  // 1) Try hex
  const hexRes = await hexCodec(text);
  results.push(hexRes);

  // 2) Try bracket
  const brRes = await bracketCodec(text);
  results.push(brRes);

  // 3) For code-heavy payloads, let Codex have a shot
  if (isCodeHeavy) {
    const codexRes = await codexCodec(text, env);
    results.push(codexRes);
  }

  // Choose the best by tokens_saved
  let best = results[0];
  let bestSaved = best.preTokens - best.postTokens;

  for (const r of results.slice(1)) {
    const saved = r.preTokens - r.postTokens;
    if (saved > bestSaved) {
      best = r;
      bestSaved = saved;
    }
  }

  return best;
}

/* ============================================================
 * 3. CruxRC-v1 RESPONSE COMPRESSION (HEADER + DECODER)
 * ============================================================ */

export type ResponseStyle = "STRICT" | "FIRST_MENTION";

export function buildCruxSystemPrompt(
  model: string,
  dictVersion = "default",
  style: ResponseStyle = "FIRST_MENTION"
): string {
  return [
    `#CRUXRC v1; model=${model}; dict=${dictVersion}; tokens_target=short; response_style=${style}`,
    "Emit compressed answers using these guidelines:",
    style === "STRICT"
      ? "Use ONLY approved acronyms. Do NOT write full terms."
      : "On first occurrence, write 'full term (ACRONYM)'. Thereafter, use acronym only.",
    "No decorative symbols. No extra commentary.",
    "If you cannot comply, reply exactly '#CRUXRC BYPASS'.",
  ].join("\n");
}

const HEADER_RE =
  /^#CRUXRC v1;\s*model=([^;]+);\s*dict=([^;]+);\s*tokens_target=(\w+)\s*(?:;\s*response_style=(STRICT|FIRST_MENTION))?\s*$/i;

export function parseCruxHeader(line: string) {
  const m = line.trim().match(HEADER_RE);
  if (!m) return { ok: false as const };
  const [, model, dict, target, style] = m;
  return {
    ok: true as const,
    model,
    dict,
    target,
    responseStyle: (style as ResponseStyle) || "FIRST_MENTION",
  };
}

const ACRO_MAP: Record<string, string> = {
  AI: "artificial intelligence",
  ML: "machine learning",
  NLP: "natural language processing",
  LLM: "large language model",
  UX: "user experience",
};

function stripHeader(raw: string): string {
  const lines = raw.split(/\r?\n/);
  if (lines.length && lines[0].startsWith("#CRUXRC")) lines.shift();
  return lines.join("\n");
}

function expandFirstMentionOnly(text: string): string {
  const seen = new Set<string>();
  return text.replace(/\b(AI|ML|NLP|LLM|UX)\b/g, (m) => {
    const base = m.toUpperCase();
    if (seen.has(base)) return m;
    seen.add(base);
    const full = ACRO_MAP[base] ?? m;
    return `${full} (${m})`;
  });
}

function collapseFullTerms(text: string): string {
  return text
    .replace(/\bartificial intelligence\s*\(AI\)/gi, "AI")
    .replace(/\bmachine learning\s*\(ML\)/gi, "ML")
    .replace(/\bnatural language processing\s*\(NLP\)/gi, "NLP")
    .replace(/\blarge language models?\s*\(LLM\)/gi, "LLM")
    .replace(/\buser experience\s*\(UX\)/gi, "UX");
}

export function processCruxReply(
  rawResponse: string,
  style: ResponseStyle
): { text: string; mode: "compressed" | "normal" | "bypass"; header_ok: boolean } {
  const raw = rawResponse.trim();
  const firstLine = raw.split(/\r?\n/, 1)[0] ?? "";

  if (/^#CRUXRC\s+BYPASS/i.test(firstLine)) {
    return {
      text: raw.split(/\r?\n/).slice(1).join("\n"),
      mode: "bypass",
      header_ok: false,
    };
  }

  const header = parseCruxHeader(firstLine);
  if (!header.ok) {
    return { text: raw, mode: "normal", header_ok: false };
  }

  const body = stripHeader(raw);
  let out = body;

  if (style === "STRICT") {
    out = collapseFullTerms(out);
  } else {
    out = expandFirstMentionOnly(out);
  }

  return { text: out, mode: "compressed", header_ok: true };
}

/* ============================================================
 * 4. FORENSIC SEMANTIC PRESERVATION (LIGHT VERSION)
 * ============================================================ */

export interface SemanticContext {
  has_math: boolean;
  has_code: boolean;
  has_urls: boolean;
  density: number;
}

export function analyzeSemanticContext(text: string): SemanticContext {
  const tokens = approxTokenCount(text) || 1;
  return {
    has_math: /[0-9\=\+\-\*\/]+/.test(text),
    has_code: /```[\s\S]*?```/.test(text),
    has_urls: /https?:\/\//.test(text),
    density: text.length / tokens,
  };
}

export function validateSemanticPreservation(
  before: SemanticContext,
  after: SemanticContext
): { safe: boolean; reason?: string } {
  // If density changes too much, maybe semantics shifted too hard
  const delta = Math.abs(after.density - before.density) / before.density;
  if (delta > 0.5) {
    return { safe: false, reason: "density_shift" };
  }
  return { safe: true };
}

/* ============================================================
 * 5. TELEMETRY (Zod)
 * ============================================================ */

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
    const expectedSaved = v.native_tokens_pre - v.native_tokens_post;
    if (v.tokens_saved !== expectedSaved) {
      ctx.addIssue({
        code: "custom",
        path: ["tokens_saved"],
        message: `tokens_saved must equal native_tokens_pre - native_tokens_post (${expectedSaved})`,
      });
    }
  });

export type AthenaTelemetry = z.infer<typeof AthenaTelemetrySchema>;

/* ============================================================
 * 6. μ-CLASSIFICATION & ROUTER
 * ============================================================ */

export function classifyModel(model: string): MuClass {
  const lower = model.toLowerCase();
  if (lower.includes("gpt-3.5") || lower.includes("grok-2")) return "e";
  if (lower.includes("gpt-4o") || lower.includes("code")) return "b";
  return "r";
}

/* ============================================================
 * 7. PUBLIC ENTRYPOINT
 * ============================================================ */

interface CompressMessageOptions {
  model: string;
  provider?: string;
  codexEnv?: CodexEnv;
  estimatedCostUsd?: number;
}

function generateEventId() {
  try {
    return randomUUID();
  } catch {
    return "";
  }
}

export async function compressMessage(
  originalText: string,
  opts: CompressMessageOptions
): Promise<CompressionDecision> {
  const start = Date.now();
  const { model, provider = "unknown", codexEnv } = opts;

  const mu = classifyModel(model);
  const pre = approxTokenCount(originalText);
  const preBytes = byteLength(originalText);

  // 1. prequalify
  const pq = prequalify(originalText);
  if (!pq.ok || mu === "r") {
    const telemetry: AthenaTelemetry = {
      event_id: generateEventId(),
      ts: new Date().toISOString(),
      model,
      provider,
      mu_class: mu,
      codec_attempted: "off",
      codec_decided: "off",
      native_tokens_pre: pre,
      native_tokens_post: pre,
      tokens_saved: 0,
      saved_pct: 0,
      bytes_pre: preBytes,
      bytes_post: preBytes,
      bytes_saved: 0,
      decision: "bypass",
      reason: pq.ok ? "resistant_or_noop" : pq.reason,
      latency_ms: Date.now() - start,
      cost_usd: opts.estimatedCostUsd ?? 0,
    };
    return {
      used: false,
      decision: "bypass",
      reason: telemetry.reason,
      eff_percent: 0,
      tokens_saved: 0,
      bytes_saved: 0,
      codec: "off",
      text: originalText,
      telemetry,
    };
  }

  // 2. choose codec
  const isCodeHeavy = /```[\s\S]*?```/.test(originalText) || /cmd = \[/.test(originalText);
  let codecResult: CodecResult;

  if (mu === "e") {
    codecResult = await hybridCodec(originalText, codexEnv, isCodeHeavy);
  } else {
    // balanced: usually bracket, with codex if code heavy
    codecResult = isCodeHeavy
      ? await codexCodec(originalText, codexEnv)
      : await bracketCodec(originalText);
  }

  // 3. benefit gate
  const gate = benefit(codecResult.preTokens, codecResult.postTokens);

  const tokens_saved = codecResult.preTokens - codecResult.postTokens;
  const bytes_saved = codecResult.preBytes - codecResult.postBytes;
  const saved_pct =
    codecResult.preTokens === 0
      ? 0
      : (tokens_saved / codecResult.preTokens) * 100;

  const finalText = gate.shouldServe ? codecResult.text : originalText;
  const latency_ms = Date.now() - start;

  const telemetryCandidate: AthenaTelemetry = {
    event_id: generateEventId(),
    ts: new Date().toISOString(),
    model,
    provider,
    mu_class: mu,
    codec_attempted: codecResult.codec,
    codec_decided: gate.shouldServe ? codecResult.codec : "off",
    native_tokens_pre: codecResult.preTokens,
    native_tokens_post: codecResult.postTokens,
    tokens_saved,
    saved_pct,
    bytes_pre: codecResult.preBytes,
    bytes_post: codecResult.postBytes,
    bytes_saved,
    decision: gate.shouldServe ? "serve" : "bypass",
    reason: gate.reason,
    latency_ms,
    cost_usd: opts.estimatedCostUsd ?? 0,
  };

  const telemetry = AthenaTelemetrySchema.parse(telemetryCandidate);

  return {
    used: gate.shouldServe,
    decision: telemetry.decision,
    reason: telemetry.reason,
    eff_percent: saved_pct,
    tokens_saved,
    bytes_saved,
    codec: telemetry.codec_decided,
    text: finalText,
    telemetry,
  };
}

