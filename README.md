# Skills

My personal collection of coding assistant skills.

## Installation

```sh
make install
```

This symlinks all skills from `skills/` into `~/.claude/skills/` and all
agent definitions from `agents/` into `~/.claude/agents/`.

For a separate config profile, override the destination:

```sh
make install CLAUDE_HOME=~/.claude-work
```

To remove installed skills and agents:

```sh
make uninstall
```

## Requirements

`make install` needs [Nix](https://nixos.org/download). The `clean-prose`
skill lints instruction text with [Vale](https://vale.sh), and this repo's
flake pins the Vale build, so every machine runs the same version. Apple
Silicon Macs work. Intel Macs do not, since nixpkgs-unstable dropped them.

Without nix, the skill reports that the linter is unavailable and reviews the
text by reading it.

## Testing

```sh
make test
```

This runs the `clean-prose` lint script against the fixtures in
`tests/clean-prose/` and diffs the alerts against each `.expected` file. The
fixtures include lists and tables, which Vale skipped before 3.17, so run
`make test` after every `nix flake update`.
