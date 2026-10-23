#!/usr/bin/env bash
set -euo pipefail

RINGLEADER="${RINGLEADER:-ringleader}"
TMUX_PREFIX="${RINGLEADER_TMUX_PREFIX:-ringleader-}"
STARTUP_GRACE_SECONDS="${WATCH_STARTUP_GRACE:-60}"
POLL_SECONDS="${WATCH_POLL:-30}"
PERMISSION_PROMPT_PATTERN="${WATCH_PERMISSION_PATTERN:-Permission required|Do you want to}"
PANE_TAIL_LINES=40
LIST_FAILURE_LIMIT=3

main() {
  session_name="${1:-}"
  [ -n "$session_name" ] || usage
  sleep "$STARTUP_GRACE_SECONDS"
  watch_until_stopped
}

usage() {
  echo "usage: watch-session.sh <session name>" >&2
  exit 2
}

watch_until_stopped() {
  local state pane
  while true; do
    state=$(session_state)
    pane=$(pane_tail)
    if shows_permission_prompt "$pane"; then
      report_stop "permission-prompt" "$pane"
    fi
    if [ "$state" != "working" ]; then
      report_stop "$state" "$pane"
    fi
    sleep "$POLL_SECONDS"
  done
}

session_state() {
  local failures=0 sessions
  until sessions=$("$RINGLEADER" list --json 2>/dev/null); do
    failures=$((failures + 1))
    [ "$failures" -lt "$LIST_FAILURE_LIMIT" ] || fail_listing
    sleep "$POLL_SECONDS"
  done
  jq -r --arg name "$session_name" \
    'first(.[] | select(.name == $name) | .state) // "gone"' <<<"$sessions"
}

fail_listing() {
  echo "$session_name: watch-failed, \`$RINGLEADER list --json\` failed $LIST_FAILURE_LIMIT times" >&2
  exit 1
}

pane_tail() {
  tmux capture-pane -p -t "$TMUX_PREFIX$session_name" 2>/dev/null | tail -n "$PANE_TAIL_LINES" || true
}

shows_permission_prompt() {
  grep -Eq "$PERMISSION_PROMPT_PATTERN" <<<"$1"
}

report_stop() {
  local reason=$1 pane=$2
  echo "$session_name: $reason"
  printf '%s\n' "$pane"
  exit 0
}

main "$@"
