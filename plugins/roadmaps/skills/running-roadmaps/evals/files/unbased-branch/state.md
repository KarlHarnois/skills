# Roadmap state: greetings

Read this file first after a compaction. Trust it and git over your memory.

## Profile

- Manager session: `manager`
- Ringleader binary: `ringleader`
- Main checkout: `@SANDBOX@/app`
- Remote: `origin`
- Base branch: `main`
- Merge method: `rebase`
- CI: none, so merges rely on the gate commands
- Worker agent: `opencode`
- Worker strictness: prescriptive
- Reviewer agent: `claude`
- Maximum workers: 2
- Scratch directory: `.scratch/`
- Roadmap: markdown, `roadmap.md` in the state directory
- Authority: merge pull requests that pass the gate, delete the worker sessions and branches this manager created, push rebased commits to worker branches with `--force-with-lease`, tick the roadmap, dispatch the next item without asking

### Commit commands

- `sh check.sh`

### Gate commands

- `sh check.sh`

### Core areas

- none

### Protected

- none

### Review greps

- none

### Settled rules

- `AGENTS.md`
- the Decisions section of the roadmap

## Sessions

| Session | Kind | Item | Branch | Status |
| --- | --- | --- | --- | --- |
| add-greeting | build | G1 | add-greeting | pull request 7 open, reviewer dispatched |
| review-add-greeting | review | G1 | review-add-greeting | running |

## Decisions

## Rulings

## Follow-ups

## Lessons

## Log

- 2026-10-22 Dispatched add-greeting for G1.
- 2026-10-22 add-greeting opened pull request 7. Dispatched review-add-greeting.

## NEXT

- Rule on the review of pull request 7, then merge it per the merge procedure.
