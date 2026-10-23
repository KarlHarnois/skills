# Model instruction text

## Terms

- A **fork** is a subagent that inherits the orchestrator's whole
  conversation.
- In model instruction text, the reader is the model that follows the text.
  The reader is the orchestrator, a subagent, or any other model a program
  prompts.

## 2. Force is a controlled vocabulary

**Write every force word that states force in all capitals:** all capitals
tell the reader that the word states force. Leave a force word in its ordinary
sense in lowercase. A force word in its ordinary sense that starts a sentence
takes a capital first letter. A `Never` that opens a Prohibition MAY keep a
capital first letter, per `SKILL.md` §2. A force word that a sentence names
MAY take any case.

## 3. Branches are exhaustive

**If the text tells the reader to stop and ask or to report, the reader
contacts the user.**

**If any branch can reach a destructive or unrecoverable action, end the rule
with the default `Otherwise, stop and ask the user`.**

## 4. Every action states its failure branch

**Give every retry a limit:** without one, the reader can retry forever. Name
the branch the reader takes when the retries run out.

## 6. Modular structure, formatted to be scanned

**The reader can reach only what it loads and the tools it can run.** A model
that is neither the orchestrator nor a subagent loads what it is sent with its
prompt. That model also loads every file it reads and every skill it invokes
in the run. A file MAY reference every file it tells the reader to read. For
the orchestrator and a subagent, a file MAY also reference the always-loaded
instructions. If the file is an agent definition, NEVER reference anything its
subagent cannot reach. §8 lists what a subagent loads. If a rule depends on
another skill, the rule tells the reader to invoke that skill. A reader cannot
apply a skill it has not loaded.

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

**Read each edited block for a `must`, `always`, or `never` that states force
without all capitals.** The linter flags none of them. Write each such word in
all capitals, except a `Never` that opens a Prohibition, per §2. Count each
such word outside the edited blocks as one defect in the report of `SKILL.md`
§12 step 3.
