---
name: build-feature
description: Build a feature with a pipeline of agents. Write a spec, get the user's approval, then launch a Workflow that implements the spec, refactors it, fixes its architecture, and loops review and fixes until no finding is left in scope. Use this skill whenever the user wants agents to implement a feature, change, or fix from a description, with phrasings like "build this feature", "implement X with the pipeline", "spec it, build it, review it", "run the implementer and reviewer on this", or "/build-feature <task>". For a branch whose code already exists and needs review and fixes, use `refine-pr` instead.
---

# Build Feature

This session writes the spec and holds the approval gate. The pipeline, a Workflow script, then runs the `implementer`, `refactorer`, `architect`, and `reviewer` subagents in an order fixed in code.

Invocation arguments, if any (the task, a round budget): $ARGUMENTS

## Terms

| Term | Meaning |
| --- | --- |
| task | What the user wants built, in their words. |
| repository root | The output of `git rev-parse --show-toplevel`, run in the directory the task names by path, or in the session's working directory if the task names none. |
| base branch | The branch the work merges into, resolved in Phase 1. |
| workspace | `<git-dir>/build-feature/<branch-slug>/`, where `<git-dir>` is the output of `git rev-parse --absolute-git-dir` and `<branch-slug>` is the branch name with every `/` replaced by `-`. |
| spec | `spec.md` in the workspace. |
| verification commands | The commands that lint, typecheck, and test the project. |
| baseline | The result of the verification commands before any work on the spec. |
| verification artifacts | The paths the verification commands write into the tree. |
| pipeline | `pipeline.js` in this skill's base directory. |
| launch args | The `args` object passed to the pipeline. |
| run result | The object the pipeline returns. |
| round | One review by `reviewer` followed by one pass by `implementer` that triages and applies its findings. |

**The workspace MUST be under `git rev-parse --absolute-git-dir`:** git never tracks that directory, so nothing the skill writes lands in a commit, and a literal `.git/` path breaks in a linked worktree, where `.git` is a file.

**Run every command in this skill from the repository root:** the session's shell can start in a different repository.

## Phase 1: Setup

### 1. Check the agents

If the available agent types do not include all of `implementer`, `refactorer`, `architect`, and `reviewer`, stop and tell the user to run `make install` in the skills repository: the pipeline cannot spawn an agent type that is not installed.

### 2. Check for a run to continue

1. Resolve the repository root.
2. If the workspace for the current branch contains `state.json`, ask the user whether to continue that run or start a new one. Otherwise, go to step 3.
3. If the user chooses to continue and `state.json` holds a run result, go to Phase 3, step 2, with that run result and its launch args.
4. If the user chooses to continue and `state.json` holds no run result, show the user the stored launch args and, after the user confirms, run Phase 2 from step 3 with them: the earlier pipeline never reported back, and the implementer continues from the commits already on the branch.
5. If the user chooses a new run, rename the workspace to `<workspace>.<N>`, with the lowest unused integer `N`, and go to step 3.

This check comes before the task question and the baseline run: a continued run takes both from its stored launch args.

### 3. Resolve the task

If `$ARGUMENTS` or the conversation states the task, use it. Otherwise, ask the user for the task and wait. If the task names a repository path outside the repository root, resolve the repository root again from that path and repeat step 2.

### 4. Resolve the branch

1. Read the base branch with `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`. If `gh` fails, run `git symbolic-ref --short refs/remotes/origin/HEAD` and strip the `origin/` prefix. If both fail, ask the user for the base branch.
2. If the current branch is the base branch, use `AskUserQuestion` to propose a new branch named after the task. If the user accepts, run `git switch -c <name>`. If the switch fails, report the error and stop. If the user declines, stop: the pipeline commits, and nothing is committed to the base branch.
3. Otherwise, use the current branch.

### 5. Record the verification commands and the baseline

