# Instruction text core

**Each sentence alone MUST tell its reader whether it binds them and what it
makes them do.** A reader follows instruction text with no author to ask what
a sentence meant.

**Apply this file together with the `SKILL.md` of the kind skill.** The **kind
skill** is the skill of the `instructions` plugin whose Scope covers the edited
text. That `SKILL.md` adds the rules for one kind of instruction text, under
the section headings of this file. A section citation covers that section in
both files.

**If the repository instructions set what the text covers, follow them over
this standard.** Report each conflict to the user.

## Terms

- The **orchestrator** is the session that talks to the user.
- The **user** is the person the orchestrator talks to.
- A **reader** is the model or person that follows instruction text.
- The **always-loaded instructions** are `CLAUDE.md`, `AGENTS.md`, and every
  file they import.
- The **repository instructions** are the `CLAUDE.md` and `AGENTS.md` files in
  the text's repository, and every file they import.

## 1. Every sentence has a form

**Each sentence of instruction text MUST take one of five forms.** A sentence
that takes none of them is either a reason, kept or cut per §8, or
decoration, cut.

| Form | Shape |
| --- | --- |
| Command | Do X. |
| Prohibition | Never X. |
| Conditional | If C, do X. / Unless C, do X. |
| Definition | X is Y. |
| Invariant | X is true in every case. |

- **No semicolons.** NEVER write a semicolon: split the clauses into
  sentences, or move the series into a list.
- **Short sentences.** If a sentence passes 20 words, split it at a clause
  boundary or move its series into a list. If a sentence carries more than
  three commas, split its clauses or move its series into a list. If the
  series sits in a table cell, move the series to a list below the table.
- **Condition first.** Write `If C, do X`, NEVER `Do X, in cases where C`. The
  reader needs to know whether the sentence applies before learning what it
  asks.
- **Bind every antecedent.** If the referent of *this*, *it*, or *that* is not
  the immediately preceding subject, replace the pronoun with the noun.

## 2. Force is a controlled vocabulary

**State force with these words.** A **force word** is a word in the Word
column of this table, in any sense and in any case. OVER is a force word only
where it completes PREFER X OVER Y. Each force word has one meaning when it
states force. If `ALWAYS` or `NEVER` only says how often a fact holds, the
word is in its ordinary sense. If a sentence names a force word instead of
using the word, the word is in neither sense. If a force word carries the
meaning its row gives, the word states force in every form. Otherwise, the
word is in its ordinary sense.

| Word | Meaning |
| --- | --- |
| **MUST** / **ALWAYS** | Required. No judgment, no exception. |
| **NEVER** | Prohibited. No exception. |
| **SHOULD** | Recommended. Deviating is permitted and requires a stated reason. |
| **MAY** | Permitted. The reader chooses freely. |
| **PREFER X OVER Y** | X is the default, Y is available, and the sentence that follows says when Y wins. |

**A bare imperative (Command form) carries MUST.** A bare `Never X`
(Prohibition form) carries NEVER. If the sentence would otherwise read as
advice, write the force word.

**NEVER attach a force word to a passive verb.** Name the actor as the
subject: a passive verb hides who acts.

**NEVER write a word that states no force:**

- `consider`
- `try to`
- `it is a good idea to`
- `generally`
- `usually`
- `where appropriate`
- `as needed`

Each listed word leaves the reader to invent the rule. If the force is
conditional, write a Conditional sentence.

## 3. Branches are exhaustive

**If a rule branches, cover every case or name the default.** An uncovered
case is an instruction to guess, and different readers guess differently.

**NEVER write a Latin abbreviation.** An `etc.` leaves a list open, and an
open list is an uncovered case. Replace `etc.` with the full list, or with the
property every item shares. Replace each other Latin abbreviation with its
plain form:

| Abbreviation | Plain form |
| --- | --- |
| `e.g.` | for example |
| `i.e.` | that is |
| `vs.` | versus |

If the table has no row for a Latin abbreviation, write the English words the
abbreviation stands for.

**If any branch can reach a destructive or unrecoverable action, the default
MUST be to stop and ask.**

## 4. Every action states its failure branch

**A failure branch is what an instruction tells the reader to do when the
instruction fails.** A reader that hits an unhandled failure improvises, and
improvisation at a step whose writes cannot be undone is unrecoverable. Write
one of these branches:

- stop and ask
- fall back to a named alternative
- fix the cause and retry
- report and continue

## 5. One concept, one term

**Fix a term and reuse it exactly, in every file.** NEVER vary the wording
for elegance: in instruction text, a synonym reads as a distinction. Define a
load-bearing term once, with a Definition sentence, and reference that
definition rather than restating it.

