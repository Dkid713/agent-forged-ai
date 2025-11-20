import type { AthenaConfig } from '../../../shared/athena-core/config'

export interface CompressionInput {
  id: string
  text: string
  metadata?: Record<string, unknown>
}

export interface CompressionOutput {
  id: string
  originalTokens: number
  compressedTokens: number
  savings: number
  ratio: number
  text?: string
}

export interface LayerContext {
  requestId: string
  config: AthenaConfig
}

export type { AthenaConfig }
