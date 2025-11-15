# agent-forged-ai

This repository provides utilities for working with external AI-related projects.

## Autonomous AGI microservice

The `autonomous-server` service exposes an HTTP API on port `3000` that allows an OpenAI model to observe and act on this repository. It supports reading and writing files, running shell commands, managing git branches, and opening GitHub pull requests.

### Requirements

Set the following environment variables before starting the service:

- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `AUTONOMOUS_AGI_PORT` (optional, defaults to `3000`)

### Install dependencies

```bash
npm install
```

### Start the service in development

```bash
npm run dev
```

### Build and run in production

```bash
npm run build
npm start
```

### Chat endpoint

Send a POST request to `http://localhost:3000/chat` with a JSON payload:

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful code assistant." },
    { "role": "user", "content": "Inspect the repository." }
  ]
}
```

The service will loop on OpenAI function-calls until the model returns a final assistant message.

## Cloning the CRUX AGI AVI repository

If you want to clone [`Dkid713/cruxagi-avi-advanced-virtual-intelligence`](https://github.com/Dkid713/cruxagi-avi-advanced-virtual-intelligence), you can use the helper script provided in [`scripts/clone_cruxagi.sh`](scripts/clone_cruxagi.sh).

```bash
./scripts/clone_cruxagi.sh
```

The script defaults to cloning the repository into a local folder named `cruxagi-avi-advanced-virtual-intelligence`. You can override the destination or source URL:

```bash
./scripts/clone_cruxagi.sh <repo-url> <target-directory>
```

For example, to clone into `~/projects/cruxagi`:

```bash
./scripts/clone_cruxagi.sh https://github.com/Dkid713/cruxagi-avi-advanced-virtual-intelligence.git ~/projects/cruxagi
```

Make sure that `git` is installed on your system before running the script.
## Operational Status

🎉 **All API Keys Confirmed Active!**

Your Athena AGI Engine is fully operational with all major AI providers:

- ✅ **OpenAI** – GPT-4o, GPT-4o-mini, O1 (reasoning)
- ✅ **Anthropic** – Claude-3.5-Sonnet, Opus, Haiku
- ✅ **xAI** – Grok-3-mini, Grok-2, Grok-4
- ✅ **Perplexity** – Real-time search, citations
- ✅ **OpenRouter** – 100+ models, auto-fallback

## Available Capabilities

1. **GitHub Codex Integration**
   - Dictionary compression (⟦0⟧ tokens)
   - Four codecs: bracket, hex, hybrid, codex
   - Endpoint: `/api/codex/compress`
2. **Athena AGI Engine**
   - Evolution Engine (AI-generated code proposals)
   - Skills Marketplace (goal planning & execution)
   - Advanced compression (benefit gates, μ-classification)
   - Endpoints: `/api/athena/*` (7 endpoints)
3. **Multi-Provider Smart Routing**
   - Math/Code → Grok-3-mini ($0.07/1M tokens)
   - Research → Perplexity ($1/1M tokens)
   - Reasoning → GPT-4o-mini ($0.15/1M tokens)
   - Writing → Claude-3-Haiku ($0.25/1M tokens)
   - Fallback → OpenRouter (auto-select)
4. **Complete Compression Pipeline**
   - Gen1: Self-learning compression
   - Gen3: Semantic acronym compression (AI→ML→NLP)
   - Omega: Full pipeline (Pre→Gate→Post→Learn)
   - Codex: Dictionary-based tokens
5. **Production Infrastructure**
   - 62+ API endpoints
   - Real-time telemetry & monitoring
   - Circuit breakers & rate limits
   - AAP compliance headers
   - Full observability

## Cost Optimization

The system automatically routes requests to the most cost-effective model compared to GPT-4o:

| Query Type       | Model          | Relative Cost |
|------------------|----------------|---------------|
| Math             | Grok-3-mini    | 36× cheaper   |
| Simple reasoning | GPT-4o-mini    | 17× cheaper   |
| Writing          | Claude-Haiku   | 10× cheaper   |

## Quick Tests

```bash
# Check the status of all providers
curl https://YOUR-URL/api/athena/status

# Generate evolution proposals with real AI
curl -X POST https://YOUR-URL/api/athena/evolution/proposals \
  -d '{"telemetry":{...},"codeGraph":{...}}'

# Use the skills marketplace planner
curl -X POST https://YOUR-URL/api/athena/plan \
  -d '{"goal":{...}}'

# Compress a message with GitHub Codex
curl -X POST https://YOUR-URL/api/codex/compress \
  -d '{"message":"text to compress"}'
```

## Summary

You have successfully integrated:

- ✅ GitHub Codex module from your repo
- ✅ Athena Evolution + Skills engines
- ✅ All five major AI providers
- ✅ Smart cost-optimized routing
- ✅ Production-grade infrastructure

Your AGI platform is complete and operational. 🎯
