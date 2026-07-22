---
name: discovery-wiki
description: Bootstrap a project knowledge base by running discovery across every available surface (email, cloud drive, chat, calendar, local files, the web) and writing one index file per surface, with summaries plus links to the evidence, stitched together by a top-level index. The result is a wiki-like directory that gives future agent sessions cheap, progressive-disclosure context on the topic. Use this whenever the user kicks off a new project, vendor, engagement, or topic and wants context gathered about it, with phrases like "gather everything about X", "find all the evidence on", "crawl my email/drive/slack for", "build context on", "set up a wiki for", "what do we know about", "pull together what we have on", even when casually phrased. Also use it when asked to refresh or re-crawl an existing discovery directory, to index documents dropped into one, or to answer questions and brief agents from a wiki that already exists ("what do we know about X", "give the agent context on Y").
---

# Discovery Wiki

Build a persistent, link-based knowledge base for a project by discovering related material across every surface you can reach, then indexing it. The wiki's job is not to *contain* the knowledge. It is to let a future agent (or you, later in this session) find the right source in one or two file reads instead of re-crawling everything.

Two principles govern everything below:

1. **Indexes point, they don't copy.** Each entry is a summary plus a stable link/ID back to the source. Copying content bloats the wiki, goes stale, and defeats progressive disclosure. The source of truth stays on its surface.
2. **Stay flat by default.** One index per surface plus one top-level index; a future agent reaches any source in at most two hops: `index.md`, then `surfaces/<surface>.md`, then the source. Empirical results on progressive disclosure show that hierarchy added by default costs tokens without improving retrieval. The single sanctioned exception is volume: when one document or one research question accumulates more material than fits comfortably in its surface index, it earns a sub-index (see "Sub-indexes" below). Never nest deeper than that.

## Workflow

### 1. Scope the topic

Before crawling, write down (and confirm with the user if ambiguous):

