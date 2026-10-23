---
name: refining-prs
description: Review a PR in a subagent, implement the findings worth keeping as small commits, and keep repeating so the PR gets better without getting bigger, until a round turns up nothing left in scope. Use this skill whenever the user wants a PR reviewed *and* fixed rather than just reported on, with phrasings like "review this PR and fix what it finds", "clean up PR 123", "keep reviewing and fixing until it's ready", "address the review feedback", "get this branch merge-ready", "loop the review until it's clean", or "iterate on this PR until it's good". Also use it for any request for repeated or iterative review passes on a branch, even when they never say "loop". For a single read-only review that changes no code and makes no commits, use `reviewing-prs` instead.
---

# Refine PR

Refine a PR as far as it will go without letting it grow: review in a subagent, decide what to keep, implement the keepers as small commits, review again, and keep going.

`reviewing-prs` ends at printing findings, and this skill is what happens next. The repetition is the point. Fixing the first round's findings changes the diff, and the changed diff has problems of its own that nobody ever sees, because in practice the second review never gets requested. Reviewing again after each pass is the only way those second-order findings surface.

You are not a rubber stamp for the reviewer. A good fraction of any review is worth pushing back on: misread code, concerns already handled elsewhere, refactors that belong in a different PR. Implementing everything a reviewer says produces a worse PR than implementing most of it and saying why for the rest. The report at the end exists so those pushbacks are visible and auditable rather than silent.

Invocation arguments, if any (a PR number, a review focus, a round budget): $ARGUMENTS

## Phase 1: Setup

### 1. Resolve the target

Detect it the way `reviewing-prs` does, so both skills agree on what "this PR" means:

- A PR number in the prompt wins. Read its branches with `gh pr view <number> --json number,title,headRefName,baseRefName`.
- Otherwise find the PR for the current branch: `gh pr list --head "$(git branch --show-current)" --json number,title,headRefName,baseRefName`.
- Otherwise run in branch mode, current branch against `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`.

Record the base branch: the PR's `baseRefName`, or the default branch in branch mode. Every round's reviewer brief passes it as `BASE`, so a stacked PR is reviewed against its parent branch and not against the default branch.

If the PR's head branch is not the current branch, check it out here, once, and say so. Doing it up front is what lets the reviewer subagent be forbidden from moving HEAD later. A checkout in the middle of a round would strand that round's commits on the wrong branch.

### 2. Detect how this project verifies itself

Look for the verification commands in `CLAUDE.md`, `Makefile` targets, `package.json` scripts, `pyproject.toml`, `Cargo.toml`, or a CI workflow, in whatever order fits the repo. Expect a set rather than a pair: a linter, often a cheap parse or typecheck step worth running first because it fails in seconds, and a test suite. Record the exact invocation of each, including any container or credential wrapper, since you will run them dozens of times.

When the suite is expensive or needs live infrastructure, scope it to what the change can affect rather than skipping it. A selector naming the changed modules and their tests is a real gate; running nothing is not. Record the selector you chose so every round runs the same one.

Then run them once and record the result.

That baseline run is the part that matters. Suites are often already red for reasons that have nothing to do with this PR, and without a baseline every fix looks like it broke something and the loop reverts work it should have kept. Only failures that are new relative to the baseline block a commit.

If no command turns up, record "none detected" and carry it into the report. Say that plainly rather than inventing a plausible-looking command, because a test step that silently did nothing is worse than one the user knows was missing.

### 3. Guards

`reviewing-prs` needs none of these because it never writes. This skill commits, so it does.

**Refuse to run on the default branch.** `reviewing-prs` falls back to reviewing the working tree there; this loop has nowhere to commit. Say so and offer to branch first.

**A dirty tree stops the loop before it starts.** Check `git status --porcelain`, and do it *after* the baseline run in step 2, not before. Test and lint commands routinely write things back into the tree (caches, coverage files, snapshots, generated fixtures), so a check taken beforehand passes and then the same tree fails the identical check inside round 1, on artifacts the loop itself produced. Running first means whatever the tooling touches is visible at the one moment the user is being asked about it.

If anything is uncommitted, ask whether to commit it, stash it, or abort. Do not just proceed: uncommitted work swept into a review-fix commit breaks both the one-commit-per-finding story and every number in the final report.

