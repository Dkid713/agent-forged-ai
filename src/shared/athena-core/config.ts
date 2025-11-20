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
