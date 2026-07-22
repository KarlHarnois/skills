# discovery-wiki

Bootstraps a project knowledge base: fans discovery out across surfaces
(email, drive, chat, tracker, code, web, dropped documents, and more),
writes one link-based index per surface, and stitches them under a
top-level index. The result is a progressive-disclosure wiki that
contextualizes future agent work on the topic.

## Lineage

The `sources/` plus index structure is inspired by Andrej Karpathy's
"LLM Wiki" pattern (see also: karpathy-llm-wiki, llm-wiki-agent), with
one deliberate divergence: this skill's indexes **point** at evidence
rather than compiling knowledge pages from it. Sources of truth stay on
their surfaces; synthesis is confined to a short Key findings section.
The flat two-hop structure (index, then surface index, then source)
follows empirical results showing deeper hierarchical index layers don't
improve retrieval; sub-indexes are permitted only when volume demands.

The multi-surface discovery fan-out (per-surface crawl briefs, coverage
notes, actor-centric mode, research questions) is original to this
skill's author.

## Publishing note

If this skill is ever published to a registry or marketplace, consider
adding "LLM Wiki" to the frontmatter `description` for discoverability,
since people search for the pattern by name. Trade-off: the description
is always loaded into agent context, so naming the pattern there carries
a small risk of the agent importing compile-style behaviors from its
prior knowledge of it, against this skill's point-don't-copy design.
Keep the mention out of the description for private use; add it only at
publish time, and consider pairing it with an explicit "indexes link to
sources rather than compiling pages" clause in the same sentence to
counteract the priming.

*Note: this file is documentation for humans; agents executing the skill
load SKILL.md and its references, not this README.*
