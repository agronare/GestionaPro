#!/usr/bin/env bash
set -euo pipefail

# Helper para crear secrets en un repo GitHub usando la CLI `gh`.
# Uso:
#   export VERCEL_TOKEN="<token>"
#   export VERCEL_ORG_ID="<org-id>"
#   export VERCEL_PROJECT_ID="<project-id>"
#   ./scripts/set-github-secrets.sh owner/repo

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: Se requiere la CLI 'gh' (GitHub CLI). Instálala y logueate: https://cli.github.com/"
  exit 2
fi

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <owner/repo>"
  exit 2
fi

REPO="$1"

set_secret() {
  name="$1"
  value="${!1:-}"
  if [ -z "$value" ]; then
    echo "Skipping $name: variable de entorno $name no definida. Exporta antes: export $name=..."
    return
  fi
  echo "Setting secret $name on $REPO"
  echo -n "$value" | gh secret set "$name" --repo "$REPO" --body -
}

set_secret VERCEL_TOKEN
set_secret VERCEL_ORG_ID
set_secret VERCEL_PROJECT_ID

echo "Listo. Verifica en GitHub > Settings > Secrets and variables > Actions"
