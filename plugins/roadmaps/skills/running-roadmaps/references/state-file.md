# State file

**The state file is the manager's memory across compactions and sessions.** Resume reads it first. A fact missing from the state file is lost at the next compaction.

## Template

Write the state file from this template. Keep the section order.

````markdown
# Roadmap state: <roadmap name>

Read this file first after a compaction. Trust it and git over your memory.

## Profile

- Manager session: `<name>`
- Ringleader binary: `<path>`
- Main checkout: `<path>`
- Remote: `<remote>`
- Base branch: `<branch>`
- Merge method: `<rebase, squash, or merge>`
- CI: <required, or none, so merges rely on the gate commands>
- Worker agent: `<agent>`
- Worker strictness: <prescriptive or goal-level>
- Reviewer agent: `<agent>`
- Maximum workers: <number>
- Scratch directory: `<directory>/`
- Roadmap: <adapter>, <location>
- Authority: <the granted actions>

### Commit commands

- `<command>`

### Gate commands

- `<command>`

### Core areas

- `<path>`

### Protected

- `<file, constant, or setting>`

### Review greps

- `<pattern>`: <the defect it catches>

### Settled rules

- `<file or section>`

## Sessions

| Session | Kind | Item | Branch | Status |
| --- | --- | --- | --- | --- |

## Decisions

- D<n>: <decision>, recorded <date>

## Rulings

- <choice>, because <reason>. Cost if wrong: <cost>.

## Follow-ups

- <follow-up>, found in <session or pull request>

## Lessons

- <lesson>. Rule now applied: <rule>.

## Log

- <date and time> <event>

## NEXT

- <the next action for each item that is not done>
````

## Sections

| Section | Write it when |
| --- | --- |
| Profile | Setup fills it. Change it per `project-profile.md`. |
| Sessions | The status of a worker changes. Keep one row per worker, and update its Status. Write `deleted` in the Status once the session is deleted. |
| Decisions | The user settles a decision, per `decisions.md`. |
| Rulings | The manager makes a choice that is not a decision. |
| Follow-ups | A review or a report finds work outside its item. Add each follow-up to the roadmap too, per `roadmap-adapters.md`. |
| Lessons | A mistake reaches a worker, the base branch, or the user. Write the rule that prevents the mistake's class, not the instance. |
| Log | Each event of the Events table in `SKILL.md`. Each gate result. Each change to a session, a branch, or the roadmap. One line each. |
| NEXT | After every event. Before a planned compaction, rewrite it whole. |

**Write the state file right after each event, before the next action:** a compaction can start at any turn.

**Append to the Log, and edit the other sections in place.** NEVER rewrite the whole file: a whole-file rewrite drops lines you did not reread.

**If a lesson holds for every project, tell the user.** The user decides whether this skill gains the rule.

## Before a planned compaction

1. Rewrite the NEXT section with the next action for each item that is not done.
2. Tell the user to compact with this instruction: `Read <state file path> first after compacting.`
