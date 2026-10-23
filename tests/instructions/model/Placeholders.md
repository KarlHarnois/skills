# Research: <title>

**The manager session `<manager session>` sent this task.** You test the manager's hypotheses with a staged prototype, and you measure the cost. You report facts and NEVER decide. The manager designs the change from your report. You do not open a pull request.

**Goal: prototype <the stages> locally, answer the questions, write the report, and send its path to the manager.**

## Terms

| Term | Meaning |
| --- | --- |
| Evidence | A command plus the output lines that support a claim, or a `file:line` plus the quoted code. Evidence runs at most 15 lines. |
| The gate | <gate commands> |
| <project word> | <meaning> |

## The settled rules this task MUST keep

- <source>: "<verbatim rule>"

## Facts the manager already has

- <fact, with a `file:line` or a command>

## Hypotheses

Each hypothesis is the manager's guess. Test each one, and record whether the evidence holds it or disproves it. NEVER choose between hypotheses.

- **H1, <name>.** <hypothesis>
  - If <result>, H1 is disproved.

If every hypothesis is disproved, prototype the smallest change you can find that makes the rows pass. Record the change under Choices.

## Rules

- Read <settled rule sources> before you start.
- Keep every scratch file under `<scratch directory>` in your worktree. NEVER read or write outside your worktree: a permission prompt there can stall you until the project owner answers.
- NEVER commit on your session branch. Commit only on the prototype branch.
- NEVER run `git push`, `gh`, or any command that changes a remote.
- Change only these paths: <paths>.
- NEVER change <protected entries>.
- NEVER change <paths of other running workers>. Another session works there.
- Back every claim about behavior with evidence.
- NEVER paste test output into the report. Write "pass", or write "fail" plus the names of the failing tests.
- If the task leaves a choice open, choose by the principles of `AGENTS.md`. Record the choice under Choices in the report.
- If you find a problem outside this task, add one line under Open questions in the report, and continue.

## Stages

First, run `git branch --show-current`, and keep its output as your session branch. Then run `git switch -c <session name>-prototype <remote>/<base branch>`. Each stage is one commit on that branch.

### Stage 1: <title>

1. <step>
2. Run <commit commands>.
3. Commit every changed file with the message `Stage 1: <title>`.

## Rows

| Row | Input | Expected by the manager |
| --- | --- | --- |
| R1 | <program, input, or call> | <prediction> |

The Expected column holds predictions. If a row differs from its prediction, record what happened, and continue.

## Questions

Answer each question with evidence.

- **Q1.** <question>

<!-- vale off -->

The job should finish in an hour.

<!-- vale on -->

Press <kbd>Enter</kbd> to send <report>, and the job should finish.
