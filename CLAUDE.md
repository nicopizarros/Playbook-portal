## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## task-observer

At the start of any task-oriented session — any interaction where you will
use tools and produce deliverables — invoke the task-observer skill before
beginning work. This ensures skill improvement opportunities are captured
throughout the session.

When loading any skill, check the observation log for OPEN observations
tagged to that skill. Apply their insights to the current work, even if
the skill file hasn't been updated yet. This enables immediate application
of observations before they're permanently integrated during the weekly
review.

The skill lives at `.claude/skills/task-observer/` (SKILL.md plus
`references/`). Its workspace is this machine's **stable project identity**
— `~/.claude/projects/<project-id>/`, where `<project-id>` is derived from
the checkout's absolute path — with the observation log at
`skill-observations/log.md` inside it. Resolve that path per machine; do
not hardcode it. Anchoring on the working directory instead would put the
log inside an ephemeral checkout and lose it at teardown.

## Tooling health check

Both tools above are meant to be always-on. If either is silently inactive,
**say so in your first reply and stop to fix it — do not quietly work
around it.** Two checks, both cheap:

- **graphify.** Run any `Grep`/`Bash` search. A working install injects a
  "MANDATORY: graphify-out/graph.json exists…" reminder into the tool
  result. No reminder means the `PreToolUse` hook in `.claude/settings.json`
  is not running — usually `graphify` is not on `PATH` for non-interactive
  shells. Fix: install with `uv tool install graphifyy`, then make sure
  `~/.local/bin` is on `PATH` from `~/.zshenv` (not `~/.zshrc`, which zsh
  reads only for interactive shells, so scripts and hooks never see it).
- **task-observer.** The skill should appear in your available-skills list
  and the observation log should exist at the workspace path above. If the
  log is missing, run the skill's Session Start Protocol to create it
  rather than skipping observation for the session.
