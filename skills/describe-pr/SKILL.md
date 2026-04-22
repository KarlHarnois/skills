---
name: describe-pr
description: Draft or rewrite a GitHub pull request title and body for the current branch. Use this skill whenever the user asks to write, generate, update, rewrite, edit, or regenerate a PR description, with phrasings like "describe this PR", "write the PR body", "update the PR description", "rewrite the description", or "fix up the PR body". If a PR already exists for the branch, the skill applies the new description via `gh pr edit`. Otherwise, it returns the draft to the caller (typically the `create-pr` skill). Enforces a terse, bird's-eye-view style over diff enumeration.
allowed-tools: Bash(gh *), Bash(git *), Read, Grep, Glob
---

# Describe PR Skill

This skill produces the title and body for a pull request. It runs in one of two modes depending on whether a PR already exists for the current branch:

- **Edit mode**: a PR exists. The skill rewrites the description and applies it via `gh pr edit`.
- **Draft mode**: no PR yet. The skill returns the draft to the caller (often the `create-pr` skill) without touching GitHub.

## Phase 1: Detect mode and resolve base

Get the current branch and repo info:
```bash
git branch --show-current
```
```bash
gh repo view --json defaultBranchRef,isFork,parent,owner --jq '{default: .defaultBranchRef.name, isFork, parent: .parent.nameWithOwner, forkOwner: .owner.login}'
```

Check for an existing PR on this branch:
```bash
gh pr list --head <branch> --json number,url,baseRefName
```

On a fork (`isFork` is `true`), also check the parent:
```bash
gh pr list --repo <parent> --head <forkOwner>:<branch> --json number,url,baseRefName
```

**Pick the mode:**
- Either query returned a PR → **edit mode**. Use the PR's `baseRefName` as the base. Fetch the current title and body so you can carry forward any content a human has added (ticket links, reviewer notes, context the diff doesn't reveal):
  ```bash
  gh pr view <number> --json title,body
  ```
  On a fork, add `--repo <parent>`.
- No PR → **draft mode**. Use the repo default branch as the base, unless the user specified another.

**Resolve the remote.** If not a fork, use `origin`. If a fork, match `parent.nameWithOwner` against `git remote -v` to find the canonical remote:
```bash
git remote -v
```
Use that remote in place of `origin` below. If no remote matches, suggest `git remote add upstream <parent-url>` and stop.

## Phase 2: Read the change

```bash
git fetch <remote> <base>
git log --format="%H%n%s%n%b%n---" <remote>/<base>..HEAD
```

If `git log` is empty, stop. There's nothing to describe.

Check the diff size:
```bash
git diff <remote>/<base>...HEAD --stat
```

If ≤2000 changed lines, read the full diff:
```bash
git diff <remote>/<base>...HEAD
```

Otherwise read per file, prioritizing the largest changes:
```bash
git diff <remote>/<base>...HEAD -- path/to/file
```

## Phase 3: Draft

1. **Check for a PR template** using the Glob tool (not `ls` or other shell commands). GitHub accepts the template at any of these paths, so glob for all of them in one call:
   - `.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE.md`
   - `docs/pull_request_template.md` or `docs/PULL_REQUEST_TEMPLATE.md`
   - `pull_request_template.md` or `PULL_REQUEST_TEMPLATE.md` at the repo root
   - Any `*.md` inside `.github/PULL_REQUEST_TEMPLATE/` (multi-template repos, pick the one that fits or ask the user)

   If found, read it and use its section headers, filling each one. For sections that don't apply, put plain `N/A`.

2. **Draft the title**: imperative, capitalized, ≤72 chars. Derived from the overall change, not the latest commit message.

3. **Draft the body**: the reader can see the diff. What they cannot see is the *shape* of the change and *why it matters*. Describe that, nothing more.

   **Rules:**
   - Favor natural language and a high-level summary. Each section is one or two sentences, like a standup update. Describe what the change means for the system, not what code moved.
   - No low-level implementation notes. Don't write things like "added a test for X", "refactored the Y class", "extracted a helper", or "renamed the Z field". The reader sees that in the diff.
   - Under 150 words for the entire body. When in doubt, cut.
   - Lead with what changed and why.
   - Bullets only for genuinely parallel items (two causes, two failure modes). Never for files, methods, or tests. Default to prose.
   - Backticks around code identifiers.
   - No em dashes.
   - No `Co-Authored-By` footers.
   - No emojis unless the template uses them.

   **Target length and tone:**
   ```
   ## Summary
   Fixed a bug where `invoice_totals` returned different tax amounts depending on whether an invoice was rendered as a PDF or sent by email.

   ## Changes
   Both rendering paths now go through a shared `resolve_invoice_tax` helper that snapshots the rate at send time.

   ## Testing
   Reran the known-bad invoices against prod. PDF and email totals now match for every invoice rendered in the last 30 days.

   ## Launch plan
   Run the `tax_backfill` job on staging and production after merge to refresh historical invoices.
   ```

   If no template exists, use:
   ```
   ## Summary
   <1-3 sentences, bird's-eye view>

   ## Test plan
   - [ ] <item>
   - [ ] <item>
   ```
   For trivial changes, `## Test plan` can be `N/A`.

4. **Self-review before continuing.** Reread the title and body against every rule above. These rules are violated often when drafted in a single pass, so this step is not optional. Fix any violation before moving on.

## Phase 4: Apply or return

**Edit mode**: apply the new description without asking for confirmation. The user prefers to iterate on GitHub rather than in chat.

```bash
gh pr edit <number> --title "<title>" --body "$(cat <<'EOF'
<body>
EOF
)"
```

On a fork, add `--repo <parent>`. Do not escape backticks, dollar signs, or quotes inside the body. The single-quoted `'EOF'` handles them. Return the PR URL.

**Draft mode**: present the title and body to the caller and stop. If `create-pr` invoked this skill, control returns there with the draft in hand. If the user invoked `describe-pr` directly and no PR exists, show them the draft and note that `create-pr` will open the PR when they're ready.
