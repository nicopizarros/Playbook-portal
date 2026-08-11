#!/usr/bin/env bash
# PreToolUse guard for graphify. Nudges the agent toward the knowledge graph
# instead of raw grep/read sweeps.
#
# The point of this wrapper: the nudge must fire whether or not the graphify
# CLI is installed. The graph artifacts under graphify-out/ are committed plain
# JSON and markdown, so a session with no CLI (locked-down container, flaky
# PyPI, no uv) can still read them — it just needs to be told how, rather than
# getting silence and falling back to grep.
#
# Usage: graphify-guard.sh <search|read>
# Contract: print guidance on stdout, always exit 0. Never block a tool call.

set -u

MODE="${1:-search}"

# Resolve project root from this script's location (.claude/hooks/ -> root).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GRAPH="$ROOT/graphify-out/graph.json"

# No graph in this checkout: nothing to nudge toward.
[ -f "$GRAPH" ] || exit 0

# Preferred path: the real CLI, if this session has it.
if command -v graphify >/dev/null 2>&1; then
  graphify hook-guard "$MODE" 2>/dev/null || true
  exit 0
fi

# Degraded path: CLI absent. Point at the offline reader instead of letting the
# agent conclude the graph is unavailable. Do NOT suggest installing — an
# install is only warranted when the graph must be rebuilt, not to read it.
cat <<EOF
MANDATORY: graphify-out/graph.json exists (offline mode — the graphify CLI is
not installed in this session, which is fine for reading the graph).

Before broad grep/read sweeps, query the committed graph with the stdlib-only
reader — no CLI, no network, no install:

  python3 scripts/graph-query.py query "<question>"
  python3 scripts/graph-query.py path "<A>" "<B>"
  python3 scripts/graph-query.py explain "<concept>"

It returns a scoped subgraph with file:line anchors, far cheaper than reading
graphify-out/GRAPH_REPORT.md whole or grepping the tree. Fall back to grep only
when the graph does not surface enough. Do not try to install the graphify CLI
to answer a read-only question.
EOF
exit 0
