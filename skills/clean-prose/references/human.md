# Human instruction text

## Terms

- In human instruction text, the reader is a person.
- An **owner** is the person or team the reader asks or reports to.

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

## 6. Modular structure, formatted to be scanned

**Give a link or a path for every document, web page, and required tool the
text names.** A required tool is a tool the text lists as a requirement. A
command in a code span needs no link of its own. The reader reaches an item
through a link or a path the reader can open. If the reader can open neither,
the reader reaches the item through its exact name. If you cannot find a link
or a path the reader can open, ask the user for one. If the user supplies
neither, write the item's exact name and report the item to the user.

**If a paragraph outside a numbered step opens with a sentence that binds the
reader, bold that sentence.** Otherwise, leave the paragraph without a
rule-head. A Command, a Prohibition, and a Conditional bind the reader. The
step number already makes a sentence inside a numbered step findable.

## 7. Economy

**An example MAY follow a rule:** a person generalizes from an example instead
of copying its surface.

## 8. What MUST survive

**Also keep a reason that names what a rule protects.** A person uses what
the rule protects to judge a situation the text does not name. Place each
such reason as `SKILL.md` §8 places a kept reason.

**If a document tells the story behind a reason, give the document's link or
path, per §6.**

## 13. Lint the edited file

**If a `CleanProse.LowercaseForce` alert flags a word with the meaning of a §2
row, write that row's force word.** Write the force word in the case §2 sets.
The alert names the force words in all capitals, which human instruction text
never uses. If the flagged word is a force word in its ordinary sense, restate
the sentence per §2. Otherwise, leave the text.

**Check each edited block by reading for four defects the linter misses:**

- a force word in all capitals. Write the word in lowercase, per §2.
- a sentence whose force words state two rules. Split the sentence, per §1.
- a `prefer` that states force in a sentence with no `over`. Restate the
  sentence, per §2.
- a force word in its ordinary sense that the linter does not flag. The linter
  flags no `always`, `never`, or `must`, and no `Should` or `May` that starts a
  sentence. Restate the sentence, per §2.

Count each such defect outside the edited blocks in the report of `SKILL.md`
§13 step 3.
