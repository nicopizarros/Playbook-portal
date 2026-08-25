# Skill observation log (committed copy)

`log.md` here is a checked-in copy of the task-observer observation log.

## Why this exists

task-observer's working log lives outside the repo, at the machine's stable
project identity (`~/.claude/projects/<project-id>/skill-observations/log.md`).
That is the right home on a workstation: it survives branch switches, fresh
clones, and worktree teardown.

It does not survive a **remote or web session**, where the entire container
including `~/.claude/` is reclaimed when the session ends. Observations written
during those sessions are lost unless they are carried into the repo by hand.
This directory is that carry.

## Which copy is authoritative

The live log at the workspace path is authoritative during a session. This copy
is a snapshot, taken at the end of a session that produced observations worth
keeping.

- **Starting a session on a machine with no log:** seed the workspace log from
  this file rather than starting empty, so observation numbering continues
  instead of colliding.
- **Ending a remote/web session that logged anything:** copy the workspace log
  back over `log.md` here and commit it, the same way this snapshot was made.
- **Merging two divergent copies:** entry numbers are the identity. Renumber the
  incoming entries past the highest existing number rather than interleaving,
  and follow the log-write safety rules in the task-observer skill (backup,
  re-read live before writing back, verify the header count).

## Snapshot history

- **2026-08-25** — 22 entries. The incoherence audit added 16–18 (the recurrence
  of the architecture-destroying commit, the one-ended symlink health check, the
  relative-vs-absolute magnitude guard); the remediation pass the same day
  actioned those three plus Observation 10, and added 19 (a skill that appends
  to itself has no stable size), 20 (a gate in prose is skipped when it
  matters), 21 (closing an instance is not closing a mode — OPEN) and 22 (a
  suite keyed to live data — OPEN).

- **2026-08-13** — 15 entries. Observation 14 (architecture-destroying skill
  commit, actioned by restoring the slim/reference architecture) and 15 (the
  "hook didn't fire" claim recurring, OPEN) added during the codebase-audit
  session.

- **2026-08-11** — 8 entries, from the session that added the offline graph
  reader and ran the three-article `publish-sourced-article` validation.
  Observations 4, 5, 7 and 8 were acted on in that same session; the rest
  remain OPEN.
