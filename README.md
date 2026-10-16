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

`make install` needs [Nix](https://nixos.org/download). The
`writing-instructions` skill lints instruction text with
[Vale](https://vale.sh). This repo's flake pins the Vale build, so every
machine runs the same version. Apple Silicon Macs work. Intel Macs do not,
since nixpkgs-unstable dropped them.

Without nix, `make install` stops with `nix not found, see README` before it
links anything. If the linter cannot run later, the `writing-instructions`
skill reports the failure and checks the text by hand.

## Testing

```sh
make test
```

This runs two suites, and each has its own target:

- `make test-node` runs every `*.test.mjs` under `skills/` with `node --test`,
  so it needs Node.
- `make test-writing-instructions` runs the `writing-instructions` lint script
  against the fixtures in `tests/writing-instructions/`. It diffs the alerts
  against each `.expected` file, so it needs nix. The fixtures include lists
  and tables, which Vale skipped before 3.17, so run
  `make test-writing-instructions` after every `nix flake update`.
