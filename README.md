# Skills

My collection of coding assistant skills, published as a
[Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
named `karl-skills`. Each skill is its own plugin under `plugins/`, so a
repository turns on only the skills it needs.

| Plugin | Ships | Depends on |
| --- | --- | --- |
| `writing-clean-code` | the `writing-clean-code` skill | none |
| `writing-instructions` | the `writing-instructions` skill and its Vale linter | none |
| `describing-prs` | the `describing-prs` skill | none |
| `creating-prs` | the `creating-prs` skill | `describing-prs` |
| `reviewing-prs` | the `reviewing-prs` skill and the `reviewer` agent | none |
| `refining-prs` | the `refining-prs` skill | `reviewing-prs`, `describing-prs` |
| `building-features` | the `building-features` skill and the `implementer`, `refactorer`, and `architect` agents | `reviewing-prs`, `creating-prs`, `writing-clean-code`, `writing-instructions` |
| `building-discovery-wikis` | the `building-discovery-wikis` skill and the `surface-crawler` agent | none |

Claude Code installs a plugin's dependencies with the plugin. It prefixes
every skill and agent with its plugin name, so the reviewer agent is
`reviewing-prs:reviewer`.

## Add skills to a repository

Commit this to the repository's `.claude/settings.json`, and list only the
plugins the repository needs:

```json
{
  "extraKnownMarketplaces": {
    "karl-skills": {
      "source": { "source": "github", "repo": "KarlHarnois/skills" }
    }
  },
  "enabledPlugins": {
    "writing-clean-code@karl-skills": true
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
   `writing-clean-code--v1.1.0`. Dependency version ranges resolve against
   these tags.

## Installation on your own machine

```sh
make install
```

This registers this checkout as the `karl-skills` marketplace and installs
every plugin at user scope. Claude Code reads the plugins from this checkout,
so edits take effect at the next session start or after `/reload-plugins`.

For a separate config profile, override the config directory:

```sh
make install CLAUDE_HOME=~/.claude-work
```

To remove the marketplace and its plugins:

```sh
make uninstall
```

`make status` lists the installed plugins.

## Requirements

`make install` needs the `claude` CLI and [Nix](https://nixos.org/download).
The `writing-instructions` skill lints instruction text with
[Vale](https://vale.sh). The flake in `plugins/writing-instructions/` pins
the Vale build, so every machine runs the same version. Apple Silicon Macs
work. Intel Macs do not, since nixpkgs-unstable dropped them.

Without nix, `make install` stops with `nix not found, see README` before it
installs anything. If the linter cannot run later, the `writing-instructions`
skill reports the failure and checks the text by hand.

## Testing

```sh
make test
```

This runs two suites, and each has its own target:

- `make test-node` runs every `*.test.mjs` under `plugins/` with
  `node --test`, so it needs Node.
- `make test-writing-instructions` runs the `writing-instructions` lint script
  against the fixtures in `tests/writing-instructions/`, so it needs nix. It
  diffs the alerts against each `.expected` file. The fixtures include lists
  and tables, which Vale skipped before 3.17, so run
  `make test-writing-instructions` after every `nix flake update`.

`make validate` runs `claude plugin validate --strict` on the marketplace and
on every plugin.
