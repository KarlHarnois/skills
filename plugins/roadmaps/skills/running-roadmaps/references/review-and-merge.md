# Review and merge

**A pull request merges only after a fresh reviewer, the manager's rulings, and the gate on the tree that lands.** The worker's report is a claim, so none of these steps trusts it.

## Review a pull request

1. Run `git fetch <remote>`. Check that every commit hash of the report is on `<remote>/<branch>`. If a hash is missing, send the worker a fix list that asks for the push.
2. Write the reviewer handoff, per `handoff-review.md`. If a fix list came from an earlier review, include that review. Dispatch the reviewer, per `SKILL.md` Transport.
3. While the reviewer runs, run the Checklist below.
4. When the reviewer report arrives, run Rule on the review.

## Checklist

**Run these checks yourself on `git diff <remote>/<base branch>...<remote>/<branch>`.** Each hit is a finding for Rule on the review.

| Check | Command |
| --- | --- |
| Every changed path is within the paths of the build handoff. | `git diff --name-only <range>` |
| No protected entry changed. | `git diff <range>`, searched for each entry of the Protected list |
| Each review grep finds nothing. | `git diff <range>`, searched for each pattern of the Review greps list |
| The report lists every changed snapshot or output. | `git diff --name-only <range>`, compared with the report |
| The pull request targets the base branch and is assigned. | `gh pr view <number> --json baseRefName,assignees,body` |
| The description follows the format of the build handoff. | the `body` field of the same command |

## Rule on the review

1. Save the review to `<state directory>/reports/<reviewer session name>-1.md`. Copy its file, or write its message text.
2. Rule on each finding of the review and of the Checklist:

   | Ruling | Action |
   | --- | --- |
   | Blocking | Put it in the fix list. |
   | Minor | Record it under Follow-ups, and add it to the roadmap. If a fix list goes out anyway and the fix is one step, put it in the fix list instead. |
   | Rejected | Record a ruling with the reason. |

3. Rule on each departure of the worker's report. Record each accepted departure as a ruling. Put each rejected departure in the fix list.
4. Delete the reviewer, per `SKILL.md` Transport.
5. If the fix list holds a step, send it, per `handoff-fix-list.md`. Otherwise, run Merge.

**NEVER downgrade a blocking finding to keep the roadmap moving:** every later build inherits the defect.

## Merge

**If the Authority of the profile covers merging, merge without asking.** Otherwise, give the user the pull request link and ask.

1. Run the merge gate from the main checkout, with one `--gate` per gate command:

   ```sh
   <this skill's base directory>/scripts/merge-gate.sh --remote <remote> --base <base branch> --branch <branch> --gate '<gate command>'
   ```

   If the gate takes more than four minutes, run the merge gate with Bash `run_in_background`.

2. Act on the exit code of the merge gate:

   | Exit code | Verdict | Action |
   | --- | --- | --- |
   | 0 | `ready` | Go to step 3. |
   | 4 | `ready-after-rebase` | Run the push command that the merge gate printed. Then run step 1 again. |
   | 1 | `gate-failed` | Find the cause, and send a fix list with the failing command, the log tail, and the cause. If the branch was not based on the base branch, its first step rebases. |
   | 3 | `conflict` | Send a fix list that rebases onto `<remote>/<base branch>`. Read both sides of each conflicting path, and name the side to keep. |
   | 5 | `git-failed` | If the branch is missing from the remote, send a fix list that pushes it. Otherwise, fix the cause and run step 1 again, at most twice. If it still fails, tell the user. |
   | 2 | usage | Fix the command and run step 1 again, once. |

3. If the profile requires CI, run `gh pr checks <number>`. If a check fails, send a fix list that names the check. If a check is still running, wait for it, and run this step again. Run this step after the merge gate: a push of rebased commits starts a new CI run.
4. Run `gh pr merge <number> --<merge method>` as its own command, after you read exit code 0 and step 3 passes. NEVER run the merge gate and the merge in one command line: the merge could run after a failed check.
5. If `gh pr merge` fails because the base branch moved, run step 1 again. If it fails for another reason, tell the user its output.
6. If the main checkout is on the base branch and `git status --porcelain` prints nothing there, run `git pull --ff-only` in it. Otherwise, leave the main checkout as it is. If the pull fails, tell the user. NEVER switch the branch of the main checkout: it is the user's directory.
7. Run `git fetch <remote>`. Compare `git rev-parse '<remote>/<base branch>^{tree}'` with the tree that the merge gate printed. If the trees differ, run Gate the base branch.
8. Record the merge and the tree that passed the gate in the Log section of the state file.
9. Run Close an item, per `SKILL.md`.

## Gate the base branch

**NEVER run a gate command in the working tree of the main checkout.** The main checkout is the user's directory, and its uncommitted and ignored files change the result.

The base-branch gate is this command. Run it from the main checkout, with one `--gate` per gate command:

```sh
<this skill's base directory>/scripts/merge-gate.sh --remote <remote> --base <base branch> --branch <base branch> --gate '<gate command>'
```

1. Run the base-branch gate.
2. Act on its exit code:

   | Exit code | Action |
   | --- | --- |
   | 0 | Record the tree that it printed in the Log section of the state file. |
   | 1 | Run Repair the base branch. |
   | Any other code | Fix the cause and run step 1 again, at most twice. If it still fails, tell the user. |

## Repair the base branch

**If the gate fails on the base branch, NEVER merge or dispatch anything else until it passes again.**

If a gate command fails because of the machine and not the code, tell the user and stop. A build cannot repair the machine. Otherwise, follow these steps:

1. Find the commits since the last tree that passed the gate, per the Log section of the state file. If the Log records no such tree, tell the user and stop.
2. Dispatch a build that fixes the failure, with the prefix `fix-`. Name the failing command, its output tail, and those commits in the handoff.
3. Review and merge that build, per this file.
4. Record a lesson, per `state-file.md`.
