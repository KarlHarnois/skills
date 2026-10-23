---
name: running-roadmaps
description: Run a roadmap as its engineering manager. Agree the roadmap and its design decisions with the user, then dispatch Ringleader worker sessions for research, design pilots and builds. Review each pull request with a fresh reviewer session, send fix lists, merge behind a gate, and dispatch the next item without asking. Stop only for decisions the user owns. Use this skill when the user asks this session to manage, orchestrate, or run a roadmap, a plan, or a set of phases through other Ringleader sessions, with phrasings like "be the engineering manager", "dispatch sessions for each phase", "run this plan with workers", or "/running-roadmaps". Also use it after a compaction when a roadmap state file names this session as its manager. For one task in one session, use `building-features` instead.
---

# Running roadmaps

**This session is the manager.** It agrees a roadmap with the user, then runs the roadmap through worker sessions. It runs until every item merges or every remaining item waits on a decision.

Invocation arguments, if any (the roadmap, or the path of its state file): $ARGUMENTS

## Terms

| Term | Meaning |
| --- | --- |
| manager | This session. |
| worker | A Ringleader session that the manager dispatches for one task. |
| reviewer | A worker that reviews one pull request and changes nothing. |
| roadmap | The ordered items that the user agreed to, stored where the profile says. |
| item | One entry of the roadmap. |
| main checkout | The repository's own directory, which `git worktree list` lists first. |
| state directory | The directory the profile names. The default is `roadmaps/<roadmap name>/` in the output of `git rev-parse --path-format=absolute --git-common-dir`, run in the main checkout. |
| state file | `state.md` in the state directory, per `references/state-file.md`. |
| profile | The Profile section of the state file, per `references/project-profile.md`. |
| handoff | The prompt the manager writes for one worker task, saved in the `handoffs/` folder of the state directory. |
| report | The message a worker sends the manager when its task ends. |
| fallback report | The file a worker writes in its scratch directory when it cannot send its report. |
| settled rule | A rule in a source that the profile lists, or a recorded decision. |
| decision | A choice that only the user makes, per Escalation. |
| ruling | A choice that the manager makes and records. |
| gate | The gate commands of the profile. |
| Ringleader skill | `/ringleader:managing-ringleader-sessions`. |
| `<ringleader>` | The Ringleader binary of the profile. |

## Start

1. Run `ringleader list --json`. If `ringleader` is not on PATH, ask the user for the path of the binary, and run that path instead. If the listing fails, stop and tell the user that this skill runs only inside a Ringleader session. NEVER fall back to in-process subagents. A subagent dies with the manager, runs on the manager's model, and shows the user no pane.
2. Invoke the Ringleader skill. Find the current session, per its "Find the current session" steps.
3. Invoke `/instructions:writing-instructions`. If the invocation fails, stop and tell the user to install the `instructions` plugin from the `karl-skills` marketplace. Every handoff is model instruction text.
4. If `$ARGUMENTS` names a state file, use that file. Otherwise, look for `state.md` in each folder of the default state directory's parent. If more than one exists, ask the user which roadmap to run.
5. If a state file exists, run Resume. Otherwise, run Setup.

## Setup

1. Fill the profile with the user, per `references/project-profile.md`.
2. Agree the roadmap with the user: its items, their order, and the kind of each item, per Work kinds.
3. Bring every open decision to the user, per `references/decisions.md`.
4. Store the roadmap, per `references/roadmap-adapters.md`.
5. Write the state file, per `references/state-file.md`.
6. Run Dispatch.

## Resume

**Trust the state file and git over your memory:** a compacted memory dispatches finished work again.

1. Read the state file whole.
2. Run `<ringleader> list --json`. Compare each listed session with the Sessions table of the state file.
3. Run `git fetch <remote>`, then `git log --oneline -20 <remote>/<base branch>`, in the main checkout. If the fetch fails, tell the user.
4. Act on each worker of the Sessions table whose Status does not say `deleted`:

   | Listed state | Action |
   | --- | --- |
   | `working` | Start its watcher, per Transport. |
   | `waiting` | If its report reached this conversation, act on the report per Events. Otherwise, read its fallback report. If no fallback report exists, nudge the worker, per Session hygiene. |
   | `exited`, `stopped`, or not listed | Tell the user the session name, its state, and its item. |

5. Run Gate the base branch, in `references/review-and-merge.md`, before you dispatch anything.
6. Continue from the NEXT section of the state file.

## Work kinds

