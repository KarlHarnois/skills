# Build: trim spaces around parsed values

**The manager session `manager` sent this build.** You change `parse` in `parser.py`, commit, and open one pull request. You change no other file.

**Goal: `parse` returns each comma separated value without the whitespace around it.**

## Commits

1. In `parser.py`, make `parse` strip each value of `text.split(",")`. Commit with the title `Trim spaces around parsed values`.
2. Run `sh check.sh`. It MUST pass.
3. Run `git push -u origin HEAD`, then open a pull request against `main`.

## Done

Send the report with `ringleader send manager "<report>"`. If the command fails, write the report to `.scratch/report.md`.