Record the paths the verification commands touch. Those are expected to reappear every round, and the per-round guard ignores them rather than halting the loop each time the tests run.

**No PR and no remote branch means no push.** Note it now and skip the push step later rather than failing on it every round.

### 4. Open the workspace

```bash
mkdir -p .git/refining-prs/<branch-slug>
```

It lives inside `.git` because git never tracks that directory, so the loop's own log cannot end up in one of the loop's own commits. It is per-repo and per-branch, and it outlives the session, so an interrupted run can be resumed by reading `state.json` and continuing from the next round.

```
.git/refining-prs/<branch-slug>/
├── state.json          # round counter, per-round tallies, exit reason
├── round-1-review.md   # the reviewer's output, verbatim
├── round-1-triage.md   # every finding, the decision, the reason, the commit sha
└── report.md           # the final report, same text that gets printed
```

Write the triage file as you go rather than reconstructing it at the end. The final report is assembled from these files, not from memory, and a tally recalled across several rounds of context is a tally that will be wrong.

## Phase 2: The round loop

### 1. Check the ground is still solid

HEAD is still the branch under review, and `git status --porcelain` shows nothing beyond the verification artifacts recorded at setup. If either has drifted, stop and explain; do not review a tree that does not match what you are about to commit onto.

### 2. Spawn one reviewer

**If the agent list includes `reviewing-prs:reviewer`**, spawn one `reviewing-prs:reviewer` with the filled-in brief below as its task prompt. The `reviewing-prs` plugin ships this agent. The agent carries the read-only tool set and sets the reviewer model in one place. It inherits the session model by default. Review quality decides what gets committed and when the loop declares the PR done.

**If subagents are available but the agent is not**: spawn one generic subagent with the same brief, and add to it the read-only constraints the agent file would have carried, namely that it must not edit files, move HEAD, or post to GitHub.

**If subagents are not available**, invoke `reviewing-prs:reviewing-prs` inline. Note in the report that the reviews were not independent: a reviewer that already knows which findings you rejected is a softer reviewer.

Spawn a fresh reviewer every round. Never continue the previous one. A reviewer that remembers being overruled last round argues less this round, and a loop that ends because the reviewer got tired has converged for the wrong reason.

```
REPO: <output of `git rev-parse --show-toplevel`>
BRANCH: <branch>, already checked out. Do not switch branches or move HEAD.
BASE: <the PR's base branch, or the default branch in branch mode>
FOCUS: <the user's focus, verbatim, or "none">
ROUND: <N>

PREVIOUSLY DECLINED (considered in an earlier round and not implemented;
on round 1 write "none, this is the first round"):
- <SEVERITY> <file>:<line> <one-line summary>
  Reason: <why it was declined>
- ...
Do not simply restate a point already answered here. If you think a reason is
wrong, raise it again and say which part you disagree with.

Invoke the `reviewing-prs:reviewing-prs` skill and review BRANCH against BASE. Return its complete output
verbatim: the summary table, every detail block with its failure scenario, and
the closing summary block with the counts. That text is your whole return
value. Do not summarize it and do not add recommendations of your own.
```

Save what comes back to `round-N-review.md` unedited.

### 3. Triage every finding

For each finding, decide keep or push back, and write one line of reasoning either way. Reasons that hold up:

- The reviewer misread the code, and the failure scenario it describes cannot actually happen.
- The concern is real but already handled somewhere the reviewer did not look.
- It belongs in a different PR: it would grow the diff rather than improve it. This is the most consequential call in the loop; more below.
- It contradicts a convention stated in `CLAUDE.md` or `~/.config/reviewing-prs/review_guide.md`.
- It is a preference this codebase has visibly and deliberately decided against.

"It is only a nitpick" is not one of them. A correct nitpick that costs one line is worth taking, and the report counts nitpicks separately so cheap wins stay visible instead of being quietly dropped.

**Stay in scope.** This is the judgment that keeps the loop healthy, so make it deliberately on every finding. You can tell whether a change belongs in this PR. A fix that makes the diff better stays, however small. A good idea that would make the diff bigger, new capability, a second input format, a policy the PR never set, goes to Deferred with a sentence on why. No formula improves on being honest about which of the two you are looking at.

