---
name: clean-prose
description: "This skill is the prose standard for instruction text, the prose a model executes: CLAUDE.md, AGENTS.md, and the files they import; SKILL.md files and their reference files; agent definitions; slash commands; and prompts a program sends to a model. Use this skill before writing, editing, or reviewing instruction text, including a one-sentence change. Prose written for people is out of scope: READMEs, documentation, PR descriptions, and commit messages."
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/lint.sh *)
---

# Clean Prose

**A reader MUST be able to tell, from a sentence alone, whether the sentence
binds them and what it makes them do.** The orchestrator and subagents execute
instruction text, and neither can ask what a sentence meant.

## Terms

- The **orchestrator** is the session that talks to the user and dispatches
  subagents.
- A **subagent** is an agent the orchestrator dispatches.
- A **fork** is a subagent that inherits the orchestrator's whole
  conversation.
- An **agent definition** is the file that defines one subagent: its
  frontmatter and its instructions.
- A **reader** is any model that executes instruction text: the orchestrator
  or a subagent.
- The **always-loaded instructions** are `CLAUDE.md`, `AGENTS.md`, and every
  file they import.
- The **host** is the program that runs the orchestrator and its subagents,
  such as Claude Code.

## Scope

**Instruction text is prose a model executes.** This skill applies to:

- the always-loaded instructions
- every `SKILL.md` and every reference file a skill loads
- every agent definition
- every slash command
- every prompt a program sends to a model, such as a prompt string in a
  workflow script or a system prompt in application code; this skill governs
  the prompt's text and not the code around it

**§9 applies the standard to the orchestrator's explanation of its own work
in chat.**

**Prose written for people is out of scope:** READMEs, documentation, PR
descriptions, and commit messages.

## 1. Every sentence has a form

**Each sentence of instruction text MUST take one of five forms.** A sentence
that takes none of them is either rationale, recast per §8, or decoration,
cut.

| Form | Shape |
| --- | --- |
| Command | Do X. |
| Prohibition | Never X. |
| Conditional | If C, do X. / Unless C, do X. |
| Definition | X is Y. |
| Invariant | X is always true. |

- **One rule per sentence.** A sentence carrying two obligations hides the
  second: split it.
- **Condition first.** Write `If C, do X`, never `Do X, in cases where C`. The
  reader needs to know whether the sentence applies before learning what it
  asks.
- **Bind every antecedent.** Replace *this*, *it*, and *that* with the noun
  wherever the referent is not the immediately preceding subject. No reader
  can ask the author what was meant.

## 2. Force is a controlled vocabulary

**State obligation with these words.** Each has one meaning.

| Word | Meaning |
| --- | --- |
| **MUST** / **ALWAYS** | Required. No judgment, no exception. |
| **NEVER** | Prohibited. No exception. |
| **SHOULD** | Recommended. Deviating is permitted and requires a stated reason. |
| **MAY** | Permitted. The reader chooses freely. |
| **PREFER X OVER Y** | X is the default, Y is available, and the sentence that follows says when Y wins. |

**A bare imperative (Command form) carries MUST.** A bare `Never X`
(Prohibition form) carries NEVER. Write the capitalized word when the sentence
would otherwise read as advice.

<!-- vale CleanProse.NoForceWords = NO -->
**NEVER write a word that states no force:** *consider*, *try to*, *it is a
good idea to*, *generally*, *usually*, *where appropriate*, *as needed*. Each
leaves the reader to invent the rule. If the force is conditional, write a
Conditional sentence.
<!-- vale CleanProse.NoForceWords = YES -->

## 3. Branches are exhaustive

**If a rule branches, cover every case or name the default.** An uncovered
case is an instruction to guess, and different readers guess differently.

**If any branch can reach a destructive or unrecoverable action, the default
MUST be `Otherwise, stop and ask the user`.**

## 4. Every action states its failure branch

**An instruction that can fail MUST say what happens when it does.** Choose
one and write it: stop and ask, fall back to a named alternative, or report
and continue. A reader that hits an unhandled failure improvises, and
improvisation at a step whose writes cannot be undone is unrecoverable.

## 5. One concept, one term

**Fix a term and reuse it exactly, in every file.** NEVER vary the wording
for elegance: in instruction text, a synonym reads as a distinction. Define a
load-bearing term once, with a Definition sentence, and reference that
definition rather than restating it.

**A vocabulary is the project's table of fixed terms.** It has one row per
term and three columns: the term, what it means, and its banned synonyms. A
banned synonym NEVER appears in place of its term.

