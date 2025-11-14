# Agent Forged AI

A minimal prototype for a self-evolving agent platform. The project demonstrates how telemetry, autonomous hypothesis generation, experimentation, scoring, and skill composition can work together to continuously evolve an application without human intervention.

## Packages

- **server/telemetry** – lightweight request telemetry capture utilities.
- **server/athena** – closed-loop evolution engine (observe → hypothesize → experiment → evaluate → propose PR).
- **server/skills** – dynamic registry for tool/skill orchestration.
- **server/agi** – broker that composes skills into pipelines aligned with a textual requirement.
- **server/src** – bootstrap script that seeds telemetry, registers skills, and optionally runs the evolution loop.

## Getting Started

```bash
npm install
npm run build
EVOLUTION_ENABLED=1 DEMO_PIPELINE=1 npm start
```

The bootstrap script seeds synthetic telemetry, runs a single evolution iteration (configurable via environment), and prints a composed pipeline plan based on the registered skills.
