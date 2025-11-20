import fs from "node:fs"
import path from "node:path"
import type { AthenaConfig } from "../types/core"

const DEFAULT_CONFIG_PATH = path.join(
  process.cwd(),
  "src",
  "crux-agi-core",
  "config",
  "athena.config.yml"
)

const defaultConfig: AthenaConfig = {
  service: "crux-agi-core",
  version: 1,
  gen1: {
    enabled: true,
    maxExpansionRatio: 1,
    rulesetVersion: "gen1-v1.0.0"
  },
  gen2: {
    enabled: true,
    dictionaryVersion: "gen2-dict-v1.0.0",
    minSavingsTokens: 4
  },
  gen3: {
    enabled: true,
    model: "text-embeddings",
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

function parseScalar(value: string): unknown {
  const normalized = value.trim()
  if (normalized === "true") return true
  if (normalized === "false") return false
  const numeric = Number(normalized)
  if (!Number.isNaN(numeric)) return numeric
  return normalized.replace(/^['"]|['"]$/g, "")
}

function parseBasicYaml(content: string): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  const stack: { indent: number; obj: Record<string, unknown> }[] = [
    { indent: -1, obj: root }
  ]

  for (const rawLine of content.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue
    const indent = rawLine.search(/\S/)
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop()
    }

    const current = stack[stack.length - 1].obj
    const [rawKey, ...rest] = rawLine.trim().split(":")
    const key = rawKey.trim()
    const valuePart = rest.join(":").trim()

    if (valuePart === "") {
      const nested: Record<string, unknown> = {}
      current[key] = nested
      stack.push({ indent, obj: nested })
    } else {
      current[key] = parseScalar(valuePart)
    }
  }

  return root
}

function mergeConfig(
  defaults: AthenaConfig,
  overrides: Partial<AthenaConfig>
): AthenaConfig {
  return {
    ...defaults,
    ...overrides,
    gen1: { ...defaults.gen1, ...(overrides.gen1 ?? {}) },
    gen2: { ...defaults.gen2, ...(overrides.gen2 ?? {}) },
    gen3: { ...defaults.gen3, ...(overrides.gen3 ?? {}) },
    feedback: { ...defaults.feedback, ...(overrides.feedback ?? {}) },
    telemetry: { ...defaults.telemetry, ...(overrides.telemetry ?? {}) }
  }
}

export function loadAthenaConfig(configPath: string = DEFAULT_CONFIG_PATH): AthenaConfig {
  if (!fs.existsSync(configPath)) {
    return defaultConfig
  }

  const raw = fs.readFileSync(configPath, "utf-8")
  const parsed = parseBasicYaml(raw) as Partial<AthenaConfig>

  return mergeConfig(defaultConfig, parsed)
}
