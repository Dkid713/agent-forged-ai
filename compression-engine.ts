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

  // Explicit bypass
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
    // FIRST_MENTION
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
  // crude but useful: if density changes too much, semantics may have shifted too far
  const delta = Math.abs(after.density - before.density) / before.density;
  if (delta > 0.5) {
    return { safe: false, reason: "density_shift" };
  }
  return { safe: true };
}
