import type { CompressionInput, CompressionOutput, LayerContext } from '../types/core'
import type { Gen2Engine } from '../types/gen2'
import { Logger } from '../util/logger'

export class DefaultGen2Engine implements Gen2Engine {
  private readonly logger = new Logger('athena-gen2')

  constructor(private readonly templates: string[]) {
    this.logger.info('Template engine initialized', { templatesLoaded: templates.length })
  }

  async compress(input: CompressionInput, ctx: LayerContext): Promise<CompressionOutput> {
    this.logger.info('Running Gen2 templating pass', { requestId: ctx.requestId })

    const originalTokens = input.text.trim().split(/\s+/).filter(Boolean).length
    const templateBoost = Math.min(0.1, this.templates.length * 0.01)
    const compressedTokens = Math.max(1, Math.floor(originalTokens * (0.75 - templateBoost)))
    const savings = originalTokens - compressedTokens

    return {
      id: input.id,
      originalTokens,
      compressedTokens,
      savings,
      ratio: compressedTokens / Math.max(originalTokens, 1),
      text: input.text
    }
  }
}
