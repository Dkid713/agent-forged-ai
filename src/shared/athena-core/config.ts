export interface Gen1Config {
  enabled: boolean
  rulesetVersion: string
  maxExpansionRatio: number
}

export interface Gen2Config {
  enabled: boolean
  dictionaryVersion: string
  minSavingsTokens: number
}

export interface Gen3Config {
  enabled: boolean
  model: string
  minClusterSize: number
  minConceptGain: number
}

export interface FeedbackConfig {
  enabled: boolean
  minDeltaSavingsTokens: number
  safetyFirst: boolean
}

export interface TelemetryConfig {
  enabled: boolean
  sampleRate: number
  kpiWindowSize: number
}

export interface AthenaConfig {
  service: string
  version: number
  gen1: Gen1Config
  gen2: Gen2Config
  gen3: Gen3Config
  feedback: FeedbackConfig
  telemetry: TelemetryConfig
}

export const defaultAthenaConfig: AthenaConfig = {
  service: 'athena-core',
  version: 1,
  gen1: {
    enabled: true,
    maxExpansionRatio: 1,
    rulesetVersion: 'gen1-v1.0.0'
  },
  gen2: {
    enabled: true,
    dictionaryVersion: 'gen2-dict-v1.0.0',
    minSavingsTokens: 4
  },
  gen3: {
    enabled: true,
    model: 'text-embeddings',
    minClusterSize: 12,
    minConceptGain: 128
  },
  feedback: {
    enabled: true,
    minDeltaSavingsTokens: 64,
    safetyFirst: true
  },
  telemetry: {
    enabled: true,
    sampleRate: 1,
    kpiWindowSize: 10000
  }
}
