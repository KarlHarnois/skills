# Build handoff

**A build worker builds the change one logical commit at a time and opens one pull request.** Use this template for the Build kind of `SKILL.md`.

## Fill

1. Quote every settled rule and recorded decision the build touches.
2. If a research or design came first, write your answers to its open questions. Name the prototype branch and each prototype commit the build reuses.
3. Split the change into commits. Each commit is one logical change that passes the commit commands alone.
4. Write the MUST lines. Run each MUST line against the prototype, and correct each line that the prototype contradicts, per `prompt-standards.md`.
5. List each existing snapshot or output that MAY change. Every other one MUST stay unchanged.
6. Keep one Start line. If the session did the research or design, keep the second line. Otherwise, keep the first.
7. Replace every `<placeholder>`. Delete each template line that does not apply.

## Template

````markdown
# Build: <title>

**The manager session `<manager session>` sent this build.** You build the change below as commits on one branch, and you open one pull request. You never merge it.

**Goal: <one sentence: what the code does after this build>.**

## The settled rules this build MUST keep

- <source>: "<verbatim rule>"

## Answers to your open questions

- <question>: <answer>

## Rules

- Read <settled rule sources> before you start.
- Keep every scratch file under `<scratch directory>` in your worktree. NEVER read or write a path outside your worktree: outside it, you can stop at a permission prompt that only the project owner can answer.
- Before each commit, run these commands. All of them MUST pass.

  ```sh
  <commit commands>
  ```

- Change only these paths: <paths>.
- Read every new or changed snapshot or output before you commit it.
- Name every path in each `git commit` command.
- NEVER change <protected entries>.
- NEVER change <paths of other running workers>. Another session works there.
- Only these existing snapshots or outputs MAY change: <list, or "none">. Every other one MUST stay unchanged.
- If the task leaves a choice open, choose by the principles of `AGENTS.md`. Record the choice under Departures in the report.
- If you find a problem outside this task, add one line under Open questions in the report, and continue.

## Start

- Run `git fetch <remote>`, then `git merge --ff-only <remote>/<base branch>`. Your session already runs on its branch.
- Run `git fetch <remote>`, then `git switch -c <build branch> <remote>/<base branch>`.

## Commits

| Commit | Title | Content |
| --- | --- | --- |
| 1 | `<title>` | <the change, or the prototype commit to cherry-pick plus its fixes> |

Give each commit a description of two or three sentences.

## MUST lines

- <artifact> MUST <exact value>.

## Finish

1. Run the gate on the last commit: <gate commands>. Every command MUST pass.
2. Push the branch.
3. Open the pull request with `gh pr create --assignee @me`, the title `<pull request title>`, and this description:

   ```markdown
   ## Summary
   <two or three plain sentences: what the code does now, and why>

   ## Test plan
   - [x] <the gate commands> pass.
   ```

4. NEVER merge the pull request.
5. Send the report, per the Done section.

## Failure branches

- If a MUST line or an unlisted snapshot differs, stop work on that commit. Put the diff in the report.
- If a rule above cannot be built as written, stop work on that commit. Put the rule, the input, and the problem in the report.
- If a command fails, fix the cause and rerun it at most twice. If it still fails, stop and put its output in the report.
- If `git push` or `gh pr create` fails, stop and put the command and its output in the report.

## Done

Send the report with this command, with a timeout of at least 90 seconds:

```sh
<ringleader> send <manager session> "$(cat <<'REPORT'
<report>
REPORT
)"
```

The report MUST contain each of these, and nothing else. Keep it under 30 lines.

- the status word on the first line: `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, or `NEEDS_CONTEXT`
- the branch, each commit hash with its title, and the pull request link
- the result of each gate command, as pass or fail, plus the names of the failing tests
- one line per changed existing snapshot or output, saying what changed
- each place where you departed from this build, and why
- each step you did not finish, and why

NEVER paste test output into the report. If the command fails, write the report to `<scratch directory>/report.md`, wait two minutes, and run the command once more. If it fails again, stop.
````
