#!/usr/bin/env bash
set -euo pipefail

# Script to help set up authenticated git remote for pushing changes
# Usage: ./scripts/setup_git_remote.sh [YOUR_GITHUB_TOKEN]

REPO_OWNER="Dkid713"
REPO_NAME="agent-forged-ai"
REMOTE_NAME="origin"

echo "=== Git Remote Setup Script ==="
echo ""

# Check if git is available
if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is not installed or not available in PATH." >&2
  exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Error: Not in a git repository." >&2
  exit 1
fi

# Get current remote URL
CURRENT_URL=$(git remote get-url "$REMOTE_NAME" 2>/dev/null || echo "")

if [ -z "$CURRENT_URL" ]; then
  echo "Error: No remote named '$REMOTE_NAME' found." >&2
  exit 1
fi

echo "Current remote URL: $CURRENT_URL"
echo ""

# Check if token is provided as argument
if [ $# -eq 0 ]; then
  echo "Usage: $0 YOUR_GITHUB_TOKEN"
  echo ""
  echo "To set up authenticated git remote for pushing:"
  echo "  1. Create a GitHub Personal Access Token at:"
  echo "     https://github.com/settings/tokens"
  echo "  2. Grant the token 'repo' permissions"
  echo "  3. Run this script with your token:"
  echo "     $0 YOUR_TOKEN"
  echo ""
  echo "Alternatively, you can manually set the remote URL:"
  echo "  git remote set-url $REMOTE_NAME https://YOUR_TOKEN@github.com/$REPO_OWNER/$REPO_NAME.git"
  echo ""
  exit 0
fi

GITHUB_TOKEN="$1"

# Validate token format (basic check)
if [ ${#GITHUB_TOKEN} -lt 20 ]; then
  echo "Warning: The provided token seems too short. GitHub tokens are typically longer." >&2
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Set the new remote URL with authentication
NEW_URL="https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
echo "Setting remote URL with authentication..."
git remote set-url "$REMOTE_NAME" "$NEW_URL"

# Verify the change (but don't display the token)
# Use printf to safely escape special characters in the token
VERIFY_URL=$(git remote get-url "$REMOTE_NAME" | awk -v token="$GITHUB_TOKEN" '{gsub(token, "***TOKEN***"); print}')
echo "Remote URL updated: $VERIFY_URL"
echo ""
echo "✓ Git remote is now configured with authentication"
echo ""
echo "You can now push changes to the repository:"
echo "  git push $REMOTE_NAME main"
echo ""
echo "⚠️  SECURITY WARNING:"
echo "Your token is stored in PLAINTEXT in .git/config and can be viewed by anyone"
echo "with access to this repository directory. Consider using SSH keys or a"
echo "credential helper for better security:"
echo "  https://docs.github.com/en/get-started/getting-started-with-git/caching-your-github-credentials-in-git"
echo ""
echo "To remove the token from git config, run:"
echo "  git remote set-url $REMOTE_NAME https://github.com/$REPO_OWNER/$REPO_NAME.git"
