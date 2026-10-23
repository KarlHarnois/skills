# Roadmap state: parsing

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
| fix-parser | build | P1 | fix-parser | pull request 12, fix list 1 sent |
| design-cache | design pilot | P2 | design-cache | running |
| split-lines | build | P0 | split-lines | merged, deleted |

## Decisions

## Rulings

- Accepted the fix-parser departure that keeps `parse` pure, because AGENTS.md prefers pure functions. Cost if wrong: one more commit.

## Follow-ups

## Lessons

## Log

- 2026-10-22 P0 merged as pull request 10.
- 2026-10-22 Dispatched fix-parser for P1 and design-cache for P2.
- 2026-10-22 Review of pull request 12 found one defect. Sent fix list 1 to fix-parser.

## NEXT

- fix-parser: on its report on fix list 1, review pull request 12 again, with the review in `reports/review-fix-parser-1.md`.
- design-cache: on its design, review it and send the build to the same session.
- Do not dispatch P0 again: it is merged.
