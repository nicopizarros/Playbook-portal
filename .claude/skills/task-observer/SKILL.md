---
name: task-observer
description: Capture skill-improvement observations during task-oriented work, and apply OPEN observations already logged against a skill before using it. Invoke at the start of any session that will use tools and produce deliverables, and whenever loading another skill. Also owns the periodic review that turns OPEN observations into skill edits.
---

# Task observer

Two jobs, both cheap, both easy to skip and expensive to have skipped:

1. **Read before you work.** When you load any skill, check the log for OPEN
   observations tagged to it and apply their insight **now**, even though the
   skill file itself has not been updated yet.
2. **Write as you work.** When a skill (or the absence of one) costs you a
   detour, capture it. The detour is the data.

## Workspace — resolve it, never hardcode it

The log lives with the machine's **stable project identity**, not with the
checkout:

```
~/.claude/projects/<project-id>/skill-observations/
  log.md                        the observations
  cross-cutting-principles.md   principles that apply to ALL skills
  last-review-date.txt          YYYY-MM-DD, or "never"
```

`<project-id>` is derived from the checkout's absolute path (here:
`-Users-nicolaspizarro-code-Playbook-portal`). Anchoring on the working
directory instead would put the log inside an ephemeral checkout and lose it
at teardown.

**Remote/web sessions:** that whole directory is ephemeral. Treat the log as
session-local and **surface observations in the final report** so a human can
carry them back.

## Session Start Protocol

1. Resolve the workspace path above.
2. If `skill-observations/` does not exist, create it, with `log.md` carrying
   the header in `references/observation-format.md` and
   `last-review-date.txt` containing `never`.
3. Read `cross-cutting-principles.md` — those apply to everything.
4. Skim `log.md` for **OPEN** entries relevant to the work ahead.
5. Say nothing about any of this unless something is missing or relevant.
   Observation is background work, not a deliverable.

## When to capture — the bar

Capture when the session shows something **reusable**. The reliable signal is
a detour: you had to work around a skill, re-derive context a skill should
have carried, or discover that no skill covered a recurring job.

| Capture | Don't capture |
|---|---|
| A skill's instruction was wrong, stale, or unverifiable | A one-off bug in project code |
| A skill assumed a tool/flag/path that does not exist | Something already logged — update that entry instead |
| You needed a workflow no skill covers (new-skill candidate) | A preference with no reusable lesson |
| A rule lived in two places and drifted | Anything you cannot state as a principle |
| A verification method silently measured the wrong thing | Routine success |

**Format:** `references/observation-format.md`. Every entry needs a
**Principle** line — one sentence, generalisable beyond this session. If you
cannot write one, you have an anecdote, not an observation.

## Status lifecycle

`OPEN` → `ACTIONED (YYYY-MM-DD)` when the skill is actually edited, or
`DECLINED (YYYY-MM-DD)` when the user decides not to pursue it. Resolved
statuses **always carry their resolution date**. Never delete an entry:
a declined observation is a record of a decision.

## Periodic review

`references/weekly-review.md`. Run it when `last-review-date.txt` is more
than ~7 days old (or `never`) **and** the user asks for it — the review edits
skills, so it is not something to do unprompted mid-task.

## Applying an OPEN observation mid-session

This is the half that actually pays. On loading skill X:

1. `grep -n "Skill:.*X" log.md`, then read the surrounding entries.
2. For each **OPEN** one, apply its **Suggested improvement** to the work in
   hand.
3. Say once, briefly, that you did — so the human knows the skill file and
   your behaviour have deliberately diverged.
