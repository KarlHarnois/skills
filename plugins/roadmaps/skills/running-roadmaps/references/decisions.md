# Decisions

**A decision belongs to the user, and a recorded decision is a settled rule.** `SKILL.md` defines which choices are decisions.

## Bring decisions to the user

1. Number each decision `D<n>`, continuing the numbers in the Decisions section of the state file.
2. If the decisions belong to a spec, a design, or a roadmap item, open the message with a summary of it in at most five sentences.
3. For each decision, write these parts:
   - the question, in one sentence
   - two or three options
   - for each option, a concrete example: what a user of the project writes, and what results
   - the cost of each option
   - your recommendation, with its reason taken from the settled rules or the principles of `AGENTS.md`
4. Put the decisions in one message, in number order, in plain text, per `SKILL.md`.
5. Dispatch the items that the open decisions do not block.

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

## Record an approval

**An approval is a one-time permission the user grants, such as accepting one measured regression or one exception to a settled rule.** An approval is not a decision, and it settles no rule.

1. Add `<what the user allowed>, limited to <the scope>, granted <date>` to the Approvals section of the state file. The scope names the pull request, the head, the entry, or the limit the user gave.
2. Act on the approval only within its scope. If a later change passes the scope, ask the user again.
3. NEVER read an approval as a rule for later items.
