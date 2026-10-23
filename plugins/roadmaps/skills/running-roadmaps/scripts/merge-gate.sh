#!/usr/bin/env bash
set -euo pipefail

readonly EXIT_READY=0
readonly EXIT_GATE_FAILED=1
readonly EXIT_USAGE=2
readonly EXIT_CONFLICT=3
readonly EXIT_READY_AFTER_REBASE=4
readonly EXIT_GIT_FAILED=5
readonly LOG_TAIL_LINES=20

main() {
  parse_arguments "$@"
  fetch_remote
  prepare_scratch_space
  trap remove_scratch_worktree EXIT
  if branch_is_based_on_base; then
    gate_based_branch
  else
    gate_rebased_branch
  fi
}

parse_arguments() {
  remote=origin
  base=""
  branch=""
  gate_commands=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --remote) remote="${2:-}"; shift 2 ;;
      --base) base="${2:-}"; shift 2 ;;
      --branch) branch="${2:-}"; shift 2 ;;
      --gate) gate_commands+=("${2:-}"); shift 2 ;;
      *) usage ;;
    esac
  done
  [ -n "$base" ] && [ -n "$branch" ] && [ ${#gate_commands[@]} -gt 0 ] || usage
  base_ref="$remote/$base"
  branch_ref="$remote/$branch"
}

usage() {
  echo "usage: merge-gate.sh --base <branch> --branch <branch> --gate '<command>' [--gate '<command>'...] [--remote <name>]" >&2
  exit "$EXIT_USAGE"
}

fetch_remote() {
  git fetch --quiet "$remote" || stop "$EXIT_GIT_FAILED" "git-failed: \`git fetch $remote\` failed"
  git rev-parse --verify --quiet "$base_ref" >/dev/null || stop "$EXIT_GIT_FAILED" "git-failed: $base_ref does not exist"
  git rev-parse --verify --quiet "$branch_ref" >/dev/null || stop "$EXIT_GIT_FAILED" "git-failed: $branch_ref does not exist"
}

prepare_scratch_space() {
  local slug=${branch//\//-}
  scratch_root="$(git rev-parse --path-format=absolute --git-common-dir)/merge-gate"
  scratch_worktree="$scratch_root/$slug"
  gate_log="$scratch_root/$slug.log"
  mkdir -p "$scratch_root"
  remove_scratch_worktree
  git worktree add --quiet --detach "$scratch_worktree" "$branch_ref" ||
    stop "$EXIT_GIT_FAILED" "git-failed: cannot create the scratch worktree $scratch_worktree"
}

remove_scratch_worktree() {
  git worktree remove --force "$scratch_worktree" >/dev/null 2>&1 || true
  rm -rf "$scratch_worktree"
  git worktree prune
}

branch_is_based_on_base() {
  git merge-base --is-ancestor "$base_ref" "$branch_ref"
}

gate_based_branch() {
  run_gate
  stop "$EXIT_READY" "ready: $branch_ref is based on $base_ref, and the gate passed on tree $(gated_tree)"
}

gate_rebased_branch() {
  rebase_onto_base
  run_gate
  echo "push the rebased commits first:"
  echo "  git push --force-with-lease=$branch:$(git rev-parse "$branch_ref") $remote $(git -C "$scratch_worktree" rev-parse HEAD):refs/heads/$branch"
  stop "$EXIT_READY_AFTER_REBASE" "ready-after-rebase: the gate passed on $branch rebased onto $base_ref, tree $(gated_tree)"
}

rebase_onto_base() {
  git -C "$scratch_worktree" rebase --quiet "$base_ref" >"$gate_log" 2>&1 || stop_failed_rebase
}

stop_failed_rebase() {
  local conflicting_paths
  conflicting_paths=$(git -C "$scratch_worktree" diff --name-only --diff-filter=U | tr '\n' ' ')
  git -C "$scratch_worktree" rebase --abort >/dev/null 2>&1 || true
  [ -n "$conflicting_paths" ] ||
    stop "$EXIT_GIT_FAILED" "git-failed: \`git rebase $base_ref\` failed without a conflict, full log: $gate_log"
  stop "$EXIT_CONFLICT" "conflict: $branch does not rebase cleanly onto $base_ref, conflicting paths: $conflicting_paths"
}

run_gate() {
  local command
  : >"$gate_log"
  for command in "${gate_commands[@]}"; do
    if ! (cd "$scratch_worktree" && bash -c "$command") >>"$gate_log" 2>&1; then
      tail -n "$LOG_TAIL_LINES" "$gate_log"
      stop "$EXIT_GATE_FAILED" "gate-failed: \`$command\` failed on $(gate_subject), full log: $gate_log"
    fi
  done
}

gate_subject() {
  if branch_is_based_on_base; then
    echo "$branch_ref"
  else
    echo "$branch rebased onto $base_ref"
  fi
}

gated_tree() {
  git -C "$scratch_worktree" rev-parse 'HEAD^{tree}'
}

stop() {
  local exit_code=$1 verdict=$2
  echo "$verdict"
  exit "$exit_code"
}

main "$@"
