# Prompt standards

**Every handoff follows these standards, and each template applies them.** A handoff is model instruction text, so the `instructions:writing-model-instructions` standard binds it too.

## The handoff stands alone

**A worker sees only its handoff.** It sees nothing of this conversation, the state file, or this skill.

- Inline every rule, format, fact, and command the worker needs.
- NEVER name a path outside the worker's worktree, such as a skill file, the state directory, or `/tmp`. Outside its worktree, a worker can stop at a permission prompt that only the user can answer.
- NEVER tell a worker to follow a skill. An opencode worker loads no Claude skill. Inline the rules the skill would give.
- Write the commands with the Ringleader binary and the manager session of the profile.

## Strictness

**The Worker strictness field of the profile sets how much the manager designs.**

| Strictness | The manager writes | The worker decides |
| --- | --- | --- |
| `prescriptive` | the root cause and the design: files, functions, signatures, and exact code where a choice matters | only what the handoff leaves open |
| `goal-level` | the goal, the settled rules, the constraints, and how to verify the result | the design within the settled rules |

## Settled rules

- Quote verbatim each settled rule the task touches, with its source.
- Put the quotes in a section titled "The settled rules this task MUST keep".
- Write "leave out what contradicts the design". NEVER write "leave out what contradicts the file": a planned change contradicts the current text.
- If the design leaves a choice open, tell the worker to choose by the principles of `AGENTS.md`.
- Tell the worker to record each choice it makes under Choices in its report.

## Steering

**A research or design handoff NEVER gives the expected answer:** a worker bends its evidence toward a given answer. The handoff gives facts, hypotheses, and questions.

- Label each hypothesis as the manager's guess.
- Give each hypothesis the result that would disprove it.
- Tell a researcher to test every hypothesis and NEVER choose between them.
- Ask each question openly. NEVER phrase a question so that one answer is the only fitting one.

## MUST lines

**A MUST line names one observable artifact and its exact value.** Artifacts include a snapshot line, a printed output, and a signature.

- Before you send a build, run every MUST line against the prototype, and correct each line that the prototype contradicts.
- If no prototype exists for a MUST line, mark the line as a prediction. Tell the worker to stop that step and report the difference on a mismatch.
- Pair each MUST line with a failure branch: "If <artifact> differs, stop work on that commit. Put the diff in the report."
- List which existing snapshots or outputs MAY change. Every other existing snapshot MUST stay unchanged.

## Failure branches

**Every step that can fail has a failure branch with a limit.**

- If a command fails, the worker fixes the cause and reruns the command at most twice. If the command still fails, the worker stops and reports the output.
- If a research stage fails three attempts at a fix, the worker commits the stage with ` (incomplete)` after its message. The worker then records what blocks the stage, and stops.
- If `git push` or `gh` fails, the worker stops and reports the command and its output.

## Scope

- Name the paths the worker MAY change, in the Rules section.
- Name as forbidden the paths of every other running worker.
- Name as forbidden every entry of the Protected list of the profile.
- Tell the worker to keep every scratch file under the scratch directory of the profile, inside its worktree.
- Give the worker this rule: `If you find a problem outside this task, add one line under Open questions in the report, and continue.`

## Reports

**Ask for a report that puts findings first and stays capped.** The report carries each of these, and nothing else:

| Part | Content |
| --- | --- |
| Status | One status word on the first line, from the list below this table |
| Where | the branch, each commit hash with its title, and the pull request link if any |
| Commands | each command with "pass", or with "fail" plus the names of the failing tests |
| Changes | one line per changed existing snapshot or output, saying what changed |
| Departures | each place where the worker departed from the handoff, and why |
| Undone | each step the worker did not finish, and why |

The status words:

- `DONE`: every step finished.
- `DONE_WITH_CONCERNS`: every step finished, and the worker doubts part of the result.
- `BLOCKED`: a failure branch stopped the task.
- `NEEDS_CONTEXT`: the handoff lacks a fact that the task needs.

The rules of a report:

- Tell the worker to NEVER paste test output.
- Cap a report sent as a message at 30 lines. Cap a report file at 15 KB.
- If a report passes the cap of a message, tell the worker to write it to `<scratch directory>/report.md`. The message then names the file.
- After the message arrives, copy the file to `<state directory>/reports/<session name>-<round>.md`.

## Done section

**Every handoff ends with the command that sends its report, and with a fallback.** A report takes one of two forms:

| Form | Kinds | Fallback |
| --- | --- | --- |
| A message that holds the report | build, fix list | Write the report to `<scratch directory>/report.md`, then send once more. |
| A message that names the report file | research, design, review | Send once more. The manager reads the file. |

**NEVER put a backtick, a dollar sign, or a double quote in a handoff title.** The shell expands those characters in the send command.

The template of each kind holds its Done section. `templates/build.md` and `templates/fix-list.md` show the form that holds the report.

## Opener and skeleton

**Open each handoff with a bold sentence that names the manager session and the worker's contract.** The contract says what the worker does and what it does not do.

**Order every handoff's sections like this, and leave out each section that the task does not need:**

1. Title: `# <Kind>: <title>`
2. The opener
3. Goal, in bold, one sentence
4. Terms: a table of each project word the handoff uses
5. The settled rules this task MUST keep
6. Facts the manager already has, each with a `file:line` or a command
7. Hypotheses, Options, or Answers to your open questions, per kind
8. Rules
9. Stages, or Start and Commits
10. Rows and Questions
11. Measurements
12. Failure branches
13. The report or the design file
14. Done

## Before you send

1. Check each standard in this file against the handoff.
2. Lint the handoff, per `SKILL.md` Dispatch.
