export const DNA = {
  version: "0.2.0",
  goals: [
    "minimize_latency",
    "maximize_compression",
    "expand_capabilities_with_supervision"
  ],
  mutationRate: 0.02,
  fitnessReviewThreshold: 0.75,
  requiresHumanApproval: true,
  sandboxRoot: "./sandbox",
  cycleIntervalMs: 60_000,
  skills: ["compress", "chat", "analyze"],
  env: "node"
} as const;

export type DNAType = typeof DNA;
