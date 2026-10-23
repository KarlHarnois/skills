# Design handoff

**A design worker writes options, recommends one, and prototypes it.** Use this template for the Design pilot kind of `SKILL.md`.

## Fill

1. Quote the roadmap item verbatim.
2. Quote every settled rule the design touches. The Conformance section checks the design against these quotes.
3. Write examples that every option MUST handle, such as programs, inputs, or calls. Include one example where you expect the options to differ.
4. Write each question openly, per `prompt-standards.md`. NEVER hint at the option you expect.
5. Replace every `<placeholder>`. Delete each template line that does not apply.

## Template

````markdown
# Design: <title>

**The manager session `<manager session>` sent this task.** You design the change and prototype it. The manager reviews the design and decides. You do not open a pull request.

**Goal: write a design for the roadmap item below, prototype it on a local branch, and send the design's path to the manager.**

The roadmap item, verbatim:

> <item>

## Terms

| Term | Meaning |
| --- | --- |
| Evidence | A command plus the output lines that support a claim, or a `file:line` plus the quoted code, at most 15 lines |
| The gate | <gate commands> |
| The design | The file `<scratch directory>/design.md` in your worktree |
| <project word> | <meaning> |

## The settled rules this task MUST keep

- <source>: "<verbatim rule>"

## Facts the manager already has

- <fact, with a `file:line` or a command>

## Examples

Every option in the design MUST show its result for each example.

| Example | Input |
| --- | --- |
| E1 | <program, input, or call> |

## Rules

- Read <settled rule sources> before you design. Your design MUST follow them. The principles of `AGENTS.md` decide every choice that no rule covers.
- Keep every scratch file under `<scratch directory>` in your worktree. NEVER read or write a path outside your worktree: outside it, you can stop at a permission prompt that only the project owner can answer.
- NEVER commit on your session branch. Commit only on the prototype branch.
- NEVER run `git push`, `gh`, or any command that changes a remote.
- Change only these paths: <paths>.
- NEVER change <protected entries>.
- NEVER change <paths of other running workers>. If your design needs a change there, write it under Open questions.
- Back every claim about current behavior with evidence.
- NEVER paste test output into the design. Write "pass", or write "fail" plus the names of the failing tests.
- If you find a problem outside this task, add one line under Open questions in the design, and continue.

## Steps

1. Record the current result of each example.
2. Write two or three design options. For each option, give:
   - the changes, by file
   - the result of each example
   - the risks
   - the result that would show the option is wrong
3. Recommend one option. Give the reasons in terms of the settled rules and the principles of `AGENTS.md`.
4. Check the recommendation against each settled rule above, for the Conformance section.
5. Prototype the recommendation, per the Prototype section.
6. Write the design, and send it, per the Done section.

## Questions

- **Q1.** <question>

## Prototype

1. Run `git branch --show-current`, and keep its output as your session branch. Then run `git switch -c <session name>-prototype <remote>/<base branch>`.
2. Implement the recommendation. Add tests or fixtures that cover the examples.
3. Run <commit commands> and the gate.
4. Commit every changed file with the message `Prototype: <title>`.
5. Run `git switch <session branch>`.

If a step still fails after two tries, record the step and the error in the design. Then run `git switch <session branch>`, and continue with the Done section.

## The design

Write `<scratch directory>/design.md` with these sections, in this order. Keep the file under 15 KB. Put findings first, and leave out what the manager can read in the code.

1. Summary: the status word on the first line, then the recommended design in at most ten lines. The status word is `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, or `NEEDS_CONTEXT`.
2. Conformance: each settled rule above, quoted, with one sentence on how the recommendation keeps it.
3. Current state: the result of step 1.
4. Options: one subsection per option, with every item of step 2.
5. Recommendation: the chosen option and the reasons.
6. Questions: each question with its answer.
7. Prototype: the branch, the commit hash, the result of each gate command, and one line per changed existing snapshot or output.
8. Decisions for the project owner: each choice that no settled rule decides, with its options and an example each.
9. Open questions.

## Done

1. Run this command, with a timeout of at least 90 seconds:

   ```sh
   <ringleader> send <manager session> "Design for <title> is ready: $(git rev-parse --show-toplevel)/<scratch directory>/design.md"
   ```

2. If the command fails, wait two minutes, and run it once more. If it fails again, stop. The manager reads the design file.
````
