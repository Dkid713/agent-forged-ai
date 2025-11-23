import type { CompressionInput, LayerContext } from '../types/core'
import type { Gen1Engine } from '../types/gen1'
import type { Gen2Engine } from '../types/gen2'
import type { Gen3Engine } from '../types/gen3'
import { Logger } from '../util/logger'

export class DefaultFeedbackManager {
  private readonly logger = new Logger('athena-feedback')

  constructor(
    private readonly gen1: Gen1Engine,
    private readonly gen2: Gen2Engine,
    private readonly gen3: Gen3Engine
  ) {}

  async runCycle(batch: CompressionInput[], ctx: LayerContext): Promise<void> {
    this.logger.info('Running feedback cycle', { requestId: ctx.requestId, batchSize: batch.length })

    for (const item of batch) {
      await this.gen1.compress(item, ctx)
      await this.gen2.compress(item, ctx)
      await this.gen3.compress(item, ctx)
    }

    this.logger.info('Feedback cycle complete', { requestId: ctx.requestId })
  }
}