Two things make deferring the right call whenever it is close. An out-of-scope change implemented here is reviewed by nobody: it lands inside a PR opened for something else, under a description written for something else, in front of an approver who thinks they already understand the diff. And it compounds, because the next round reviews the code it added, and its bugs are then real defects you own. A deferred finding costs nothing and stays visible in the report, where the user can turn it into a ticket or tell you to do it now.

Push back on a critical finding only when you can say concretely why the failure scenario is wrong. Severity is the reviewer's claim about consequences, so dismissing one on taste is the single most expensive mistake available in this loop.

Findings that repeat something already declined are marked as repeats. They are counted once, in the round they first appeared, and re-declining one is not a new decision.

Record all of it in `round-N-triage.md`: severity, location, summary, decision, reason, and later the commit sha.

### 4. Implement the keepers

Work one coherent change at a time and keep each one small enough to describe in a single commit subject. Before committing each, run the detected lint and test commands.

Order the accepted findings before you start rather than working down the reviewer's numbering. Structural findings come first: an extraction that collapses duplicated code, or a change to a function's return contract. Point fixes that land inside that structure come after. A review of duplicated code reports the same defect once per copy, so fixing the duplication first turns each of those into a single edit, while the other order means writing the same fix twice and then deleting one of them. Commit granularity is unaffected, since each finding still gets its own commit; only the sequence changes.

When the change *is* a check, an assertion, or a test, a green run proves nothing on its own, because it passes when nothing is wrong and it would also pass if it were broken. Force it to produce rows or to fail: relax its condition, feed it the input it is meant to catch, and read the output it would emit. Then put it back. A check nobody has ever seen fire is a check nobody knows the shape of.

If a fix introduces a failure the baseline did not have, try to repair it in place. If it will not come right within this round, revert that one change (`git checkout -- <paths>` on the unstaged fix, or `git reset` the staged unit first) and record it as reverted along with the failing output. The rest of the round's commits stand. The finding stays outstanding and shows up in the report under `Reverted`, so it reads as unfinished work rather than as a finding that was addressed.

The point of reverting rather than committing red is that the next round's reviewer will otherwise spend itself reporting the broken test back to you as a critical finding, and the loop starts chasing its own tail.

### 5. Commit each finding separately

One commit per finding. One fix applied in three places is still one commit; two unrelated fixes in one file are two.

Follow the repo's commit conventions: capital first letter, subject at 72 characters or under, imperative mood, and a body that says what changed and why. Write a normal commit message: no review metadata, no mention of the round or the finding, no `Co-Authored-By` line, no `Claude-Session` line. These commits should read like any other commit on the branch; the triage file already maps each sha back to its finding and round, so the message does not need to.

```
Check token expiry before authorizing the request

`claims.exp` was never compared against the current time, so a token
issued yesterday with a one-hour expiry still authorized the request.
```

### 6. Push

`git push`, or `git push -u origin HEAD` when the branch has no upstream. Never force-push: this loop only ever adds commits, so a push that needs `--force` means something else moved and you should stop and say so.

### 7. Continue or stop

**Keep going.** Refinement is what this skill is for, and it is cumulative: the tenth nitpick fixed is not worth less than the first critical, it is just cheaper. A round returning four suggestions and two nitpicks about the diff is a productive round. A run that spends five rounds turning a good PR into a very good one has done exactly its job. A non-empty review is not a signal to wind down.

**What has to stay bounded is scope, not rounds.** Hold the triage line and the loop can run as long as the user wants: the diff stays the size the author intended while the quality inside it climbs.

**Stop when a round produces nothing in scope.** Everything it raised was out of scope, already declined, or simply wrong. That is the real terminal state, and it is reachable: the in-scope surface of a fixed diff is finite even though a reviewer's supply of observations is not. So do not wait for an empty review, which will never come. Wait for an empty *in-scope* review.

**Watch for the one failure mode, which is scope leak.** If a round is mostly about code this loop wrote, work out why. Honest consequences of your own repairs are in scope and worth fixing; catching them is the loop earning its keep. But if you are debugging a feature that slipped the gate several rounds ago, say so and revisit that acceptance. That is the one way this loop makes a PR worse instead of better, and it is invisible unless you look for it.

