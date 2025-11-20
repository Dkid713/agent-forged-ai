# Configuration

- `athena.config.yml` holds the shared defaults for Athena-aware components.
- Both the server loader and the Crux AGI utilities search `config/athena.config.yml` first, then fall back to legacy paths under `src/**/config/athena.config.yml` for backward compatibility.
- Copy this file and adjust values to tune telemetry, feedback, or generation settings without editing code.
