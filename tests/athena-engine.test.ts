import { describe, it, expect } from "bun:test";

import {
  compressText,
  EvolutionEngine,
  SkillBroker,
  buildDefaultRegistry,
  type Goal,
  type LLMEnv,
} from "../src/athena-engine";

describe("compressText skill", () => {
  it("skips when the payload is too short", async () => {
    const result = await compressText("short", "gpt-4o");
    expect(result.used).toBeFalse();
    expect(result.reason).toBe("short");
  });

  it("evaluates benefit gating", async () => {
    const text = "content without double  spaces but exceeding the minimum length. ".repeat(6);
    const result = await compressText(text, "gpt-4o");
    expect(result.tokens_in).toBeGreaterThan(0);
    expect(result.tokens_out).toBeGreaterThan(0);
    expect(result.used).toBeFalse();
  });
});

describe("EvolutionEngine", () => {
  it("returns parsed proposals from the LLM", async () => {
    const mockLLM: LLMEnv = {
      complete: async () =>
        JSON.stringify([
          {
            id: "p1",
            title: "Refactor",
            description: "Split module",
            rationale: "clarity",
            impactHypothesis: {
              metrics: [{ name: "performance", direction: "up", expectedDeltaPct: 5 }],
            },
            changePlan: {
              targetModules: ["core"],
              operations: [{ type: "split_file", file: "core.ts", into: ["a.ts", "b.ts"] }],
            },
          },
        ]),
    };

    const engine = new EvolutionEngine(mockLLM);
    const proposals = await engine.generateProposals(
      {
        timeRange: { from: new Date(), to: new Date() },
        hotPaths: [],
        errorClusters: [],
        perfHotspots: [],
        featureAdoption: [],
        codeMetrics: [],
      },
      { nodes: [], edges: [] },
      ["performance"],
    );

    expect(proposals).toHaveLength(1);
    expect(proposals[0]?.id).toBe("p1");
  });
});

describe("SkillBroker", () => {
  it("falls back to a default plan when planning fails", async () => {
    const registry = buildDefaultRegistry();
    const mockLLM: LLMEnv = { complete: async () => "not-json" };
    const broker = new SkillBroker(registry, mockLLM);
    const goal: Goal = {
      name: "Compress",
      inputs: "text to compress",
      constraints: { maxLatencyMs: 1000, maxCostUsd: 1 },
      objectives: { qualityWeight: 1, costWeight: 0, latencyWeight: 0 },
    };

    const plan = await broker.plan(goal);
    expect(plan.steps[0]?.skillName).toBe("compressText");
  });

  it("executes each step and returns the last output", async () => {
    const registry = buildDefaultRegistry();
    const mockLLM: LLMEnv = { complete: async () => "[]" };
    const broker = new SkillBroker(registry, mockLLM);
    const goal: Goal = {
      name: "Compress",
      inputs: "This sentence is intentionally long enough to pass prequalification. ".repeat(6),
      constraints: { maxLatencyMs: 1000, maxCostUsd: 1 },
      objectives: { qualityWeight: 1, costWeight: 0, latencyWeight: 0 },
    };

    const plan = {
      steps: [
        {
          skillName: "compressText",
          outputAlias: "out",
          inputMapping: { text: "goalInput" },
        },
      ],
      estimatedCostUsd: 0,
      estimatedLatencyMs: 0,
    };

    const result = await broker.execute(plan, goal);
    expect(result).toHaveProperty("compressed");
  });
});
