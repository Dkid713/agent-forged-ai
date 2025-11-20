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

## Endpoint behavior

- **Request body**: `{ "id?": string, "text"?: string, "message"?: string }` (`text` and `message` are interchangeable).
- **Response body**: `{ id, originalTokens, compressedTokens, savings, ratio, text }`.
- The response shape is stable in both Athena and legacy modes.

## Athena configuration

Athena Core reads from `src/server/athena-core/config/athena.config.yml`. Default values are shared across server code, the Crux AGI utilities, and the shared config types. You can adjust the YAML if you need to tune defaults.

## Notes on optional dependencies

- The CruxAGI-AVI repository is optional for running this service. Use `./scripts/clone_cruxagi.sh` if you need it locally.
- The `/chat` endpoint and GitHub automation are disabled unless the relevant environment variables are provided; the server still starts without them.
