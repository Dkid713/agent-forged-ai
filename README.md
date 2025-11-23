# agent-forged-ai

A lightweight HTTP service that exposes:

- `/api/codex/compress` for simple text compression
- `/chat` for OpenAI function-calling (requires an API key)

The service can run with the legacy compression path or with the Athena Core pipeline.

## Quickstart

1. Install dependencies

   ```bash
   npm install
   ```

2. (Optional) Clone the CruxAGI-AVI dependency if you want the auxiliary repository locally

   ```bash
   ./scripts/clone_cruxagi.sh
   ```

3. Start the development server

   - Legacy compression (no extra env needed):

     ```bash
     npm run dev
     ```

   - Athena Core compression:

     ```bash
     ENABLE_ATHENA_CORE=true npm run dev
     ```

   - Optional integrations:
     - `OPENAI_API_KEY` enables the `/chat` endpoint.
     - `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` enable GitHub PR automation used by the `/chat` functions.
     - `AUTONOMOUS_AGI_PORT` can override the default port `3000`.

4. Test the compression endpoint

   ```bash
   curl -X POST http://localhost:3000/api/codex/compress \
     -H 'Content-Type: application/json' \
     -d '{"id":"demo-1","text":"This is a simple compression test."}'
   ```

   With `ENABLE_ATHENA_CORE=true`, the request flows through Athena Core and emits `[AthenaCore]` logs. With the flag unset, it uses the legacy fallback but returns the same response shape.

## Quick sanity checks

Run these to confirm both compression paths behave as expected on your machine:

- **Legacy mode** (no extra env needed)

  ```bash
  npm install
  npm run dev
  curl -X POST http://localhost:3000/api/codex/compress \
    -H 'Content-Type: application/json' \
    -d '{"id":"demo","text":"Hello Athena"}'
  ```

- **Athena Core mode** (flag enabled)

  ```bash
  npm install
  ENABLE_ATHENA_CORE=true npm run dev
  curl -X POST http://localhost:3000/api/codex/compress \
    -H 'Content-Type: application/json' \
    -d '{"id":"demo-athena","text":"Hello Athena with flag on"}'
  ```

The second run should include `[AthenaCore]` log lines while keeping the same response schema.

## Repository layout

- `src/`: application source code.
- `config/`: central configuration, including `athena.config.yml` shared by Athena-aware components.
- `docs/`: project documentation and integration notes.
- `scripts/`: helper scripts such as `clone_cruxagi.sh`.
- `tests/`: home for automated tests (placeholder until suites are added).

Additional design notes live in `docs/ai-native-os-kernel-reference.md`, which summarizes the AI-Native OS kernel API and developer guide from the v0.1 release.

## Python CLI prototype

For a runnable Python demonstration of the CruxAGI compression, Hive6D coordination, and agent spawning flows, use `scripts/ai_native_os_cli.py`.

Examples:

```bash
# Compress a file with LZMA and emit a JSON summary (preset 0-9)
python scripts/ai_native_os_cli.py compress ./README.md ./README.md.xz --preset 6

# Generate Hive6D-style random coordination slots for 5 agents across 6 dimensions
# Optional --seed provides reproducible assignments
python scripts/ai_native_os_cli.py coordinate --agents 5 --dimensions 6 --seed 42

# Spawn a simulated agent bound to a semantic graph name
python scripts/ai_native_os_cli.py spawn knowledge-graph-A
```

No external dependencies are required beyond a standard Python 3 interpreter.

## Endpoint behavior

- **Request body**: `{ "id?": string, "text"?: string, "message"?: string }` (`text` and `message` are interchangeable).
- **Response body**: `{ id, originalTokens, compressedTokens, savings, ratio, text }`.
- The response shape is stable in both Athena and legacy modes.

## Athena configuration

Athena Core reads from `config/athena.config.yml`. Default values are shared across server code, the Crux AGI utilities, and the shared config types. You can adjust the YAML if you need to tune defaults; the loaders will also fall back to legacy paths under `src/**/config/athena.config.yml` if needed.

## Notes on optional dependencies

- The CruxAGI-AVI repository is optional for running this service. Use `./scripts/clone_cruxagi.sh` if you need it locally.
- The `/chat` endpoint and GitHub automation are disabled unless the relevant environment variables are provided; the server still starts without them.
