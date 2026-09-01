# Skills

My personal collection of coding assistant skills.

## Installation

```sh
make install
```

This symlinks all skills from `skills/` into `~/.claude/skills/` and all
agent definitions from `agents/` into `~/.claude/agents/`.

A newly installed skill is usable in the current session right away. A newly
installed agent takes longer to appear, so a skill that spawns one may fall
back to a generic subagent for the first little while after `make install`.

To remove installed skills and agents:

```sh
make uninstall
```
