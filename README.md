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

The `clean-prose` skill lints instruction text with [Vale](https://vale.sh),
version 3.14 or later. Install it on each machine:

| Platform | Command |
| --- | --- |
| Arch | `sudo pacman -S vale` |
| macOS | `brew install vale` |
| NixOS | add `pkgs.vale` to `home.packages` |

Without Vale, the skill reports that the linter is missing and reviews the
text by reading it.

## Testing

```sh
make test
```

This runs the `clean-prose` Vale style against the fixtures in
`tests/clean-prose/` and diffs the alerts against each `.expected` file. To
test another Vale binary, pass `VALE=/path/to/vale`.
