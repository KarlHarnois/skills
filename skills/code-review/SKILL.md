---
name: code-review
description: Review a GitHub pull request and print the review findings in the shell, without posting anything to GitHub. Use this skill whenever the user asks to review a PR, check a pull request, look at or look over code changes, review PR #123, give feedback on a branch or diff, or asks "anything wrong with this PR?", "what do you think of these changes?", or similar, even if they never say "code review". Also use it when they name a focus, like "review PR 12 for security" or "check this PR for N+1 queries".
allowed-tools: Bash(*), Read, Grep, Glob, LS, AskUserQuestion
---

# Code Review Skill

Review the code changes in a pull request and print the findings in the shell.

Nothing is posted to GitHub: no review comments, no approvals, no PR comments. The user wants to read the findings first and decide for themselves what to say on the PR, so the shell output is the whole deliverable. Posting would create notifications and public comments the user never chose, so do not offer it as a follow-up either.

If the user names a focus (security, performance, a specific file), prioritize that and keep unrelated findings short.

## Review Guidelines

First, check for custom review guidelines at `~/.config/code-review/review_guide.md`. If the file exists:
1. Follow any custom review focus areas
2. **Check the "Skip These" section** - do NOT flag issues matching skip categories

If no custom guidelines exist, use these defaults:

- Look for bugs, logic errors, and edge cases
- Identify security vulnerabilities (injection, XSS, auth issues, etc.)
- Check for performance problems (N+1 queries, unnecessary allocations, etc.)
- Evaluate code clarity and maintainability
- Verify error handling is appropriate
- Check for missing tests for critical paths

## Workflow

### Phase 1: Gather Information

Use git directly to read diffs and code, NOT `gh` commands to fetch diffs. `gh` is only used for read-only lookups (finding the PR, reading its metadata, checking out its branch).

1. **Determine the PR to review:**

   If a PR number is provided in the prompt, use it directly.

   If no PR number is provided, detect the PR from the current branch:
   ```bash
   BRANCH=$(git branch --show-current)
   gh pr list --head "$BRANCH" --json number,title,baseRefName
   ```
   - If exactly one PR is found, use it.
   - If multiple PRs are found, present them to the user and ask which one to review.
   - If no PRs are found, tell the user no open PR was found for this branch and stop.

2. **Ensure the PR branch is checked out locally:**

   Check whether the current branch matches the PR's head branch:
   ```bash
   gh pr view <pr-number> --json headRefName --jq '.headRefName'
   ```
   If the current branch (`git branch --show-current`) does not match, check it out:
   ```bash
   gh pr checkout <pr-number>
   ```
   This switches the user's working branch, so check `git status --porcelain` first. If there are uncommitted changes, tell the user and ask before switching, so nothing gets tangled up in a checkout they did not expect.

3. **Get the PR base branch and diff:**

   Get the base branch name if not already known from step 1:
   ```bash
   gh pr view <pr-number> --json baseRefName --jq '.baseRefName'
   ```

   Compute the merge base and diff:
   ```bash
   git merge-base origin/<baseRefName> HEAD
   git diff -U10 <merge-base>...HEAD
   ```

4. **Check diff size before reading the full diff:**
   ```bash
   git diff --stat <merge-base>...HEAD
   ```
   Look at the total line count in the summary line at the bottom. If total changed lines exceed ~2000:
   - Do NOT read the entire diff at once. Instead, review files individually:
     ```bash
     git diff -U10 <merge-base>...HEAD -- path/to/file.ext
     ```
   - Prioritize files with the most changes, and files in critical paths (auth, security, data handling).
   - Skip generated files (e.g. `*.generated.*`, `*.min.js`), lock files (`package-lock.json`, `yarn.lock`, `Cargo.lock`), and vendored dependencies.

5. **Get the PR title and description** to understand intent:
   ```bash
   gh pr view <pr-number> --json title,body
   ```

6. **Get commit messages:**
   ```bash
   git log --format="%H%n%s%n%b%n---" <merge-base>...HEAD
   ```

7. **Fetch existing review comments** so you don't repeat feedback that is already on the PR:
   ```bash
   gh api repos/{owner}/{repo}/pulls/<pr-number>/comments --jq '.[] | {path, line, body}'
   ```
   `gh` fills in `{owner}` and `{repo}` from the current repo. Substitute the PR number yourself. This is a read-only call.

   Keep these in mind during Phase 2. If an existing comment already covers an issue (same file, same line, same point), skip it.

8. **Read surrounding code** using local files for additional context when needed.

### Line Number Mapping from Unified Diffs

Every reported issue must reference a new-file line number so the user can jump straight to it. Here is how to extract them from a unified diff.

Each hunk starts with a header like `@@ -a,b +c,d @@`. The `+c` value is the starting line number in the new file. From there, count forward through lines that exist in the new file: context lines (starting with ` `) and addition lines (starting with `+`). Skip deletion lines (starting with `-`), they do not exist in the new file.

**Example:**

```diff
@@ -10,7 +12,8 @@ fn process(input: &str) {
     let trimmed = input.trim();       // +12 (context)
     let parsed = parse(trimmed);      // +13 (context)
-    let result = old_transform(parsed);
+    let result = new_transform(parsed); // +14 (addition)
+    log::info!("transformed: {result}"); // +15 (addition)
     if result.is_empty() {            // +16 (context)
         return Err("empty");          // +17 (context)
     }                                 // +18 (context)
```

The hunk header says `+12`, so the first context line is line 12. Counting forward through ` ` and `+` lines (skipping the `-` line): 12, 13, 14, 15, 16, 17, 18. To reference `new_transform`, use line 14. To reference the `log::info!` addition, use line 15.

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
- Line number (see "Line Number Mapping from Unified Diffs" above)
- Issue description
- Severity level

### Phase 3: Print the Review

This is the final output. Print it in the shell and stop. There is no selection step and no submission step, because the user decides what to do with the findings after reading them.

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
Token expiration is not being checked. An expired token will still be
accepted, allowing unauthorized access.

Context:
    43│     let token = extract_token(&headers)?;
    44│     let claims = decode_token(&token)?;
  > 45│     Ok(claims.user_id)  // Missing: check claims.exp
    46│ }
──────────────────────────────────────────────────────

[2] SUGGEST - auth.rs:23
...
```

Order everything by severity (critical first), then by file and line. Use the same numbering in the table and the detail headers so the user can jump from one to the other.

End with the summary block:

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

## Important Notes

- The review lives in the shell output only. No `gh pr review`, no `gh pr comment`, no `gh api ... -X POST` against the PR, and no offering to do so. The user asked for it this way so they stay in control of what appears on the PR.
- Use `gh auth status` to verify authentication if the read-only `gh` lookups fail
- Line numbers must be mapped from the unified diff hunk headers (see "Line Number Mapping from Unified Diffs")
- Be constructive and specific
- Explain *why* something is an issue, not just *what*
- Review guidelines at `~/.config/code-review/review_guide.md` - check "Skip These" section before flagging issues
