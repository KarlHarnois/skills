---
name: writing-model-instructions
description: "This skill is the prose standard for model instruction text, the text a model loads to follow. Model instruction text includes CLAUDE.md, AGENTS.md, and the files they import, plus SKILL.md files and their reference files. It also includes agent definitions, slash commands, and prompts a program sends to a model. Any other file written for a model to follow is model instruction text too. Use this skill before writing, editing, or reviewing model instruction text, including a one-sentence change. READMEs, runbooks, and guides for people that no CLAUDE.md or AGENTS.md imports are human instruction text: use instructions:writing-human-instructions for them. PR descriptions, commit messages, design docs, and reviews are out of scope."
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/lint.sh *)
---

# Writing Model Instructions

**Before writing, editing, or reviewing model instruction text, read
`${CLAUDE_SKILL_DIR}/../../shared/core.md`.** The standard is that file plus
this one. This file adds the rules for model instruction text under the
section headings of `core.md`. If you cannot read `core.md`, report its path to
the user and stop.

## Terms

- In model instruction text, the reader is the model that follows the text.
  The reader is the orchestrator, a subagent, or any other model a program
  prompts.
- A **subagent** is an agent that the orchestrator or a workflow script
  dispatches.
- A **fork** is a subagent that inherits the orchestrator's whole
  conversation.
- An **agent definition** is the file that defines one subagent: its
  frontmatter and its instructions.
- A **reference file** is a file in a skill's directory that the skill loads.
- A **prompt template** is a prompt that the reader fills in and sends to
  another model.

## Scope

**Model instruction text is any text in this list:**

- the always-loaded instructions
- every `SKILL.md` and every reference file
- every agent definition
- every slash command
- every prompt a program sends to a model, such as a workflow script's prompt
  string or an application's system prompt. This skill governs the prompt's
  text and not the code around the prompt.
- every other file written for a model to follow

**A text in this list is model instruction text, even when a person also
follows the text.** Neither a person nor a model changes a text's kind by
following the text.

**Human instruction text is a README, a runbook, or a guide that tells a person
how to do a task.** If the text is human instruction text and the list does not
cover the text, invoke the `instructions:writing-human-instructions` skill
instead.

**Every other text is out of scope.**

**These texts are out of scope, even when part of one tells a person how to do
a task:**

- PR descriptions
- commit messages
- design docs
- reviews

## 1. Every sentence has a form

**One rule per sentence.** A sentence carrying two rules hides the second:
split it.

## 2. Force is a controlled vocabulary

**Write every force word that states force in all capitals:** all capitals
tell the reader that the word states force. Leave a force word in its ordinary
sense in lowercase. A force word in its ordinary sense that starts a sentence
takes a capital first letter. A `Never` that opens a Prohibition MAY keep a
capital first letter, per `core.md` §2. A force word that a sentence names MAY
take any case.

## 3. Branches are exhaustive

**If the text tells the reader to stop and ask or to report, the reader
contacts the user.**

**If any branch can reach a destructive or unrecoverable action, end the rule
with the default `Otherwise, stop and ask the user`.**

## 4. Every action states its failure branch

**An instruction that can fail MUST state its failure branch.**

**Give every retry loop the text sets up a limit:** without one, the reader can
retry forever. Name the branch the reader takes when the retries run out.

**A subagent contacts the user only through the message it returns when its
run ends.** To report and continue, a subagent puts the report in that message
and keeps working. A subagent gets no answer within its run. If a rule has a
subagent ask the user, the subagent takes the branch for no answer. The
subagent puts the question in its message.

## 6. Modular structure, formatted to be scanned

**A step names every effect it has.** If a step writes, deletes, or sends
something, the step's text names that action.

**A paragraph opens with a bold rule-head stating the rule.** What follows is
its detail.

**Reference only what the reader can reach.** The reader can reach only what
it loads and the tools it can run. A model that is neither the orchestrator
nor a subagent loads what it is sent with its prompt. That model also loads
every file it reads and every skill it invokes in the run. A file MAY
reference every file it tells the reader to read. For the orchestrator and a
subagent, a file MAY also reference the always-loaded instructions. If the
file is an agent definition, NEVER reference anything its subagent cannot
reach. §8 lists what a subagent loads. If a rule depends on another skill, the
rule tells the reader to invoke that skill. A reader cannot apply a skill it
has not loaded.

**Put each prompt template in its own `.md` file, NEVER in a code block:** the
linter reads no code block. The step that sends the prompt tells the reader to
read that file.

## 7. Economy

**PREFER tightening the rule OVER adding an example:** a reader copies an
example's surface into the rule. An example wins only when the tightened rule
is still ambiguous. If an example wins, write a contrasting pair: one case the
rule covers and one it excludes. Make the two cases differ only in the property
the rule tests.

## 8. What MUST survive

**Cut every reason except a guard-dependent rule's reason.**

**Duplication is a defect only within a single context:** repetition across a
delegation boundary reads like waste and is load-bearing. A restatement is a
copy of a rule in an agent definition or in the prompt a subagent is sent. If
the subagent also loads the rule's source, the restatement is a duplicate.
Otherwise, the restatement is necessary.

**If the reader can break a skill body's rule without invoking the skill, the
always-loaded copy is necessary.** Otherwise, the always-loaded copy is a
duplicate.

**A rule that tells the reader to invoke a skill or read a file is a
reference, not a duplicate.** Cutting it as a copy of what the skill or file
says loses the trigger.

**A fork loads everything the orchestrator has loaded.** Every other subagent
loads the items below. If its agent definition sets `omitClaudeMd: true`, the
subagent does not load the always-loaded instructions.

- its agent definition
- the prompt it is sent
- every skill its agent definition lists in its `skills` field
- every skill it invokes in the run
- every file it reads in the run
- the always-loaded instructions

## 9. Priority

**Weight a finding by how often its text loads.** The always-loaded
instructions, every skill `description`, and every agent `description` load in
every session. A skill body loads only when the skill is invoked. Fix the text
that loads in every session first.

## 12. Lint the edited file

**The linter command for model instruction text is:**

```sh
${CLAUDE_SKILL_DIR}/scripts/lint.sh <absolute path>
```
