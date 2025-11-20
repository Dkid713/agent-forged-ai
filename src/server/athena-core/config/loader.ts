import fs from 'fs'
import path from 'path'
import { defaultAthenaConfig } from '../../../shared/athena-core/config'
import type { AthenaConfig } from '../types/core'

const CONFIG_FILENAME = 'athena.config.yml'

function parseScalar(value: string): unknown {
  const normalized = value.trim()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  const numeric = Number(normalized)
  if (!Number.isNaN(numeric)) return numeric
  return normalized.replace(/^['"]|['"]$/g, '')
}

function parseBasicYaml(content: string): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  const stack: { indent: number; obj: Record<string, unknown> }[] = [
    { indent: -1, obj: root }
  ]

  for (const rawLine of content.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue
    const indent = rawLine.search(/\S/)
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop()
    }

    const current = stack[stack.length - 1].obj
    const [rawKey, ...rest] = rawLine.trim().split(':')
    const key = rawKey.trim()
    const valuePart = rest.join(':').trim()

    if (valuePart === '') {
      const nested: Record<string, unknown> = {}
      current[key] = nested
      stack.push({ indent, obj: nested })
    } else {
      current[key] = parseScalar(valuePart)
    }
  }

  return root
}

const candidatePaths = [
  path.join(__dirname, CONFIG_FILENAME),
  path.join(process.cwd(), 'src', 'server', 'athena-core', 'config', CONFIG_FILENAME)
]

export function loadAthenaConfig(): AthenaConfig {
  const foundPath = candidatePaths.find((candidate) => fs.existsSync(candidate))
  if (!foundPath) {
    return defaultAthenaConfig
  }

  const fileContents = fs.readFileSync(foundPath, 'utf-8')
  const parsed = parseBasicYaml(fileContents) as Partial<AthenaConfig> | undefined

  return {
    ...defaultAthenaConfig,
    ...parsed,
    telemetry: {
      ...defaultAthenaConfig.telemetry,
      ...(parsed?.telemetry ?? {})
    },
    gen1: {
      ...defaultAthenaConfig.gen1,
      ...(parsed?.gen1 ?? {})
    },
    gen2: {
      ...defaultAthenaConfig.gen2,
      ...(parsed?.gen2 ?? {})
    },
    gen3: {
      ...defaultAthenaConfig.gen3,
      ...(parsed?.gen3 ?? {})
    },
    feedback: {
      ...defaultAthenaConfig.feedback,
      ...(parsed?.feedback ?? {})
    }
  }
}
