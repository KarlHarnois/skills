# Fix list

**A fix list gives a build worker exact steps after a review or a failed gate.** Send it to the same session, per `SKILL.md` Transport.

## Fill

1. Name what you accept, including each departure of the report that you accept.
2. Write each defect with its file, its reason, and the settled rule or ruling it breaks.
3. Write the steps as exact edits: the file, the function, and the change. If a step rebases, name each conflicting file and which side to keep.
4. Repeat the MUST lines that the fixes touch. Run each one against your own check of the branch first.
5. If the pull request description needs changes, write the new description inline.
6. Number the fix list: the first fix list for a pull request is 1. If this fix list is the third, start a fresh session instead, per `SKILL.md` Session hygiene.

## Template

````markdown
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
````
