# Crawl Brief

Use this as the prompt for a per-surface subagent, or as your own checklist when crawling a surface directly. Fill in every `{placeholder}`. If the agent list includes `building-discovery-wikis:surface-crawler`, the filled-in brief is that agent's task prompt. Otherwise, the filled-in brief is a generic subagent's prompt.

---

## The brief (fill in and send)

```
You are crawling one surface to build a discovery index for a project.

TOPIC: {topic statement}
MODE: {topic-centric | actor-centric}
IDENTITIES: {actor-centric only: the person's handle on THIS surface}
KEY TERMS: {comma-separated search strings, including aliases}
RUBRIC: {optional: category labels to tag entries with, e.g.
  accomplishments | impact-metrics | growth. Omit if none.}
RESEARCH QUESTIONS: {web surface only, optional: questions to investigate
  with slugs, e.g. pricing: "what are their tiers?", alternatives:
  "cheaper vendors?"}
TIME WINDOW: {e.g. 2025-01-01 to present}
DECISION CONTEXT: {what the wiki will be used for}
SURFACE: {email | drive | chat | tracker | code | calendar | local | web | documents | past-chats}
TOOLS: {the specific tools available for this surface}
OUTPUT FILE: {path}/surfaces/{surface}.md
FORMAT: follow {path-to-skill}/references/templates.md exactly.

Protocol:
1. BREADTH FIRST. Run one search per key term before drilling into
   anything. Note which queries return nothing; that goes in Coverage
   notes.
2. EXPAND once: from the best hits, harvest new terms (people's names,
   doc titles, thread subjects, ticket IDs) and run one more round with
   them. Stop after two rounds; deeper crawling is a re-crawl decision,
   not yours.
3. TRIAGE, don't read everything. Open a source fully only if its
   title or snippet suggests it bears on the decision context. Skim,
   don't study.
4. DEDUPE. Same document reachable two ways = one entry; note the
   aliases.
5. WRITE the index. Summaries must answer "why would the decision-maker
   open this?" in 1-2 sentences. Record the stable link/ID for every
   entry; an entry without a working link is worthless. Links must open:
   use the surface's real permalink format, never an invented URI scheme.
   When one entry summarizes a cluster (an epic, a PR series, a thread
   arc), anchor it on a representative item or the container; ticket IDs
   in prose are not a link. Keep each tier newest-first; a cluster or
   ranged entry sorts by its most recent date, and importance is already
   expressed by the tier, not the order. Write the index
   file even if every query came up empty: a searched-but-empty surface
   gets its file with entry_count: 0, no tier sections, and full
   Coverage notes. "Searched, nothing found" is evidence; only a surface
   you could not reach at all is a coverage gap.
6. In actor-centric MODE, the identity filter is your round-1 query
   (their PRs, their tickets, their messages); KEY TERMS narrow round 2.
   Prefer evidence of outcomes over activity: a merged PR that shipped
   a feature outranks ten review comments.
7. If a RUBRIC is given, tag every entry with one category in brackets
   after the title, and hunt specifically for the numbers the rubric
   implies (impact %, usage counts, cost deltas). A summary that says
   "reduced latency" when the source says "reduced p99 by 38%" has
   discarded the evidence.
8. SPLIT only on volume: if one document has roughly 5+ relevant
   sections, or one research question accumulates roughly 8+ entries,
   move its detail to surfaces/{surface}/{slug}.md and keep a roster
   entry in the surface index pointing at it, placed in the tier of the
   sub-index's best entry. Below those thresholds, keep everything
   inline.
9. Fill in Coverage notes honestly: queries run, queries that failed,
   folders/channels/labels NOT searched, access errors.

Return to the orchestrator ONLY: entry counts per relevance tier, 1-2
sentences on the most important finding, and any coverage problems.
Do not return the index content itself.
```

---

## Per-surface tactics

**email**: Search key terms in subject AND body; also search by correspondent once you know the counterparty's domain (`from:acme.com`). Attachments are often the real evidence: note filename and which message carries them. Thread = one entry; link the thread with an openable permalink (Gmail: `https://mail.google.com/mail/u/0/#all/<thread-id>`), and summarize its arc ("Mar-Apr 2025 negotiation; ends with them conceding the SLA credit").

**drive**: Search by term, then by owner once key people are known. Prefer the canonical or latest version when drafts proliferate; list superseded drafts as one collapsed entry ("plus 4 earlier drafts"). Record doc IDs, not just titles; titles get renamed.

**chat**: Search channels and DMs for key terms; identify the 1-3 channels where the topic actually lives and note them in Coverage notes even if you couldn't read everything. Chat evidence is about *who decided what, when*; summaries should name people and dates.

**tracker** (Jira/Linear/Asana): Topic mode: search summaries and descriptions for key terms, note the epic(s) where the topic lives. Actor mode: query by assignee/reporter within the window; group by epic or project, one entry per meaningful ticket, or per epic when tickets are granular. Resolved-date and story points are your metrics; quote them.

**code** (GitHub/GitLab): Topic mode: search repos, PRs, and issues for key terms. Actor mode: merged PRs by author within the window is round 1; group by repo. Entry = PR (or a cluster of related PRs); link the PR and summarize what *shipped* plus any stated impact from the description, not the diff mechanics. Review activity is Peripheral unless the decision context says otherwise.

**calendar**: Search event titles and descriptions for key terms. Evidence here is cadence and attendees ("QBRs every quarter with X and Y; next one 2026-08-14"). Flag upcoming deadline-relevant events in the entry summary. On actor-centric crawls a year of events is too much to page; sampling one full week per quarter plus keyword searches is a sound tradeoff, provided Coverage notes say which weeks were sampled and which periods are search-only.

**local**: `grep`/glob for key terms under the directories the user points at. Never index build artifacts, node_modules, or caches. Use relative paths from the project dir when possible.

**web**: When RESEARCH QUESTIONS are given, run each as its own mini-investigation (2-4 searches per question), then file all findings into the standard relevance tiers, tagging each entry with its question slug (`[alternatives]`). Close the index with an `## Answers` section: one 1-2 sentence answer-so-far per question, naming its best entries by their exact titles (grep contract; no links needed within the same file). A question that crosses the volume trigger moves its entries to `surfaces/web/<slug>.md` per protocol step 8; its answer line stays in `web.md`. Without research questions: plain key-term searches, no tags, no Answers section. Either way: prefer primary sources (the vendor's own pricing page, filings, official docs) over aggregators; treat review-site and forum complaints as directional, noting volume and recency rather than quoting individual gripes; record URL and access date. Web links rot fastest, so summaries carry slightly more substance here.

**documents**: No searching: enumerate `sources/`, diff against existing entries, index every new file. For files longer than a few pages, point at the sections that matter with page numbers or headings ("Sec 4.2 Termination, p. 11: 90-day notice required"), inline for short docs, in a `surfaces/documents/<doc-slug>.md` sub-index when past the volume trigger. Extract the decision-critical facts (dates, amounts, obligations, thresholds) into the summary with the page reference. One entry per file; supersession chains ("replaces acme-msa-2021.pdf") noted on the newer entry.

**past-chats**: Search prior conversations for the key terms. Entries link the conversation URL; summaries state what was decided or produced there, and distinguish user decisions from assistant suggestions.
