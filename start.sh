#!/usr/bin/env bash
set -euo pipefail
launch_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$launch_dir"
if [[ "${NODE_ENV:-}" == test && -n "${RUNTIME_PROJECT_SOURCE:-}" && -d "$RUNTIME_PROJECT_SOURCE" ]]; then
  project_dir="$(cd "$RUNTIME_PROJECT_SOURCE" && pwd)"
fi

[[ -f "$launch_dir/.env" ]] || { echo 'Missing .env; copy .env.example and provide real secrets.' >&2; exit 1; }
[[ -d "$project_dir/node_modules" && -d "$project_dir/client/node_modules" ]] || { echo 'Dependencies are missing; install them explicitly before starting.' >&2; exit 1; }

load_env_file() {
  local file="$1" line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    case "$line" in ''|'#'*) continue ;; esac
    line="${line#export }"
    key="${line%%=*}"
    value="${line#*=}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ "$value" == \"*\" && "$value" == *\" ]] || [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
    if [[ -z "${!key+x}" ]]; then printf -v "$key" '%s' "$value"; export "$key"; fi
  done < "$file"
}
load_env_file "$launch_dir/.env"

backend_port="${BACKEND_PORT:-${SERVER_PORT:-${PORT:-4000}}}"
frontend_port="${FRONTEND_PORT:-3000}"
backend_host="${BACKEND_HOST:-127.0.0.1}"
frontend_host="${FRONTEND_HOST:-127.0.0.1}"

for port in "$backend_port" "$frontend_port"; do
  if command -v lsof >/dev/null && lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use." >&2
    exit 1
  fi
done

backend_pid=""
frontend_pid=""
cleanup() {
  [[ -n "$backend_pid" ]] && kill "$backend_pid" 2>/dev/null || true
  [[ -n "$frontend_pid" ]] && kill "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ "${MIGRATE_ON_START:-false}" == "true" || "${ALLOW_SCHEMA_MIGRATION:-false}" == "true" ]]; then
  (cd "$project_dir" && node server/scripts/migrate.js && node server/scripts/runtime-bootstrap.js)
fi
(cd "$project_dir" && SERVER_PORT="$backend_port" CLIENT_URL="${CLIENT_URL:-http://$frontend_host:$frontend_port}" exec node server/index.js) &
backend_pid=$!
if [[ "${NODE_ENV:-}" != test ]]; then
  (cd "$project_dir/client" && HOST="$frontend_host" PORT="$frontend_port" REACT_APP_API_URL="${REACT_APP_API_URL:-http://$backend_host:$backend_port/api}" BROWSER=none exec ./node_modules/.bin/react-scripts start) &
  frontend_pid=$!
fi

wait "$backend_pid"