**The round budget is the user's call, not yours.** Rounds 1 through 3 run unattended. Before round 4, and before every round after it, stop and use `AskUserQuestion` to ask whether to keep refining, showing what the last round actually landed and what is still outstanding. Give them the numbers rather than an opinion about diminishing returns: in testing, a fourth round still implemented three of its four findings, and two of those were real defects opened by round 3's own commits. How much refinement to buy is theirs to decide. If they named a round budget in the invocation, honor it and stop there.

Stop early and explain if the reviewer fails twice in a row, or the tree cannot be brought back to clean. A loop that cannot verify its own state should not keep committing.

## Phase 3: Wrap up

In branch mode with no PR, skip this step. Otherwise, refresh the PR body by invoking the `describing-prs:describing-prs` skill via the Skill tool. The diff has moved since the description was written, and a stale description describes a PR that no longer exists. Never draft the description inline: the drafting rules live in that skill.

Then write `report.md` and print the same text.

### Counting rules

Get these right; the tally is what the user asked this skill for.

- **Raised** counts a finding once, in the round it first appeared. A repeat adds nothing.
- **Implemented** means it produced a commit that is still on the branch at the end.
- **Reverted** means accepted, attempted, then backed out. It is not implemented.
- **Pushed back** means declined on the merits.
- **Deferred** means correct but outside this PR.
- **Applied to the description** means the fix was to the PR body rather than the code. Reviewing a diff regularly catches the description claiming more than the diff delivers, and that correction is a real outcome with no commit behind it.
- Every severity row must satisfy `Raised = Implemented + Reverted + Pushed back + Deferred + Applied to the description`. If a row does not reconcile, recount from the triage files rather than printing numbers that do not add up. If a disposition is rare enough that a column would be mostly zeros, leave it out of the table and say in a line underneath how that row reconciles.

### Report format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Refine Complete

PR: #2129 Add retry backoff to the shipment client
Rounds: 3   Exit: round 3 raised nothing in scope
Commits: 9 (pushed)   Tests: pytest -q, green

              │ Raised │ Implemented │ Deferred │ Pushed back │ Reverted
──────────────┼────────┼─────────────┼──────────┼─────────────┼──────────
 Critical     │   3    │      3      │    0     │      0      │    0
 Suggestion   │   8    │      5      │    2     │      0      │    1
 Nitpick      │   6    │      1      │    0     │      5      │    0
──────────────┼────────┼─────────────┼──────────┼─────────────┼──────────
 Total        │  17    │      9      │    2     │      5      │    1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Per round
  Round 1  raised 11 (2 CRIT, 5 SUGGEST, 4 NIT)  implemented 7  commits 7
  Round 2  raised  4 (1 CRIT, 2 SUGGEST, 1 NIT)  implemented 2  commits 2
  Round 3  raised  2 (0 CRIT, 1 SUGGEST, 1 NIT)  implemented 0  → exit

Pushed back (5)
  SUGGEST  client.py:88   Extract the retry policy into a class
                          The policy is four lines with one caller. A class
                          adds indirection without a second use.
  NITPICK  client.py:12   Sort the imports
                          isort runs in CI and already orders them.

Deferred to a follow-up (2)
  SUGGEST  client.py:35   No timeout on the outbound request
                          Correct, and the session is injected, so it needs
                          the transport contract settled first.

Reverted (1)
  SUGGEST  client.py:140  Share one session across requests
                          Broke test_client_timeout: the shared session holds
                          the socket past the timeout assert. Reverted, and
                          the finding still stands.

Outstanding: 8 findings not implemented, none critical.
PR description refreshed via describing-prs.
```

Keep the two kinds of pushback apart. `Pushed back` is for findings judged wrong or already handled: they are closed. `Deferred` is for findings that are correct but outside this PR, and that section is a to-do list the user may want to open tickets from, so it is worth stating what each one would take. Both sections list the reason. Together they are the whole audit trail for the decisions made without asking, and a report showing only what was implemented hides exactly the part worth checking.

Adjust the closing line to what actually happened: if critical findings were pushed back or reverted, say that instead, since a PR with an outstanding critical finding should not read as finished.

## Troubleshooting

If `gh` lookups fail, run `gh auth status`.

If the reviewer returns a summary instead of the verbatim review, the tally cannot be built from it. Re-spawn once with the return contract restated. If it happens again, fall back to inline `reviewing-prs` for that round and note it in the report.
