# Graphify + task-observer: setup, fixes, and where it stands

Closing note on the tooling installed across the 2026-08-10/11 sessions. Both
tools are meant to be always-on and both are now wired into `CLAUDE.md`, so this
file exists to explain *why* the pieces are shaped the way they are. The rules
themselves live in `CLAUDE.md`; nothing here overrides them.

---

## What was installed

**Graphify** — a knowledge graph over the repo, committed at `graphify-out/`.
`graph.json` is plain JSON and `GRAPH_REPORT.md` is plain markdown, so reading
the graph needs no install and no network. A `PreToolUse` hook
(`.claude/hooks/graphify-guard.sh`, wired in `.claude/settings.json`) nudges an
agent toward the graph before it starts a broad grep/read sweep. The `graphify`
CLI is a convenience for querying and a requirement only for *rebuilding*.

**task-observer** — a skill at `.claude/skills/task-observer/` that captures
skill-improvement observations during real work, plus the observation log. It
has no CLI and no network dependency, so it works in any session including ones
where graphify is degraded. The two are independent by design: a graphify
failure is never a reason to skip observation.

---

## What was fixed along the way

### 1. The PATH bug

`uv tool install graphifyy` puts its executables in `~/.local/bin`. That
directory was being added to `PATH` from `~/.zshrc`, which zsh reads **only for
interactive shells** — so the binary was invisible to scripts and to the hook,
the two contexts that actually needed it. The install looked successful and the
tool looked missing.

Fixed by exporting the path from `~/.zshenv` instead, which zsh reads for every
shell. Related trap worth keeping: a half-finished install leaves a broken entry
behind, and `uv tool uninstall graphifyy` has to clear it before a retry will
work.

### 2. The offline-reader fallback

The original instructions routed every codebase question through the `graphify`
CLI, so a session without the binary had one documented remedy: install it. On
2026-08-11 a web session with flaky PyPI egress spent three failed install
attempts before doing any real work — for a task that only ever needed to *read*
committed plain JSON.

Fixed by adding `scripts/graph-query.py`, a stdlib-only reader exposing the same
`query` / `path` / `explain` commands plus `stats`, and by splitting the guidance
into read paths and write paths. Reading is never gated behind installing the
producer; only `graphify update .` needs the binary.

The guard hook was made to cover both modes itself, so it prints the offline
instructions when the CLI is absent rather than going silent and letting the
agent conclude the graph is unavailable.

Generalised in the observation log as: *when a tool produces committed
artifacts, the artifacts are the interface, not the tool.*

### 3. The coworker-session gap

task-observer's working log lives at the machine's stable project identity
(`~/.claude/projects/<project-id>/skill-observations/log.md`). That is correct on
a workstation — it survives branch switches, fresh clones and worktree teardown.

It does not survive a **remote or web session**, where the whole container
including `~/.claude/` is reclaimed at the end. Observations written in those
sessions were being lost silently.

Fixed by committing the log to `docs/skill-observations/`, with a README
covering which copy is authoritative, how to seed a fresh workspace from it, and
how to merge two divergent copies without colliding entry numbers. Remote
sessions now write there directly and the observations ship with the branch.

### 4. Two health-check corrections

The first version of the tooling health check was binary: if a tool is inactive,
say so **and stop to fix it**. Faced with a missing CLI whose absence was
harmless, that rule mandated stopping — exactly the wrong call when a supported
degraded mode exists. It now enumerates three states (healthy /
degraded-but-supported / broken) and reserves "stop" for the last.

Separately, diagnosing the flaky PyPI egress produced two confident wrong
conclusions from single-sample probes before three samples per path showed both
paths failing intermittently at the same rate. The check now requires N>=3
samples and reports the failure *signature* (status + bytes + elapsed), because
the real signature was `HTTP 200` headers followed by a body stalling at 0 bytes.

---

## Where things stand

Working, and verified rather than assumed on 2026-08-11:

- The offline reader answers in a fresh remote session with **no CLI and no
  install** — the whole point of fix 2.
- The committed observation log survives container teardown — fix 3.
- The editorial checks the graph work sat alongside (`check-voice.mjs`,
  `find-duplicates.mjs`) are covered by regression suites keyed to the live
  archive.

Two things a future session should know rather than rediscover:

- **The guard hook runs fine in the remote/web container, in both modes.**
  Recorded here because this session first reported the opposite and was wrong:
  it announced the hook as dead based on not having noticed the reminder, when
  the transcript held 86 offline-mode hook messages starting from the first tool
  calls. If a hook ever does look inactive, settle it with evidence before
  reporting it — count its output in the session transcript rather than relying
  on recollection. A remedy checklist that comes back entirely green against a
  reported symptom usually means the symptom is misdiagnosed.
- **PyPI egress is intermittent, not down.** It was healthy on 2026-08-11
  (3x HTTP 200, fast) and the install succeeded; the same command had failed
  repeatedly the day before. Run the three-sample probe in `CLAUDE.md` before
  concluding anything either way.

After changing code, `graphify update .` keeps the graph current (AST-only, no
API cost). If the CLI is unavailable, a stale graph still answers most questions
and the staleness is visible via `built_at_commit` in `graph.json` — leave it
stale rather than burning a session on retries.
