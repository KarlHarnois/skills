#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/../sandbox.sh"

create_remote_and_checkout
commit_file AGENTS.md "$(cat "$EVAL_FILES/design-pilot/AGENTS.md")" "Add the project rules"
commit_file .gitignore '.scratch/
__pycache__/' "Ignore scratch files"
commit_file src/report.py 'def report(entries):
    return "\n".join(f"{name}: {total}" for name, total in entries)' "Print the report as text"
commit_file check.sh 'python3 -c "import sys; sys.path.insert(0, \"src\"); import report"' "Check that the report module imports"
git -C "$SANDBOX/app" push -q origin main
state_dir=$(install_state_file "$EVAL_FILES/design-pilot/state.md" reporting)
cp "$EVAL_FILES/design-pilot/roadmap.md" "$state_dir/roadmap.md"
echo '[{"name":"manager","state":"working","worktree":"'"$SANDBOX/app"'","branch":"main","agent":"claude","repo":"app","diff":""}]' >"$SANDBOX/sessions.json"
print_environment
