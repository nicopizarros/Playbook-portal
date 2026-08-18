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
# CONTRACT (learned the hard way, 2026-08-13): for a PreToolUse hook, plain
# stdout on exit 0 is shown in the transcript but is NOT injected into the
# model's context. Guidance only reaches the agent as a JSON envelope:
#   {"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"…"}}
# The graphify CLI's own `hook-guard` emits that envelope; the offline path
# below used to print a bare heredoc, which made offline sessions silently
# guard-less (skill-observations log, entries 11/12/15 — agents repeatedly
# and correctly reported "no reminder", and the transcript disagreed because
# the text WAS printed, just never delivered to the model).
#
# Usage: graphify-guard.sh <search|read>
# Always exit 0. Never block a tool call.

set -u

MODE="${1:-search}"

# Resolve project root from this script's location (.claude/hooks/ -> root).
# $0, not BASH_SOURCE: correct for shebang execution AND `sh script` (dash has
# no arrays, and a "Bad substitution" here used to kill the guard silently).
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GRAPH="$ROOT/graphify-out/graph.json"

# No graph in this checkout: nothing to nudge toward.
[ -f "$GRAPH" ] || exit 0

# Preferred path: the real CLI, if this session has it AND it succeeds.
# (No `|| true` swallow: a failing CLI falls through to the offline envelope
# instead of producing silence.)
if command -v graphify >/dev/null 2>&1; then
  if graphify hook-guard "$MODE" 2>/dev/null; then
    exit 0
  fi
fi

# Degraded path: CLI absent (or hook-guard failed). Point at the offline
# reader instead of letting the agent conclude the graph is unavailable. Do
# NOT suggest installing — an install is only warranted when the graph must be
# rebuilt, not to read it. Emit the JSON envelope so the text actually reaches
# the model; python3 handles the JSON string escaping.
python3 - "$MODE" <<'PYEOF'
import json, sys
mode = sys.argv[1] if len(sys.argv) > 1 else "search"
msg = (
    "MANDATORY: graphify-out/graph.json exists (offline mode: the graphify CLI is "
    "not installed in this session, which is fine for reading the graph). "
    "Before broad grep/read sweeps, query the committed graph with the stdlib-only "
    "reader (no CLI, no network, no install): "
    'python3 scripts/graph-query.py query "<question>" | '
    'path "<A>" "<B>" | explain "<concept>". '
    "It returns a scoped subgraph with file:line anchors, far cheaper than reading "
    "GRAPH_REPORT.md whole or grepping the tree. Fall back to "
    + ("grep" if mode == "search" else "raw reads")
    + " only when the graph does not surface enough. Do not install the graphify "
    "CLI to answer a read-only question."
)
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "additionalContext": msg,
    }
}))
PYEOF
exit 0
