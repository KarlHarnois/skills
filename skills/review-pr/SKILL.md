---
name: review-pr
description: Review a GitHub pull request, or the current branch when there is no PR, and print the review findings in the shell, without posting anything to GitHub. Use this skill whenever the user asks to review a PR, check a pull request, look at or look over code changes, review PR #123, give feedback on a branch or diff, or asks "anything wrong with this PR?", "what do you think of these changes?", or similar, even if they never say "code review". Also use it when they name a focus, like "review PR 12 for security" or "check this PR for N+1 queries".
allowed-tools: Bash(*), Read, Grep, Glob, LS, AskUserQuestion
---

# Review PR Skill

Review the code changes in a pull request (or the current branch, if it has no PR yet) and print the findings in the shell.

Nothing is posted to GitHub: no review comments, no approvals, no PR comments. The user wants to read the findings first and decide for themselves what to say on the PR, so the shell output is the whole deliverable. Posting would create notifications and public comments the user never chose, so do not offer it as a follow-up either.

If the user names a focus (security, performance, a specific file), prioritize that and keep unrelated findings short.

## Review Guidelines

The user may keep personal review guidelines at `~/.config/review-pr/review_guide.md`. This is a file they write and maintain themselves; nothing creates it automatically, so it is fine if it does not exist. If it does:
1. Follow any custom review focus areas
2. Do NOT flag issues matching categories listed under its "Skip These" section

Whether or not the file exists, also look for:

- Bugs, logic errors, and edge cases
- Security vulnerabilities (injection, XSS, auth issues, etc.)
- Performance problems (N+1 queries, unnecessary allocations, etc.)
- Code clarity and maintainability
- Appropriate error handling
- Missing tests for critical paths

## Workflow

### Phase 1: Gather Information

Read diffs and code with git on a local checkout rather than `gh pr diff`. The local checkout lets you use `-U10` for wide context and open the surrounding files, which `gh pr diff` cannot give you. `gh` is only used for read-only lookups: finding the PR, reading its metadata and existing comments, and checking out its branch.

1. **Determine what to review:**

   If a PR number is provided in the prompt, use it directly.

   If no PR number is provided, detect the PR from the current branch:
   ```bash
   BRANCH=$(git branch --show-current)
   gh pr list --head "$BRANCH" --json number,title
   ```
   - If exactly one PR is found, use it.
   - If multiple PRs are found, present them to the user and ask which one to review.
   - If no PRs are found, fall back to **branch mode** (see below).

   **Branch mode:** the user asked for a review, so a missing PR is not a reason to stop. Tell them no open PR was found and that you are reviewing the branch against the repo's default branch instead:
   ```bash
   gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
   ```
   Use that as `<baseRefName>` and skip steps 2, 3, and 5, since there is no PR metadata to read. If the current branch *is* the default branch, review the working tree instead (`git diff HEAD` for changes, plus `git status --porcelain` for untracked files), and if there is nothing to review, say so and stop.

2. **Read the PR metadata in one call:**
   ```bash
   gh pr view <pr-number> --json number,title,body,headRefName,baseRefName
   ```
   The title and body tell you the intent of the change, and the branch names drive the next steps.

3. **Ensure the PR branch is checked out locally:**

   If `git branch --show-current` does not match `headRefName`, check it out:
   ```bash
   gh pr checkout <pr-number>
   ```
   This switches the user's working branch, so check `git status --porcelain` first. If there are uncommitted changes, tell the user and ask before switching, so nothing gets tangled up in a checkout they did not expect.

4. **Compute the merge base and diff:**
   ```bash
   git merge-base origin/<baseRefName> HEAD
   git diff --stat <merge-base>...HEAD
   git diff -U10 <merge-base>...HEAD
   ```
   Check the stat summary before reading the full diff. If total changed lines exceed ~2000:
   - Do NOT read the entire diff at once. Instead, review files individually:
     ```bash
     git diff -U10 <merge-base>...HEAD -- path/to/file.ext
     ```
   - Prioritize files with the most changes, and files in critical paths (auth, security, data handling).
   - Skip generated files (e.g. `*.generated.*`, `*.min.js`), lock files (`package-lock.json`, `yarn.lock`, `Cargo.lock`), and vendored dependencies.

