---
name: create-pr
description: Create a GitHub pull request with a brief, high-level description. Use this skill when the user asks to create a PR, open a pull request, push a PR up, or anything involving authoring a new pull request on GitHub. The skill enforces a terse writing style that gives a bird's-eye view of the change rather than enumerating every diff.
allowed-tools: Bash(gh *), Bash(git *), Read, Grep, Glob, AskUserQuestion
---

# Create PR Skill

Create a GitHub pull request with a short, high-signal description.

## Writing Style (the whole point)

The default failure mode is a PR description that restates the diff as a bullet list. Do not do that. The reader can see the diff. What they cannot see is the *shape* of the change and *why it matters*.

**Rules:**
- Keep the description short. A few sentences is usually enough. Long PRs get a few sentences plus a short bullet list of the main moving parts, nothing more.
- Describe the change at the level a teammate would explain it in one breath at standup. Not "added method X to class Y, updated Z to call it, fixed typo in W." Instead: "Cache the expensive lookup on the request object so downstream middleware doesn't re-fetch it."
- Skip minor surrounding fixes, refactors, import reshuffles, formatting, and renames unless they are the point of the PR.
- Skip implementation details the reader doesn't need to evaluate the change. Don't name every file or function.
- Lead with *what changed* and *why*, in plain language. No corporate phrasing, no marketing voice, no "This PR..." preamble.
- Wrap code identifiers (column names, table names, variable names, CLI commands, file paths) in backticks.
- Imperative mood in the title. Capitalized first letter. Max 72 characters.

**Good vs bad:**

Bad (restates the diff):
```
## Summary
- Added `getUserCache` method to `UserService`
- Updated `AuthMiddleware` to call `getUserCache` instead of `fetchUser`
- Added unit tests for `getUserCache`
- Fixed a typo in `user.ts`
- Renamed `tmp` to `cached` in `user.ts`
```

Good (bird's-eye view):
```
## Summary
Cache the user lookup on the request so auth and downstream middleware share one fetch instead of two.
```

Bad (bullet list of files):
```
## Summary
- Changes in `billing.py`
- Changes in `invoice.py`
- Changes in `tests/test_billing.py`
```

Good:
```
## Summary
Charge tax on invoice line items instead of invoice totals, so mixed-rate orders come out right. Previously all lines were taxed at the order's first line's rate.
```

## Workflow

### Phase 1: Gather state

Run these in parallel:
```bash
git status
git branch --show-current
gh repo view --json defaultBranchRef,nameWithOwner --jq '{default: .defaultBranchRef.name, repo: .nameWithOwner}'
gh pr list --head "$(git branch --show-current)" --json number,url
```

If the current branch equals the repo's default branch, stop and tell the user to switch to a feature branch first. Otherwise the workflow will fetch and diff for nothing, then fail confusingly at `gh pr create` (which refuses base==head).

If `gh pr list` returns a non-empty array, an open PR already exists for this branch. Stop and tell the user, surfacing the PR number and URL from the JSON output so they can jump straight to it. They likely want to update, not re-create. Do not continue to the fetch/diff work below.

Then refresh the remote-tracking ref so the comparison is against the current remote tip, not a stale local copy:
```bash
git fetch origin <default>
git log --format="%H%n%s%n%b%n---" origin/<default>..HEAD
git diff origin/<default>...HEAD --stat
```

Check the stat total. If ≤2000 changed lines, read the full diff:
```bash
git diff origin/<default>...HEAD
```

Otherwise, read the diff per file, prioritizing the largest changes and files in critical paths:
```bash
git diff origin/<default>...HEAD -- path/to/file
```

### Phase 2: Preconditions

- **Uncommitted changes**: stop and tell the user to commit first. Do not auto-commit.
- **No commits ahead of base**: if the `git log origin/<default>..HEAD` output from Phase 1 is empty, stop and tell the user there is nothing to open a PR for.
- **Branch not pushed**: note it, push in Phase 4 with `-u`.

### Phase 3: Draft

1. **Check for a PR template**: GitHub accepts the template at any of these paths, so check all of them:
   - `.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE.md`
   - `docs/pull_request_template.md` or `docs/PULL_REQUEST_TEMPLATE.md`
   - `pull_request_template.md` or `PULL_REQUEST_TEMPLATE.md` at the repo root
   - Any `*.md` inside `.github/PULL_REQUEST_TEMPLATE/` (multi-template repos, pick the one that fits or ask the user)

   If found, use its section headers verbatim and fill each one with real content. Drop any HTML-comment placeholders (`<!-- describe your changes -->`, `<!-- link related issues -->`, etc.) rather than copying them into the final body. For sections that don't apply, put plain `N/A` (no italics, no explanation).

2. **Draft the title**: imperative, capitalized, ≤72 chars. Derived from the overall change, not the latest commit message.

3. **Synthesize from commits and diff together**: use commit subjects and bodies to draft the framing. They carry intent and the natural shape of the change. Then skim the diff to sanity-check that the description matches reality and to catch anything the commits downplayed or omitted. Don't rely on commits alone (WIP or squashed commits can lie) or the diff alone (you'll drift into restating it).

4. **Draft the body**: follow the Writing Style rules above. If no template exists, use:
   ```
   ## Summary
   <1-3 sentences, bird's-eye view>

   ## Test plan
   <bulleted checklist>
   ```
   For trivial changes (docs, one-line fixes), `## Test plan` can be `- N/A`.

5. **Submit without asking for confirmation.** Proceed directly to Phase 4. The user prefers to edit the PR on GitHub after the fact rather than iterate on the draft in chat.

### Phase 4: Submit

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

Add `--draft` if the user asked for a draft. Add `--base <branch>` only if the base is not the repo default.

Return the PR URL.

## Important Notes

- Never add `Co-Authored-By` lines or any generated-by footer.
- Never include emojis in the title or body unless the user asks or the PR template already uses them.
- Never use em dashes to join clauses. Use periods or commas.
- Always `--assignee @me`.
- If the user pushes back on the draft ("too long", "too detailed"), cut harder. The target is a description a busy reviewer can read in 10 seconds and know what the PR is about.
