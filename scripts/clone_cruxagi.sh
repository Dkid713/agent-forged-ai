#!/usr/bin/env bash
set -euo pipefail

DEFAULT_URL="https://github.com/Dkid713/cruxagi-avi-advanced-virtual-intelligence.git"
REPO_URL="${1:-$DEFAULT_URL}"
TARGET_DIR="${2:-cruxagi-avi-advanced-virtual-intelligence}"

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is not installed or not available in PATH." >&2
  exit 1
fi

if [ -d "$TARGET_DIR/.git" ]; then
  echo "Repository already exists in '$TARGET_DIR'." >&2
  exit 0
fi

if [ -d "$TARGET_DIR" ]; then
  echo "Error: target directory '$TARGET_DIR' exists but is not a git repository." >&2
  exit 1
fi

echo "Cloning $REPO_URL into $TARGET_DIR..."
git clone "$REPO_URL" "$TARGET_DIR"
echo "Clone completed successfully."