5. **Fetch feedback already on the PR** so you don't repeat it. Feedback can live in three places, so check all three:
   ```bash
   # Inline review comments (attached to a file and line)
   gh api repos/{owner}/{repo}/pulls/<pr-number>/comments --jq '.[] | {path, line, body}'
   # Review summaries and top-level PR comments
   gh pr view <pr-number> --json reviews,comments --jq '{reviews: [.reviews[] | {author: .author.login, body}], comments: [.comments[] | {author: .author.login, body}]}'
   ```
   `gh` fills in `{owner}` and `{repo}` from the current repo. Substitute the PR number yourself. Both calls are read-only.

   Keep these in mind during Phase 2. If an existing comment already covers an issue (same file, same line, same point), skip it.

6. **Get commit messages:**
   ```bash
   git log --format="%H%n%s%n%b%n---" <merge-base>...HEAD
   ```

7. **Read surrounding code** using local files for additional context when needed.

### Line Numbers

Every reported issue references a new-file line number, meaning the line as it exists in the checked-out file, so the user can jump straight to it. The `+c` in a hunk header `@@ -a,b +c,d @@` is the new-file line of the first line in that hunk; count forward through context and `+` lines, skipping `-` lines. When in doubt, confirm with `grep -n` or by reading the file, since it is right there on disk.

### Phase 2: Analyze and Identify Issues

#### Understand intent from commit messages and PR description

Read the commit messages and PR description to understand the motivation, approach, and scope of the change. Use this context to inform your code review. For example, knowing *why* a change was made helps you judge whether the implementation is appropriate and catch cases where the code doesn't match the stated intent.

#### Review code changes

Analyze the diff and categorize issues:

- **Critical**: Must fix before merge (bugs, security issues)
- **Suggestions**: Recommended improvements
- **Nitpicks**: Minor style/preference issues

Keep track of:
- File path
- Line number
- Issue description
- Failure scenario
- Severity level

#### Require a concrete failure scenario

Every finding must name a concrete failure scenario before it makes the list: the specific input, state, or timing that triggers the problem, and the wrong output, crash, or exposure that results. "This could break" is not a scenario. "An empty `items` list makes `total / len(items)` raise `ZeroDivisionError`" is.

For suggestions and nitpicks, where nothing crashes, the scenario is the concrete cost instead: what gets duplicated, what work is wasted, what becomes harder to change, or which guideline is broken.

If you cannot write the scenario, drop the finding. A finding without one is a guess, and the user cannot turn a guess into a review comment.

Be constructive and specific, and explain *why* something is an issue, not just *what*. The user will be turning these findings into their own comments, so the reasoning is what they need most.

### Phase 3: Print the Review

This is the final output. Print it in the shell and stop. There is no selection step and no submission step (see the top of this skill for why).

**Short-circuit for small reviews:** If there are only 1-2 issues, skip the table. Show each issue inline with its details, then the summary block.

**If no issues are found**, skip the table and details and print only the summary block.

For 3+ issues, show ALL issues in a summary table first:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 #  │ Severity │ Location              │ Issue Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1  │ CRITICAL │ auth.rs:45            │ Token expiration not checked
 2  │ SUGGEST  │ auth.rs:23            │ Use constant-time comparison
 3  │ SUGGEST  │ middleware.rs:67      │ Error message reveals user existence
 4  │ NITPICK  │ auth.rs:12            │ Unused import
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then show FULL details of each issue below the table:

```
──────────────────────────────────────────────────────
[1] CRITICAL - auth.rs:45
──────────────────────────────────────────────────────
Token expiration is not being checked, so `claims.exp` is never compared
against the current time.

Failure scenario: a client presents a token issued yesterday with a 1-hour
expiry. `decode_token` succeeds, `claims.exp` is ignored, and the request is
authorized as that user.

Context:
    43│     let token = extract_token(&headers)?;
    44│     let claims = decode_token(&token)?;
  > 45│     Ok(claims.user_id)  // Missing: check claims.exp
    46│ }
──────────────────────────────────────────────────────

[2] SUGGEST - auth.rs:23
...
```

Every detail block includes a `Failure scenario:` line. Order everything by severity (critical first), then by file and line. Use the same numbering in the table and the detail headers so the user can jump from one to the other.

End with the summary block. In branch mode, replace the `PR:` line with `Branch: <branch> vs <base>`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Review Complete

PR: #<number> <title>
Critical issues: X
Suggestions: Y
Nitpicks: Z

[If critical issues > 0]
  ⚠️  Critical issues were found. PR should not be merged until addressed.

[If critical issues == 0]
  ✓ No critical issues found.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Troubleshooting

If the read-only `gh` lookups fail, run `gh auth status` to check authentication before retrying.
