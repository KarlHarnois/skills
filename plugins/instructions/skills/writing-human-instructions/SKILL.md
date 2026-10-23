---
name: writing-human-instructions
description: "This skill is the prose standard for human instruction text: READMEs, runbooks, and every guide that tells a person how to do a task. Use this skill before writing, editing, or reviewing human instruction text, including a one-sentence change. A text written for a model to follow, such as a SKILL.md, a CLAUDE.md, or an agent definition, is model instruction text even when a person reads it: use writing-model-instructions for it. PR descriptions, commit messages, design docs, and reviews are out of scope."
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/lint.sh *)
---

# Writing Human Instructions

**Before writing, editing, or reviewing human instruction text, read
`${CLAUDE_SKILL_DIR}/../../shared/core.md`.** The standard is that file plus
this one. This file adds the rules for human instruction text under the
section headings of `core.md`. If you cannot read `core.md`, report its path to
the user and stop.

## Terms

- In human instruction text, the reader is a person.
- An **owner** is the person or team the reader asks or reports to.

## Scope

**Human instruction text is any text in this list:**

- READMEs
- runbooks
- every guide that tells a person how to do a task

**A text written for a model to follow is model instruction text, even when
this list also covers the text.** Model instruction text includes `CLAUDE.md`,
`AGENTS.md`, every `SKILL.md`, and every agent definition. If the text is model
instruction text, invoke the `instructions:writing-model-instructions` skill
instead.

**Every other text is out of scope.**

**These texts are out of scope, even when part of one tells a person how to do
a task:**

- PR descriptions
- commit messages
- design docs
- reviews

## 1. Every sentence has a form

**One rule per sentence that binds the reader.** A sentence carrying two rules
hides the second: split it. A sentence that describes a product, a tool, or a
behavior MAY state two facts.

## 2. Force is a controlled vocabulary

**Write every force word in lowercase:** a person reads a force word in all
capitals as shouting. A force word that starts a sentence takes a capital first
letter.

**NEVER write a force word in its ordinary sense:** in lowercase, nothing marks
a force word as force. Write the replacement for the sense:

| Ordinary sense | Replacement |
| --- | --- |
| A possibility | `can` or `might` |
| An expected result | `expect` |
| How often a fact holds | the present tense, without `always` or `never` |
| Any other sense | a restatement without the force word |

## 3. Branches are exhaustive

**If the text tells the reader to stop and ask or to report, name the owner and
the owner's contact.** If you cannot name the owner or the owner's contact, ask
the user for the missing part. If the user does not supply the missing part,
keep the step and report the missing part to the user.

## 4. Every action states its failure branch

**A procedure step that can fail MUST state its failure branch.** A sentence
that describes a product, a tool, or a behavior needs no failure branch.

## 5. One concept, one term

**A term the reader already knows is not a load-bearing term.** A term the
reader already knows is a term in common use in the reader's field. NEVER write
a Definition whose predicate only expands or repeats its term.

## 6. Modular structure, formatted to be scanned

**A step names every effect the reader sees or acts on.** NEVER name an effect
the reader neither sees nor acts on.

**Reference only what the reader can reach.** Give a link or a path for every
document, web page, and required tool the text names. A required tool is a tool
that a step of the text cannot run without. A command in a code span needs no
link of its own. The reader reaches an item through a link or a path the
reader can open. If the reader can open neither, the reader reaches the item
through its exact name. If you cannot find a link or a path the reader can
open, ask the user for one. If the user supplies neither, write the item's
exact name and report the item to the user.

**If a paragraph outside a numbered step opens with a sentence that binds the
reader, bold that sentence.** Otherwise, leave the paragraph without a
rule-head. A Command, a Prohibition, and a Conditional bind the reader. The
step number already makes a sentence inside a numbered step findable.

## 7. Economy

**An example MAY follow a rule:** a person generalizes from an example instead
of copying its surface.

**A README gives an overview.** An overview covers these:

- what the project does
- how to install and start using the project
- a summary of each interface the project offers

**If one of these shows a fact where the reader needs the fact, leave the fact
out of the README:**

- a program's help, in its `--help` output or on a help screen
- an error message
- a config file's comments

**This rule outranks every rule of this standard that adds content to a
README.**

## 8. What MUST survive

**Keep a reason that names what a rule protects.** A person uses what the rule
protects to judge a situation the text does not name. Place each such reason
as §8 places a kept reason.

**If a document tells the story behind a reason, give the document's link or
path, per §6.**

## 12. Lint the edited file

**The linter command for human instruction text is:**

```sh
${CLAUDE_SKILL_DIR}/scripts/lint.sh <absolute path>
```

**Check each edited block by reading for three defects the linter misses:**

- a sentence whose force words state two rules. Split the sentence, per §1.
- a `prefer` that states force in a sentence with no `over`. Restate the
  sentence, per §2.
- a force word in its ordinary sense. Restate the sentence, per §2.

Count each such defect outside the edited blocks in the report of §12 step 3.
