#!/usr/bin/env bash
# PreToolUse guard for graphify. Nudges the agent toward the knowledge graph
# instead of raw grep/read sweeps.
#
# The point of this wrapper: the nudge must fire whether or not the graphify
# CLI is installed. The graph artifacts under graphify-out/ are committed plain
# JSON and markdown, so a session with no CLI (locked-down container, flaky
# PyPI, no uv) can still read them -- it just needs to be told how, rather than
# getting silence and falling back to grep.
#
# CONTRACT (learned the hard way, 2026-08-13): for a PreToolUse hook, plain
# stdout on exit 0 is shown in the transcript but is NOT injected into the
# model's context. Guidance only reaches the agent as a JSON envelope:
#   {"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"..."}}
#
# SILENT-GUARD REGRESSIONS, both real, both cost a session before being found:
#   2026-08-13  offline path printed a bare heredoc -> text appeared in the
#               transcript but never reached the model (log entries 11/12/15).
#   2026-08-25  `hook-guard` was dropped from the CLI (gone from `graphify
#               --help` as of 0.9.44) and the CLI exits 0 on unknown
#               subcommands. `if graphify hook-guard ...; then exit 0; fi` thus
#               took the success branch, printed nothing, and returned -- so
#               CLI-present sessions had no guard at all. Exit status is not
#               evidence the guard ran; non-empty stdout is.
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

HAVE_CLI=0
command -v graphify >/dev/null 2>&1 && HAVE_CLI=1

# Preferred path: the real CLI -- but only if it exists, exits 0, AND actually
# prints something. </dev/null is load-bearing: without it the CLI inherits the
# hook's stdin and can block forever, hanging the tool call it was meant to
# decorate.
if [ "$HAVE_CLI" = "1" ]; then
  CLI_OUT="$(graphify hook-guard "$MODE" </dev/null 2>/dev/null)" || CLI_OUT=""
  case "$CLI_OUT" in
    *[![:space:]]*)
      printf '%s\n' "$CLI_OUT"
      exit 0
      ;;
  esac
fi

# Self-hosted path. Reached when the CLI is absent, or present but no longer
# serving `hook-guard`. Emit the JSON envelope so the text actually reaches the
# model; python3 handles the JSON string escaping.
python3 - "$MODE" "$HAVE_CLI" <<'PYEOF'
import json, sys

mode = sys.argv[1] if len(sys.argv) > 1 else "search"
have_cli = (sys.argv[2] if len(sys.argv) > 2 else "0") == "1"
fallback = "grep" if mode == "search" else "raw reads"

# Two distinct states. Conflating them misleads the next session into either
# a pointless install or a needlessly degraded query path.
if have_cli:
    preamble = (
        "MANDATORY: graphify-out/graph.json exists and the graphify CLI IS "
        "installed. (This guard is self-hosted: the CLI no longer ships a "
        "`hook-guard` subcommand as of 0.9.44. That is expected, not a failure.) "
    )
    reader = (
        'graphify query "<question>", graphify path "<A>" "<B>", '
        'graphify explain "<concept>"'
    )
else:
    preamble = (
        "MANDATORY: graphify-out/graph.json exists (offline mode: the graphify "
        "CLI is not installed in this session, which is fine for reading the "
        "graph). "
    )
    reader = (
        'python3 scripts/graph-query.py query "<question>", '
        'python3 scripts/graph-query.py path "<A>" "<B>", '
        'python3 scripts/graph-query.py explain "<concept>"'
    )

msg = (
    preamble
    + "Before broad grep/read sweeps, query the committed graph: "
    + reader
    + ". It returns a scoped subgraph with file:line anchors, far cheaper than "
    "reading GRAPH_REPORT.md whole or grepping the tree. Fall back to "
    + fallback
    + " only when the graph does not surface enough. Do not install or "
    "reinstall the graphify CLI to answer a read-only question."
)

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "additionalContext": msg,
    }
}))
PYEOF

exit 0
