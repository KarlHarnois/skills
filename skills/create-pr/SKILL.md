---
name: create-pr
description: Create a GitHub pull request with a brief, high-level description. Use this skill when the user asks to create a PR, open a pull request, push a PR up, or anything involving authoring a new pull request on GitHub. The skill enforces a terse writing style that gives a bird's-eye view of the change rather than enumerating every diff.
allowed-tools: Bash(gh *), Bash(git *), Read, Grep, Glob, AskUserQuestion
---

# Create PR Skill

Create a GitHub pull request with a short, high-signal description.

## Phase 1: Gather state

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

**Stop conditions** — check before continuing:
- Current branch equals the resolved base → tell the user to switch to a feature branch.
- Either `gh pr list` call returned a PR → tell the user, surface the PR URL.
- `git status` shows uncommitted changes → tell the user to commit first.

**Resolve the remote.** If not a fork, use `origin`. If a fork, match `parent.nameWithOwner` against `git remote -v` to find the canonical remote:
```bash
git remote -v
```
Use that remote in place of `origin` below. If no remote matches, suggest `git remote add upstream <parent-url>` and stop.

Fetch and log:
```bash
git fetch <remote> <base>
git log --format="%H%n%s%n%b%n---" <remote>/<base>..HEAD
```

If `git log` is empty, stop. Nothing to open a PR for.

Check the diff size:
```bash
git diff <remote>/<base>...HEAD --stat
```

If ≤2000 changed lines, read the full diff:
```bash
git diff <remote>/<base>...HEAD
```

Otherwise, read per file, prioritizing the largest changes:
```bash
git diff <remote>/<base>...HEAD -- path/to/file
```

## Phase 2: Draft

The reader can see the diff. What they cannot see is the *shape* of the change and *why it matters*. Describe that, nothing more.

**Rules:**
- Under 150 words. Keep it short and scannable. When in doubt, cut.
- Lead with what changed and why. Plain language, no dramatization.
- Prefer outcome and scope over implementation inventory. The diff has the details.
- Skip tests you added. The diff has them.
- Bullets only for parallel items (two causes, two failure modes). Never for files, methods, or tests.
- Title: imperative, capitalized, ≤72 characters. Backticks around code identifiers.
- No em dashes. No `Co-Authored-By` footers. No emojis unless the template uses them.

**Target length and tone:**

```
## Summary
`invoice_totals` produced different tax amounts for the same order across our two rendering paths:
- PDF export used the order's creation-time tax rate, so rates fixed months later weren't picked up.
- Email receipts recomputed tax from the current rate table on every send, so a sent-and-paid invoice could show a new total if the rate later changed.

## Changes
Both paths now read tax from a new shared `resolve_invoice_tax` helper, which snapshots the per-line-item rate at send time and falls back to the order-level rate for legacy rows.

## Testing
Verified against prod for the known-bad invoices. Every invoice rendered in the last 30 days now produces matching PDF and email totals.

## Launch plan
After merge, run the `tax_backfill` job on staging and production. The invoice cache is per-template, so without a backfill historical invoices render with the old totals.
```

**Steps:**

1. **Check for a PR template**: GitHub accepts the template at any of these paths, so check all of them:
   - `.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE.md`
   - `docs/pull_request_template.md` or `docs/PULL_REQUEST_TEMPLATE.md`
   - `pull_request_template.md` or `PULL_REQUEST_TEMPLATE.md` at the repo root
   - Any `*.md` inside `.github/PULL_REQUEST_TEMPLATE/` (multi-template repos, pick the one that fits or ask the user)

   If found, use its section headers verbatim and fill each one with real content. Drop any HTML-comment placeholders (`<!-- describe your changes -->`, `<!-- link related issues -->`, etc.) rather than copying them into the final body. Preserve non-placeholder scaffolding the template ships with: checkbox lists (`- [ ] Tests added`, `- [ ] Docs updated`), static reviewer notes, and similar structural content stay in the body. Tick the boxes that apply, leave the rest unchecked, but don't delete them. For sections that don't apply, put plain `N/A` (no italics, no explanation).

2. **Draft the title**: imperative, capitalized, ≤72 chars. Derived from the overall change, not the latest commit message.

3. **Synthesize from commits and diff together**: use commit subjects and bodies to draft the framing. They carry intent and the natural shape of the change. Then skim the diff to sanity-check that the description matches reality and to catch anything the commits downplayed or omitted. Don't rely on commits alone (WIP or squashed commits can lie) or the diff alone (you'll drift into restating it).

4. **Draft the body**: follow the rules above. If no template exists, use:
   ```
   ## Summary
   <1-3 sentences, bird's-eye view>

   ## Test plan
   - [ ] <item>
   - [ ] <item>
   ```
   For trivial changes (docs, one-line fixes), `## Test plan` can be plain `N/A` (no bullet, no italics, no explanation), matching the empty-section form used in the template path.

5. **Submit without asking for confirmation.** Proceed directly to Phase 3. The user prefers to edit the PR on GitHub after the fact rather than iterate on the draft in chat.

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

Do not backslash-escape backticks, dollar signs, or quotes inside the body. The single-quoted `'EOF'` delimiter already disables shell expansion, so any escape characters pass through literally and show up as visible backslashes in the rendered PR.

Add `--draft` if the user asked for a draft. Pass `--base <base>` if the resolved base from Phase 1 isn't the repo default.

On a fork (`isFork` is `true`), `gh pr create` may interactive-prompt for the target repo or default to the fork itself. Make it deterministic by passing `--repo <parent> --head <forkOwner>:<branch>` using the values collected in Phase 1.

Return the PR URL.