**NEVER write a contraction.** Write the full words: `'s` and `'d` each stand
for more than one word.

**A vocabulary is the project's table of fixed terms.** It has one row per
term and three columns: the term, what the term means, and its banned synonyms.
NEVER write a banned synonym in place of its term.

- If the always-loaded instructions name a vocabulary file, read the
  vocabulary file before the edit and use its terms. If the edit introduces a
  load-bearing term, that edit adds the term and its banned synonyms to the
  vocabulary file. A term used in two files and defined in neither becomes a
  distinction.
- If the named vocabulary file does not exist, report the missing file to the
  user. Then define each new load-bearing term with a Definition sentence in
  the file that introduces the term.
- Otherwise, define each new load-bearing term with a Definition sentence in
  the file that introduces the term.

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
- **Split a procedure on its mode.** If a procedure branches on the same
  condition at more than one step, write one procedure per branch. Choose
  between the procedures at the top.

### Formatting

**Render the text so the binding sentence is findable without reading the
paragraph:**

- Enumerable rules go in a **table**.
- Sequences go in **numbered steps**.
- Reserve flowing paragraphs for kept reasons (§8).
- One section covers one decision. A section that covers three is three
  sections.

**Break a paragraph at its joints.** One paragraph carries one unit of the
argument. Where the text turns to the next unit, break. If a paragraph passes
140 words, look for a joint. NEVER break a paragraph for length alone. NEVER
merge two units to balance length. NEVER break an enumeration inside an item.
If an enumeration's items run about a line each, the list stays one paragraph
at any length.

**If two lists are separated by only a blank line, put a paragraph between
them.** CommonMark joins the two lists into one.

**Inside one list, put a blank line between every two adjacent items, or
between none.**

## 7. Economy

**If deleting a sentence changes nothing about the reader's behavior, delete
the sentence.** Apply this test to every sentence you write and every sentence
you edit past.

**NEVER write these into instruction text:**

- **Narrative:** scenarios, anecdotes, incidents.
- **Self-explanation:** a sentence justifying the sentence before it. A reason
  §8 keeps is not self-explanation.
- **Throat-clearing:** announcing what the next section will do.
- **Qualification longer than the rule it qualifies.** Name the rare case in
  one clause.

**NEVER write a wordy phrase where a shorter one means the same.** Write the
plain form:

| Wordy phrase | Plain form |
| --- | --- |
| `in order to` | to |
| `prior to` | before |
| `utilize` | use |
| `leverage`, as a verb | use |
| `commence` | start |
| `approximately` | about |
| `in the event that` | if |
| `due to the fact that` | because |
| `despite the fact that` | although |
| `at this point in time` | now |
| `with regard to` | about |
| `is able to`, `has the ability to` | can |

**Data that parameterizes a rule is specification, not example.** Such data
includes an enumeration of any of these:

- types
- producers
- fields
- sentence shapes
- name-shapes

## 8. What MUST survive

**Keep a guard-dependent rule's reason:** the reason reads like waste, and
cutting it fails silently. A rule is *guard-dependent* if someone editing the
text without knowing its reason would plausibly revert it.
Place the kept reason directly after the rule, as one clause
(`NEVER X: <reason>`) or one sentence. Cut the story behind every reason: the
history, the incident, the alternatives weighed.

## 9. Priority

**Within a file, rank by consequence:** an unstated failure branch or an
uncovered case outranks a wordy sentence. The first two change what the reader
does, and the third only adds length.

## 10. How to change instruction text

**State every proposed change as replacement text, NEVER as a verdict.**
"These 40 words say what these 12 do" is actionable, and "this section is
verbose" is not.

**Edit one file per change.** Read the result whole.

**After each restatement, compare the new sentence with the sentence it
replaced and with what the text describes.** If the restatement changed a true
claim, restore the old claim before you restate again. If the third
restatement also changes a true claim, keep the old sentence and report the
sentence to the user.

**Read each sentence of the result alone.** If a sentence does any of these,
cut the sentence or restate it:

- states something false
- states something true in only some of the cases it covers
- repeats its subject in its predicate
- tells the reader nothing new

**If you cannot verify a sentence's claim, keep the sentence and report the
sentence to the user.**

## 11. A rule covers a defect class

**A defect class is the property of an input that produces a failure, stated
without naming the input.** An input is what an instruction acts on: a file, a
record, a request, a pull request. **A special case is a rule, a branch, a
constant, or a table entry that only one input can meet.** The inputs of one
run count as one input. NEVER write a special case into instruction text.
Inputs vary without limit, and a rule fitted to one input breaks on the next.

