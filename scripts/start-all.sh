#!/usr/bin/env bash
#
# start-all — launch the whole NowStack Mobile stack with one command.
#
# Runs Convex, the web app, and the Expo mobile dev server together.
# Each service streams colored, prefixed output to this terminal AND is
# tee'd to its own file under ./logs/.
#
# Ports auto-increment so several apps run side by side without clashing:
# the web app takes the first free port in the 310x range (3100, 3101, …)
# and Metro takes the matching 810x port (8100, 8101, …). A second copy of
# this stack launched from another repo simply lands on the next slot.
#
# Usage (via package.json):
#   npm run start-all                     # convex + web + mobile (Metro only)
#   npm run start-all -- --ios            # convex + web + iOS simulator
#   npm run start-all -- --android        # convex + web + Android emulator
#   npm run start-all -- --web --convex   # only the listed services
#   npm run start-all -- --no-mobile      # everything except mobile
#   npm run start-all -- --port 3105      # pin the web port (Metro follows)
#   npm run start-all -- --help
#
# Note: npm needs the `--` separator to forward flags, so plain
# `npm run start-all --ios` does NOT reach this script. Use either
# `npm run start-all -- --ios`, the `npm run start-all:ios` shortcut,
# or run the script directly: ./scripts/start-all.sh --ios
#
# Stop everything with Ctrl-C.

set -euo pipefail

# Script lives in scripts/, so the repo root is one level up.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/logs"
STAMP="$(date +%Y%m%d-%H%M%S)"

WEB_PORT_BASE=3100   # web app: first free port at or above this (310x)
METRO_PORT_BASE=8100 # Expo Metro: first free port at or above this (810x)

# ── colors ──────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  C_CONVEX=$'\033[35m'   # magenta
  C_WEB=$'\033[36m'      # cyan
  C_MOBILE=$'\033[32m'   # green
  C_SYS=$'\033[33m'      # yellow
  C_DIM=$'\033[2m'
  C_BOLD=$'\033[1m'
  NC=$'\033[0m'
else
  C_CONVEX=""; C_WEB=""; C_MOBILE=""; C_SYS=""; C_DIM=""; C_BOLD=""; NC=""
fi

PIDS=()

log_sys() { printf '%b%-7s%b | %s\n' "$C_SYS" "system" "$NC" "$1"; }

# true if something is already listening on the given TCP port.
port_in_use() { lsof -iTCP:"$1" -sTCP:LISTEN -n -P >/dev/null 2>&1; }

# echo the first free TCP port at or above the given start port.
first_free_port() {
  local port="$1"
  while port_in_use "$port"; do port=$((port + 1)); done
  printf '%s' "$port"
}

# recursively terminate a pid and all of its descendants (macOS-safe, no setsid)
killtree() {
  local pid="$1" child
  for child in $(pgrep -P "$pid" 2>/dev/null); do
    killtree "$child"
  done
  kill -TERM "$pid" 2>/dev/null || true
}

cleanup() {
  trap - INT TERM EXIT
  echo
  log_sys "shutting down…"
  local pid
  for pid in "${PIDS[@]:-}"; do
    [[ -n "$pid" ]] && killtree "$pid"
  done
  wait 2>/dev/null || true
  log_sys "all services stopped. logs kept in ./logs/"
}

# start_service <name> <color> <workdir> <log-basename> <cmd...>
start_service() {
  local name="$1" color="$2" workdir="$3" base="$4"; shift 4
  local logfile="$LOG_DIR/${base}.log"

  ln -sf "${base}.${STAMP}.log" "$logfile" 2>/dev/null || true
  local real="$LOG_DIR/${base}.${STAMP}.log"
  : > "$real"

  log_sys "starting ${color}${name}${NC} ${C_DIM}(logs: logs/${base}.log)${NC}"

  (
    cd "$workdir"
    # line-buffer where possible so logs stream live
    exec "$@"
  ) > >(
    while IFS= read -r line; do
      printf '%b%-7s%b | %s\n' "$color" "$name" "$NC" "$line"
      printf '%s\n' "$line" >> "$real"
    done
  ) 2>&1 &

  PIDS+=($!)
}

# ── arg parsing ───────────────────────────────────────────────────────────────
RUN_CONVEX=true
RUN_WEB=true
RUN_MOBILE=true
LAUNCH_IOS=false
LAUNCH_ANDROID=false
EXPLICIT=false
WEB_PORT=""

