# Roadmap adapters

**An adapter is the way the manager reads and changes the roadmap.** The Roadmap field of the profile names the adapter and its location.

Every adapter supports these four operations:

| Operation | Effect |
| --- | --- |
| Read | List the items in order, with each item's kind and whether it is done. |
| Tick | Mark one item done. |
| Add | Add one item, such as a follow-up. |
| Record | Add one decision. |

## Markdown

**The roadmap is one Markdown file.** Write it from `templates/roadmap.md`.

| Location | Tick, Add, and Record |
| --- | --- |
| In the state directory | Edit the file directly. |
| Tracked in the repository | Tell each build to tick its own item in its last commit. Add and Record through a build whose only change is the roadmap file. |

**NEVER commit a roadmap change directly to the base branch:** every change to the base branch passes the gate first.

## Claude Docs

**The roadmap is a Claude Docs document, and the location is its link.**

1. Before the first operation, load the Claude Docs tools and their guide.
2. Read the document since the last revision that the Log section of the state file records.
3. Record each item's block ID in the Sessions table when you dispatch its worker.
4. Tick an item by setting its `checked` attribute.
5. After each change, record the document's new revision in the Log section.

If a Claude Docs call fails, retry it once. If it fails again, record the operation under NEXT in the state file, and tell the user.