- **Topic statement**: one sentence, e.g. "Renewal of the Acme Corp data-platform contract, current term ending 2026-09-30."
- **Discovery mode**: *topic-centric* (searching for a subject: a vendor, a project, an incident) or *actor-centric* (searching for what a person did: self-reviews, promo packets, handoff summaries of someone's work). Actor-centric mode changes the query axis: you search by identity, not keyword, so collect the person's handle on each surface (email address, chat handle, issue-tracker account, code-host username). Most crawls blend both; name the primary mode.
- **Key terms**: names, aliases, ticket numbers, vendor names, project codenames, the actual strings you will search for. Ask the user for aliases you might not guess ("do people call this something else internally?").
- **Time window**: how far back is relevant. Default: 18 months, but contracts and legal topics often need the full prior term, and reviews are usually exactly the review period.
- **Decision context**: what the wiki will be used *for* (negotiate a renewal, write a postmortem, fill a review template). This determines what "relevant" means during triage.
- **Evidence rubric** (when the deliverable has known structure): if the user provides a template or the output document has defined sections (a self-review's "accomplishments / impact / growth areas", a renewal memo's "usage / cost / risk"), derive 3-6 category labels from it. Crawlers tag every entry with a category, so an agent later filling the template can pull evidence per section. When a rubric implies metrics (impact numbers, usage stats, cost figures), summaries should surface the specific number, not just note that one exists.
- **Research questions** (mainly for the web surface): open questions the user wants investigated rather than terms to match, such as "what are their pricing tiers?", "common complaints?", "cheaper alternatives?". Each gets a short slug (`pricing`, `complaints`, `alternatives`) used to tag entries, and the web index answers each in its `## Answers` section. Internal surfaces find what *exists*; research questions direct what to *find out*.

**Cold starts / handoffs**: when the user is new to the topic (taking over a vendor, inheriting a project), they can't supply aliases or key people, so don't stall on the interview. Start with the terms you have, treat the round-2 term harvest (step 3) as the primary scoping mechanism, confirm harvested names and terms back to the user, and add a `## Who's who` section to the top-level index (prior owner, counterparty contacts, recurring internal voices). For a handoff, that roster is half the deliverable.

Record all of this in the top-level `index.md` under `## Scope`; it doubles as the re-crawl spec later.

### 2. Enumerate surfaces

List every surface you can actually reach in this environment, then pick the relevant ones. Typical surfaces:

| Surface | Reached via | Typical evidence |
|---|---|---|
| email | Gmail/Outlook tools | negotiations, commitments, attachments, dates |
| drive | Drive/Sharepoint tools | contracts, decks, spreadsheets, drafts |
| chat | Slack/Teams tools | informal decisions, sentiment, who knows what |
| tracker | Jira/Linear/Asana tools | tickets shipped, scope, dates, assignees |
| code | GitHub/GitLab tools | PRs, commits, reviews, repos touched |
| calendar | Calendar tools | meeting cadence, attendees, upcoming deadlines |
| local | filesystem | prior work product, repos, notes |
| web | web search/fetch | vendor news, pricing, complaints, alternatives; driven by research questions |
| documents | files dropped into `sources/` | user-supplied PDFs, contracts, exports; indexed per section |
| past-chats | conversation search | prior agent sessions on this topic |

Tell the user which surfaces you will crawl and which relevant-looking ones you *can't* reach (e.g. "Slack isn't connected; connect it and I'll add a chat index"). Missing surfaces go in the top-level index under `## Coverage gaps` so a future agent knows the blind spots. A surface that was searched and came up empty is NOT a coverage gap: it still gets its index file with `entry_count: 0`, no tier sections, and full Coverage notes. "Searched, nothing found" is evidence; "couldn't search" is a gap; never conflate them.

### 3. Fan out, one crawl per surface

**If subagents are available** (Claude Code, Cowork): spawn one subagent per surface, all in the same turn so they run in parallel. Give each the crawl brief in `references/crawl-brief.md` filled in with the scope from step 1, the surface assignment, and the output path. Subagents write their index file directly; they return only entry counts per relevance tier, 1-2 sentences on the most important finding, and any coverage problems (the same return spec the brief states), so the orchestrator's context stays clean and it can write the `## Surfaces` lines and `log.md` deltas without re-reading every index.

**If subagents are not available** (claude.ai chat): crawl surfaces yourself, sequentially, one surface at a time, writing each surface index before starting the next. Follow the same crawl brief. Prioritize the surfaces most likely to hold decisive evidence for the decision context (for contracts: drive and email first).

Each crawl follows the protocol in `references/crawl-brief.md`: breadth-first search with the key terms, triage by relevance, dedupe, then write the index. Read that file before crawling; it also has per-surface query tactics.

### 4. Write per-surface indexes

Each surface gets exactly one file, `surfaces/<surface>.md`, in the format defined in `references/templates.md`. The non-negotiables:

- Frontmatter records `crawled_at`, the queries actually run, and the time window covered; this is what makes delta re-crawls possible.
- Entries are grouped by relevance (`Key evidence` / `Supporting` / `Peripheral`), newest first within groups. This structure is identical on every surface, no exceptions, so downstream agents can parse any index mechanically. Consumption-specific structure (rubric categories, research questions) is expressed through entry tags, never through custom sections.
- Every entry: title, **stable link or ID**, date, owner/author if known, and a 1-2 sentence summary written for the *decision context*, not a generic abstract. "Contains the 2024 pricing table; per-seat cost is on p. 4" beats "A spreadsheet about pricing."
- A `## Coverage notes` section stating honestly what was and wasn't searched, and any access failures. An index that overstates its coverage is worse than no index.
- A surface that was searched but returned nothing still gets its index file: frontmatter with `entry_count: 0`, no tier sections, full Coverage notes. "Searched, empty" and "couldn't reach" are different facts; only the latter belongs in `## Coverage gaps`.

### 5. Stitch the top-level index

Write `index.md` at the project root (format in `references/templates.md`):

- `## Scope`: the step-1 scope block, verbatim.
- `## Surfaces`: one line per surface index: link, entry count, crawl date, one-line characterization.
- `## Key findings`: 5-10 bullets of the most decision-relevant facts found *anywhere*, each linking to its surface entry. This is the only place synthesis happens; keep it short.
- `## Who's who` (handoffs and actor-centric crawls): the people that matter: role, relationship to the topic, and a link to where they show up most.
- `## Open questions`: contradictions between sources, missing documents you expected to find, things the user should clarify.
- `## Coverage gaps`: unreachable surfaces, failed queries, time windows not covered.

Append one line to `log.md` (create if absent): date, operation (`initial crawl` / `re-crawl` / `added surface` / `ingested document`), surfaces touched, entry deltas.

### 6. Validate, then report back

Before reporting, run the deterministic checks (auto-fix silently: clerical errors are auto-fixable whether this session, a prior crawl, or a hand edit introduced them):

- Every surface listed in `index.md` has its file, and every `surfaces/*.md` file has its `index.md` line.
- Every sub-index roster entry points at an existing file, and every sub-index has a roster entry in its parent.
- Frontmatter `entry_count` matches the actual entry count.
- Every intra-wiki link anywhere in `index.md` (Surfaces, Key findings, Who's who) and in every surface index resolves to an existing file.
- Every Key findings, Who's who, and Answers citing line satisfies the grep contract (its quoted wording, or for Who's who the person's name, is found in the linked file; see "Linking conventions" in `references/templates.md`).
- Every entry line carries a link, including cluster entries (anchor rule in `references/templates.md`).
- Entries are newest-first within each tier; a ranged or cluster entry sorts by its most recent date.

Run the link and grep checks mechanically (grep the target files); rereading by eye is how these errors survive to the report.

Judgment-level problems (contradictions between sources, suspicious gaps) are never auto-fixed; they go in `## Open questions`.

Then give the user a compact summary: surfaces crawled, counts, the 3-5 most important findings, the open questions, and the coverage gaps. Point them at `index.md`. Do not paste the whole wiki into chat.

## Sub-indexes

When volume warrants, a surface index delegates detail to sub-index files in a folder named after the surface. This is the only sanctioned third hop.

**Triggers** (do not split below these):
- A dropped document with roughly 5+ decision-relevant sections gets its own file in `surfaces/documents/<doc-slug>.md`.
- A research question that accumulates roughly 8+ entries gets its own file in `surfaces/web/<question-slug>.md`.

**Rules**:
- The surface index (`documents.md`, `web.md`) remains the single entry point. It keeps one roster entry per sub-index: the standard entry line, the single most decision-relevant fact, and a link to the sub-index file for the rest. The roster entry sits in the tier of the best entry inside its sub-index, so a sub-index of Supporting-grade material doesn't get promoted to Key evidence just for being large.
- Sub-index files use the same entry format and tier structure as surface indexes, so any index file in the wiki parses the same way.
- The web surface's `## Answers` section always lives in `web.md` itself, never in a sub-index; an agent that reads only `web.md` still gets every answer.
- Never nest below a sub-index.

## Ingesting dropped documents

The wiki accepts direct deposits: the user (or you) can place files, such as a 20-page contract PDF, a usage-report export, or meeting notes, into `sources/` at the project root. These get indexed like any surface, in `surfaces/documents.md`, with two differences:

- **No search step.** Every file in `sources/` gets an entry; the "crawl" is reading and triaging the file itself. On any run, diff `sources/` against the entries in `surfaces/documents.md` and index whatever is new (log as `ingested document`).
- **Index into the document, not just at it.** For anything longer than a few pages, point at the sections that matter, with page numbers or section names, so a future agent reads pages 4 and 11 of the contract, not all 20. A short document keeps its section pointers inline in `documents.md`; a document that crosses the sub-index trigger gets its own file under `surfaces/documents/`. This is progressive disclosure applied inside a file.

Files in `sources/` are immutable source material: never edit them, never delete them; supersede by adding a newer file and noting it in the index.

## Re-crawls and deltas

When asked to refresh an existing discovery directory:

1. Read `index.md` scope and each surface's frontmatter (`crawled_at`, queries).
2. Re-run the same queries filtered to items newer than `crawled_at`, plus any new key terms the user supplies.
3. Append new entries to the existing indexes (marking them `*(added YYYY-MM-DD)*`), update frontmatter, update `## Key findings` only if something changed materially, and log the operation.
4. Never delete entries on a re-crawl; if a source is gone, mark it `*(link dead as of YYYY-MM-DD)*`.
5. Spot-check link integrity while you're there: verify the links of the entries you touch plus a small sample of `Key evidence` links per surface, and mark dead ones as above. Full link audits only when the user asks for a wiki health check.

## Consuming the wiki

Building the wiki is half the skill; the other half is using one that exists. When a conversation references a topic that has a discovery directory, or the user asks "what do we know about X": (if the user doesn't point at the directory, ask where it lives or check the obvious project locations; never guess silently, since answering from the wrong wiki is worse than a short delay)

- **Answering a question**: read `index.md` first. Often `## Key findings` and `## Answers` settle it in one read. Otherwise follow the surface links relevant to the question, and open actual sources only when the index summary isn't enough. Never re-crawl surfaces to answer a question the wiki already covers; cite wiki entries by their links.
- **Briefing an agent (context pack)**: when the wiki's purpose is to contextualize another prompt or subagent, assemble a bounded brief rather than attaching index files wholesale: the scope block, the Key findings, the Who's who if present, plus only the entries relevant to that agent's task, each with its link so the agent can go deeper on demand. State the wiki's `updated` date and coverage gaps in the brief so the agent knows what it can't see.
- **Freshness**: check `updated` in `index.md` frontmatter. If the topic is fast-moving and the wiki is stale, say so and offer a re-crawl; don't silently present old findings as current.

## Initialization and existing wikis

Initialization is idempotent: it creates only what is missing (`index.md`, `log.md`, `sources/`, `surfaces/`) and never replaces an existing file with a blank one. This restraint applies to initialization only; re-crawls and ingestion edit existing files freely under their own rules (append entries, update frontmatter, log the operation). If the target directory already contains a discovery wiki, do not start from scratch: read its scope and treat the request as a re-crawl, an added surface, or a consumption request, whichever matches what the user asked.

## Directory layout

```
<project-dir>/
├── index.md            # top-level: scope, surface list, key findings, open questions, gaps
├── log.md              # append-only operation log
├── sources/            # user-dropped files, immutable (indexed by surfaces/documents.md)
│   └── acme-msa-2023.pdf
└── surfaces/
    ├── email.md        # one index per crawled surface
    ├── drive.md
    ├── chat.md
    ├── web.md
    ├── web/            # sub-indexes, only when a question crosses the volume trigger
    │   └── alternatives.md
    ├── documents.md
    └── documents/      # sub-indexes for long dropped documents
        └── acme-msa-2023.md
```

Put the directory where the user says; if unspecified, ask, suggesting a sibling to their other project directories. The directory name should be a short slug of the topic (`acme-renewal-2026`).

## Reference files

- `references/crawl-brief.md`: the fill-in brief for each surface crawl (works as a subagent prompt or as your own checklist), including per-surface query tactics. Read before any crawl.
- `references/templates.md`: exact file formats for surface indexes, sub-indexes, and the top-level index, with worked examples. Read before writing any index file.
