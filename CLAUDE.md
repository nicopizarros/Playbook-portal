## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community
structure, and cross-file relationships. **The graph is committed** — graph.json
is plain JSON and GRAPH_REPORT.md is plain markdown, so reading it needs no
install and no network. The `graphify` CLI is a convenience for querying, never
a prerequisite for using the graph.

Rules:
- For codebase questions, query the graph before broad grep/read sweeps.
  - **CLI present** (`command -v graphify` succeeds): `graphify query "<question>"`,
    `graphify path "<A>" "<B>"`, `graphify explain "<concept>"`.
  - **CLI absent:** use the committed stdlib-only reader — the same three commands,
    no dependencies:
    ```bash
    python3 scripts/graph-query.py query   "<question>"
    python3 scripts/graph-query.py path    "<A>" "<B>"
    python3 scripts/graph-query.py explain "<concept>"
    python3 scripts/graph-query.py stats          # graph shape + communities
    ```
    Both return a scoped subgraph with `file:line` anchors, far smaller than
    GRAPH_REPORT.md or raw grep output.
- **Never block on installing the CLI to answer a read-only question.** A missing
  `graphify` binary is a degraded mode, not a broken session: fall through to
  `scripts/graph-query.py` and keep working. Install only when the task actually
  requires *rebuilding* the graph (see below).
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw
  source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when
  query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current
  (AST-only, no API cost). This one *does* need the CLI. If it is missing, try
  `uv tool install graphifyy`; if the install fails (see the network note below),
  say so and leave the graph stale rather than burning the session on retries —
  a stale graph still answers most questions, and the staleness is visible via
  `built_at_commit` in graph.json.

### When the graphify install fails

Some sessions (Claude Code on the web, CI containers, restricted networks) have
unreliable PyPI egress. The failure mode seen in practice: `HTTP 200` headers
arrive, then the response body stalls at 0 bytes until timeout, intermittently,
on roughly half of requests. `uv tool install graphifyy` pulls ~20 wheels
(networkx, rapidfuzz, several tree-sitter grammars), so a per-request stall rate
that high makes the install effectively impossible even though the network
"works".

Diagnose in one command before concluding anything:

```bash
for i in 1 2 3; do curl -sS -o /dev/null -m 20 \
  -w 'HTTP %{http_code} got=%{size_download}B in %{time_total}s\n' \
  https://pypi.org/simple/graphifyy/; done
```

Three fast 200s with a non-zero byte count means egress is fine and the install
is worth attempting. Any `got=0B` line at the timeout means it is not — stop,
use `scripts/graph-query.py`, and tell the user the graph is read-only for this
session.

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

task-observer has no CLI and no network dependency — it is a skill plus a
markdown log — so it works in any session, including ones where graphify is
unavailable. The two are independent; a graphify failure is never a reason to
skip observation.

**Remote/web sessions:** the whole container is ephemeral there, including
`~/.claude/projects/`, so the log does not survive teardown on its own. In
those sessions, treat the log as session-local and surface observations in the
final report so they can be carried back by hand.

## Tooling health check

Both tools above are meant to be always-on. If either is silently inactive,
**say so in your first reply** — do not quietly work around it. Say so, then
keep working in the documented degraded mode; only a *reminder that never
fires at all* is worth stopping to fix. Two checks, both cheap:

- **graphify.** Run any `Grep`/`Bash` search. Either reminder is a pass:
  - "MANDATORY: graphify-out/graph.json exists…" — CLI present, full mode.
  - "…(offline mode — the graphify CLI is not installed…)" — CLI absent. This
    is a **supported, non-blocking** state: query the graph with
    `python3 scripts/graph-query.py` and carry on. Mention it once; do not
    attempt an install for a read-only task.

  **No reminder at all** is the actual failure: the `PreToolUse` hook in
  `.claude/settings.json` is not running. It should invoke
  `.claude/hooks/graphify-guard.sh`, which handles both modes on its own.
  Check that the file exists and is executable (`chmod +x`), and that
  `graphify-out/graph.json` is present in this checkout — the guard exits
  silently when there is no graph to point at.

  If the CLI is genuinely wanted (you need to rebuild the graph, not read it)
  and `uv tool install graphifyy` succeeds, also make sure `~/.local/bin` is on
  `PATH` from `~/.zshenv` — not `~/.zshrc`, which zsh reads only for
  interactive shells, so scripts and hooks never see it. A half-finished
  install leaves a broken entry behind; clear it with
  `uv tool uninstall graphifyy` before retrying.
- **task-observer.** The skill should appear in your available-skills list
  and the observation log should exist at the workspace path above. If the
  log is missing, run the skill's Session Start Protocol to create it
  rather than skipping observation for the session.
