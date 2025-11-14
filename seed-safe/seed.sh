#!/bin/bash
set -euo pipefail

npm install

echo "CRUXAGI SAFE SEED: AWAITING HUMAN GUIDANCE..."

npm run seed
