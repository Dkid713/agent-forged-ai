import fs from "node:fs"
import path from "node:path"
import { AthenaConfig } from "../types/core"

const defaultConfig: AthenaConfig = {
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

export function loadAthenaConfig(configPath?: string): AthenaConfig {
  const p =
    configPath ??
    path.join(process.cwd(), "src", "crux-agi-core", "config", "athena.config.yml")
  if (!fs.existsSync(p)) {
    return defaultConfig
  }

  const raw = fs.readFileSync(p, "utf-8")
  const parsed = parseBasicYaml(raw)

  return {
    ...defaultConfig,
    ...parsed,
    gen1: { ...defaultConfig.gen1, ...(parsed.gen1 as Record<string, unknown> | undefined) },
    gen2: { ...defaultConfig.gen2, ...(parsed.gen2 as Record<string, unknown> | undefined) },
    gen3: { ...defaultConfig.gen3, ...(parsed.gen3 as Record<string, unknown> | undefined) },
    feedback: {
      ...defaultConfig.feedback,
      ...(parsed.feedback as Record<string, unknown> | undefined)
    },
    telemetry: {
      ...defaultConfig.telemetry,
      ...(parsed.telemetry as Record<string, unknown> | undefined)
    }
  }
}
