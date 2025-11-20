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
    kpiWindowSize: number
  }
  gen1: {
    enabled: boolean
    maxExpansionRatio: number
    rulesetVersion: string
  }
  gen2: {
    enabled: boolean
    dictionaryVersion: string
    minSavingsTokens: number
  }
  gen3: {
    enabled: boolean
    model: string
    minClusterSize: number
    minConceptGain: number
  }
  feedback: {
    enabled: boolean
    minDeltaSavingsTokens: number
    safetyFirst: boolean
  }
}
