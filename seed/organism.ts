import { randomUUID } from "crypto";
import { DNA } from "./DNA";
import {
  observe,
  proposeMutation,
  requestHumanApproval,
  applyMutationSafely,
  MutationProposal
} from "./evolution";

export class Organism {
  readonly id = randomUUID();
  fitness = 0;
  generation = 0;

  constructor(private readonly maxCycles = 1) {}

  async live() {
    for (let cycle = 0; cycle < this.maxCycles; cycle += 1) {
      const telemetry = await observe();
      const proposal = await proposeMutation(telemetry);

      if (proposal && (await this.approve(proposal))) {
        await applyMutationSafely(proposal);
        this.generation += 1;
      }

      this.fitness = await this.evaluate();
      await sleep(DNA.cycleIntervalMs);
    }
  }

  private async approve(proposal: MutationProposal): Promise<boolean> {
    if (!DNA.requiresHumanApproval) {
      return true;
    }

    return requestHumanApproval(proposal);
  }

  private async evaluate(): Promise<number> {
    // Placeholder: real implementation would analyze sandbox metrics.
    return 0.8;
  }
}

export async function spawnOrganism(maxCycles?: number) {
  const organism = new Organism(maxCycles);
  await organism.live();
}

function sleep(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

if (require.main === module) {
  const cycles = Number.parseInt(process.env.MAX_CYCLES ?? "1", 10);
  void spawnOrganism(Number.isFinite(cycles) ? cycles : 1);
}
