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
- Use bullets for parallel items that share a logical role (two root causes, two failure modes, two affected subsystems). Prose flattens that parallel structure, but a bulleted list preserves it. Don't use bullets to enumerate files, methods, or diff steps.
- If a section covers two distinct ideas, for example a mechanism change and the test that locks it in, break them into separate paragraphs so a reader can skim.
- Write every section at the level a teammate would explain it in one breath at standup, including Launch plan and Testing, not just Summary. Prefer the concrete word to jargon or metaphor. Say "the table only rewrites recent rows on each run" instead of "the incremental predicate doesn't watch the resolver's lineage." Not "added method X to class Y, updated Z to call it, fixed typo in W." Instead: "Cache the expensive lookup on the request object so downstream middleware doesn't re-fetch it."
- Skip minor surrounding fixes, refactors, import reshuffles, formatting, and renames unless they are the point of the PR.
- Skip implementation details the reader doesn't need to evaluate the change. Don't name every file or function.
- Lead with *what changed* and *why*, in plain language. No corporate phrasing, no marketing voice, no "This PR..." preamble.
- Wrap code identifiers (column names, table names, variable names, CLI commands, file paths) in backticks.
- Imperative mood in the title. Capitalized first letter. Max 72 characters.
- Never use em dashes to join or interrupt clauses. Use periods or commas instead.
- Never add `Co-Authored-By` lines or any generated-by footer to the body.
- No emojis in the title or body unless the user asks or the PR template already uses them.

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

Good (parallel structure kept as bullets):
```
## Summary
Wholesale and owned-channel arms of the dim returned different names for the same SKU, for two different reasons:
- Wholesale picked archived Shopify variants, so test products labeled real revenue.
- Owned-channel joined names per order line, so a SKU fanned out every time a variant was renamed.
Both arms now resolve from a single per-SKU canonical name model.
```

## Workflow

### Phase 1: Gather state

First get the branch name:
```bash
git branch --show-current
```

Then run these in parallel, substituting the branch name into `gh pr list`. Issue them as three separate Bash tool calls in the same turn so they actually run concurrently. Putting them in one block would just run them sequentially in a single shell.
```bash
git status
```
```bash
gh repo view --json defaultBranchRef,isFork,parent,owner --jq '{default: .defaultBranchRef.name, isFork, parent: .parent.nameWithOwner, forkOwner: .owner.login}'
```
```bash
gh pr list --head <branch> --json number,url
```

On a fork, `gh pr list` queries the current repo, so a PR opened cross-fork against the canonical repo won't show up. If `isFork` from the repo view above is `true`, also query the parent. Substitute `<parent>` (already in `owner/repo` form) and `<forkOwner>` from the repo view into:
```bash
gh pr list --repo <parent> --head <forkOwner>:<branch> --json number,url
```

**Resolve the PR base.** Default to the repo default branch from the `gh repo view` output. If the user's prompt named a different base ("open a PR against `release-1.5`", "PR into `develop`"), use that instead. Use this resolved base in every command below. Fetching, logging, and diffing against the wrong base would draft a description that enumerates commits already on the actual base and omits commits the PR will actually contain.

If the current branch equals the resolved base, stop and tell the user to switch to a feature branch first. Otherwise the workflow will fetch and diff for nothing, then fail confusingly at `gh pr create` (which refuses base==head).

If either `gh pr list` call (the current-repo query, or the cross-fork query against the parent on a fork) returns a non-empty array, an open PR already exists for this branch. Stop and tell the user, surfacing the PR number and URL from the JSON output so they can jump straight to it. They likely want to update, not re-create. Do not continue to the fetch/diff work below.

If `git status` shows any modified, staged, or untracked files, stop and tell the user to commit first. Do not auto-commit, and do not continue to the fetch/diff work below.

Pick the remote that tracks the PR base. If `isFork` is `false`, use `origin`. If `isFork` is `true`, `origin` points at the fork and would lag the actual base, so look up the canonical remote (commonly `upstream`) by matching `parent.nameWithOwner` against `git remote -v`:
```bash
git remote -v
```
Pick the remote whose URL matches the `parent` value. Use that remote name in place of `origin` for every command in the rest of this phase. If no remote matches the parent, tell the user the canonical remote isn't configured locally and suggest `git remote add upstream <parent-url>` (the URL is `https://github.com/<parent>.git` or the SSH equivalent), then stop so they can add it and re-run.

Then refresh the remote-tracking ref so the comparison is against the current remote tip, not a stale local copy:
```bash
git fetch <remote> <base>
git log --format="%H%n%s%n%b%n---" <remote>/<base>..HEAD
```

If the `git log` output is empty, stop and tell the user there is nothing to open a PR for. Do not continue to the diff work below.

Then check the diff size:
```bash
git diff <remote>/<base>...HEAD --stat
```

If ≤2000 changed lines, read the full diff:
```bash
git diff <remote>/<base>...HEAD
```

Otherwise, read the diff per file, prioritizing the largest changes and files in critical paths:
```bash
git diff <remote>/<base>...HEAD -- path/to/file
```

### Phase 2: Draft

1. **Check for a PR template**: GitHub accepts the template at any of these paths, so check all of them:
   - `.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE.md`
   - `docs/pull_request_template.md` or `docs/PULL_REQUEST_TEMPLATE.md`
   - `pull_request_template.md` or `PULL_REQUEST_TEMPLATE.md` at the repo root
   - Any `*.md` inside `.github/PULL_REQUEST_TEMPLATE/` (multi-template repos, pick the one that fits or ask the user)

   If found, use its section headers verbatim and fill each one with real content. Drop any HTML-comment placeholders (`<!-- describe your changes -->`, `<!-- link related issues -->`, etc.) rather than copying them into the final body. Preserve non-placeholder scaffolding the template ships with: checkbox lists (`- [ ] Tests added`, `- [ ] Docs updated`), static reviewer notes, and similar structural content stay in the body. Tick the boxes that apply, leave the rest unchecked, but don't delete them. For sections that don't apply, put plain `N/A` (no italics, no explanation).

2. **Draft the title**: imperative, capitalized, ≤72 chars. Derived from the overall change, not the latest commit message.

3. **Synthesize from commits and diff together**: use commit subjects and bodies to draft the framing. They carry intent and the natural shape of the change. Then skim the diff to sanity-check that the description matches reality and to catch anything the commits downplayed or omitted. Don't rely on commits alone (WIP or squashed commits can lie) or the diff alone (you'll drift into restating it).

4. **Draft the body**: follow the Writing Style rules above. If no template exists, use:
   ```
   ## Summary
   <1-3 sentences, bird's-eye view>

   ## Test plan
   - [ ] <item>
   - [ ] <item>
   ```
   For trivial changes (docs, one-line fixes), `## Test plan` can be plain `N/A` (no bullet, no italics, no explanation), matching the empty-section form used in the template path.

5. **Submit without asking for confirmation.** Proceed directly to Phase 3. The user prefers to edit the PR on GitHub after the fact rather than iterate on the draft in chat.

### Phase 3: Submit

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
