# Research handoff

**A research worker tests the manager's hypotheses and never decides.** Use this template for the Research kind of `SKILL.md`.

## Fill

1. Diagnose the item yourself first: read the code, and reproduce the problem.
2. Write each hypothesis with the result that would disprove it, per `prompt-standards.md`.
3. Plan one stage per later build commit, so that the build can cherry-pick the stages.
4. Write rows that cover each hypothesis, and one row where you expect a hypothesis to fail.
5. Write questions that ask for every site a change touches, with `file:line`.
6. Replace every `<placeholder>`. Delete each template line that does not apply.

## Template

````markdown
# Research: <title>

**The manager session `<manager session>` sent this task.** You test the manager's hypotheses with a staged prototype, and you measure the cost. You report facts and never decide. The manager designs the change from your report. You do not open a pull request.

**Goal: prototype <the stages> as commits on a local branch, answer the questions, write the report, and send its path to the manager.**

## Terms

| Term | Meaning |
| --- | --- |
| Evidence | A command plus the output lines that support a claim, or a `file:line` plus the quoted code, at most 15 lines |
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
- Keep every scratch file under `<scratch directory>` in your worktree. NEVER read or write a path outside your worktree: outside it, you can stop at a permission prompt that only the project owner can answer.
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

## Measurements

For each stage, record:

- `git show --stat` of the stage's commit
- the result of each gate command, as pass or fail
- one line per changed existing snapshot or output, saying what changed
- each row's result: "as expected", or what happened instead

## Failure branches

- If a stage cannot pass its tests after three attempts at a fix, commit what you have with the stage's message plus ` (incomplete)`. Record what blocks the stage, then stop. NEVER start the next stage after an incomplete one.
- If a command fails for a reason outside the stage, rerun it at most twice. If it still fails, record its output in the report, and stop.
- If a row cannot run, record the row and its error, and continue.

## The report

Write `<scratch directory>/report.md` with these sections, in this order. Keep the file under 15 KB.

1. Summary: the status word on the first line, then at most eight lines. The status word is `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, or `NEEDS_CONTEXT`. State first whether each hypothesis holds.
2. Questions: each question with its answer.
3. Stages: one subsection per stage, with its measurements.
4. Rows: one line per row.
5. Choices: each choice the task left open, what you chose, and why.
6. Open questions.

## Done

1. Run `git switch <session branch>`.
2. Run this command, with a timeout of at least 90 seconds:

   ```sh
   <ringleader> send <manager session> "Research report for <title> is ready: $(git rev-parse --show-toplevel)/<scratch directory>/report.md"
   ```

3. If the command fails, wait two minutes, and run it once more. If it fails again, stop. The manager reads the report file.
````
