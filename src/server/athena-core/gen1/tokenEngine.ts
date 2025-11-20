import type { CompressionInput, CompressionOutput, LayerContext } from '../types/core'
import type { Gen1Engine } from '../types/gen1'
import { Logger } from '../util/logger'

export class DefaultGen1Engine implements Gen1Engine {
  private readonly logger = new Logger('athena-gen1')

  constructor(private readonly rulesetVersion: string) {}

  async compress(input: CompressionInput, ctx: LayerContext): Promise<CompressionOutput> {
    this.logger.info(`Running Gen1 compression with ruleset ${this.rulesetVersion}`, {
      requestId: ctx.requestId
    })

    const tokens = input.text.trim().split(/\s+/).filter(Boolean)
    const originalTokens = tokens.length
    const compressedTokens = Math.max(1, Math.floor(originalTokens * 0.8))
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
