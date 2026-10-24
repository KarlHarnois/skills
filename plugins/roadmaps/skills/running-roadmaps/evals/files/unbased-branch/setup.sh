#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/../sandbox.sh"

create_remote_and_checkout
commit_file names.txt 'Ana
Bo' "Add the names"
commit_file check.sh '[ -s names.txt ]' "Check that names exist"
git -C "$SANDBOX/app" push -q origin main

git -C "$SANDBOX/app" switch -q -c add-greeting
commit_file greeting.sh 'while read -r name; do echo "Hello, $name"; done <names.txt' "Greet every name"
commit_file check.sh '[ -s names.txt ] && [ "$(sh greeting.sh | wc -l | tr -d " ")" = 2 ]' "Check the greeting count"
git -C "$SANDBOX/app" push -q origin add-greeting

git -C "$SANDBOX/app" switch -q main
commit_file names.txt 'Ana
Bo
Cy' "Add a third name"
git -C "$SANDBOX/app" push -q origin main

state_dir=$(install_state_file "$EVAL_FILES/unbased-branch/state.md" greetings)
cp "$EVAL_FILES/unbased-branch/roadmap.md" "$state_dir/roadmap.md"
echo '[{"name":"manager","state":"working","worktree":"'"$SANDBOX/app"'","branch":"main","agent":"claude","repo":"app","diff":""},{"name":"add-greeting","state":"waiting","worktree":"'"$SANDBOX/add-greeting"'","branch":"add-greeting","agent":"opencode","repo":"app","diff":""},{"name":"review-add-greeting","state":"waiting","worktree":"'"$SANDBOX/review-add-greeting"'","branch":"review-add-greeting","agent":"claude","repo":"app","diff":""}]' >"$SANDBOX/sessions.json"
print_environment
