#!/usr/bin/env python3
"""Offline reader for graphify-out/graph.json — no CLI, no network, stdlib only.

The graphify CLI (`graphify query|path|explain`) is the nicer interface, but it
is a PyPI install and some sessions can't get one (flaky egress, locked-down
containers, no uv). The graph itself is committed plain JSON, so nothing about
it actually requires the CLI. This script covers the three read commands so a
session without graphify still gets a scoped subgraph instead of falling back
to grepping raw source.

    python3 scripts/graph-query.py query "how do publishing skills reach the CMS"
    python3 scripts/graph-query.py path "publish-sourced-article" "articles table"
    python3 scripts/graph-query.py explain "createArticle"

Output is deliberately terse — the whole point is to spend fewer tokens than
reading GRAPH_REPORT.md or grepping the tree.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict, deque

DEFAULT_GRAPH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "graphify-out",
    "graph.json",
)

# Words that match half the graph and tell us nothing about intent.
STOPWORDS = {
    "a", "the", "an", "and", "or", "of", "to", "in", "on", "for", "with",
    "how", "what", "where", "which", "who", "why", "does", "do", "is", "are",
    "was", "were", "be", "been", "get", "gets", "use", "uses", "used", "using",
    "from", "into", "via", "by", "at", "it", "its", "this", "that", "these",
    "those", "can", "could", "should", "would", "connect", "connects",
    "connected", "relate", "related", "between",
}


def load_graph(path: str) -> dict:
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        sys.exit(
            f"graph not found at {path}\n"
            "Run `graphify .` (needs the CLI) to build it, or pass --graph."
        )
    except json.JSONDecodeError as exc:
        sys.exit(f"graph at {path} is not valid JSON: {exc}")


def tokenize(text: str) -> list[str]:
    """Split on non-word chars *and* camelCase/PascalCase humps."""
    rough = re.split(r"[^A-Za-z0-9]+", text)
    out: list[str] = []
    for chunk in rough:
        if not chunk:
            continue
        for piece in re.findall(r"[A-Z]+(?![a-z])|[A-Z][a-z0-9]*|[a-z0-9]+", chunk):
            piece = piece.lower()
            if len(piece) > 2 and piece not in STOPWORDS:
                out.append(piece)
    return out


def node_haystack(node: dict) -> str:
    return " ".join(
        str(node.get(k, ""))
        for k in ("label", "id", "source_file", "community_name", "rationale")
    ).lower()


def score_node(node: dict, terms: list[str]) -> float:
    """Weight a label hit above a path hit above a community hit."""
    label = str(node.get("label", "")).lower()
    node_id = str(node.get("id", "")).lower()
    src = str(node.get("source_file", "")).lower()
    community = str(node.get("community_name", "")).lower()
    score = 0.0
    for term in terms:
        if term == label:
            score += 6.0
        elif term in label:
            score += 3.0
        if term in src:
            score += 2.0
        if term in node_id:
            score += 1.0
        if term in community:
            score += 0.5
    return score


def fmt_node(node: dict) -> str:
    loc = node.get("source_location") or ""
    where = node.get("source_file") or node.get("source_url") or "?"
    suffix = f":{loc}" if loc else ""
    return f"{node.get('label', node.get('id'))}  [{where}{suffix}]"


def index_edges(graph: dict):
    out = defaultdict(list)
    inc = defaultdict(list)
    for link in graph["links"]:
        out[link["source"]].append(link)
        inc[link["target"]].append(link)
    return out, inc


def find_nodes(graph: dict, needle: str, limit: int = 12) -> list[dict]:
    """Resolve a free-text needle to nodes, best match first."""
    terms = tokenize(needle) or [needle.lower()]
    scored = []
    for node in graph["nodes"]:
        score = score_node(node, terms)
        if score > 0:
            scored.append((score, node))
    if not scored:  # last resort: raw substring anywhere
        low = needle.lower()
        scored = [(0.1, n) for n in graph["nodes"] if low in node_haystack(n)]
    scored.sort(key=lambda pair: (-pair[0], str(pair[1].get("label", ""))))
    return [node for _, node in scored[:limit]]


def cmd_query(graph: dict, args) -> int:
    terms = tokenize(args.text)
    if not terms:
        sys.exit("query needs at least one meaningful word")
    matches = find_nodes(graph, args.text, limit=args.limit)
    if not matches:
        print(f"no nodes matched: {args.text}")
        return 1

    out_edges, in_edges = index_edges(graph)
    by_id = {n["id"]: n for n in graph["nodes"]}
    hit_ids = {n["id"] for n in matches}

    print(f"# query: {args.text}")
    print(f"# graph: {len(graph['nodes'])} nodes / {len(graph['links'])} edges "
          f"@ {graph.get('built_at_commit', 'unknown')[:8]}")
    print()

    communities = Counter(
        n.get("community_name") for n in matches if n.get("community_name")
    )
    if communities:
        print("## communities in play")
        for name, count in communities.most_common(5):
            print(f"- {name} ({count} matched node{'s' if count > 1 else ''})")
        print()

    print(f"## matched nodes ({len(matches)})")
    for node in matches:
        print(f"- {fmt_node(node)}")
    print()

    print("## neighbourhood (1 hop)")
    for node in matches[: args.expand]:
        nid = node["id"]
        outs = out_edges.get(nid, [])[: args.fanout]
        ins = in_edges.get(nid, [])[: args.fanout]
        if not outs and not ins:
            continue
        print(f"\n### {fmt_node(node)}")
        for link in outs:
            tgt = by_id.get(link["target"], {"id": link["target"]})
            mark = "*" if link["target"] in hit_ids else " "
            print(f"  {mark}-> {link['relation']:<12} {fmt_node(tgt)}")
        for link in ins:
            src = by_id.get(link["source"], {"id": link["source"]})
            mark = "*" if link["source"] in hit_ids else " "
            print(f"  {mark}<- {link['relation']:<12} {fmt_node(src)}")
    print("\n(* = also a direct match for the query)")
    return 0


def cmd_path(graph: dict, args) -> int:
    src_candidates = find_nodes(graph, args.source, limit=5)
    dst_candidates = find_nodes(graph, args.target, limit=5)
    if not src_candidates:
        sys.exit(f"no node matched source: {args.source}")
    if not dst_candidates:
        sys.exit(f"no node matched target: {args.target}")

    # Undirected walk: we want "is there a relationship", not "does A call B".
    adj = defaultdict(list)
    for link in graph["links"]:
        adj[link["source"]].append((link["target"], link, "->"))
        adj[link["target"]].append((link["source"], link, "<-"))

    by_id = {n["id"]: n for n in graph["nodes"]}
    goals = {n["id"] for n in dst_candidates}

    print(f"# path: {args.source}  ->  {args.target}")
    print(f"# source candidates: {', '.join(n['label'] for n in src_candidates)}")
    print(f"# target candidates: {', '.join(n['label'] for n in dst_candidates)}")
    print()

    for start in src_candidates:
        prev: dict[str, tuple] = {}
        seen = {start["id"]}
        queue = deque([start["id"]])
        found = None
        while queue:
            cur = queue.popleft()
            if cur in goals and cur != start["id"]:
                found = cur
                break
            for nxt, link, direction in adj.get(cur, ()):
                if nxt not in seen:
                    seen.add(nxt)
                    prev[nxt] = (cur, link, direction)
                    queue.append(nxt)
        if not found:
            continue

        chain = []
        cur = found
        while cur in prev:
            parent, link, direction = prev[cur]
            chain.append((parent, link, direction, cur))
            cur = parent
        chain.reverse()

        print(f"## {fmt_node(start)}")
        for parent, link, direction, child in chain:
            arrow = "->" if direction == "->" else "<-"
            print(f"   {arrow} {link['relation']} ({link.get('source_file', '?')}"
                  f":{link.get('source_location', '?')})")
            print(f"   {fmt_node(by_id[child])}")
        print(f"\n({len(chain)} hop{'s' if len(chain) != 1 else ''})")
        return 0

    print("no connecting path found between any candidate pair")
    return 1


def cmd_explain(graph: dict, args) -> int:
    matches = find_nodes(graph, args.concept, limit=args.limit)
    if not matches:
        print(f"no nodes matched: {args.concept}")
        return 1
    out_edges, in_edges = index_edges(graph)
    by_id = {n["id"]: n for n in graph["nodes"]}

    print(f"# explain: {args.concept}")
    for node in matches:
        nid = node["id"]
        print(f"\n## {fmt_node(node)}")
        if node.get("community_name"):
            print(f"community: {node['community_name']}")
        if node.get("rationale"):
            print(f"rationale: {node['rationale']}")
        outs = out_edges.get(nid, [])
        ins = in_edges.get(nid, [])
        print(f"degree: {len(outs)} out / {len(ins)} in")
        for link in outs[: args.fanout]:
            print(f"  -> {link['relation']:<12} "
                  f"{fmt_node(by_id.get(link['target'], {'id': link['target']}))}")
        for link in ins[: args.fanout]:
            print(f"  <- {link['relation']:<12} "
                  f"{fmt_node(by_id.get(link['source'], {'id': link['source']}))}")

    hyper = [
        h for h in graph.get("hyperedges", [])
        if any(n["id"] in h.get("nodes", []) for n in matches)
    ]
    if hyper:
        print("\n## god nodes / hyperedges touching this")
        for h in hyper[:5]:
            print(f"- {h.get('label', h.get('id'))} "
                  f"({len(h.get('nodes', []))} members)")
    return 0


def cmd_stats(graph: dict, args) -> int:
    print(f"nodes: {len(graph['nodes'])}")
    print(f"edges: {len(graph['links'])}")
    print(f"hyperedges: {len(graph.get('hyperedges', []))}")
    print(f"built_at_commit: {graph.get('built_at_commit', 'unknown')}")
    print("\ntop communities:")
    for name, count in Counter(
        n.get("community_name") for n in graph["nodes"] if n.get("community_name")
    ).most_common(15):
        print(f"  {count:>5}  {name}")
    print("\nrelations:")
    for rel, count in Counter(l.get("relation") for l in graph["links"]).most_common():
        print(f"  {count:>5}  {rel}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="graph-query.py", description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--graph", default=DEFAULT_GRAPH, help="path to graph.json")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_query = sub.add_parser("query", help="free-text question -> scoped subgraph")
    p_query.add_argument("text")
    p_query.add_argument("--limit", type=int, default=12)
    p_query.add_argument("--expand", type=int, default=5,
                         help="how many matched nodes get a neighbourhood dump")
    p_query.add_argument("--fanout", type=int, default=8)
    p_query.set_defaults(fn=cmd_query)

    p_path = sub.add_parser("path", help="shortest relationship between two things")
    p_path.add_argument("source")
    p_path.add_argument("target")
    p_path.set_defaults(fn=cmd_path)

    p_explain = sub.add_parser("explain", help="one concept, its edges and community")
    p_explain.add_argument("concept")
    p_explain.add_argument("--limit", type=int, default=3)
    p_explain.add_argument("--fanout", type=int, default=12)
    p_explain.set_defaults(fn=cmd_explain)

    p_stats = sub.add_parser("stats", help="graph shape, communities, relation counts")
    p_stats.set_defaults(fn=cmd_stats)

    args = parser.parse_args()
    return args.fn(load_graph(args.graph), args)


if __name__ == "__main__":
    sys.exit(main())
