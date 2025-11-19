#!/usr/bin/env bash
set -euo pipefail

# Sync selected env vars from .env.local to Vercel (Production and Preview)
# Usage: ./scripts/sync-vercel-envs-from-dotenv.sh
# Requires: vercel CLI logged in and project linked (vercel link)

ENV_FILE=".env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[x] $ENV_FILE no existe. Crea el archivo con tus credenciales reales primero." >&2
  exit 1
fi

REQUIRED_KEYS=(
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  NEXT_PUBLIC_FIREBASE_PROJECT_ID
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  NEXT_PUBLIC_FIREBASE_APP_ID
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  FIREBASE_CLIENT_EMAIL
  FIREBASE_PRIVATE_KEY
)

# Read KEY=VALUE from dotenv, ignoring comments and blank lines
get_val() {
  local key="$1"
  # Use grep to find the line, then cut after '=' and trim quotes/spaces
  local line
  line=$(grep -E "^${key}=" "$ENV_FILE" || true)
  if [[ -z "$line" ]]; then
    echo ""
    return 0
  fi
  local val
  val=${line#*=}
  # Trim surrounding quotes if present
  val=${val%\r}
  val=${val%\n}
  if [[ ${val:0:1} == '"' && ${val: -1} == '"' ]]; then
    val=${val:1:-1}
  elif [[ ${val:0:1} == "'" && ${val: -1} == "'" ]]; then
    val=${val:1:-1}
  fi
  echo "$val"
}

add_or_update_var() {
  local name="$1"
  local value="$2"
  local env="$3" # production|preview

  if [[ -z "$value" ]]; then
    echo "[-] $name ($env) vacío — omitido"
    return
  fi
  local lower
  lower=$(echo "$value" | tr '[:upper:]' '[:lower:]')
  if echo "$lower" | grep -Eq "^$|^<|your_|tu_|xxxx|placeholder|reemplaza|replace"; then
    echo "[-] $name ($env) parece placeholder — omitido"
    return
  fi
  # Primero intentar update; si no existe, intentar add
  if echo "$value" | vercel env update "$name" "$env" >/dev/null 2>&1; then
    echo "[~] $name ($env) actualizado"
  else
    if echo "$value" | vercel env add "$name" "$env" >/dev/null 2>&1; then
      echo "[+] $name ($env) agregado"
    else
      echo "[!] $name ($env) no se pudo agregar/actualizar"
    fi
  fi
}

# Ensure project is linked
if ! vercel whoami >/dev/null 2>&1; then
  echo "[x] No has iniciado sesión en Vercel. Ejecuta: vercel login" >&2
  exit 1
fi

# Try to get project info (non-fatal)
vercel link --yes >/dev/null 2>&1 || true

echo "Sincronizando variables a Vercel..."
for key in "${REQUIRED_KEYS[@]}"; do
  val=$(get_val "$key")
  add_or_update_var "$key" "$val" production
  add_or_update_var "$key" "$val" preview
 done

echo "Hecho. Puedes reintentar: vercel --prod --yes"
