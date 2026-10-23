# Skills

My collection of coding assistant skills, published as a
[Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
named `karl-skills`. The skills are grouped by area into plugins under
`plugins/`, so a repository enables only the areas it needs.

| Plugin | Skills | Agents | Depends on |
| --- | --- | --- | --- |
| `clean-code` | `writing-clean-code` | none | none |
| `instructions` | `writing-model-instructions`, `writing-human-instructions` | none | none |
| `prs` | the four PR skills listed below | `reviewer` | none |
| `features` | `building-features` | the three agents listed below | `prs`, `clean-code`, `instructions` |
| `wikis` | `building-discovery-wikis` | `surface-crawler` | none |
| `roadmaps` | `running-roadmaps` | none | `prs`, `instructions` |

The `prs` plugin ships these skills:

- `creating-prs`
- `describing-prs`
- `reviewing-prs`
- `refining-prs`

The `features` plugin ships these agents:

- `implementer`
- `refactorer`
- `architect`

Claude Code installs a plugin's dependencies with the plugin. It prefixes
every skill and agent with its plugin name. The `reviewing-prs` skill runs as
`/prs:reviewing-prs`, and the reviewer agent is `prs:reviewer`.

## Add skills to a repository

**Commit this to the repository's `.claude/settings.json`.** List only the
plugins the repository needs under `enabledPlugins`:

```json
{
  "extraKnownMarketplaces": {
    "karl-skills": {
      "source": { "source": "github", "repo": "KarlHarnois/skills" }
    }
  },
  "enabledPlugins": {
    "clean-code@karl-skills": true
  }
}
```

When a contributor trusts the repository folder, Claude Code prompts them to
add the marketplace and install the listed plugins.

## Versions

Each plugin sets `version` in its `.claude-plugin/plugin.json`. Users stay on
that version until the string changes. A change to a plugin reaches users only
after its version is bumped.

To release a plugin:

1. Bump `version` in the plugin's `.claude-plugin/plugin.json`, following
   semver.
2. Merge the change to `master`.
3. From the plugin's directory on `master`, run `claude plugin tag --push`.
   The command creates and pushes a tag such as
   `clean-code--v1.1.0`. Dependency version ranges resolve against
   these tags. If the command refuses, fix the problem it reports and run it
   again.

## Installation on your own machine

```sh
make install
```

This registers this checkout as the `karl-skills` marketplace and installs
every plugin at user scope. Claude Code reads the plugins from this checkout,
so edits take effect at the next session start or after `/reload-plugins`.

**To install into a separate config directory, set `CLAUDE_HOME`:**

```sh
make install CLAUDE_HOME=~/.claude-work
```

**To remove the marketplace and its plugins, run:**

```sh
make uninstall
```

`make status` lists the installed plugins.

## Requirements

`make install` needs the [`claude` CLI](https://code.claude.com/docs/en/setup)
and [Nix](https://nixos.org/download).
Both `instructions` skills lint instruction text with
[Vale](https://vale.sh). The flake in `plugins/instructions/` pins
the Vale build, so every machine runs the same version. Apple Silicon Macs
work. Intel Macs do not, since nixpkgs-unstable dropped them.

Without nix, `make install` stops with `nix not found, see README` before it
installs anything. If the linter cannot run later, the `instructions` skills
report the failure and check the text by hand.

## Testing

```sh
make test
```

This runs two suites, and each has its own target:

- `make test-node` runs every `*.test.mjs` under `plugins/` and `tests/` with
  `node --test`, so it needs [Node](https://nodejs.org).
- `make test-instructions` lints the fixtures in `tests/instructions/<kind>/`
  with that kind's Vale config, so it needs nix. It diffs the alerts
  against each `.expected` file. The fixtures include lists and tables, which
  Vale skipped before 3.17. After every `nix flake update`, run
  `make test-instructions`.

`make validate` runs `claude plugin validate --strict` on the marketplace and
on every plugin.

### Bench the instruction standard

```sh
make bench BENCH_BASE=master BENCH_HEAD=HEAD BENCH_RUNS=3
```

The bench measures how a change to the model instruction standard changes
what a model writes. It snapshots the standard at both refs and has
`claude -p` apply each snapshot to every case in
`tests/instructions/bench/cases/`, `BENCH_RUNS` times. It grades each
rewrite on the known sites of its case and counts its alerts under both
linters. Two blind judges then score the rewrites of each case. The bench
writes `report.md` to a new directory in the system temporary directory, and
prints its path.

**To choose the directory, pass `--out` to
`tests/instructions/bench/bench.mjs`.** Keep the directory outside the
repository: nix refuses a flake that sits untracked inside a git repository.

At the defaults, the bench calls the model 16 times, so `make test` and CI
leave it out.

**To add a case, create a directory in `tests/instructions/bench/cases/`.** Put
the files to rewrite in its `input/` directory, and list the sites to grade in
its `case.json`.
