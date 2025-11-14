import { Octokit } from "@octokit/rest";

type Proposal = {
  id: string;
  summary: string;
  justification: string;
};

type Email = {
  to: string;
  subject: string;
  body: string;
};

const octokit = new Octokit({ auth: process.env.GH_TOKEN });

export async function openPR(proposal: Proposal) {
  if (!process.env.GH_TOKEN) {
    console.warn("GH_TOKEN not provided; returning mock PR URL");
    return { url: `https://github.com/Dkid713/agent-forged-ai/pull/mock-${proposal.id}` };
  }

  const response = await octokit.pulls.create({
    owner: "Dkid713",
    repo: "agent-forged-ai",
    title: `[CRUXAGI] ${proposal.summary}`,
    head: `evo/${proposal.id}`,
    base: "main",
    body: proposal.justification
  });

  return { url: response.data.html_url ?? "" };
}

export async function sendEmail(email: Email) {
  console.log("EMAIL TO HUMAN:", email);
}
