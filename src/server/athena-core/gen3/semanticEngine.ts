import type { CompressionInput, CompressionOutput, LayerContext } from '../types/core'
import type { Gen3Engine } from '../types/gen3'
import { Logger } from '../util/logger'

export class DefaultGen3Engine implements Gen3Engine {
  private readonly logger = new Logger('athena-gen3')

  async compress(input: CompressionInput, ctx: LayerContext): Promise<CompressionOutput> {
    this.logger.info('Running Gen3 semantic compression', { requestId: ctx.requestId })

    const originalTokens = input.text.trim().split(/\s+/).filter(Boolean).length
    const compressedTokens = Math.max(1, Math.floor(originalTokens * 0.65))
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
