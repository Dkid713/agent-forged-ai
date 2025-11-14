export interface Skill {
  name: string;
  fn: (...args: any[]) => Promise<any> | any;
  cost: number;
  latency: number;
  description?: string;
}

const skills = new Map<string, Skill>();

export function registerSkill(skill: Skill): void {
  skills.set(skill.name, skill);
}

export function unregisterSkill(name: string): boolean {
  return skills.delete(name);
}

export function getSkill(name: string): Skill | undefined {
  return skills.get(name);
}

export function listSkills(): Skill[] {
  return [...skills.values()];
}

export interface PipelineBenchmark {
  skill: Skill;
  estimatedLatency: number;
  estimatedCost: number;
}

export async function benchmarkSkill(skill: Skill): Promise<PipelineBenchmark> {
  const start = Date.now();
  await Promise.resolve(skill.fn());
  const duration = Math.max(skill.latency, Date.now() - start);
  return {
    skill,
    estimatedLatency: duration,
    estimatedCost: skill.cost,
  };
}
