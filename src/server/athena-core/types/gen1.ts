import type { CompressionInput, CompressionOutput, LayerContext } from './core'

export interface Gen1Engine {
  compress(input: CompressionInput, ctx: LayerContext): Promise<CompressionOutput>
}
