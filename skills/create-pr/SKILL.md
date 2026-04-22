---
name: create-pr
description: Create a GitHub pull request with a brief, high-level description. Use this skill when the user asks to create a PR, open a pull request, push a PR up, or anything involving authoring a new pull request on GitHub. Delegates the title and body drafting to the `describe-pr` skill.
allowed-tools: Bash(gh *), Bash(git *), Read, Grep, Glob, AskUserQuestion, Skill
---

# Create PR Skill

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
- Either `gh pr list` call returned a PR → tell the user, surface the PR URL. If they want to rewrite the description, point them at the `describe-pr` skill.
- `git status` shows uncommitted changes → tell the user to commit first.

**Resolve the remote.** If not a fork, use `origin`. If a fork, match `parent.nameWithOwner` against `git remote -v` to find the canonical remote:
```bash
git remote -v
```
Use that remote in place of `origin` below. If no remote matches, suggest `git remote add upstream <parent-url>` and stop.

Fetch so the next phase can diff against an up-to-date base:
```bash
git fetch <remote> <base>
```

If `git log --format=%H <remote>/<base>..HEAD` is empty, stop. Nothing to open a PR for.

## Phase 2: Draft title and body

Invoke the `describe-pr` skill via the Skill tool to produce the title and body. Do not draft them inline and do not read `describe-pr`'s SKILL.md to execute its steps yourself. Skill invocation is the single source of truth for drafting rules, and skipping it means its rules silently don't apply.

No PR exists yet for this branch, so `describe-pr` runs in draft mode and returns the title and body to you without touching GitHub. Reuse the branch, repo, base, and remote you already resolved in Phase 1. There's no need to re-run those queries.

## Phase 3: Submit

Push the branch if needed:
```bash
git push -u origin HEAD
```

Create the PR using a HEREDOC for the body:
```bash
gh pr create --assignee @me --title "<title>" --body "$(cat <<'EOF'
<body>
EOF
)"
```

Do not escape backticks, dollar signs, or quotes inside the body. The single-quoted `'EOF'` handles them.

Add `--draft` if the user asked for a draft. Pass `--base <base>` if the resolved base from Phase 1 isn't the repo default.

On a fork (`isFork` is `true`), `gh pr create` may interactive-prompt for the target repo or default to the fork itself. Make it deterministic by passing `--repo <parent> --head <forkOwner>:<branch>` using the values collected in Phase 1.

Submit without asking the user for confirmation. The user prefers to edit on GitHub rather than iterate in chat. Return the PR URL.
