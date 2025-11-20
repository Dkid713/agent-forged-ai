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

export interface AthenaConfig {
  version: number
  service: string
  telemetry: {
    enabled: boolean
    sampleRate: number
  }
  gen1: {
    rulesetVersion: string
  }
}