- If the always-loaded instructions name a vocabulary file, read the
  vocabulary file before the edit and use its terms. If the edit introduces a
  load-bearing term, add the term to the vocabulary file in the same change,
  with its banned synonyms: a term used in two files and defined in neither
  becomes a distinction.
- If the named vocabulary file does not exist, report the missing file to the
  user, then define each new load-bearing term with a Definition sentence in
  the file that introduces it.
- Otherwise, define each new load-bearing term with a Definition sentence in
  the file that introduces it.

**A banned synonym MAY appear in two places:**

- inside a code or configuration identifier
- in a quotation that states its ban

## 6. Modular structure, formatted to be scanned

### Decomposition

**Define each rule and each procedure once, as a small named unit, and
compose larger procedures by reference.** A rule stated inside three
procedures is three copies to drift.

- **Order a procedure the way it runs:** preconditions, then steps in
  sequence, then what the procedure guarantees on completion.
- **Keep a procedure's steps at one level of detail.** If a step needs steps
  of its own, make it a named procedure and reference it from the step.
- **A step names every effect it has.** If a step writes, deletes, or sends
  something, the step's text names that action.
- **Split a procedure on its mode.** If a procedure branches on the same
  condition at more than one step, write one procedure per branch and choose
  between them at the top.
- **Reference only what the reader loads.** A file MAY reference the
  always-loaded instructions and the reference files it names. If the file is
  an agent definition, NEVER reference anything §8's table does not list for
  its subagent. If a rule depends on another skill, the rule tells the reader
  to invoke that skill: a reader cannot apply a skill it has not loaded.

### Formatting

**Render the text so the binding sentence is findable without reading the
paragraph:**

- Enumerable rules go in a **table**.
- Sequences go in **numbered steps**.
- A paragraph opens with a **bold rule-head** stating the rule; what follows is
  its detail.
- Reserve flowing paragraphs for recast rationale (§8).
- One section covers one decision. A section that covers three is three
  sections.

**Break a paragraph at its joints.** One paragraph carries one unit of the
argument; where the text turns to the next unit, break. If a paragraph passes
140 words, look for a joint. Length alone NEVER forces a break. NEVER merge
two units to balance length. An enumeration breaks between its items, NEVER
inside one. If an enumeration's items run about a line each, the list stays one
paragraph at any length.

## 7. Economy

**If deleting a sentence changes nothing about the reader's behavior, delete
the sentence.** Apply this test to every sentence you write and every sentence
you edit past.

**NEVER write these into instruction text:**

- **Narrative:** scenarios, anecdotes, incidents.
- **Self-explanation:** a sentence justifying the sentence before it.
- **Throat-clearing:** announcing what the next section will do.
- **Qualification longer than the rule it qualifies.** Name the rare case in
  one clause.

**PREFER tightening the rule OVER adding an example:** a reader copies an
example's surface into the rule. An example wins only when the tightened rule
is still ambiguous; then write a contrasting pair, one case the rule covers and
one it excludes, differing only in the property the rule tests. Data that
parameterizes a rule, such as an enumeration of types, producers, fields,
sentence shapes, or name-shapes, is specification, not example.

## 8. What must survive

Guarding rationale and repetition across a delegation boundary read like
waste and are load-bearing. Cutting them is the characteristic failure of a
tightening pass, and it is silent.

**Keep a guard-dependent rule's reason.** A rule is *guard-dependent* if
someone editing the text without knowing its reason would plausibly revert it.
Place the kept reason directly after the rule, as one clause
(`NEVER X: <reason>`) or one sentence. Cut every other reason. Cut the story
behind every reason: the history, the incident, the alternatives weighed.

**Duplication is a defect only within a single context.** A rule restated in
an agent definition or in the prompt a subagent is sent is a duplicate if the
subagent also loads the rule's source, and necessary otherwise. A subagent
loads:

| Subagent | Loads |
| --- | --- |
| a fork | everything the orchestrator has loaded |
| every other subagent | its agent definition, the prompt it is sent, every skill its agent definition lists in its `skills` field, every reference file it reads in the run, and the always-loaded instructions unless its agent definition sets `omitClaudeMd: true` |

## 9. Chat register

**This section governs procedural explanation:** what the orchestrator is
doing and why. It does NOT govern the substance of an answer. If the host's
own chat guidance fixes a format, keep the order below inside that format.

**The orchestrator's explanation of its own work MUST carry the structure of
the instruction it is following.** The user MUST be able to tell which rule
produced an action without opening the rule.

**State the trigger, then the rule, then the action, in that order.** NEVER
state an action first and its reason afterwards.

**Mirror the form of the instruction being followed:**