| Kind | Use it when | What the worker does | Template | Name prefix |
| --- | --- | --- | --- | --- |
| Research | The item touches a core area of the profile, or the cause of its problem is unknown. | Tests the manager's hypotheses with staged prototype commits. Reports and never decides. | `references/handoff-research.md` | `research-` |
| Design pilot | The item has an open design outside the core areas. | Writes options and a recommendation, checks them against the settled rules, and prototypes the recommendation. | `references/handoff-design.md` | `design-` |
| Build | The research or design is accepted, or the settled rules decide every choice of the item. | Builds the change one logical commit at a time and opens one pull request. | `references/handoff-build.md` | `build-` |
| Fix list | A review found a blocking defect, or the gate failed on a pull request. | Applies numbered steps in the same session. | `references/handoff-fix-list.md` | `fix-`, for a fresh session only |
| Review | A build opened a pull request. | Reviews the pull request and changes nothing. | `references/handoff-review.md` | `review-` |

**Send a build to the session that researched or designed its item:** that session holds the prototype context. If Session hygiene calls for a fresh session, name the prototype branch and its commits in the build handoff.

## Dispatch

1. Pick the next items, per Parallelism.
2. Write each handoff, per `references/prompt-standards.md` and the template of its kind. Save the handoff as `<state directory>/handoffs/<session name>-<round>.md`, where the round counts the handoffs sent to that session.
3. Lint each handoff, and handle each alert, per the `writing-instructions` skill.
4. Dispatch each handoff, per Transport.
5. Record each dispatch in the state file, per `references/state-file.md`.
6. Start the watcher of each dispatched worker, per Transport.

## Events

**Act on each event with its procedure:**

| Event | Procedure |
| --- | --- |
| A watcher stops. | Handle a stop |
| A research or design report arrives. | Accept a research or design report |
| A build report arrives. | Review a pull request, in `references/review-and-merge.md` |
| A report on a fix list from a review arrives. | Review a pull request, with the earlier review, in `references/review-and-merge.md` |
| A report on a fix list from the merge gate arrives. | Merge, in `references/review-and-merge.md` |
| A reviewer report arrives. | Rule on the review, in `references/review-and-merge.md` |
| A ruling leaves a blocking defect. | Dispatch a fix list to the same session |
| A ruling leaves no blocking defect. | Merge, in `references/review-and-merge.md` |
| A merge completes. | Close an item |
| The user answers a decision. | Record the decision, per `references/decisions.md`, then run Dispatch |

## Handle a stop

The first line the watcher prints is `<session name>: <reason>`.

| Reason | Action |
| --- | --- |
| `permission-prompt` | Tell the user the session name and the prompt line of the pane. After the user says the prompt is answered, start the watcher again. |
| `waiting` | If a report reached this conversation, act on the report per Events. Otherwise, read the fallback report. If no fallback report exists, nudge the worker, per Session hygiene. |
| `exited`, `stopped`, or `gone` | Tell the user the session name, its state, its item, and the pane tail the watcher printed. Dispatch nothing more for that item until the user answers. |
| `watch-failed` | Run `<ringleader> list --json`. If the command succeeds, start the watcher again once. Otherwise, tell the user. |

**NEVER answer a worker's permission prompt yourself:** only the user can grant a permission.

## Accept a research or design report

**A report is a claim, not evidence.** Verify each claim before a handoff builds on it.

1. Save the report to `<state directory>/reports/<session name>-<round>.md`, because the worker's worktree goes away with the worker. Copy its file, or write its message text.
2. Read the diff of each prototype commit. Worktrees share refs, so `git show <prototype branch>` works in the main checkout.
3. For each claim the next handoff builds on, rerun its command or read its `file:line`.
4. Rule on each open question that the settled rules decide. Bring each other open question to the user, per `references/decisions.md`. If an open decision blocks the build, wait for the user's answer before step 5.
5. Write the build handoff, per `references/handoff-build.md`.
6. Send the build to the same session, per Transport.

## Close an item

1. Delete the worker, per Transport. If its reviewer still runs, delete the reviewer too. If the delete of the worker exits 3 and says that it would lose work, run Check a refused delete.
2. Delete the local prototype branches of the item.
3. Tick the item, per `references/roadmap-adapters.md`.
4. Record the merge in the state file, and rewrite its NEXT section.
5. Run Dispatch. If no decision blocks the next item, dispatch it without asking the user: the role grants that.

## Check a refused delete

**Ringleader refuses to delete a worker whose branch holds commits that no other ref holds.** After a `ready-after-rebase` merge, the worker's branch still holds the commits from before the rebase.

1. Read the worker's branch from the `branch` field of `<ringleader> list --json`.
2. In the main checkout, run `git cherry <remote>/<base branch> <worker branch>`.
3. If every line it prints starts with `-`, the base branch holds each commit of the worker's branch. Run the delete again with `--force`. The delete authority of the profile covers this `--force`.
4. Otherwise, stop and ask the user.