1. Find the verification commands in `CLAUDE.md`, `Makefile` targets, `package.json` scripts, `pyproject.toml`, `Cargo.toml`, or the CI workflow. Record each exact invocation, including any container or credential wrapper.
2. If a fast lint or typecheck command exists, list it before the test suite.
3. If the test suite is expensive or needs live infrastructure, scope it with a selector naming the modules the task touches and their tests. Never drop the suite instead of scoping it.
4. If no command is found, record `none detected`. Never invent a command.
5. Run `git status --porcelain --untracked-files=all` and record the `git hash-object` of every file it lists. Run the verification commands once, then run the same `git status` again. A path in the second listing is a verification artifact if the first listing lacks it or its `git hash-object` changed during the run.
6. Record the result as the baseline, naming every failing test or check: only failures the baseline lacks block a commit later.

### 6. Require a clean tree

If `git status --porcelain` shows paths other than the verification artifacts, ask the user whether to commit those changes first or abort. If the user chooses commit, commit those paths and continue. Otherwise, stop. Never launch the pipeline with uncommitted work: the agents stop on any uncommitted change outside the verification artifacts.

### 7. Open the workspace

Resolve the workspace path and run `mkdir -p <workspace>`.

### 8. Write the spec

1. Read the code the task touches.
2. If the task leaves a behavior undecided that changes what gets built, ask the user with `AskUserQuestion` before writing.
3. Write the spec with these sections, in this order:

| Section | Content |
| --- | --- |
| Goal | One paragraph: what the change does and why. |
| Acceptance criteria | A numbered list. Each item is one observable behavior that a test can check. |
| Out of scope | What this change does not do. |
| Affected areas | The files and modules expected to change. |
| Verification | The verification commands and the baseline. |
| Decisions | `None yet`. Entries are added per Recording a decision. |

4. Never prescribe an implementation detail the task does not require: the implementer chooses the design, and the reviewer judges it.
5. Never write a criterion that requires matching all existing behavior, such as "exactly as it does today": no test can check it, and every review round finds another case to restore. If existing behavior must stay the same, give each behavior that must stay its own criterion.

### 9. Get approval

1. Print the spec.
2. Use `AskUserQuestion` with three options: `Approve and run the pipeline`, `Revise`, and `Abort`.
3. If the user chooses Revise, ask what to change, rewrite the spec, and return to step 1.
4. If the user chooses Abort, stop and leave the workspace in place.
5. If the user chooses Approve and this step was reached from Phase 3, relaunch per Relaunch in Phase 3. Otherwise, go to Phase 2.

## Phase 2: Run the pipeline

1. Build the launch args. If the user named a round budget, use it as `maxRounds`; otherwise use 3.

```json
{
  "repoPath": "<repository root>",
  "specPath": "<absolute path of the spec>",
  "branch": "<branch>",
  "baseBranch": "<base branch>",
  "verifyCommands": ["<command>"],
  "verificationArtifacts": ["<path>"],
  "baseline": "<baseline, naming every failing test or check>",
  "maxRounds": 3,
  "startRound": 1,
  "reviewOnly": false,
  "declined": []
}
```

2. Write `state.json` in the workspace with the launch args and no run result.
3. Copy the pipeline into the scratchpad directory your system prompt names, with `cp <pipeline> <scratchpad>/build-feature/pipeline.js`: the Workflow tool rejects a `scriptPath` outside the working directory and the directories added to the session, and this skill's base directory is neither.
4. Call the Workflow tool with `scriptPath` set to the copy and `args` set to the launch args as a JSON object, never as a JSON-encoded string.
5. If the session has no scratchpad directory, or the Workflow tool rejects the copy's path, read the pipeline and pass its whole content unchanged through the Workflow tool's `script` input instead.
6. If the Workflow call returns any other error, report its message to the user and stop.
7. Tell the user the pipeline is running and that `/workflows` shows its progress, then end the turn. Never poll the pipeline: its completion arrives as a notification.

## Phase 3: Wrap up

### 1. Record the run result

1. Read the run result from the completion notification. If the notification names a file instead, read that file. If it holds neither, report that the run result is missing and stop.
2. If the pipeline threw an error instead of returning a run result, report the error to the user and stop.
3. Write `state.json` with the launch args and the run result.
4. For each entry in the run result's `rounds`, write `round-<N>-review.md` with the entry's `review` verbatim.
5. For each entry whose `triage` is not null, write `round-<N>-triage.md` as a table with one row per finding: number, severity, location, summary, decision, reason, and commit.

