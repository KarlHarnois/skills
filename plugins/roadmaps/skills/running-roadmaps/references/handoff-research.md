# Research handoff

**A research worker tests the manager's hypotheses and NEVER decides.**

## Fill

1. Copy `templates/research.md` to the handoff file, per `SKILL.md` Dispatch.
2. Diagnose the item yourself first: read the code, and reproduce the problem.
3. Write each hypothesis with the result that would disprove it, per `prompt-standards.md`.
4. Plan one stage per later build commit, so that the build can cherry-pick the stages.
5. Write rows that cover each hypothesis, and one row where you expect a hypothesis to fail.
6. Write questions that ask for every site a change touches, with `file:line`.
7. Replace every `<placeholder>`. Delete each template line that does not apply.