- If a reader misjudged one input, state the defect class. Then find the
  sentence that permitted the misjudgment: an uncovered case, an undefined
  force, or an undefined term. Restate that sentence. NEVER append a sentence
  for the input.
- If the defect class cannot be stated, leave the instruction text unchanged
  and report the input to the user. If only a special case covers the input,
  leave the instruction text unchanged and report the input to the user.
- NEVER name an input in a rule. NEVER describe an input so closely that
  only that input fits. Data that parameterizes a rule is specification (§7).
- PREFER restating the rule that governs the decision OVER adding a rule
  beside it. The added rule wins only when no existing rule governs the
  decision.
- If a rule carries more than two exceptions, restate the rule so that it
  covers them.
- If a list in a rule gains one entry per failure, restate the rule so that it
  covers every entry.

## 12. Lint the edited file

**The linter is the command that §12 of the kind skill's `SKILL.md` gives.** It
runs a pinned Vale build with the WritingInstructions style and the config for
the edited text's kind. An **alert** is one line of the linter's
output, in the form `file:line:column:level:rule:message`. An alert's message
cites the section of this standard that the alert enforces. An **edited block**
is a top-level block that the edit wrote, changed, or deleted text from. A
top-level block is any block that no other block contains. Headings,
paragraphs, lists, and tables are top-level blocks. In a file that is not
Markdown, the top-level blocks are the paragraphs of its instruction text.

**After each edit to instruction text, run these steps.** If the edited file's
extension is not `.md` or `.markdown`, start at step 3. The linter applies no
rule to any other file and reports the file clean.

1. Run the linter on the file's absolute path. The run also writes
   `.vale-gcroot`, a gitignored link at the plugin root that pins the Vale
   build.
2. Act on the linter's exit code, per the exit code table.
3. Read the result whole, and run the §10 checks on every edited block. A run
   with no alerts does not clear the file, because the linter cannot detect
   meaning. Check every sentence against every rule whose test depends on
   meaning. Check every sentence the linter did not fully read against every
   rule. The linter reads no code block and no file that is not Markdown. In
   front matter, the linter reads words but no sentence pattern. A run that did
   not exit 0 or 1 read nothing. Skip quoted text and the code around the
   instruction text.

   For each defect this step finds in an edited block, apply the §7 deletion
   test first. If the text survives the test, restate the text. Report the
   number of such defects outside the edited blocks to the user. A sentence
   that breaks two rules counts as two defects.

**Act on the exit code:**

| Exit code | Meaning | Action |
| --- | --- | --- |
| 0 or 1 | The linter ran. Code 1 means at least one `error` alert in the file. | Handle each alert in an edited block, per the rules that follow this table. Report the number of alerts outside the edited blocks to the user. |
| 2 | Vale failed, for example on invalid YAML front matter. | If the edit changed the front matter, fix its YAML and rerun step 1 once. Otherwise, or if the rerun exits 2, report Vale's error message to the user. |
| 3 | nix is not installed. | Report to the user that the linter needs nix. |
| 4 | The path does not exist. | Rerun step 1 once with the edited file's absolute path. If the rerun exits 4, report the path to the user. |
| 5 | nix could not build Vale. | Report the error message to the user. |
| Any other code | The linter could not run. | Report the exit code and the output to the user. |

**If the flagged text is quoted text, put it in a code span or a fenced code
block.** The linter skips code, so its rules stay on for the rest of the
block.

**Quoted text is text whose exact wording the reader MUST keep.** NEVER
restate quoted text to meet a rule of this standard. Quoted text includes:

- a quotation that states its own ban
- a message template the reader sends to a person
- a message a tool prints that the reader MUST recognize

A prompt sent to a model is instruction text, never quoted text.

**If the quoted text is in front matter, leave the text and report the alert
to the user instead.** The linter checks code spans in front matter too.

**Handle every other alert by its level:**

| Level | Action |
| --- | --- |
| `error` | Apply the §7 deletion test to the flagged text first. If the text survives the test, restate the text so it meets the cited section. |
| `warning` or `suggestion` | Read the cited section. If its rule does not hold for the flagged text, leave the text. Otherwise, apply the §7 deletion test first. If the text survives the test, restate the text. |

**NEVER swap in a synonym that breaks the cited rule to clear an alert.** The
synonym hides the break from the linter.

**NEVER cut a reason §8 keeps to clear an alert:** the linter cannot tell a
kept reason from self-explanation.
