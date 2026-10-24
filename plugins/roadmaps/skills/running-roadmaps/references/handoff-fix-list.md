# Fix list

**A fix list gives a build worker exact steps after a review or a failed gate.** Send it to the same session, per `SKILL.md` Transport.

## Fill

1. Copy `templates/fix-list.md` to the handoff file, per `SKILL.md` Dispatch.
2. Name what you accept, including each departure of the report that you accept.
3. Write each defect with its file, its reason, and the settled rule or ruling it breaks.
4. Write the steps as exact edits: the file, the function, and the change. If a step rebases, name each conflicting file and which side to keep.
5. Repeat the MUST lines that the fixes touch. Run each one against your own check of the branch first.
6. If the pull request description needs changes, write the new description inline.
7. Number the fix list: the first fix list for a pull request is 1. If this fix list is the third, start a fresh session instead, per `SKILL.md` Session hygiene.
