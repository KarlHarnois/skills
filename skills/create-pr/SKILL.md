---
name: create-pr
description: Create a GitHub pull request with a brief, high-level description. Use this skill when the user asks to create a PR, open a pull request, push a PR up, or anything involving authoring a new pull request on GitHub. Delegates the title and body drafting to the `describing-prs` skill.
allowed-tools: Bash(gh *), Bash(git *), Read, Grep, Glob, AskUserQuestion, Skill
---

# Create PR Skill

This skill opens the PR first with a bootstrap title/body, then invokes `describing-prs` in edit mode to replace them with a proper draft. The order is deliberate: if anything goes wrong between the two phases, the PR still exists and the user can rerun `describing-prs` to fix the description. The previous design drafted first and created second, which meant a turn that ended after drafting left the user with no PR at all.

## Phase 1: Pre-flight checks

Get the branch name:
```bash
git branch --show-current
```

Run these in parallel as three separate Bash tool calls:
```bash
git status
```
```bash
gh repo view --json defaultBranchRef,isFork,parent,owner --jq '{default: .defaultBranchRef.name, isFork, parent: .parent.nameWithOwner, forkOwner: .owner.login}'
```
```bash
gh pr list --head <branch> --json number,url
```

On a fork (`isFork` is `true`), also query the parent:
```bash
gh pr list --repo <parent> --head <forkOwner>:<branch> --json number,url
```

**Resolve the PR base.** Default to the repo default branch. If the user named a different base, use that instead. Use this resolved base in every command below.

**Stop conditions**, check before continuing:
- Current branch equals the resolved base → tell the user to switch to a feature branch.
- Either `gh pr list` call returned a PR → tell the user, surface the PR URL. If they want to rewrite the description, point them at the `describing-prs` skill.
- `git status` shows uncommitted changes → tell the user to commit first.

**Resolve the remote.** If not a fork, use `origin`. If a fork, match `parent.nameWithOwner` against `git remote -v` to find the canonical remote:
```bash
git remote -v
```
Use that remote in place of `origin` below. If no remote matches, suggest `git remote add upstream <parent-url>` and stop.

Fetch so we can confirm there's something to push:
```bash
git fetch <remote> <base>
```

If `git log --format=%H <remote>/<base>..HEAD` is empty, stop. Nothing to open a PR for.

## Phase 2: Open the PR with a bootstrap description

Push the branch:
```bash
git push -u <remote> HEAD
```

Open the PR with `--fill-first`, which uses the first commit's subject and body as a temporary title/body. `describing-prs` will replace both in Phase 3.

```bash
gh pr create --assignee @me --fill-first
```

Add `--draft` if the user asked for a draft. Pass `--base <base>` if the resolved base from Phase 1 isn't the repo default.

On a fork (`isFork` is `true`), `gh pr create` may interactive-prompt for the target repo or default to the fork itself. Make it deterministic by passing `--repo <parent> --head <forkOwner>:<branch>` using the values collected in Phase 1.

Do not ask the user for confirmation before creating. The placeholder is meant to be transient; the user reviews the real description on GitHub.

## Phase 3: Replace the description

Invoke the `describing-prs` skill via the Skill tool. It detects the freshly-opened PR and runs in edit mode, overwriting the bootstrap title and body with a proper draft. Do not draft the title and body inline; the drafting rules and self-review live in `describing-prs` and only apply when it actually runs.

Return the PR URL when done.
