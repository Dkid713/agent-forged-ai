import { evolutionCycle } from "../athena/evolution-loop.js";
import { log } from "../telemetry/index.js";
import { composeSolution } from "../agi/broker.js";
import { registerSkill } from "../skills/registry.js";

registerSkill({
  name: "compressText",
  cost: 0.07,
  latency: 45,
  description: "Codex text compression",
  fn: async () => ({ ratio: 0.42 }),
});

registerSkill({
  name: "summarize",
  cost: 0.05,
  latency: 90,
  description: "gpt-4o-mini summarisation",
  fn: async () => ({ summary: "Lorem ipsum" }),
});

registerSkill({
  name: "webhookSend",
  cost: 0.03,
  latency: 35,
  description: "Dispatch payload via webhook",
  fn: async () => ({ ok: true }),
});

export async function bootstrap(): Promise<void> {
  // Seed telemetry with synthetic data so the evolution loop has material to inspect.
  for (let i = 0; i < 500; i += 1) {
    log({
      path: "/api/messages",
      status: 200,
      latency: 180 + (i % 20),
      metadata: { source: "seed" },
    });
  }

  for (let i = 0; i < 75; i += 1) {
    log({
      path: "/api/auth/login",
      status: i % 8 === 0 ? 500 : 200,
      latency: 320 + (i % 50),
      metadata: { source: "seed" },
    });
  }

  if (process.env.DEMO_PIPELINE) {
    const plan = await composeSolution("Compress user message, summarize, send webhook under 200ms");
    console.info("[broker] Pipeline", plan);
  }

  if (process.env.EVOLUTION_ENABLED) {
    console.info("[evolution] Starting self-evolution loop");
    await evolutionCycle({ iterations: 1, intervalMs: 10 });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrap().catch((error) => {
    console.error("Bootstrap failed", error);
    process.exitCode = 1;
  });
}
