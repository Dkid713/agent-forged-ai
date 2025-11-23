import type { CompressionInput, CompressionOutput, LayerContext } from './core'

export interface Gen2Engine {
  compress(input: CompressionInput, ctx: LayerContext): Promise<CompressionOutput>
}
