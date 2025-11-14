import { describe, it, expect } from "bun:test";

import {
  prequalify,
  benefit,
  compressMessage,
  buildCruxSystemPrompt,
  processCruxReply,
  analyzeSemanticContext,
  validateSemanticPreservation,
  classifyModel,
  validateAthenaTelemetry,
  type AthenaTelemetry,
} from "../src/compression-engine";

const LONG_TEXT = "lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(8);

describe("prequalify", () => {
  it("rejects empty and short payloads", () => {
    expect(prequalify("").ok).toBeFalse();
    expect(prequalify("tiny").reason).toBe("short");
  });

  it("rejects code blocks and urls", () => {
    expect(prequalify("```code``` ").reason).toBe("code_block");
    expect(prequalify("see https://example.com").reason).toBe("urls");
  });

  it("accepts sufficiently long natural text", () => {
    expect(prequalify(LONG_TEXT).ok).toBeTrue();
  });
});

describe("benefit", () => {
  it("blocks expansions and requires minimum efficiency", () => {
    const expansion = benefit(10, 15);
    expect(expansion.shouldServe).toBeFalse();
    expect(expansion.reason).toBe("expansion_or_no_gain");

    const lowEff = benefit(100, 95);
    expect(lowEff.shouldServe).toBeFalse();
    expect(lowEff.reason).toContain("Efficiency too low");
  });
});

describe("compressMessage", () => {
  it("bypasses short content", async () => {
    const result = await compressMessage("short", { model: "gpt-4o" });
    expect(result.decision).toBe("bypass");
    expect(result.reason).toBe("short");
    expect(result.codec).toBe("off");
  });

  it("bypasses resistant models even when otherwise eligible", async () => {
    const result = await compressMessage(LONG_TEXT, { model: "my-special" });
    expect(result.decision).toBe("bypass");
    expect(result.reason).toBe("resistant_or_noop");
    expect(result.telemetry.mu_class).toBe("r");
  });
});

describe("CruxRC helpers", () => {
  it("builds prompts with the selected response style", () => {
    const prompt = buildCruxSystemPrompt("gpt-4o", "default", "STRICT");
    expect(prompt).toContain("response_style=STRICT");
    expect(prompt).toContain("Use ONLY approved acronyms");
  });

  it("expands acronyms on first mention in FIRST_MENTION mode", () => {
    const raw = [
      "#CRUXRC v1; model=gpt-4o; dict=default; tokens_target=short; response_style=FIRST_MENTION",
      "AI improves UX",
    ].join("\n");

    const processed = processCruxReply(raw, "FIRST_MENTION");
    expect(processed.mode).toBe("compressed");
    expect(processed.text).toContain("artificial intelligence (AI)");
    expect(processed.text).toContain("user experience (UX)");
  });

  it("collapses full terms in STRICT mode", () => {
    const raw = [
      "#CRUXRC v1; model=gpt-4o; dict=default; tokens_target=short; response_style=STRICT",
      "artificial intelligence (AI) improves user experience (UX)",
    ].join("\n");

    const processed = processCruxReply(raw, "STRICT");
    expect(processed.text).toBe("AI improves UX");
  });
});

describe("semantic preservation", () => {
  it("detects density shifts", () => {
    const before = analyzeSemanticContext("a ".repeat(200));
    const after = analyzeSemanticContext("supercalifragilisticexpialidocious ".repeat(10));
    const validation = validateSemanticPreservation(before, after);
    expect(validation.safe).toBeFalse();
    expect(validation.reason).toBe("density_shift");
  });
});

describe("classifyModel", () => {
  it("categorises models by heuristics", () => {
    expect(classifyModel("gpt-3.5-turbo")).toBe("e");
    expect(classifyModel("gpt-4o-mini")).toBe("b");
    expect(classifyModel("unknown-model")).toBe("r");
  });
});

describe("validateAthenaTelemetry", () => {
  it("accepts well-formed telemetry", () => {
    const candidate: AthenaTelemetry = {
      event_id: "id",
      ts: new Date().toISOString(),
      model: "gpt-4o",
      provider: "x-ai",
      mu_class: "b",
      codec_attempted: "bracket",
      codec_decided: "off",
      native_tokens_pre: 100,
      native_tokens_post: 95,
      tokens_saved: 5,
      saved_pct: 5,
      bytes_pre: 1000,
      bytes_post: 900,
      bytes_saved: 100,
      decision: "bypass",
      reason: "Efficiency too low (5.0% < 10.0%)",
      latency_ms: 10,
      cost_usd: 0.0001,
    };

    expect(validateAthenaTelemetry(candidate)).toEqual(candidate);
  });

  it("rejects mismatched token accounting", () => {
    const candidate = {
      model: "gpt-4o",
      mu_class: "b",
      codec_attempted: "bracket",
      codec_decided: "bracket",
      native_tokens_pre: 10,
      native_tokens_post: 5,
      tokens_saved: 0,
      saved_pct: 50,
      bytes_pre: 100,
      bytes_post: 50,
      bytes_saved: 50,
      decision: "serve",
      reason: "beneficial",
      latency_ms: 1,
      cost_usd: 0,
    } as const;

    expect(() => validateAthenaTelemetry(candidate)).toThrow("tokens_saved mismatch");
  });
});
