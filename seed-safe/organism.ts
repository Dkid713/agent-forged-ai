import { randomUUID } from "crypto";
import { DNA } from "./DNA";
import { proposeMutation, awaitHumanApproval, replicate } from "./evolution";

type MutationProposal = {
  id: string;
  summary: string;
  justification: string;
  changes?: Record<string, unknown>;
};

export class Organism {
  id = randomUUID();
  fitness = 0;
  generation = 0;

  async live() {
    while (true) {
      const telemetry = await observe();
      const proposal = await proposeMutation(telemetry);

      if (proposal) {
        const approved = await awaitHumanApproval(proposal);
        if (approved) {
          this.apply(proposal);
          this.fitness = await this.evaluate();

          if (this.fitness > 0.8 && DNA.replicationRequiresHumanApproval) {
            const spawn = await awaitHumanApproval({
              type: "replicate",
              parent: this.id,
              summary: "Spawn child",
              justification: "Fitness threshold exceeded"
            });
            if (spawn) await replicate(this);
          }
        }
      }

      await sleep(3_600_000); // 1 hour
    }
  }

  private apply(proposal: MutationProposal) {
    console.log(`Applying mutation: ${proposal.summary}`);
    this.generation += 1;
  }

  private async evaluate() {
    console.log("Evaluating organism after mutation");
    return Math.random();
  }
}

async function observe() {
  return {
    timestamp: Date.now(),
    metrics: {
      performance: Math.random(),
      cost: Math.random()
    }
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
