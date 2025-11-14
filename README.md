# agent-forged-ai

TypeScript implementations of the Athena / CruxAGI compression and evolution engines.

## Getting started

```bash
npm install
npm run build
```

## Modules

- `src/compression-engine.ts` – Athena / CruxAGI v2 compression engine with codec routing, telemetry, and CruxRC helpers.
- `src/athena-engine.ts` – Unified engine wiring together the compression skill, evolution engine scaffolding, and skills market.
