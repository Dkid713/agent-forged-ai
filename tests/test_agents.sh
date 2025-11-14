#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"

if [[ -f "$repo_root/AGENTS.md" ]]; then
  echo "AGENTS.md present."
else
  echo "AGENTS.md missing." >&2
  exit 1
fi
