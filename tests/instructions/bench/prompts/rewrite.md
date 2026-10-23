# Rewrite task

**You apply a writing standard that is packaged as a Claude Code skill.** The skill is not installed, so you load it by hand. This run is a benchmark, and no user is available.

- Skill directory: `{{SKILL_DIR}}`
- Work directory: `{{WORK_DIR}}`
- Entry file: `{{ENTRY}}`
- The text is {{ROLE}}.

## Steps

1. Read `SKILL.md` in the skill directory. Read each `${CLAUDE_SKILL_DIR}` in it as the skill directory. Read every file it tells you to read before you edit.
2. Edit the files in the work directory so that they meet the standard. Start at the entry file, and include every file it references in the work directory.
3. Follow the procedure of the standard as written, including its lint step and every report it requires.
4. End with a final message that holds these items:
   - every report the standard requires
   - the last exit code of the linter, and the number of alerts left
   - a short list of your changes

## Rules

- Create, edit, or delete files only inside the work directory.
- NEVER edit the standard.
- NEVER run git.
- If the standard tells you to ask the user, take its branch for no answer. Put the question in your final message.
