import { Hypothesis } from "./hypothesis-engine.js";
import { Scorecard } from "./scorecard.js";

export interface PullRequestPayload {
  title: string;
  body: string;
  head: string;
  base: string;
}

export async function proposePR(hypothesis: Hypothesis, scorecard: Scorecard): Promise<PullRequestPayload> {
  const markdown = renderScorecard(hypothesis, scorecard);
  const payload: PullRequestPayload = {
    title: `[Codex] ${hypothesis.summary}`,
    body: markdown,
    head: hypothesis.targetBranch,
    base: "main",
  };

  console.info("[github-bot] Prepared PR payload", payload);
  return payload;
}

function renderScorecard(hypothesis: Hypothesis, scorecard: Scorecard): string {
  const bullets = hypothesis.tasks.map((task) => `- [ ] ${task}`).join("\n");
  const narrative = scorecard.narrative.map((line) => `- ${line}`).join("\n");

  return `# [Codex] ${hypothesis.summary}

**Hypothesis**: ${hypothesis.description}

**Experiment**:
${narrative}

**Scorecard**:
- Complexity delta: ${(scorecard.complexityDelta * 100).toFixed(1)}%
- Performance gain: ${(scorecard.performanceGain * 100).toFixed(1)}%
- Risk: ${(scorecard.risk * 100).toFixed(1)}%
- **Improvement**: ${(scorecard.improvement * 100).toFixed(1)}%

**Action Items**:
${bullets}
`;
}
