# Fix list <fix list number> for pull request <number>: <title>

**The manager session `<manager session>` reviewed pull request <number>.** <What is accepted.> Every rule of your build task still binds you.

## Defects

1. <file>: <defect>, because <reason or rule>.

## Steps

1. <exact step>
2. Run the commit commands of your build task. All of them MUST pass.
3. <amend the commit, or add a commit with the title `<title>`>
4. Run the gate: <gate commands>. Every command MUST pass.
5. Run `git push --force-with-lease`.
6. Send the report, per the Done section.

## MUST lines

- <artifact> MUST <exact value>.

## Failure branches

- If a rebase conflict cannot keep both changes, run `git rebase --abort`, stop, and put the conflicting hunks in the report.
- If a snapshot or output changes that a step does not allow, stop. Put its diff in the report.
- If a command fails, fix the cause and rerun it at most twice. If it still fails, stop and put its output in the report.

## Done

Send the report with this command, with a timeout of at least 90 seconds:

```sh
<ringleader> send <manager session> "$(cat <<'REPORT'
<report>
REPORT
)"
```

If the command fails, write the report to `<scratch directory>/report.md`, wait two minutes, and run the command once more. If it fails again, stop.

The report MUST contain each of these, and nothing else:

- the status word on the first line: `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, or `NEEDS_CONTEXT`
- each commit hash with its title
- each defect, with the commit that fixes it
- the result of each gate command, as pass or fail
- each place where you departed from this fix list, and why
