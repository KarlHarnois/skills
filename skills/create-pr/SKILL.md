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
```

Then:
```bash
git log --format="%H%n%s%n%b%n---" origin/<default>..HEAD
git diff origin/<default>...HEAD --stat
git diff origin/<default>...HEAD
```

If the diff is large (>2000 changed lines), read it in chunks by file instead of all at once.

### Phase 2: Preconditions

- **Uncommitted changes**: stop and tell the user to commit first. Do not auto-commit.
- **No commits ahead of base**: stop and tell the user there is nothing to open a PR for.
- **Branch not pushed**: note it, push in Phase 4 with `-u`.
- **Existing PR for this branch**: check with `gh pr list --head "$(git branch --show-current)" --json number,url`. If one exists, tell the user and stop. They likely want to update, not re-create.

### Phase 3: Draft

1. **Check for a PR template**: read `.github/pull_request_template.md` if it exists. Use its sections verbatim. For sections that don't apply, put plain `N/A` (no italics, no explanation).

2. **Draft the title**: imperative, capitalized, ≤72 chars. Derived from the overall change, not the latest commit message.

3. **Draft the body**: follow the Writing Style rules above. If no template exists, use:
   ```
   ## Summary
   <1-3 sentences, bird's-eye view>

   ## Test plan
   <bulleted checklist>
   ```
   For trivial changes (docs, one-line fixes), `## Test plan` can be `- N/A`.

4. **Show the draft to the user** and ask if they want to edit, submit as-is, or submit as draft. Do not submit without confirmation.

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
