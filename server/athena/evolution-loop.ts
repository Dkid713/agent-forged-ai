import { observe } from "./telemetry.js";
import { hypothesize } from "./hypothesis-engine.js";
import { experiment } from "./shadow-runner.js";
import { evaluate } from "./scorecard.js";
import { proposePR } from "./github-bot.js";

export interface EvolutionOptions {
  intervalMs?: number;
  iterations?: number;
  signal?: AbortSignal;
  onCycle?: (payload: EvolutionCyclePayload) => void | Promise<void>;
}

export interface EvolutionCyclePayload {
  telemetryCount: number;
  hypothesisSummary?: string;
  improvement?: number;
  prPayload?: Awaited<ReturnType<typeof proposePR>>;
}

const DEFAULT_INTERVAL = 1000 * 60 * 60 * 6;

export async function evolutionCycle(options: EvolutionOptions = {}): Promise<void> {
  const { intervalMs = DEFAULT_INTERVAL, iterations = Infinity, signal } = options;
  let remaining = iterations;

  while (remaining > 0 && !signal?.aborted) {
    const telemetry = await observe();
    const cyclePayload: EvolutionCyclePayload = { telemetryCount: telemetry.events.length };

    const hypothesis = await hypothesize(telemetry);
    if (!hypothesis) {
      await options.onCycle?.(cyclePayload);
      await sleep(intervalMs, signal);
      remaining -= 1;
      continue;
    }

    cyclePayload.hypothesisSummary = hypothesis.summary;

    const result = await experiment(hypothesis);
    const scorecard = await evaluate(result);
    cyclePayload.improvement = scorecard.improvement;

    if (scorecard.improvement > 0.15) {
      cyclePayload.prPayload = await proposePR(hypothesis, scorecard);
    }

    await options.onCycle?.(cyclePayload);

    await sleep(intervalMs, signal);
    remaining -= 1;
  }
}

async function sleep(duration: number, signal?: AbortSignal): Promise<void> {
  if (duration <= 0) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, duration);

    const onAbort = () => {
      clearTimeout(timeout);
      reject(new Error("Evolution loop aborted"));
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