usage() {
  # print the leading comment block (skip the shebang), strip the "# " prefix
  awk 'NR==1{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "${BASH_SOURCE[0]}"
  exit 0
}

# the first positive selector switches to explicit mode: start only what is asked.
select_only() {
  if [[ "$EXPLICIT" == false ]]; then
    RUN_CONVEX=false; RUN_WEB=false; RUN_MOBILE=false; EXPLICIT=true
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage ;;
    -p|--port)
      WEB_PORT="${2:-}"
      [[ "$WEB_PORT" =~ ^[0-9]+$ ]] || { log_sys "--port needs a number (got '${2:-}')"; exit 1; }
      shift
      ;;
    --no-mobile) RUN_MOBILE=false; LAUNCH_IOS=false; LAUNCH_ANDROID=false ;;
    --no-web)    RUN_WEB=false ;;
    --no-convex) RUN_CONVEX=false ;;
    --convex|convex) select_only; RUN_CONVEX=true ;;
    --web|web)       select_only; RUN_WEB=true ;;
    --mobile|mobile) select_only; RUN_MOBILE=true ;;
    # --ios/--android are launch modifiers, not service selectors: they pick the
    # mobile target and keep the default convex + web running alongside.
    --ios)           RUN_MOBILE=true; LAUNCH_IOS=true ;;
    --android)       RUN_MOBILE=true; LAUNCH_ANDROID=true ;;
    *) log_sys "unknown arg: $1 (try --help)"; exit 1 ;;
  esac
  shift
done

if ! $RUN_CONVEX && ! $RUN_WEB && ! $RUN_MOBILE; then
  log_sys "no services selected — nothing to run."
  exit 1
fi

mkdir -p "$LOG_DIR"

# resolve ports now so the banner can report them. An explicit --port wins;
# otherwise grab the next free slot in each range so parallel stacks coexist.
if $RUN_WEB; then
  WEB_PORT="$(first_free_port "${WEB_PORT:-$WEB_PORT_BASE}")"
fi
METRO_PORT="$(first_free_port "$METRO_PORT_BASE")"

# install cleanup only now that we're actually about to spawn services,
# so --help and arg errors don't trigger the shutdown banner.
trap cleanup INT TERM EXIT

# ── banner ────────────────────────────────────────────────────────────────────
printf '\n%b┌─────────────────────────────────────────────┐%b\n' "$C_BOLD" "$NC"
printf '%b│     NowStack Mobile — dev launcher           │%b\n' "$C_BOLD" "$NC"
printf '%b└─────────────────────────────────────────────┘%b\n\n' "$C_BOLD" "$NC"

# ── launch ────────────────────────────────────────────────────────────────────
$RUN_CONVEX && start_service "convex" "$C_CONVEX" "$ROOT" "convex" npm run dev:convex
$RUN_WEB    && start_service "web"    "$C_WEB"    "$ROOT/web-app" "web" npx vite dev --port "$WEB_PORT"

if $RUN_MOBILE; then
  mobile_cmd=(npx expo start --port "$METRO_PORT")
  $LAUNCH_IOS     && mobile_cmd+=(--ios)
  $LAUNCH_ANDROID && mobile_cmd+=(--android)
  start_service "mobile" "$C_MOBILE" "$ROOT/mobile-app" "mobile" "${mobile_cmd[@]}"
fi

echo
if $RUN_WEB; then
  log_sys "${C_BOLD}stack is up${NC}  ·  web: http://localhost:${WEB_PORT}  ·  Ctrl-C to stop"
else
  log_sys "${C_BOLD}stack is up${NC}  ·  Ctrl-C to stop"
fi
if $RUN_MOBILE; then
  log_sys "${C_DIM}mobile: Metro on port ${METRO_PORT}${NC}"
  if $LAUNCH_IOS; then
    log_sys "${C_DIM}iOS: opening the simulator (needs a dev build — run 'cd mobile-app && npm run ios' once if it isn't installed)${NC}"
  fi
  if $LAUNCH_ANDROID; then
    log_sys "${C_DIM}Android: opening the emulator (needs a dev build — run 'cd mobile-app && npm run android' once if it isn't installed)${NC}"
  fi
  if ! $LAUNCH_IOS && ! $LAUNCH_ANDROID; then
    log_sys "${C_DIM}mobile: Metro only — pass --ios or --android to open a simulator, or scan the Expo QR${NC}"
  fi
fi
echo

wait
