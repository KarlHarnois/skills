#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/../sandbox.sh"

create_remote_and_checkout
commit_file parser.py 'def parse(text):
    return text.split(",")' "Parse comma separated values"
git -C "$SANDBOX/app" push -q origin main
commit_file check.sh 'python3 -c "import parser"' "Check that the parser imports"
git -C "$SANDBOX/app" push -q origin main

git -C "$SANDBOX/app" switch -q -c fix-parser
commit_file parser.py 'def parse(text):
    return [value.strip() for value in text.split(",")]' "Trim spaces around parsed values"
git -C "$SANDBOX/app" push -q origin fix-parser
fix_commit=$(git -C "$SANDBOX/app" rev-parse --short fix-parser)
git -C "$SANDBOX/app" switch -q main

mkdir -p "$SANDBOX/fix-parser/.scratch" "$SANDBOX/design-cache"
sed -e "s|@COMMIT@|$fix_commit|" >"$SANDBOX/fix-parser/.scratch/report.md" <<'REPORT'
Status: DONE

- Branch `fix-parser`, commit `@COMMIT@` "Trim spaces around parsed values", amended per fix list 1.
- Pull request: https://github.com/example/app/pull/12
- `sh check.sh`: pass.
- Departures: none.
- Sending this report failed twice: the source session was away from its prompt.
REPORT

state_dir=$(install_state_file "$EVAL_FILES/resume/state.md" parsing)
cp "$EVAL_FILES/resume/roadmap.md" "$state_dir/roadmap.md"
cp -R "$EVAL_FILES/resume/handoffs" "$EVAL_FILES/resume/reports" "$state_dir/"
echo '[{"name":"manager","state":"working","worktree":"'"$SANDBOX/app"'","branch":"main","agent":"claude","repo":"app","diff":""},{"name":"fix-parser","state":"waiting","worktree":"'"$SANDBOX/fix-parser"'","branch":"fix-parser","agent":"opencode","repo":"app","diff":""},{"name":"design-cache","state":"working","worktree":"'"$SANDBOX/design-cache"'","branch":"design-cache","agent":"opencode","repo":"app","diff":""}]' >"$SANDBOX/sessions.json"
print_environment
