#!/usr/bin/env bash
# Cloud Agent install: refresh dependencies against the checked-out source.
# Idempotent and safe to re-run.
set -euo pipefail

cd "$(dirname "$0")/.."

# WeaselNet uses Node's built-in node:sqlite, including backup(), which is only
# available on Node >= 22.15. The runtime's default `node` can be older, so pin a
# known-good version via the pre-installed nvm.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install 22.22.2 >/dev/null 2>&1 || true
  export PATH="$NVM_DIR/versions/node/v22.22.2/bin:$PATH"
fi

echo "Using node $(node --version) / npm $(npm --version)"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