### 2. Act on the exit reason

| `exitReason` | Action |
| --- | --- |
| `nothing in scope` | Go to step 3. |
| `round cap` | Show the last round's findings by decision, then ask the user whether to run more rounds and how many. If yes, relaunch per Relaunch. Otherwise, go to step 3. |
| `blocked` | Find the entry in the run result's `stages` or a round's `triage` whose `status` is `blocked`, and ask the user its `question`. Record the answer per Recording a decision. If the answer asks for an action in the tree, such as committing or discarding a change, carry it out. If the answer adds, removes, or changes an acceptance criterion, update the criteria and get approval per Phase 1, step 9. Otherwise, relaunch per Relaunch. |
| `reviewer failed` | Tell the user the reviewer twice returned no complete review, then ask whether to relaunch or stop. If the user chooses relaunch, relaunch per Relaunch. Otherwise, go to step 3. |
| `agent failed` | Tell the user which stage or round returned nothing, then ask whether to relaunch or stop. If the user chooses relaunch, relaunch per Relaunch. Otherwise, go to step 3. |

#### Recording a decision

1. If the spec has no Decisions section, add one at the end.
2. If the section reads `None yet`, remove that line.
3. Append one entry with the stage name, or `round <N>`, that asked, the question, and the user's answer:

```
- Asked by architect: Should the slug rules move from the HTTP handler into slug.py?
  Decision: Move them. The handler only parses the request and formats the response.
```

#### Relaunch

1. Copy the previous launch args.
2. Overwrite `reviewOnly` and `startRound` with the run result's `resume`.
3. Overwrite `declined` with the run result's `declined`.
4. Set `maxRounds` to the number of rounds the user asked for, or 3.
5. Run Phase 2 from step 2.

### 3. Report

Write `report.md` in the workspace and print the same text. Count findings across every run of this workspace by these rules:

- Two findings in different rounds are the same finding if they name the same file and the same problem, whatever their line numbers.
- A finding is counted once, in the round it first appeared.
- A finding decided `repeat` adds nothing.
- If a finding decided `reverted` appears again in a later round, its later decision replaces the earlier one.
- Every severity row MUST satisfy `Raised = Implemented + Reverted + Pushed back + Deferred`. If a row does not reconcile, recount from the triage files. Never print numbers that do not add up.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build Complete

Branch: feature/slugify vs main
Spec: 4 acceptance criteria
Commits: implement 3, refactor 2, architect 1, review fixes 4
Rounds: 2   Exit: nothing in scope
Verification: pytest -q, green

              │ Raised │ Implemented │ Deferred │ Pushed back │ Reverted
──────────────┼────────┼─────────────┼──────────┼─────────────┼──────────
 Critical     │   1    │      1      │    0     │      0      │    0
 Suggestion   │   3    │      1      │    1     │      1      │    0
 Nitpick      │   2    │      2      │    0     │      0      │    0
──────────────┼────────┼─────────────┼──────────┼─────────────┼──────────
 Total        │   6    │      4      │    1     │      1      │    0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pushed back (1)
  SUGGEST  slug.py:14   Make the separator a parameter
                        The spec fixes the separator, and no caller needs
                        another one.

Deferred (1)
  SUGGEST  slug.py:30   Transliterate non-ASCII letters
                        Correct, and it needs a dependency the spec did
                        not approve.

Outstanding: 2 findings not implemented, none critical.
```

- List every pushed back, deferred, and reverted finding with its reason. Omit a section that has no findings.
- List every entry of the spec's Decisions section under `Decisions (<N>)`. Omit the section if the spec has no entries.
- If a CRITICAL finding was not implemented, the closing line MUST say so.

### 4. Offer a pull request

Use `AskUserQuestion` to offer a pull request. If the user accepts, invoke the `create-pr` skill. Otherwise, stop. Never push the branch unless the user accepts here.
