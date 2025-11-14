import { DNA } from "./DNA";
import { sendEmail, openPR } from "./human-interface";
import type { Organism } from "./organism";

type Proposal = {
  id: string;
  summary: string;
  justification: string;
  type?: string;
  parent?: string;
};

type PullRequest = {
  url: string;
};

export async function awaitHumanApproval(proposal: Proposal) {
  const pr = await openPR(proposal);
  await sendEmail({
    to: DNA.humanReviewer,
    subject: `[CRUXAGI] Review Evolution: ${proposal.summary}`,
    body: `PR: ${pr.url}\nJustification: ${proposal.justification}\nApprove?`
  });
  return waitForHumanResponse(pr);
}

export async function proposeMutation(telemetry: any) {
  try {
    const response = await globalThis.fetch?.("/api/athena/evolution/proposals", {
      method: "POST",
      body: JSON.stringify(telemetry)
    });

    if (!response) {
      return null;
    }

    const proposals = await response.json();
    return proposals?.[0] ?? null;
  } catch (error) {
    console.warn("Failed to retrieve mutation proposals", error);
    return null;
  }
}

export async function replicate(parent: Organism) {
  console.log(`Replicating organism ${parent.id}`);
  const { Organism: OrganismCtor } = await import("./organism");
  const child: Organism = new OrganismCtor();
  child.generation = parent.generation + 1;
  child.fitness = parent.fitness;
  console.log("New organism spawned", { parent: parent.id, child: child.id });
  return child;
}

async function waitForHumanResponse(pr: PullRequest) {
  console.log("Waiting for human approval at", pr.url);
  return true;
}
