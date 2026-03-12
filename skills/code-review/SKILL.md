---
name: code-review
description: Review pull requests and submit comments to GitHub. Use this skill when the user asks to review a PR, check a pull request, look at code changes, review PR #123, or anything involving code review of GitHub pull requests, even if they don't explicitly say "code review".
allowed-tools: Bash(gh *), Bash(git *), Read, Grep, Glob, LS, AskUserQuestion
---

# Code Review Skill

Interactively review code changes and submit approved comments to GitHub using `gh` CLI.

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

Use git directly to read diffs and code, NOT `gh` commands to fetch diffs.

1. **Determine the PR to review:**

   If a PR number is provided in the prompt, use it directly.

   If no PR number is provided, detect the PR from the current branch:
   ```bash
   gh pr list --head "$(git branch --show-current)" --json number,title,baseRefName
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

5. **Get PR metadata** (for comment submission):
   ```bash
   gh repo view --json nameWithOwner --jq '.nameWithOwner'
   gh pr view <pr-number> --json title,body,isDraft
   ```
   If the PR is a draft, ask the user whether they still want to submit review comments before proceeding.

6. **Get commit messages:**
   ```bash
   git log --format="%H%n%s%n%b%n---" <merge-base>...HEAD
   ```

7. **Read surrounding code** using local files for additional context when needed.

### Line Number Mapping from Unified Diffs

The GitHub review API `line` field expects new-file line numbers. Here is how to extract them from a unified diff.

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

The hunk header says `+12`, so the first context line is line 12. Counting forward through ` ` and `+` lines (skipping the `-` line): 12, 13, 14, 15, 16, 17, 18. To comment on `new_transform`, use `line: 14`. To comment on the `log::info!` addition, use `line: 15`.

### Phase 2: Analyze and Identify Issues

If no issues are found after analysis, skip directly to Phase 6 and offer approval.

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

When composing comment bodies for submission, prefix each with its severity so reviewers on GitHub can see it at a glance: `**Critical:** ...`, `**Suggestion:** ...`, `**Nitpick:** ...`.

### Phase 3: Present All Issues At Once

**Short-circuit for small reviews:** If there are only 1-2 issues, skip the table and selection menu. Show each issue inline with its details and ask "Submit these comments? (y/n)". Jump to Phase 5 if yes, Phase 6 if no.

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

### Phase 4: Batch Selection

After showing all issues, prompt for batch action:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Which comments to submit?

  a = all          Submit all comments
  c = critical     Submit only CRITICAL issues
  n = none         Skip all, proceed to summary
  1,2,4 or 1-3     Select specific numbers
  q = quit         Cancel review

Your choice:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Parse user input:
- `a` or `all`: Submit every comment
- `c` or `critical`: Submit only CRITICAL severity
- `n` or `none`: Don't submit any, proceed to summary
- Numbers like `1,2,4` or `1-3,5`: Submit selected issues
- `q` or `quit`: Cancel the entire review

### Phase 5: Submit Selected Comments

Submit all selected comments in a single review to avoid spamming the PR with individual notifications.

Build a JSON payload file and submit it in one API call. Using a temp file avoids shell escaping issues with quotes and special characters in comment bodies.

```bash
cat > /tmp/review_payload.json << 'REVIEW_JSON'
{
  "event": "COMMENT",
  "body": "",
  "commit_id": "<HEAD commit SHA>",
  "comments": [
    {"path":"auth.rs","line":45,"side":"RIGHT","body":"**Critical:** Token expiration is not checked..."},
    {"path":"auth.rs","line":23,"side":"RIGHT","body":"**Suggestion:** Use constant-time comparison..."},
    {"path":"middleware.rs","line":67,"side":"RIGHT","body":"**Suggestion:** Error message reveals user existence..."}
  ]
}
REVIEW_JSON

gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews \
  -X POST \
  --input /tmp/review_payload.json
```

Get the HEAD commit SHA with `git rev-parse HEAD` and substitute it into the payload.

**Important API notes:**
- `commit_id` is required to anchor comments to the correct commit
- `line` values must be integers, not strings
- `line` must be the new-file line number derived from hunk headers (see "Line Number Mapping from Unified Diffs")
- `side` should be `"RIGHT"` for comments on new-file lines
- `path` is relative to the repo root
- The `body` field on the review itself should be empty (the comments carry the content)

If the batch review call fails, fall back to submitting each comment individually:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
  -X POST \
  -f body="[Comment text]" \
  -f commit_id="$(git rev-parse HEAD)" \
  -f path="[file path]" \
  -F line=[line number] \
  -f side="RIGHT" \
  -f subject_type="line"
```

If a single comment also fails (usually a bad line number), fall back to a general PR comment:
```bash
gh pr comment {pr_number} --body "**[file:line]** [Comment text]"
```

Show the result after submission:
```
Submitted 3 comments as a single review.
```

### Phase 6: Final Summary and Approval

Show final summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Review Complete

Comments submitted: X
Comments skipped: Y
Critical issues: Z

[If critical issues > 0]
  ⚠️  Critical issues were found. PR should not be approved until addressed.

[If critical issues == 0]
  ✓ No critical issues found.
  Would you like to approve this PR? (y)es / (n)o
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If user chooses to approve:

```bash
# Approve WITHOUT --body to avoid duplicate comments
gh pr review {pr_number} --approve
```

**DO NOT use `--body` with approve** - comments are submitted separately in Phase 5. Adding `--body` creates a duplicate.

### Phase 7: Learn from Skipped Comments

After the review ends (approved or not), if any comments were skipped, offer to update the user's review guidelines to avoid similar suggestions in future reviews.

1. **Identify skipped comments**: Track which issues the user chose NOT to submit.

2. **Extract categories**: For each skipped comment, determine its abstract category. Don't use the specific code or text - extract the general pattern.

   Examples of category extraction:
   - Skipped: "Unused import `os`" → Category: "unused imports"
   - Skipped: "Consider using `const` instead of `let`" → Category: "const vs let preferences"
   - Skipped: "Add JSDoc comment for this function" → Category: "missing documentation comments"
   - Skipped: "Line exceeds 80 characters" → Category: "line length warnings"
   - Skipped: "Use early return pattern" → Category: "early return style suggestions"

3. **Present categories to user**:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Learn from skipped comments?

   You skipped these types of feedback:
     1. unused imports
     2. missing documentation comments

   Add to your review guidelines to skip in future? (y)es / (n)o
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

4. **Update guidelines file**: If user confirms, update `~/.config/code-review/review_guide.md`:

   - Create the directory and file if they don't exist (`mkdir -p ~/.config/code-review`).
   - If the file already has a "## Skip These" section, append only the new categories under it.
   - If the file has no "## Skip These" section, add one at the end.
   - Deduplicate against existing entries before adding.

5. **Confirm update**:
   ```
   ✓ Updated ~/.config/code-review/review_guide.md
     Added 2 categories to skip list.
   ```

**Important**:
- Only offer this if there were skipped comments
- Extract abstract categories, not specific instances
- Deduplicate categories (if user skipped 3 "unused import" issues, that's one category)
- Check existing skip rules to avoid duplicates

## Important Notes

- **NO `--body` on approve** - comments are submitted separately in Phase 5
- Always confirm the PR number before submitting any comments
- Use `gh auth status` to verify authentication if commands fail
- Line numbers must be mapped from the unified diff hunk headers (see "Line Number Mapping from Unified Diffs")
- Be constructive and specific in comments
- Explain *why* something is an issue, not just *what*
- Review guidelines at `~/.config/code-review/review_guide.md` - check "Skip These" section before flagging issues
