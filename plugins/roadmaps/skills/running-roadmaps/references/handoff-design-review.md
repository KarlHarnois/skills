# Design reviewer handoff

**A design reviewer judges the design of the code that one pull request changes, and changes nothing.** The behavior reviewer tests what the code does. The design reviewer judges how the code is built.

## Fill

1. If `handoffs/design-review-template.md` exists in the state directory, copy it to the handoff file. Otherwise, copy `templates/design-review.md` to the handoff file, and save a copy as `handoffs/design-review-template.md`, per `state-file.md` Project templates.
2. Name the design reviewer session `review-design-<pull request number>`.
3. Quote each settled rule about design, such as the design principles of `AGENTS.md`.
4. Name the file types that the design review covers, from the languages that the settled rules about design govern.
5. Add each design question that the user or a settled rule gave for this project.
6. NEVER add your own opinion of the pull request: an opinion anchors the reviewer.
7. Replace every `<placeholder>`. Delete each template line that does not apply.
