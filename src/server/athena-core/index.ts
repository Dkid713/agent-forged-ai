import { loadAthenaConfig } from './config/loader'
import { DefaultGen1Engine } from './gen1/tokenEngine'
import { DefaultGen2Engine } from './gen2/templateEngine'
import { DefaultGen3Engine } from './gen3/semanticEngine'
import { DefaultFeedbackManager } from './feedback/feedbackManager'
import { Telemetry } from './telemetry/metrics'
import { ATHENA_OMEGA_BASELINE_GEN580 } from '../../shared/athena-core/athenaOmegaBaseline'
import type { CompressionInput, CompressionOutput, LayerContext } from './types/core'

const config = loadAthenaConfig()
const omegaPsiKuramoto = ATHENA_OMEGA_BASELINE_GEN580.parameters
const gen1 = new DefaultGen1Engine(config.gen1.rulesetVersion)
const gen2 = new DefaultGen2Engine([])
const gen3 = new DefaultGen3Engine()
const feedbackManager = new DefaultFeedbackManager(gen1, gen2, gen3)
const telemetry = new Telemetry(config.telemetry)

function estimateTokens(text: string): number {
  return text
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length
}

function passthroughOutput(input: CompressionInput): CompressionOutput {
  const tokens = estimateTokens(input.text)
  return {
    id: input.id,
    originalTokens: tokens,
    compressedTokens: tokens,
    savings: 0,
    ratio: 1,
    text: input.text
  }
}

export async function compressWithAthena(
  input: CompressionInput
): Promise<CompressionOutput> {
  const ctx: LayerContext = {
    requestId: input.id,
    config,
    omegaPsiKuramoto
  }

  let currentOutput: CompressionOutput | null = null

  if (config.gen1.enabled) {
    currentOutput = await gen1.compress(input, ctx)
    telemetry.recordCompression('gen1', currentOutput.savings)
  }

  if (config.gen2.enabled) {
    const g2Input: CompressionInput = {
      ...input,
      text: input.text
    }

    const g2Out = await gen2.compress(g2Input, ctx)
    telemetry.recordCompression('gen2', g2Out.savings)
    currentOutput = g2Out
  }

  if (config.gen3.enabled) {
    const g3Input: CompressionInput = {
      ...input,
      text: input.text
    }

    const g3Out = await gen3.compress(g3Input, ctx)
    telemetry.recordCompression('gen3', g3Out.savings)
    currentOutput = g3Out
  }

  const finalOutput = currentOutput ?? passthroughOutput(input)

  if (telemetry.isEnabled()) {
    console.log('[AthenaCore] request', input.id, {
      originalTokens: finalOutput.originalTokens,
      compressedTokens: finalOutput.compressedTokens,
      savings: finalOutput.savings,
      ratio: finalOutput.ratio
    })
  }

  return finalOutput
}

export async function runAthenaFeedback(batch: CompressionInput[]): Promise<void> {
  const ctx: LayerContext = {
    requestId: `feedback-${Date.now()}`,
    config,
    omegaPsiKuramoto
  }
  await feedbackManager.runCycle(batch, ctx)
}

export { Telemetry }
export type { CompressionInput, CompressionOutput }
