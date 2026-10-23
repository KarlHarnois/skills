# Build handoff

**A build worker builds the change one logical commit at a time and opens one pull request.**

## Fill

1. Copy `templates/build.md` to the handoff file, per `SKILL.md` Dispatch.
2. Quote every settled rule and recorded decision the build touches.
3. If a research or design came first, write your answers to its open questions. Name the prototype branch and each prototype commit the build reuses.
4. Split the change into commits. Each commit is one logical change that passes the commit commands alone.
5. Write the MUST lines. Run each MUST line against the prototype, and correct each line that the prototype contradicts, per `prompt-standards.md`.
6. List each existing snapshot or output that MAY change. Every other one MUST stay unchanged.
7. Keep one Start line. If the session did the research or design, keep the second line. Otherwise, keep the first.
8. Replace every `<placeholder>`. Delete each template line that does not apply.
