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

To run the tests (requires Node):

```sh
make test
```

To remove installed skills and agents:

```sh
make uninstall
```
