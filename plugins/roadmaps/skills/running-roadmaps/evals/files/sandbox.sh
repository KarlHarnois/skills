#!/usr/bin/env bash
set -euo pipefail

EVAL_FILES="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX="${SANDBOX:-$PWD/sandbox}"

export GIT_AUTHOR_NAME="Eval Author" GIT_AUTHOR_EMAIL="author@example.com"
export GIT_COMMITTER_NAME="Eval Author" GIT_COMMITTER_EMAIL="author@example.com"

create_remote_and_checkout() {
  mkdir -p "$SANDBOX"
  git init -q --bare -b main "$SANDBOX/remote.git"
  git clone -q "$SANDBOX/remote.git" "$SANDBOX/app" 2>/dev/null
  git -C "$SANDBOX/app" switch -q -c main
}

commit_file() {
  local path=$1 contents=$2 message=$3
  mkdir -p "$(dirname "$SANDBOX/app/$path")"
  printf '%s\n' "$contents" >"$SANDBOX/app/$path"
  git -C "$SANDBOX/app" add "$path"
  git -C "$SANDBOX/app" commit -q -m "$message"
}

install_state_file() {
  local template=$1
  local state_dir
  state_dir="$(git -C "$SANDBOX/app" rev-parse --path-format=absolute --git-common-dir)/roadmaps/$2"
  mkdir -p "$state_dir"
  sed -e "s|@SANDBOX@|$SANDBOX|g" "$template" >"$state_dir/state.md"
  echo "$state_dir"
}

print_environment() {
  echo "export PATH=\"$EVAL_FILES/bin:\$PATH\""
  echo "export RINGLEADER_CALLS=\"$SANDBOX/ringleader-calls.log\""
  echo "export GH_CALLS=\"$SANDBOX/gh-calls.log\""
  echo "export RINGLEADER_SESSIONS=\"$SANDBOX/sessions.json\""
}
