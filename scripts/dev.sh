#!/usr/bin/env bash
# Runs the template app against a live-rebuilt kit in a tmux session.
# Usage: scripts/dev.sh [start|stop|restart|status|logs]   (default: restart)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION="${DEV_SESSION:-darkraise-dev}"
PORT=5176 # apps/template/vite.config.ts server.port
PNPM="$(command -v pnpm)"

running() { tmux has-session -t "=$SESSION" 2>/dev/null; }
port_busy() { ss -ltnH "sport = :$PORT" | grep -q .; }

any_alive() {
  local pid
  for pid in "$@"; do
    kill -0 "$pid" 2>/dev/null && return 0
  done
  return 1
}

descendants() {
  local pid
  for pid in "$@"; do
    echo "$pid"
    descendants $(pgrep -P "$pid" || true)
  done
}

# Starts a window whose pane stays open after its command exits, so a crash
# leaves its output readable in `logs`.
open_window() {
  local name="$1" cmd="$2"
  if [[ "$name" == kit ]]; then
    tmux new-session -d -s "$SESSION" -n "$name" -c "$ROOT" -e "PATH=$PATH"
  else
    tmux new-window -d -t "=$SESSION:" -n "$name" -c "$ROOT" -e "PATH=$PATH"
  fi
  tmux set-option -w -t "=$SESSION:$name" remain-on-exit on
  tmux respawn-pane -k -t "=$SESSION:$name" "$cmd"
}

start() {
  if running; then
    echo "$SESSION is already running; use restart."
    return 0
  fi
  if port_busy; then
    echo "Port $PORT is taken by a process outside $SESSION:" >&2
    ss -ltnpH "sport = :$PORT" >&2
    exit 1
  fi

  echo "Building the kit once (types, CSS, fonts)..."
  (cd "$ROOT" && "$PNPM" --filter darkraise-ui build)

  open_window kit "$PNPM --filter darkraise-ui dev"
  open_window app "$PNPM --filter darkraise-web-template dev"

  echo -n "Waiting for the app on port $PORT"
  for _ in $(seq 60); do
    if curl -fs -o /dev/null "http://localhost:$PORT/"; then
      echo
      echo "Up: http://localhost:$PORT/ (LAN: http://$(hostname -I | awk '{print $1}'):$PORT/)"
      echo "Live output: tmux attach -t $SESSION"
      return 0
    fi
    echo -n .
    sleep 1
  done
  echo
  echo "The app did not answer within 60 s; recent output:" >&2
  logs >&2
  exit 1
}

stop() {
  if ! running; then
    echo "$SESSION is not running."
    return 0
  fi
  local pids
  pids=$(descendants $(tmux list-panes -s -t "=$SESSION" -F '#{pane_pid}'))
  tmux kill-session -t "=$SESSION"

  # Children that ignore the pane's SIGHUP get TERM, then KILL.
  local signal
  for signal in "" TERM KILL; do
    [[ -n "$signal" ]] && kill "-$signal" $pids 2>/dev/null || true
    for _ in $(seq 20); do
      any_alive $pids || break 2
      sleep 0.25
    done
  done
  for _ in $(seq 20); do
    port_busy || break
    sleep 0.25
  done
  if port_busy; then
    echo "Stopped $SESSION, but port $PORT is still taken." >&2
    exit 1
  fi
  echo "Stopped $SESSION."
}

status() {
  if ! running; then
    echo "$SESSION is not running."
    return 0
  fi
  tmux list-windows -t "=$SESSION" -F '#{window_name}: #{?pane_dead,exited (#{pane_dead_status}),running}'
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" || true)
  echo "http://localhost:$PORT/ -> ${code:-no answer}"
}

logs() {
  local name
  for name in kit app; do
    echo "--- $name ---"
    tmux capture-pane -p -t "=$SESSION:$name" -S -40 2>/dev/null | sed '/^$/d' || true
  done
}

case "${1:-restart}" in
  start) start ;;
  stop) stop ;;
  restart) stop && start ;;
  status) status ;;
  logs) logs ;;
  *)
    echo "Usage: $0 [start|stop|restart|status|logs]" >&2
    exit 2
    ;;
esac
