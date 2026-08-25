---
name: discovery-wiki
description: Bootstrap a project knowledge base by running discovery across every available surface (email, cloud drive, chat, calendar, local files, the web) and writing one index file per surface, with summaries plus links to the evidence, stitched together by a top-level index. The result is a wiki-like directory that gives future agent sessions cheap, progressive-disclosure context on the topic. Use this whenever the user kicks off a new project, vendor, engagement, or topic and wants context gathered about it, with phrases like "gather everything about X", "find all the evidence on", "crawl my email/drive/slack for", "build context on", "set up a wiki for", "what do we know about", "pull together what we have on", even when casually phrased. Also use it when asked to refresh or re-crawl an existing discovery directory, to index documents dropped into one, or to answer questions and brief agents from a wiki that already exists ("what do we know about X", "give the agent context on Y").
---

# Discovery Wiki

Build and use a persistent, link-based knowledge base for a project. The wiki's job is not to *contain* the knowledge. It is to let a future agent (or you, later in this session) find the right source in one or two file reads instead of re-crawling everything.

Two principles govern everything:

1. **Indexes point, they don't copy.** Each entry is a summary plus a stable link/ID back to the source. Copying content bloats the wiki, goes stale, and defeats progressive disclosure. The source of truth stays on its surface.
2. **Stay flat by default.** One index per surface plus one top-level index; a future agent reaches any source in at most two hops: `index.md`, then `surfaces/<surface>.md`, then the source. Hierarchy added by default costs tokens without improving retrieval. The single sanctioned exception is volume: a document or research question that outgrows its surface index earns a sub-index, never anything deeper.

## Two jobs, two paths

- **Using a wiki that exists** (answer a question, brief an agent, check freshness): follow "Consuming the wiki" below. It never crawls; that is what keeps a lookup at two file reads.
- **Building or changing one** (initial crawl, re-crawl, added surface, ingesting dropped documents): read `references/build.md` first and follow its workflow. The build workflow lives there rather than here so lookup sessions, which vastly outnumber builds, don't carry crawl instructions they never use.

If the target directory already contains a discovery wiki, don't start from scratch: read its scope and treat the request as a re-crawl, an added surface, or a lookup, whichever matches what the user asked.

Invocation arguments, if any (a scope block for a build, or a question for a lookup): $ARGUMENTS

## Consuming the wiki

When a conversation references a topic that has a discovery directory, or the user asks "what do we know about X": if the user doesn't point at the directory, ask where it lives or check the obvious project locations. Never guess silently, since answering from the wrong wiki is worse than a short delay.

- **Answering a question**: read `index.md` first. Often `## Key findings` settles it in one read, and `## Answers` in `surfaces/web.md` covers the research questions. Otherwise follow the surface links relevant to the question, and open actual sources only when the index summary isn't enough. Never re-crawl surfaces to answer a question the wiki already covers; cite wiki entries by their links. If the answer genuinely isn't in the wiki, say so, name the coverage gap that likely explains it, and offer a re-crawl or an added surface rather than searching surfaces yourself.
- **Briefing an agent (context pack)**: when the wiki's purpose is to contextualize another prompt or subagent, assemble a bounded brief rather than attaching index files wholesale: the scope block, the Key findings, the Who's who if present, plus only the entries relevant to that agent's task, each with its link so the agent can go deeper on demand. State the wiki's `updated` date and coverage gaps in the brief so the agent knows what it can't see.
- **Freshness**: check `updated` in `index.md` frontmatter. If the topic is fast-moving and the wiki is stale, say so and offer a re-crawl; don't silently present old findings as current. `log.md` shows what the last operation touched.

Every index file has the same shape, so you never need the templates to read one: tiers `Key evidence` / `Supporting` / `Peripheral`, newest first, each entry a bold `date · title`, an optional `[tag]`, a link, and a 1-2 sentence summary. Sub-indexes under `surfaces/<surface>/` parse identically; a roster entry in the surface index points at them.

## Directory layout

```
<project-dir>/
├── index.md            # top-level: scope, surface list, key findings, open questions, gaps
├── log.md              # append-only operation log
├── sources/            # user-dropped files, immutable (indexed by surfaces/documents.md)
└── surfaces/
    ├── email.md        # one index per crawled surface
    ├── drive.md
    ├── web.md
    ├── web/            # sub-indexes, only when a question crosses the volume trigger
    │   └── alternatives.md
    ├── documents.md
    └── documents/      # sub-indexes for long dropped documents
        └── acme-msa-2023.md
```

## Reference files

- `references/build.md`: the full build workflow (scope, surfaces, fan-out, index writing, stitching, validation), plus sub-indexes, document ingestion, re-crawls, and initialization. Read before any build, re-crawl, added surface, or ingestion.
- `references/crawl-brief.md`: the fill-in brief for each surface crawl (the crawler's prompt, or your own checklist), with per-surface query tactics. Read by whoever crawls a surface.
- `references/templates.md`: exact file formats for surface indexes, sub-indexes, and the top-level index, with worked examples. Read before writing any index file.
