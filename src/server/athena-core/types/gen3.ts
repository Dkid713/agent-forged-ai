import type { CompressionInput, CompressionOutput, LayerContext } from './core'

export interface Gen3Engine {
  compress(input: CompressionInput, ctx: LayerContext): Promise<CompressionOutput>
}
