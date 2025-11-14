import { z } from "zod";

/* ============================================================
 * 0. SHARED TYPES / PRIMITIVES
 * ============================================================ */

export type MuClass = "e" | "b" | "r"; // efficient | balanced | resistant

export interface LLMEnv {
  // generic LLM / Codex hook; you wire this to OpenAI, xAI, Anthropic, etc.
  complete: (prompt: string, opts?: { model?: string }) => Promise<string>;
}

/* ============================================================
 * 1. COMPRESSION ENGINE (compressText Skill)
 *   (simplified from our previous conversations)
 * ============================================================ */

// Core utils
function approxTokenCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function prequalify(text: string) {
  if (!text || !text.trim()) return { ok: false, reason: "empty" };
  if (/```[\s\S]*?```/.test(text)) return { ok: false, reason: "code_block" };
  if (/https?:\/\//i.test(text)) return { ok: false, reason: "urls" };
  if (byteLength(text) < 256) return { ok: false, reason: "short" };
  return { ok: true as const, reason: "ok" as const };
}

export function benefit(preTokens: number, postTokens: number) {
  if (preTokens === 0) {
    return { shouldServe: false, eff_pct: 0, reason: "no_input_tokens" };
  }
  const saved = preTokens - postTokens;
  const eff = saved / preTokens;
  const eff_pct = eff * 100;

  if (saved <= 0) {
    return { shouldServe: false, eff_pct, reason: "expansion_or_no_gain" };
  }
  if (eff < 0.1) {
    return {
      shouldServe: false,
      eff_pct,
      reason: `Efficiency too low (${eff_pct.toFixed(1)}% < 10.0%)`,
    };
  }
  return { shouldServe: true, eff_pct, reason: "beneficial" };
}

// Simple bracket-style compressor (you can replace with your real steno)
async function bracketCompress(text: string): Promise<string> {
  return text.replace(/[ ]{2,}/g, " ");
}

// Public compression skill (prompt-side)
export async function compressText(
  text: string,
  model: string
): Promise<{
  used: boolean;
  reason: string;
  compressed: string;
  tokens_in: number;
  tokens_out: number;
  eff_pct: number;
}> {
  const pq = prequalify(text);
  if (!pq.ok) {
    return {
      used: false,
      reason: pq.reason,
      compressed: text,
      tokens_in: approxTokenCount(text),
      tokens_out: approxTokenCount(text),
      eff_pct: 0,
    };
  }

  const tokens_in = approxTokenCount(text);
  const compressed = await bracketCompress(text);
  const tokens_out = approxTokenCount(compressed);

  const gate = benefit(tokens_in, tokens_out);
  return {
    used: gate.shouldServe,
    reason: gate.reason,
    compressed: gate.shouldServe ? compressed : text,
    tokens_in,
    tokens_out,
    eff_pct: gate.eff_pct,
  };
}

/* ============================================================
 * 2. EVOLUTION ENGINE (Self-Evolving Codebase Scaffolding)
 * ============================================================ */

/**
 * Telemetry / context layer
 */
export type CodePath = { file: string; function?: string; calls: number };
export type ErrorCluster = { message: string; count: number; stackSample: string[] };
export type PerfHotspot = { path: string; p95Ms: number; p99Ms: number };
export type FeatureStats = { feature: string; adoptionRate: number; errors: number };
export type CodeMetric = { file: string; loc: number; complexity: number; coveragePct: number };

export type TelemetrySnapshot = {
  timeRange: { from: Date; to: Date };
  hotPaths: CodePath[];
  errorClusters: ErrorCluster[];
  perfHotspots: PerfHotspot[];
  featureAdoption: FeatureStats[];
  codeMetrics: CodeMetric[];
};

/**
 * Code Knowledge Graph
 */
export type CodeNodeType = "file" | "function" | "class" | "module" | "service";
export type CodeEdgeType = "calls" | "imports" | "depends_on" | "owned_by" | "touches_table";

export type CodeNode = {
  id: string;
  type: CodeNodeType;
  name: string;
  path?: string;
  ownerTeam?: string;
  metrics?: { complexity?: number; coverage?: number; bugDensity?: number };
};

export type CodeEdge = {
  from: string;
  to: string;
  type: CodeEdgeType;
};

export type CodeGraph = {
  nodes: CodeNode[];
  edges: CodeEdge[];
};

/**
 * Hypothesis / Proposal
 */
export type CodeChangeOperation =
  | { type: "extract_module"; from: string; to: string; symbol: string }
  | { type: "split_file"; file: string; into: string[] }
  | { type: "introduce_interface"; name: string; implementors: string[] }
  | { type: "replace_pattern"; search: string; replace: string; scope: string };

export type CodeChangePlan = {
  targetModules: string[];
  operations: CodeChangeOperation[];
};

export type CodeMutationProposal = {
  id: string;
  title: string;
  description: string;
  rationale: string;
  impactHypothesis: {
    metrics: { name: string; direction: "up" | "down"; expectedDeltaPct: number }[];
  };
  changePlan: CodeChangePlan;
};

export type EvaluationScore = {
  proposalId: string;
  scores: {
    complexity: number;   // 0-1 (higher better)
    reliability: number;  // 0-1
    performance: number;  // 0-1
    risk: number;         // 0-1 (lower better)
  };
  summary: string;
  blockingIssues: string[];
};

// Evolution Engine core facade
export class EvolutionEngine {
  constructor(private llm: LLMEnv) {}

  async generateProposals(
    telemetry: TelemetrySnapshot,
    graph: CodeGraph,
    kpis: string[]
  ): Promise<CodeMutationProposal[]> {
    const prompt = `
You are an architect. Given telemetry, a code graph, and KPIs, propose refactors.

KPIs: ${kpis.join(", ")}

Telemetry (JSON):
${JSON.stringify(telemetry, null, 2)}

CodeGraph (JSON):
${JSON.stringify(graph, null, 2)}

Return a JSON array of CodeMutationProposal objects.
`;
    const raw = await this.llm.complete(prompt, { model: "codex-evo" });
    try {
      const parsed = JSON.parse(raw) as CodeMutationProposal[];
      return parsed;
    } catch {
      return [];
    }
  }

  async evaluateProposal(proposal: CodeMutationProposal): Promise<EvaluationScore> {
    // Here you'd wire: tests, static analysis, synthetic traffic, etc.
    // For now we stub mildly reasonable defaults.
    return {
      proposalId: proposal.id,
      scores: {
        complexity: 0.7,
        reliability: 0.8,
        performance: 0.6,
        risk: 0.3,
      },
      summary: `Stub evaluation for ${proposal.title}`,
      blockingIssues: [],
    };
  }
}

/* ============================================================
 * 3. SKILLS MARKET (Dynamic Composition Layer)
 * ============================================================ */

export type Schema = any; // you can plug JSON Schema / Zod here
export type ExecutionContext = { goal?: Goal };

export type Skill = {
  name: string;
  version: string;
  inputs: Schema;
  outputs: Schema;
  qos: {
    p95LatencyMs: number;
    errorRate: number;
    costPerCallUsd: number;
    reliabilityScore: number;
  };
  constraints: {
    maxPayloadBytes?: number;
    region?: string[];
    requiresAuth?: boolean;
  };
  impl: (input: any, ctx: ExecutionContext) => Promise<any>;
};

export type SkillMeta = Omit<Skill, "impl"> & { tags?: string[] };

export type SkillFilter = {
  name?: string;
  tag?: string;
};

export type SelectionStrategy = "bestRecent" | "cheapest" | "fastest";

export type ExecutionResultMetrics = {
  latencyMs: number;
  success: boolean;
  costUsd: number;
};

export type Goal = {
  name: string;
  inputs: any;
  constraints: {
    maxLatencyMs: number;
    maxCostUsd: number;
  };
  objectives: {
    qualityWeight: number;
    costWeight: number;
    latencyWeight: number;
  };
};

export type SkillPlanStep = {
  skillName: string;
  version?: string;
  outputAlias: string;
  inputMapping: { [skillInputKey: string]: string };
};

export type SkillPlan = {
  steps: SkillPlanStep[];
  estimatedCostUsd: number;
  estimatedLatencyMs: number;
};

export type SkillRegistry = {
  listSkills(filter?: SkillFilter): SkillMeta[];
  getImplementation(name: string, strategy: SelectionStrategy): Skill;
  recordExecutionResult(name: string, metrics: ExecutionResultMetrics): void;
};

// Minimal in-memory registry
export class InMemorySkillRegistry implements SkillRegistry {
  private skills = new Map<string, Skill>();
  private metas = new Map<string, SkillMeta>();

  register(skill: Skill & { tags?: string[] }) {
    this.skills.set(skill.name, skill);
    this.metas.set(skill.name, {
      name: skill.name,
      version: skill.version,
      inputs: skill.inputs,
      outputs: skill.outputs,
      qos: skill.qos,
      constraints: skill.constraints,
      tags: skill.tags ?? [],
    });
  }

  listSkills(filter?: SkillFilter): SkillMeta[] {
    const all = Array.from(this.metas.values());
    if (!filter) return all;
    return all.filter((s) => {
      if (filter.name && s.name !== filter.name) return false;
      if (filter.tag && !(s.tags || []).includes(filter.tag)) return false;
      return true;
    });
  }

  getImplementation(name: string, _strategy: SelectionStrategy): Skill {
    const skill = this.skills.get(name);
    if (!skill) throw new Error(`Skill not found: ${name}`);
    return skill;
  }

  recordExecutionResult(_name: string, _metrics: ExecutionResultMetrics): void {
    // TODO: track stats, bandit logic
  }
}

/* ============================================================
 * 4. BROKER (Planner + Executor)
 * ============================================================ */

export class SkillBroker {
  constructor(private registry: SkillRegistry, private llm: LLMEnv) {}

  async plan(goal: Goal): Promise<SkillPlan> {
    // Ask LLM to propose a plan
    const meta = this.registry.listSkills();
    const prompt = `
You are a planner. Given a goal and available skills, propose a SkillPlan.

Goal:
${JSON.stringify(goal, null, 2)}

Skills:
${JSON.stringify(meta, null, 2)}

Return JSON SkillPlan.
`;
    const raw = await this.llm.complete(prompt, { model: "planner" });
    try {
      const parsed = JSON.parse(raw) as SkillPlan;
      return parsed;
    } catch {
      // Fallback: simple single-step plan
      return {
        steps: [
          {
            skillName: "compressText",
            outputAlias: "result",
            inputMapping: { text: "goalInput" },
          },
        ],
        estimatedCostUsd: 0.0005,
        estimatedLatencyMs: 200,
      };
    }
  }

  async execute(plan: SkillPlan, goal: Goal): Promise<any> {
    const context: Record<string, any> = { goalInput: goal.inputs };

    for (const step of plan.steps) {
      const skill = this.registry.getImplementation(
        step.skillName,
        "bestRecent"
      );
      const input: any = {};
      for (const [k, sourceKey] of Object.entries(step.inputMapping)) {
        input[k] = context[sourceKey];
      }
      const t0 = Date.now();
      const output = await skill.impl(input, { goal });
      const latency = Date.now() - t0;
      context[step.outputAlias] = output;

      this.registry.recordExecutionResult(skill.name, {
        latencyMs: latency,
        success: true,
        costUsd: skill.qos.costPerCallUsd,
      });
    }

    const last = plan.steps[plan.steps.length - 1];
    return context[last.outputAlias];
  }
}

/* ============================================================
 * 5. WIRING IT TOGETHER
 * ============================================================ */

export function classifyModel(model: string): MuClass {
  const m = model.toLowerCase();
  if (m.includes("gpt-3.5") || m.includes("grok-2")) return "e";
  if (m.includes("gpt-4") || m.includes("code")) return "b";
  return "r";
}

// Register compressText as a Skill
export function buildDefaultRegistry(): SkillRegistry {
  const reg = new InMemorySkillRegistry();
  reg.register({
    name: "compressText",
    version: "v1",
    inputs: { type: "object", properties: { text: { type: "string" }, model: { type: "string" } } },
    outputs: { type: "object", properties: { compressed: { type: "string" } } },
    qos: {
      p95LatencyMs: 50,
      errorRate: 0.001,
      costPerCallUsd: 0.0001,
      reliabilityScore: 0.99,
    },
    constraints: { maxPayloadBytes: 1_000_000 },
    impl: async (input) => {
      const res = await compressText(input.text, input.model);
      return { compressed: res.compressed, meta: res };
    },
    tags: ["compression", "text"],
  });
  return reg;
}
