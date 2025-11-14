import { benchmarkSkill, listSkills, Skill } from "../skills/registry.js";

export interface PipelineStep {
  skill: string;
  inputFrom: string;
  estimatedLatency: number;
  estimatedCost: number;
}

export interface PipelinePlan {
  steps: PipelineStep[];
  totalLatency: number;
  totalCost: number;
  requirement: string;
}

const KEYWORD_MAPPING: Record<string, string[]> = {
  compress: ["compressText", "compressMessage"],
  summarize: ["summarize", "summarizeText"],
  webhook: ["webhookSend", "shipWebhook"],
  send: ["webhookSend"],
  ship: ["webhookSend"],
  media: ["transcodeMedia"],
};

export async function composeSolution(requirement: string): Promise<PipelinePlan> {
  const tokens = requirement.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean);
  const skills = listSkills();
  if (skills.length === 0) {
    throw new Error("No skills registered");
  }

  const selected: Skill[] = [];
  for (const token of tokens) {
    const potentialNames = KEYWORD_MAPPING[token];
    if (!potentialNames) continue;

    const skill = potentialNames
      .map((name) => skills.find((candidate) => candidate.name === name))
      .find((candidate): candidate is Skill => Boolean(candidate));

    if (skill && !selected.includes(skill)) {
      selected.push(skill);
    }
  }

  if (selected.length === 0) {
    selected.push(selectCheapestSkill(skills));
  }

  const benchmarks = await Promise.all(selected.map((skill) => benchmarkSkill(skill)));
  const steps: PipelineStep[] = benchmarks.map((benchmark, index) => ({
    skill: benchmark.skill.name,
    inputFrom: index === 0 ? "input" : benchmarks[index - 1].skill.name,
    estimatedLatency: benchmark.estimatedLatency,
    estimatedCost: benchmark.estimatedCost,
  }));

  const totalLatency = steps.reduce((sum, step) => sum + step.estimatedLatency, 0);
  const totalCost = steps.reduce((sum, step) => sum + step.estimatedCost, 0);

  return {
    requirement,
    steps,
    totalLatency,
    totalCost,
  };
}

function selectCheapestSkill(skills: Skill[]): Skill {
  return skills.reduce((cheapest, candidate) => {
    if (!cheapest) return candidate;
    if (candidate.cost < cheapest.cost) return candidate;
    if (candidate.cost === cheapest.cost && candidate.latency < cheapest.latency) return candidate;
    return cheapest;
  });
}
