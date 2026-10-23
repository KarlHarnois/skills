# Decisions

**A decision belongs to the user, and a recorded decision is a settled rule.** `SKILL.md` defines which choices are decisions.

## Bring decisions to the user

1. Number each decision `D<n>`, continuing the numbers in the Decisions section of the state file.
2. For each decision, write these parts:
   - the question, in one sentence
   - two or three options
   - for each option, a concrete example: what a user of the project writes, and what results
   - the cost of each option
   - your recommendation, with its reason taken from the settled rules or the principles of `AGENTS.md`
3. Put the decisions in one message, in number order. If a worker runs, ask in plain text, per `SKILL.md`.
4. Dispatch the items that the open decisions do not block.

**NEVER ask the user to choose without a recommendation and an example per option:** the user cannot answer without both.

## Take the answers

- Accept answers per number. The user MAY answer some decisions and leave others open.
- If the user asks about an option's cost or meaning, answer with an example. NEVER repeat the question in the same message.
- If the user leaves a decision open, NEVER ask it again. Record it under NEXT in the state file.
- If the user asks for a better option, give one more option or explain why none exists. If the new option beats your recommendation, recommend the new option. Otherwise, keep your recommendation.

## Record a decision

1. Add `D<n>: <decision>, recorded <date>` to the Decisions section of the state file.
2. Record the decision in the roadmap, per `roadmap-adapters.md`.
3. From then on, quote the decision verbatim in every handoff whose task touches it, per `prompt-standards.md`.
