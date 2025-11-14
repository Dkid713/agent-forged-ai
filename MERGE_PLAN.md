# Approved Merge & Cleanup Plan

This document captures the agreed merge sequence and related actions so the workflow is actionable—even from GitHub mobile.

## Phase 1 – Core Foundation
1. **Merge PR #8 – `codex/build-the-codecs-folder`**
   - Establishes the source of truth for:
     - `CRUXAGI_COMPRESSION_V2/production/codex/`
     - `compressMessage.ts`
     - `codecs/` (hex, bracket, hybrid, codex)
   - After the merge, `main` includes the Codex compression library.
2. **Merge PR #6 – `compression-engine.ts`**
   - Adds benefit gating plus token/byte math.
   - Introduces a central "Should we compress?" decision layer with a clean metrics object.
   - Treat `compression-engine.ts` as the Athena/LLM-facing orchestration layer that wraps `compressMessage`.

## Phase 2 – Documentation
3. **Merge PRs #9 and #10 – API Docs**
   - Provide repository-level documentation for:
     - Live API endpoints (Replit URL).
     - `POST /api/codex/compress` usage.
     - `CompressionResult` fields (`compressionPercent`, `tokensSaved`, etc.).
   - Ensure conflicts resolve in favor of retaining the full field set:
     - `original`, `compressed`, `codec`, `muClass`, `bytesSaved`, `ratio`, `compressionPercent`, `tokensSaved`.

## Phase 3 – Cleanup
4. **Close or Park PRs #1–5**
   - These cover experimental scaffolding (Athena evolution engine, telemetry helpers, Bun tests, CruxRC header work).
   - Close them as "experiment / v1 draft" or tag with a label like `future-iteration` if they should remain open.

## Post-Merge Follow-Up
- `main` will contain:
  - `CRUXAGI_COMPRESSION_V2/production/codex/…` (core library).
  - `compression-engine.ts` (optional engine layer).
  - A README with API documentation describing both the Replit API and direct `compressMessage` usage.
- Next step for Replit:
  - Point the `/api/codex/compress` route to the GitHub `compressMessage` implementation (via submodule or copied code).

## Quick GitHub Mobile Checklist
1. Merge PR #8.
2. Merge PR #6.
3. Merge PR #9.
4. Merge PR #10.
5. Close PRs #1–5.

Optional: add a comment when closing PRs #1–5, e.g. "Parking this as early experiment – core Codex engine is now in main via PR #8 and #6." This keeps the historical context.
