#!/bin/bash
set -euo pipefail

npm install
mkdir -p sandbox
cat <<'NOTICE' > sandbox/README.md
# Sandbox Environment

All mutations must remain within this directory. Review proposed changes and
apply them manually after human approval.
NOTICE

echo "SEED INITIALIZED IN SANDBOX. HUMAN APPROVAL REQUIRED FOR CHANGES."
npm run seed
