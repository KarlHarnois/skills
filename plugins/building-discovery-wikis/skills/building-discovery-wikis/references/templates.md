# Index File Templates

Follow these formats exactly. Consistency is what lets a future agent parse any discovery wiki without re-learning its shape. Every index file in the wiki (surface index or sub-index) uses the same entry format and tier structure.

## Linking conventions

All references between wiki files are standard markdown links with paths relative to the file containing them. Never use `[[wikilinks]]`: they need an app-specific resolver, collide on repeated names, and can't be mechanically validated. Two reference classes exist:

- **Intra-wiki** (index to surface, surface to sub-index, documents index to `sources/` files): relative path links, e.g. `[email](surfaces/email.md)` from `index.md`, `(web/alternatives.md)` from `surfaces/web.md`, `(../sources/acme-msa-2023.pdf)` from `surfaces/documents.md`.
- **External** (entry to its source): the most stable identifier the surface offers (doc ID, thread ID, permalink, absolute URL), as already required by the entry rules.

Directionality is strictly downward: `index.md` links to surface indexes; surface indexes link to their sub-indexes and to sources; sub-indexes link only to sources, never sideways to other index files. No file links upward; the sub-index frontmatter field `parent:` is the only upward pointer, and it exists for machines, not navigation.

Entry-level references (a Key finding, Who's who, or Answers line citing specific evidence) satisfy the **grep contract**: a Key finding links the surface file and quotes the entry's title; a Who's who line links the file where the person shows up most, and the person's name as written must appear in that file; an Answers line cites entries in its own file, so it quotes their titles with no link needed. In every case the citing line quotes the entry's title (or a distinctive part of it) exactly as it appears in the target file, so grepping the target for that quoted wording finds the entry in one hit. That exact-substring grep is how the validation step checks it. Append the tier anchor for precision when the file is long, e.g. `[email](surfaces/email.md#key-evidence)`. Tier headings are the only anchors; never invent per-entry IDs.

## Surface index: `surfaces/<surface>.md`

```markdown
---
surface: email
crawled_at: 2026-07-22
time_window: 2025-01-01 to 2026-07-22
queries:
  - "Acme renewal"
  - "Acme MSA"
  - "from:acme.com data platform"
entry_count: 4
---

# Email: Acme Renewal

## Key evidence

- **2026-06-30 · Re: Renewal terms, first pass** ([thread](gmail://thread/18c2f...))
  Jane Fortier (Acme AE) proposes 12% uplift and 3-yr lock-in; our reply
  pushes back on uplift, silent on term length. Last message unanswered.
- **2026-02-11 · FW: Executed MSA + Order Form 2023** ([msg](gmail://msg/17aa9...))
  M. Tran (prior owner) forwards the signed 2023 MSA PDF and Order Form;
  the only copy of the executed order form found on any surface.

## Supporting

- **2026-05-03 · Acme QBR follow-up** ([thread](gmail://thread/1899d...))
  Usage stats attached; we're at 78% of licensed seats.

## Peripheral

- **2025-11-20 · Acme holiday party invite** ([msg](gmail://msg/1712b...))
  Only relevant as a contact-list source for their account team.

## Coverage notes

Searched all mail 2025-01 to present with the 3 queries above. "Acme SOW"
returned nothing. Did NOT search the shared legal@ inbox (no access;
flagged as gap). Archived mail before 2025 not searched.
```

Rules:
- Relevance tiers are exactly `Key evidence`, `Supporting`, `Peripheral`. Omit an empty tier.
- Entry line 1: bold `date · title`, optional bracket tag, then the link in parentheses. Line 2+: the 1-2 sentence decision-relevant summary.
- If the scope defines an evidence rubric or research questions, the bracket tag carries the category or question slug, e.g. `**2026-03-14 · Checkout latency project** [impact-metrics] ([PR](https://...))`. One tag per entry; pick the dominant one. Tags are the ONLY permitted per-scope customization; section structure never varies by surface or topic.
- When a source contains a concrete metric, the summary carries the number verbatim ("p99 -38%", "78% of seats"), not a paraphrase.
- `entry_count` counts the entries physically in that file: a roster entry pointing at a sub-index counts as one, and the sub-index carries its own `entry_count` for what it holds. This keeps the count mechanically checkable against the file itself. A searched-but-empty surface still gets its file, with `entry_count: 0`, no tier sections, and full Coverage notes.
- Newest first within each tier. An entry covering a range or cluster (an epic, a PR series, a thread arc) sorts by its most recent date. Tiers already encode importance; never re-order a tier by importance.
- Links must be the most stable identifier the surface offers (doc ID, thread ID, permalink, absolute URL, file path), in a form that actually opens: use the surface's real permalink format, never an invented URI scheme, and never a search query as a "link".
- Cluster entries still get a link: anchor them on a representative item or the container (the epic, an anchor PR, the issue list). A themed entry with ticket IDs in prose but nothing to click fails validation.
- `## Coverage notes` is mandatory, even if it just says "exhaustive within window".

## Web index with research questions

Same tiers as every other surface; question slugs as entry tags; plus an `## Answers` section (between the tiers and Coverage notes) resolving each question:

```markdown
## Key evidence

- **2026-07-22 · BetaShip pricing page** [alternatives] ([url](https://...))
  Comparable feature set; published tier at ~60% of our current Acme
  spend at our volume. Accessed 2026-07-22.
- **2026-07-22 · Acme pricing page** [pricing] ([url](https://...))
  No public tiers, "contact sales" only; third-party benchmarks in
  Supporting. Accessed 2026-07-22.

## Supporting

- **2026-07-22 · Analyst category grid** [alternatives] ([url](https://...))
  Acme, BetaShip, and Gamma lead the category; Gamma targets smaller
  customers. Accessed 2026-07-22.
- **2026-07-22 · SaaS pricing benchmark database** [pricing] ([url](https://...))
  Reported contracts put buyers our size at $70-110k/yr with Acme.
  Accessed 2026-07-22.

## Answers

- **pricing**: No public list; benchmarks put us at $70-110k/yr at our
  volume. Best entries: "Acme pricing page", "SaaS pricing benchmark
  database".
- **alternatives**: Two credible options; BetaShip is the serious one at
  our scale, headline price ~40% lower before negotiation. Best entry:
  "BetaShip pricing page".
```

If a question crosses the volume trigger, its entries move to a sub-index and `web.md` keeps a roster entry. The roster entry sits in the tier of the sub-index's best entry (a sub-index whose strongest material is Supporting-grade gets a Supporting roster entry, not a Key evidence one):

```markdown
## Key evidence

- **2026-07-22 · Alternatives research (12 entries)** [alternatives] ([sub-index](web/alternatives.md))
  Two credible vendors at our scale; BetaShip leads on price, Gamma on
  features. Full findings in the sub-index.
```

The `## Answers` section always stays complete in `web.md`, regardless of splits.

## Documents index: `surfaces/documents.md`

Entries for files dropped in `sources/`. Short documents keep their section pointers inline:

```markdown
- **2023-04-10 · Acme MSA (executed)** ([sources/acme-msa-2023.pdf](../sources/acme-msa-2023.pdf))
  Governing agreement for the current term. Key sections:
  - Sec 3.1 Fees, p. 4: $86k/yr base, tiered overage schedule
  - Sec 4.2 Termination, p. 11: 90-day written notice; auto-renews otherwise
  - Exhibit B, p. 17: SLA 99.9% uptime, service credits capped at 10%
```

A document that crosses the volume trigger gets a sub-index at `surfaces/documents/<doc-slug>.md` holding the full section breakdown, and the roster entry in `documents.md` keeps only the top fact:

```markdown
- **2023-04-10 · Acme MSA (executed)** ([sub-index](documents/acme-msa-2023.md))
  Governing agreement; auto-renews absent 90-day notice (Sec 4.2, p. 11).
  Section-by-section breakdown in the sub-index.
```

## Sub-index files: `surfaces/<surface>/<slug>.md`

Identical format to a surface index: same frontmatter fields (with `parent: <surface>.md` added), same tiers, same entry format, mandatory Coverage notes. A sub-index never links to another sub-index.

## Top-level index: `index.md`

```markdown
---
topic: acme-renewal-2026
created: 2026-07-22
updated: 2026-07-22
status: initial crawl complete
---

# Acme Renewal 2026: Discovery Index

## Scope

Topic: Renewal of the Acme Corp data-platform contract, current term
ending 2026-09-30.
Mode: topic-centric.
Key terms: Acme, Acme Corp, ACM-2023-114, "data platform", Jane Fortier
Time window: 2025-01-01 to present (contract docs: 2023 onward)
Research questions: pricing ("what are their tiers?"), alternatives
("cheaper vendors?")
Decision context: negotiate renewal terms; decide 1-yr vs 3-yr.

## Surfaces

- [email](surfaces/email.md): 4 entries, crawled 2026-07-22. Negotiation
  thread plus the only executed order form.
- [drive](surfaces/drive.md): 9 entries, crawled 2026-07-22. MSA drafts,
  QBR decks, internal cost model.
- [web](surfaces/web.md): 4 entries, crawled 2026-07-22. No public
  pricing; two credible alternatives.
- [documents](surfaces/documents.md): 1 entry, ingested 2026-07-22. The
  executed MSA.

## Key findings

- Acme proposes a 12% uplift with 3-yr lock-in in "Re: Renewal terms";
  unanswered since 06-30 ([email](surfaces/email.md#key-evidence)).
- QBR follow-up shows we use 78% of licensed seats, giving downsize
  leverage ([email](surfaces/email.md)).
- Internal cost model puts switching cost at ~$140k
  ([drive](surfaces/drive.md)).
- Acme MSA auto-renews absent 90-day notice, so the decision deadline is
  2026-07-02 of next cycle ([documents](surfaces/documents.md)).

## Who's who

- **Jane Fortier**: Acme AE, owns the renewal on their side
  ([email](surfaces/email.md)).
- **M. Tran**: prior internal owner of this vendor; appears throughout
  the email negotiation threads ([email](surfaces/email.md)).

## Open questions

- Where is the countersigned 2023 MSA? Only the emailed PDF was found;
  nothing in drive's Legal folder.
- Did anyone commit verbally at the June QBR? Chat not yet crawled.

## Coverage gaps

- Slack not connected; chat surface not crawled.
- legal@ shared inbox inaccessible.
```

## Operation log: `log.md`

One line per operation, append-only:

```markdown
- 2026-07-22 · initial crawl · email(4) drive(9) web(4) · by claude
- 2026-07-22 · ingested document · documents(+1) · by claude
- 2026-08-04 · re-crawl · email(+3) web(+1) · by claude
```
