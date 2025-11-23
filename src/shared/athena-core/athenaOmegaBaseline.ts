// athenaOmegaBaseline.ts
// Canonical Ω–Ψ–K parameters for Athena / Crux v1.0 (Gen 580).
// DO NOT MODIFY without a complete evolutionary re-run and validation.
//
// Source of truth: organism_evolution/ATHENA_OMEGA_BASELINE_GEN580.json

export const ATHENA_OMEGA_BASELINE_GEN580 = {
  version: "1.0.0",
  profile: "ATHENA_OMEGA_BASELINE",
  status: "PRODUCTION_LOCKED",
  generated: "2025-11-23",

  evolution: {
    generation: 580,
    fitness: 97.07347869873047,
    avgFitness: 87.36718,
    improvementOverBaseline: 0.149,
    totalGenerations: 1000,
    lineages: 128,
    agentsPerGeneration: 16384,
  },

  parameters: {
    topology_L1: 1.6647956520105727,
    omega_psi_L2: 1.2106238592051974,
    kuramoto_L3: 1.5,
    K_base: 0.6,
    beta: 0.19991499845156332,
    lambda_entropy: 0.005888102440348521,
  },

  guardrails: {
    lambda_entropy: { min: 0.001, max: 0.02, optimal: 0.0059 },
    beta: { min: 0.15, max: 0.25, optimal: 0.2 },
    K_base: { min: 0.5, max: 0.7, optimal: 0.6 },
  },

  designInsights: {
    entropy_penalty:
      "MINIMAL – Strong entropy leash over-regularized the system. Optimal near 0.006.",
    coupling_strategy:
      "TIGHT – K_base increased 20% to 0.6. Strong inter-agent communication.",
    damping_regime:
      "HIGH – Beta doubled from 0.1 to 0.2. Heavy shock absorption.",
    coordination_philosophy:
      "Less leash, more damping, stronger links.",
  },
} as const

export type AthenaOmegaParams = typeof ATHENA_OMEGA_BASELINE_GEN580.parameters

export function getOmegaPsiKuramotoConfig() {
  const OMEGA = ATHENA_OMEGA_BASELINE_GEN580.parameters
  return {
    topologyScaleL1: OMEGA.topology_L1,
    omegaPsiScaleL2: OMEGA.omega_psi_L2,
    kuramotoScaleL3: OMEGA.kuramoto_L3,
    couplingBase: OMEGA.K_base,
    beta: OMEGA.beta,
    lambdaEntropy: OMEGA.lambda_entropy,
  }
}