| Instruction form | Explanation shape |
| --- | --- |
| Command | "\<rule\> requires X. Doing X." |
| Prohibition | "X is prohibited by \<rule\>. Doing Y instead." |
| Conditional | "C holds, so X follows." / "C does not hold, so X does not apply." |
| Definition | "This is a Y, because \<criterion\>." |
| Invariant | "X holds always, so Y." |

**Name the branch not taken.** If a rule branches, say which branch did not
apply and why. The user cannot audit a choice whose alternatives are invisible.

**If an action fails, name the failure branch the instruction specifies.**
NEVER improvise a recovery silently.

**Mark judgment as judgment.** If no rule governs a choice, say so: "No rule
covers this; choosing X because Y." NEVER present a preference as a
requirement. NEVER present a requirement as a preference.

**If a recommendation reverses an earlier one, name what changed:** the rule,
the measurement, or the fact. A reversal with no stated cause is
indistinguishable from noise.

<!-- vale CleanProse.Narrative = NO -->
**NEVER narrate an action without citing its reason**, as in *Let me go ahead
and…*, *I'll just…*, or *Now I'll…*.
<!-- vale CleanProse.Narrative = YES -->

## 10. Priority

**Weight a finding by how often its text loads.** The always-loaded
instructions, every skill `description`, and every agent `description` load in
every session; a skill body loads only when the skill is invoked. Fix the text
that loads in every session first.

**Within a file, rank by consequence:** an unstated failure branch or an
uncovered case outranks a wordy sentence, because the first two change what
the reader does and the third only costs tokens.

## 11. How to change instruction text

**State every proposed change as replacement text, never as a verdict.**
"These 40 words say what these 12 do" is actionable; "this section is
verbose" is not.

**Edit one file per change.** Read the result whole.

## 12. A rule covers a defect class

**A defect class is the property of an input that produces a failure, stated
without naming the input.** An input is what an instruction acts on: a file, a
record, a request, a pull request. **A special case is a rule, a branch, a
constant, or a table entry that only one input, or only the inputs of one
run, can meet.** NEVER write a special case into instruction text: inputs vary
without limit, and a rule fitted to one input breaks on the next.

- If a reader misjudged one input, state the defect class, then find the
  sentence that permitted the misjudgment: an uncovered case, an undefined
  force, or an undefined term. Restate that sentence. NEVER append a sentence
  for the input.
- If the defect class cannot be stated, or the only edit that covers the
  input is a special case, leave the instruction text unchanged and report
  the input to the user.
- NEVER name an input in a rule, and NEVER describe one so closely that only
  that input fits. Data that parameterizes a rule is specification (§7).
- PREFER restating the rule that governs the decision OVER adding a rule
  beside it. The added rule wins only when no existing rule governs the
  decision.
- If a rule carries more than two exceptions, or a list in it gains one entry
  per failure, restate the rule so that it covers them.

## 13. Lint the edited file

**The linter is `scripts/lint.sh`, which runs a pinned build of Vale with the
CleanProse style in this skill's `vale/` directory.** An **alert** is one line
of the linter's output, in the form `file:line:column:level:rule:message`. An
alert's message cites the section of this standard that the alert enforces.

**After each edit to a Markdown file, run these steps:**

1. Run the linter on the file's absolute path:

   ```sh
   ${CLAUDE_SKILL_DIR}/scripts/lint.sh <absolute path>
   ```

2. Act on the linter's exit code, per the exit code table.
3. Review the file against §1 to §12 by reading it. A run with no alerts does
   not clear the file: the linter matches words and sentence patterns, not
   meaning.

**If the edited file is not Markdown, skip steps 1 and 2.**

**Act on the exit code:**

| Exit code | Meaning | Action |
| --- | --- | --- |
| 0 or 1 | The linter ran. Code 1 means at least one `error` alert. | Handle each alert by its level, per the alert table. |
| 2 | Vale failed, for example on invalid YAML front matter. | Report Vale's error message to the user. |
| 3 | nix is not installed. | Tell the user the linter needs nix. |
| 4 | The path does not exist. | Rerun step 1 with the edited file's absolute path. |
| 5 | nix could not build Vale. | Report the error message to the user. |

**Handle each alert by its level:**

| Level | Action |
| --- | --- |
| `error` | Restate the flagged text so it meets the cited section. |
| `warning` or `suggestion` | Read the cited section. If its rule holds for the flagged text, restate the text. Otherwise, leave the text. |

**NEVER swap in a synonym to clear an alert:** the synonym breaks the same
rule and hides the break from the linter.

**NEVER cut a reason §8 keeps to clear an alert:** the linter cannot tell a
kept reason from self-explanation.
