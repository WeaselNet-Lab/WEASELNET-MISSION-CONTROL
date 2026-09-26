#!/usr/bin/env bash
# Cloud Agent dev server: WeaselNet Mission Control on http://127.0.0.1:43147.
set -euo pipefail

cd "$(dirname "$0")/.."

# Pin the same Node used at install time (node:sqlite backup() needs >= 22.15).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  export PATH="$NVM_DIR/versions/node/v22.22.2/bin:$PATH"
fi

echo "Using node $(node --version)"

# Optionally provision the single owner account when credentials are supplied as
# secrets. The operator board requires an owner session; Explore is public.
# provisionOwner refuses to replace an existing owner, so ignore that case.
if [ -n "${WEASELNET_OWNER_USERNAME:-}" ] && [ -n "${WEASELNET_OWNER_PASSWORD:-}" ]; then
  npm run owner:provision || true
fi

exec npm run dev
