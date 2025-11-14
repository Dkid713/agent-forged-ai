import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { DNA } from "./DNA";

export type Telemetry = {
  latencyMs: number;
  compressionRatio: number;
  errorCount: number;
};

export type MutationProposal = {
  id: string;
  description: string;
  patch: string;
  notes?: string;
};

export async function observe(): Promise<Telemetry> {
  // Stubbed telemetry collection for sandboxed experimentation only.
  return {
    latencyMs: 0,
    compressionRatio: 1,
    errorCount: 0
  };
}

export async function proposeMutation(telemetry: Telemetry): Promise<MutationProposal | null> {
  if (telemetry.errorCount > 0) {
    return {
      id: randomUUID(),
      description: "Document encountered errors for human review.",
      patch: `// TODO: Investigate ${telemetry.errorCount} errors.`
    };
  }

  return null;
}

export async function requestHumanApproval(proposal: MutationProposal): Promise<boolean> {
  const approvalsDir = path.resolve(DNA.sandboxRoot, "approvals");
  await fs.mkdir(approvalsDir, { recursive: true });

  const approvalPath = path.join(approvalsDir, `${proposal.id}.md`);
  const message = [
    "# Mutation Approval Required",
    "",
    `Proposal: ${proposal.description}`,
    "",
    "To approve, set the environment variable APPROVED_PROPOSAL_ID to the proposal ID",
    "before running the organism again."
  ].join("\n");

  await fs.writeFile(approvalPath, message, "utf8");

  return process.env.APPROVED_PROPOSAL_ID === proposal.id;
}

export async function applyMutationSafely(proposal: MutationProposal) {
  const sandboxPath = path.resolve(DNA.sandboxRoot);
  await fs.mkdir(sandboxPath, { recursive: true });

  const mutationRecord = path.join(sandboxPath, `${proposal.id}.patch`);
  await fs.writeFile(mutationRecord, proposal.patch, "utf8");
}
