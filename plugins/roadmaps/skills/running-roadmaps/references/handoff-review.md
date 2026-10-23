# Reviewer handoff

**A reviewer judges one pull request in a fresh context and changes nothing.** The manager wrote the build handoff, so the manager shares the worker's assumptions. The reviewer does not. Use this template for the Review kind of `SKILL.md`.

## Fill

1. Paste the whole build handoff and every fix list sent for the pull request, verbatim, into the Build task section.
2. Paste the worker's last report verbatim into the Report section.
3. Copy the Review greps and the Protected list of the profile into the Checklist.
4. NEVER add your own opinion of the pull request: an opinion anchors the reviewer.
5. If a fix list came from an earlier review, paste that review verbatim into the Earlier findings section. Otherwise, delete that section.
6. Replace every `<placeholder>`. Delete each template line that does not apply.

## Template

````markdown
# Review: pull request <number>, <title>

**The manager session `<manager session>` sent this review.** You review pull request <number> and report findings. You change nothing: no edit, no commit, no push, and no comment, approval, or review on GitHub.

**Goal: find every defect that blocks the merge of pull request <number>, and send the findings to the manager.**

Your worktree is on a branch of its own, which starts at the head of the pull request's branch `<branch>`. The base branch is `<remote>/<base branch>`.

## Rules

- Keep every scratch file under `<scratch directory>` in your worktree. NEVER read or write a path outside your worktree.
- NEVER switch branches or run `gh pr checkout`: the worker holds `<branch>` in its own worktree.
- NEVER trust the report below. It is the worker's claim about its work. Check each claim against the diff.
- NEVER run the gate. The manager runs the gate before the merge.
- Grade each finding as blocking or minor, per the Severity section.

## Steps

1. Run `git fetch <remote>`, then `git diff <remote>/<base branch>...HEAD`. Read every changed line.
2. If you can invoke the `prs:reviewing-prs` skill, invoke it with no pull request number, so that it reviews your current branch. Add its findings to yours.
3. Check the diff against the build task, the fix lists, and the Checklist.
4. Check each claim of the report against the diff.
5. Write the findings, per the Findings section, and send them, per the Done section.

## Severity

| Severity | A finding is this severity when it shows any of these |
| --- | --- |
| Blocking | a correctness bug, a requirement of the build task that the diff misses, a broken settled rule, a broken MUST line, a change outside the allowed paths, or a claim of the report that the diff contradicts |
| Minor | every other finding |

## Checklist

- Every changed path is within the paths the build task allows.
- No entry of this list changed: <protected entries>.
- Every changed snapshot or output follows from the change, and the build task allows it.
- Each commit holds one logical change, and its message matches its content.
- The pull request description matches the diff.
- <review grep>: <the defect it catches>

## Build task

<the build handoff and every fix list, verbatim>

## Report

<the worker's last report, verbatim>

## Earlier findings

<the earlier review, verbatim>

For each blocking finding of the earlier review, write one line in the findings file: `ADDRESSED` or `NOT ADDRESSED`, with the evidence.

## Findings

Write `<scratch directory>/review.md`. Keep it under 10 KB. Put the status word on the first line: `DONE` or `BLOCKED`. Then write one row per finding, blocking findings first:

| Severity | File and line | Defect | Evidence | Fix |
| --- | --- | --- | --- | --- |

Each Evidence cell holds the quoted code or a command and its output, at most 15 lines. Each Fix cell holds the exact change that fixes the defect.

## Done

1. Run this command, with a timeout of at least 90 seconds:

   ```sh
   <ringleader> send <manager session> "Review of pull request <number> is ready: $(git rev-parse --show-toplevel)/<scratch directory>/review.md"
   ```

2. If the command fails, wait two minutes, and run it once more. If it fails again, stop. The manager reads the review file.
````
