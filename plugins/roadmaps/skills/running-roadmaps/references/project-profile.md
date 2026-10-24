# Project profile

**The profile holds every value that differs between projects.** The profile is the Profile section of the state file. Every rule of the skill that names a profile field reads the field from there.

## Fields

| Field | Meaning | Where to find it |
| --- | --- | --- |
| Manager session | The Ringleader name of this session. Workers send their reports to it. | `ringleader list --json`, the entry whose `worktree` is the current worktree |
| Ringleader binary | If every session has `ringleader` on PATH, `ringleader`. Otherwise, the absolute path of the binary. | `command -v ringleader` |
| Main checkout | The absolute path of the repository's own directory. | the first entry of `git worktree list` |
| Remote | The git remote that pull requests merge into. | `git remote` |
| Base branch | The branch that pull requests merge into. | `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` |
| Merge method | `rebase`, `squash`, or `merge`, as `gh pr merge` takes it. | the repository settings, or ask the user |
| CI | Whether a pull request MUST pass CI before it merges. | the CI workflow files, or ask the user |
| Worker agent | The Ringleader agent name for research, design, build, and fix workers. | the `[[agents]]` entries of the Ringleader config, or ask the user |
| Worker strictness | `prescriptive` or `goal-level`, per `prompt-standards.md`. | ask the user |
| Reviewer agent | The Ringleader agent name for reviewers. | ask the user. PREFER the strongest model OVER the model of the worker agent. |
| Worker skills | The skills that the worker agent and the reviewer agent can invoke. | For an opencode agent, the folder names under `~/.config/opencode/skills/`. For a Claude agent, the skills its enabled plugins and skill folders provide. If neither applies, ask the user. |
| Maximum workers | How many workers MAY run at once. | ask the user. The default is 2. |
| Scratch directory | A directory inside each worktree that git ignores, for worker scratch files. | `git check-ignore -v <directory>`. If the project ignores none, ask the user. |
| Roadmap | The roadmap adapter and its location, per `roadmap-adapters.md`. | ask the user |
| Authority | The actions the manager takes without asking, per Authority below. | ask the user |

**The profile also holds these lists, one section each:**

| List | Meaning | Where to find it |
| --- | --- | --- |
| Commit commands | The commands a build MUST pass before each commit. | `AGENTS.md`, `CLAUDE.md`, the Makefile, or the CI workflow |
| Gate commands | The commands a pull request MUST pass before it merges. | the same files. The gate includes the commit commands. |
| Core areas | The paths where an item starts with research. | ask the user |
| Protected | The files, constants, and settings that no worker changes. | the repository instructions, or ask the user |
| Review greps | Patterns the manager searches in every diff, each with the defect it catches. | lessons, per `state-file.md` |
| Settled rules | The files and sections whose rules every handoff quotes when a task touches them. | `AGENTS.md`, the design documents, and the roadmap's decisions |

## Authority

**If the Authority field lists an action, the manager takes the action without asking.** Ask the user before every other action that changes a remote, deletes something, or merges.

**Offer the user this grant, and record the grant the user gives:**

- merge pull requests that pass the gate
- delete the worker sessions and branches that this manager created
- push rebased commits to worker branches with `--force-with-lease`
- tick and add roadmap items
- dispatch the next item without asking

## Fill the profile

1. Fill each field from the place its row names.
2. Show the user the fields you found, and ask for the fields marked "ask the user".
3. If no worker runs yet, you MAY use AskUserQuestion. Otherwise, ask in plain text.
4. Run the base-branch gate, defined in `review-and-merge.md`. It runs the gate where every merge runs it: a scratch worktree that holds tracked files only.
   - If it exits 0, record the tree that it printed in the Log section of the state file.
   - If it exits 1, show the user its output and ask how to make the gate pass.
   - If it exits with another code, show the user its output and stop.
5. Write the profile into the state file, per `state-file.md`.

**Change a field only when the user changes it or a lesson requires it.** Record each change in the Log section.
