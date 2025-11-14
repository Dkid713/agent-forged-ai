/* ============================================================
 * Compression Engine Utilities and Types
 * ============================================================ */

export type MuClass = "e" | "b" | "r";

export interface CodexEnv {
  runCodexTransform(text: string): Promise<string>;
}

export type CodecKind = "hex" | "bracket" | "codex" | "hybrid" | "off";

export interface CodecResult {
  codec: CodecKind;
  text: string;
  preTokens: number;
  postTokens: number;
  preBytes: number;
  postBytes: number;
}

export interface CompressionDecision {
  used: boolean;
  decision: "serve" | "bypass";
  reason: string;
  eff_percent: number;
  tokens_saved: number;
  bytes_saved: number;
  codec: CodecKind;
  text: string;
  telemetry: AthenaTelemetry;
}

export interface AthenaTelemetry {
  event_id: string;
  ts: string;
  model: string;
  provider: string;
  mu_class: MuClass;
  codec_attempted: CodecKind;
  codec_decided: CodecKind;
  native_tokens_pre: number;
  native_tokens_post: number;
  tokens_saved: number;
  saved_pct: number;
  bytes_pre: number;
  bytes_post: number;
  bytes_saved: number;
  decision: "serve" | "bypass";
  reason: string;
  latency_ms: number;
  cost_usd: number;
}

interface BenefitGate {
  shouldServe: boolean;
  reason: string;
}

interface PrequalifyResult {
  ok: boolean;
  reason?: string;
}

export const AthenaTelemetrySchema = {
  parse(input: AthenaTelemetry): AthenaTelemetry {
    return {
      ...input,
      codec_attempted: input.codec_attempted ?? "off",
      codec_decided: input.codec_decided ?? "off",
    };
  },
};

export function approxTokenCount(text: string): number {
  if (!text) {
    return 0;
  }

  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const approximation = Math.ceil(words.length * 1.33);
  return approximation || Math.ceil(text.length / 4);
}

export function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

export function prequalify(text: string): PrequalifyResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }

  if (trimmed.length < 20) {
    return { ok: false, reason: "too_short" };
  }

  if (/\u0000/.test(trimmed)) {
    return { ok: false, reason: "contains_null" };
  }

  return { ok: true };
}

export function benefit(preTokens: number, postTokens: number): BenefitGate {
  if (preTokens === 0) {
    return { shouldServe: false, reason: "no_tokens" };
  }

  if (postTokens >= preTokens) {
    return { shouldServe: false, reason: "no_savings" };
  }

  const savedPct = ((preTokens - postTokens) / preTokens) * 100;

  if (savedPct < 10) {
    return { shouldServe: false, reason: "below_threshold" };
  }

  return { shouldServe: true, reason: "meets_threshold" };
}

function buildCodecResult(codec: CodecKind, original: string, transformed: string): CodecResult {
  const preTokens = approxTokenCount(original);
  const postTokens = approxTokenCount(transformed);
  const preBytes = byteLength(original);
  const postBytes = byteLength(transformed);

  return {
    codec,
    text: transformed,
    preTokens,
    postTokens,
    preBytes,
    postBytes,
  };
}

export async function hexCodec(originalText: string): Promise<CodecResult> {
  const transformed = Buffer.from(originalText, "utf8").toString("hex");
  return buildCodecResult("hex", originalText, transformed);
}

export async function bracketCodec(originalText: string): Promise<CodecResult> {
  const transformed = originalText
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*([,.;:!?])\s*/g, "$1 ");
  return buildCodecResult("bracket", originalText, transformed);
}

export async function codexCodec(originalText: string, env?: CodexEnv): Promise<CodecResult> {
  const candidate = env ? await env.runCodexTransform(originalText) : originalText;
  const transformed = candidate.trim();
  return buildCodecResult("codex", originalText, transformed);
}

export async function hybridCodec(originalText: string, env?: CodexEnv, preferCodex = false): Promise<CodecResult> {
  const candidates: CodecResult[] = [await bracketCodec(originalText)];

  if (preferCodex) {
    candidates.push(await codexCodec(originalText, env));
  }

  candidates.push(await hexCodec(originalText));

  let best = candidates[0];
  for (const candidate of candidates.slice(1)) {
    if (candidate.postTokens < best.postTokens) {
      best = candidate;
    }
  }

  return best;
}

export function classifyModel(model: string): MuClass {
  const normalized = model.toLowerCase();

  if (/resist|privacy|no-ops/.test(normalized)) {
    return "r";
  }

  if (/gpt-4|sonnet|opus|haiku|o1|turbo/.test(normalized)) {
    return "e";
  }

  return "b";
}

/* ============================================================
 * 9. PUBLIC ENTRYPOINT: compressMessage()
 * ============================================================ */

export interface CompressMessageOptions {
  model: string;
  provider?: string;
  codexEnv?: CodexEnv;
  estimatedCostUsd?: number;
}

/**
 * Main compression engine entrypoint.
 *
 * - Applies prequalification filters
 * - Uses μ-class model routing
 * - Chooses codec (hex/bracket/hybrid/codex)
 * - Enforces benefit gate (>= 10% savings)
 * - Emits validated telemetry
 */
export async function compressMessage(
  originalText: string,
  opts: CompressMessageOptions
): Promise<CompressionDecision> {
  const start = Date.now();
  const { model, provider = "unknown", codexEnv, estimatedCostUsd = 0 } = opts;

  const mu = classifyModel(model);
  const preTokens = approxTokenCount(originalText);
  const preBytes = byteLength(originalText);

  // 1. Prequalification + resistant short-circuit
  const pq = prequalify(originalText);
  if (!pq.ok || mu === "r") {
    const telemetry: AthenaTelemetry = {
      event_id: "",
      ts: new Date().toISOString(),
      model,
      provider,
      mu_class: mu,
      codec_attempted: "off",
      codec_decided: "off",
      native_tokens_pre: preTokens,
      native_tokens_post: preTokens,
      tokens_saved: 0,
      saved_pct: 0,
      bytes_pre: preBytes,
      bytes_post: preBytes,
      bytes_saved: 0,
      decision: "bypass",
      reason: pq.ok ? "resistant_or_noop" : pq.reason ?? "rejected",
      latency_ms: Date.now() - start,
      cost_usd: estimatedCostUsd,
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

  // 2. Choose codec based on μ and content
  const isCodeHeavy =
    /```[\s\S]*?```/.test(originalText) ||
    /cmd\s*=\s*\[/.test(originalText) ||
    /function\s+\w+\(/.test(originalText);

  let codecResult: CodecResult;

  if (mu === "e") {
    // Efficient models: hybrid pipeline (hex + bracket + codex if code-heavy)
    codecResult = await hybridCodec(originalText, codexEnv, isCodeHeavy);
  } else {
    // Balanced models: bracket by default; codex if clearly code-heavy
    codecResult = isCodeHeavy
      ? await codexCodec(originalText, codexEnv)
      : await bracketCodec(originalText);
  }

  // 3. Benefit gate (no fake compression)
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
    event_id: "",
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
    cost_usd: estimatedCostUsd,
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

