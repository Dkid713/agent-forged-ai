import { loadAthenaConfig } from './config/loader'
import { DefaultGen1Engine } from './gen1/tokenEngine'
import { DefaultGen2Engine } from './gen2/templateEngine'
import { DefaultGen3Engine } from './gen3/semanticEngine'
import { DefaultFeedbackManager } from './feedback/feedbackManager'
import { Telemetry } from './telemetry/metrics'
import type { CompressionInput, CompressionOutput, LayerContext } from './types/core'

const config = loadAthenaConfig()
const gen1 = new DefaultGen1Engine(config.gen1.rulesetVersion)
const gen2 = new DefaultGen2Engine([])
const gen3 = new DefaultGen3Engine()
const feedbackManager = new DefaultFeedbackManager(gen1, gen2, gen3)
const telemetry = new Telemetry()

export async function compressWithAthena(
  input: CompressionInput
): Promise<CompressionOutput> {
  const ctx: LayerContext = {
    requestId: input.id,
    config
  }

  const g1Out = await gen1.compress(input, ctx)
  telemetry.recordCompression('gen1', g1Out.savings)

  const g2Input: CompressionInput = {
    ...input,
    text: input.text
  }

  const g2Out = await gen2.compress(g2Input, ctx)
  telemetry.recordCompression('gen2', g2Out.savings)

  return g2Out
}

export async function runAthenaFeedback(batch: CompressionInput[]): Promise<void> {
  const ctx: LayerContext = {
    requestId: `feedback-${Date.now()}`,
    config
  }
  await feedbackManager.runCycle(batch, ctx)
}

export { Telemetry }
export type { CompressionInput, CompressionOutput }
