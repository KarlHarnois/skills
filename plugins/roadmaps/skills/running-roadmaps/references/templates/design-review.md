# Design review: pull request <number>, <title>

**The manager session `<manager session>` sent this design review.** You judge the design of the code that pull request <number> changes, and report findings. Another reviewer tests its behavior, so you run no program and probe no behavior. You change nothing: no edit, no commit, and no push. You post nothing on GitHub.

**Goal: find every design defect that this pull request adds, and send the findings to the manager.**

Your worktree is on a branch of its own, which starts at the head of the pull request's branch `<branch>`. The base branch is `<remote>/<base branch>`.

## The settled rules this review MUST apply

- <source>: "<verbatim rule>"

## Rules

- Keep every scratch file under `<scratch directory>` in your worktree. NEVER read or write a path outside your worktree.
- <worker conduct>
- Review only these file types: <file types>. NEVER judge the design of any other file.
- Name only what you read. If you did not read a file, NEVER judge it.
- NEVER block on a defect that existed before this pull request. List each such defect under the heading "Existing debt".

## Steps

1. Run `git fetch <remote>`, then `git diff <remote>/<base branch>...HEAD`. Read every changed line.
2. Read the whole of each unit that the pull request creates or adds to, in every file that holds it. A unit is a type, a module, or a file. A diff cannot show a unit growing too large.
3. For each such unit, count its public members, its members, and its files. Write each count before and after this pull request.
4. Answer each question of the Questions section for the changed code.
5. Write the findings, per the Findings section, and send them, per the Done section.

## Questions

- Does each new behavior live with the data it uses?
- Does each unit have one responsibility that you can state in 25 words with no "and" or "or"?
- Should the new code be a new unit, instead of more code on an existing one?
- Does each new name state a concept of the domain, and not a step or a helper role?
- Is one piece of knowledge stated twice?
- Is the public surface as small as it can be?
- Can a wrong combination of values be built where the types could forbid it?
- Is the same choice over kinds repeated where one place could decide it?
- Does a dependency run in the wrong direction, or form a cycle?
- Do the tests go through the public interface?
- <project design question>

## Findings

Write `<scratch directory>/design-review.md`. For a later round, write `<scratch directory>/design-review-<round>.md`. Keep it under 10 KB.

1. Write the full head, from `git rev-parse HEAD`, on the first line.
2. Write exactly `**Verdict: passes.**` or `**Verdict: blocks.**` on the second line.
3. Block only when the pull request makes the design worse. Growing a unit that is already too large, when a new unit would do, makes the design worse.
4. Write one row per finding, blocking findings first:

| Severity | File and line | Design defect | Fix |
| --- | --- | --- | --- |

Each Fix cell names the units the fix creates or changes, and shows their members.

5. Write the Existing debt heading last.

## Done

1. Run this command, with a timeout of at least 90 seconds:

   ```sh
   <ringleader> send <manager session> "Design review of pull request <number> is ready: $(git rev-parse --show-toplevel)/<scratch directory>/design-review.md"
   ```

2. If the command fails, wait two minutes, and run it once more. If it fails again, stop. The manager reads the review file.
