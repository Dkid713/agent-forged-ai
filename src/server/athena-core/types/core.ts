import type { AthenaConfig } from '../../../shared/athena-core/config'
import type { AthenaOmegaParams } from '../../../shared/athena-core/athenaOmegaBaseline'

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
  omegaPsiKuramoto: AthenaOmegaParams
}

export type { AthenaConfig }