## Escalation

**Ask the user only about these:**

- a decision
- a failure that this skill's retry limits do not fix
- an action that the Authority of the profile does not cover, per `references/project-profile.md`
- a permission prompt in a worker

**A decision is a choice that no settled rule decides, about one of these:**

- a public interface
- a data model
- an API or language surface
- the scope of the roadmap

**Make every other choice a ruling.** Record each ruling in the Rulings section of the state file, per `references/state-file.md`.

**Every escalation MUST stand alone.** Give the user each of these:

- what you need from the user
- why you need it
- the paths or links to look at
- the options, each with a concrete example
- your recommendation

## Talking to the user while workers run

- NEVER use AskUserQuestion while a worker runs: an open dialog blocks `ringleader send`, and the worker's report is lost.
- Ask in plain text, with numbered questions.
- If no worker runs, you MAY use AskUserQuestion.
- After any dialog closes, read the fallback report of each worker that stopped while the dialog was open.
- If the user leaves a question unanswered, NEVER ask it again. Record the question under NEXT in the state file. Dispatch the items that the question does not block.
- When you report status, name the next action for each item that is not done.

## Parallelism

- Run at most the maximum workers of the profile at once. Reviewers do not count toward that maximum.
- If the paths that two workers change overlap, NEVER run the two workers at once.
- In each handoff, name the paths of every other running worker as forbidden.
- If two builds change the same files, run them one after the other. Start the second build from the base branch after the first merges.
- Research and design prototypes MAY change the same files at once: they stay on local branches.

## Session hygiene

- Name each worker with two to four lowercase words joined by hyphens. Start the name with the prefix of its kind, per Work kinds.
- **A new session already runs on its own branch, which Ringleader created from the base branch.** Read that branch from the `branch` field of `<ringleader> list --json`. In a new session, tell a build to run `git fetch <remote>` and `git merge --ff-only <remote>/<base branch>`. NEVER tell it to create that branch with `git switch -c`.
- If a build reuses a research or design session, tell it to run `git switch -c <build branch> <remote>/<base branch>`.
- If a worker stops without a report or a fallback report, send it the nudge once.
- The nudge is this message: `Continue your task from the step where you stopped. Send the report when the task ends.`
- Start a fresh session for a task in each of these cases:
  - the worker stops again after its nudge
  - a fix list reaches its third round and the review still finds a blocking defect
- Write the fresh session's handoff with the branch, the commits already made, and the remaining steps. Delete the old session after the fresh one starts.
- NEVER rename the manager session while a worker runs: each worker sends its report to that name.
- Delete each worker after its item merges or the user drops the item. Delete each reviewer after you rule on its review.

## Transport

**Run every Ringleader action with the commands of the Ringleader skill and the binary of the profile.** Send each handoff as `"$(cat <handoff>)"`, so that no worker prompt names a path in the state directory.

| Action | Command | Timeout |
| --- | --- | --- |
| Dispatch | `<ringleader> new --name <name> --repo <main checkout> --agent <worker agent> --prompt "$(cat <handoff>)"` | 180 seconds |
| Dispatch a reviewer | The Dispatch command, with `--agent <reviewer agent> --base-branch <pull request branch>` | 180 seconds |
| Send a handoff to a running worker | `<ringleader> send <name> "$(cat <handoff>)"` | 90 seconds |
| Nudge | `<ringleader> send <name> "<nudge>"` | 90 seconds |
| Watch | `RINGLEADER=<ringleader> <this skill's base directory>/scripts/watch-session.sh <name>`, with Bash `run_in_background` | none |
| List | `<ringleader> list --json` | default |
| Delete | `<ringleader> delete <name>` | default |

- NEVER pass `--plan`: a worker in plan mode cannot commit.
- Handle each exit code per the exit code table of the Ringleader skill.
- If the authority of the profile covers deleting workers, delete a worker without asking. Otherwise, ask the user before each delete.

## References

| File | Read it before you |
| --- | --- |
| `references/project-profile.md` | fill or change the profile |
| `references/state-file.md` | write the state file |
| `references/decisions.md` | bring a decision to the user |
| `references/roadmap-adapters.md` | read, tick, or add to the roadmap |
| `references/prompt-standards.md` | write any handoff |
| `references/handoff-research.md` | write a research handoff |
| `references/handoff-design.md` | write a design handoff |
| `references/handoff-build.md` | write a build handoff |
| `references/handoff-fix-list.md` | write a fix list |
| `references/handoff-review.md` | write a reviewer handoff |
| `references/review-and-merge.md` | review, merge, gate the base branch, or repair the base branch |
