# Roadmap state: reporting

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
| print-report | build | R1 | print-report | merged, deleted |

## Decisions

- D1: A JSON output is one object per line.

## Rulings

## Follow-ups

## Lessons

## Log

- 2026-10-21 R1 merged as pull request 1.

## NEXT

- Dispatch R2 as a design pilot. R3 waits for R2, because both change `src/report.py`.
