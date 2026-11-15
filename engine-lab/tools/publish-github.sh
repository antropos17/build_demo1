#!/usr/bin/env bash
# Run from an extracted standalone Last Piston folder. No stored credentials.
set -euo pipefail
cd "$(dirname "$0")/.."
name="${1:-last-piston}"
visibility="${2:---private}"
[[ "$name" =~ ^[a-zA-Z0-9][a-zA-Z0-9._-]*$ ]] || { echo 'Invalid repository name.' >&2; exit 2; }
[[ "$visibility" == '--private' || "$visibility" == '--public' ]] || { echo 'Use --private or --public.' >&2; exit 2; }
command -v gh >/dev/null || { echo 'Install GitHub CLI (gh) and run gh auth login.' >&2; exit 1; }
gh auth status >/dev/null
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo 'Extract a fresh standalone ZIP outside any Git repository first.' >&2
  exit 1
fi
npm test
npm run build
git init -b main
git add .
git commit -m 'Last Piston 0.9: continuous audio, calibrated telemetry, relay and efficient smoke'
gh repo create "$name" "$visibility" --source=. --remote=origin --push
