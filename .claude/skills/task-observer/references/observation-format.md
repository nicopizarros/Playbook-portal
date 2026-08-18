# Observation format

`log.md` opens with exactly this header and nothing else:

```markdown
# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill
updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue —
resolved statuses always carry their resolution date

---
```

Entries are grouped under a `## YYYY-MM-DD` date heading, newest appended at
the end. Each entry:

```markdown
### Observation N: <one line, the finding itself, not the topic>

**Status:** OPEN
**Date:** YYYY-MM-DD
**Session context:** What the session was actually doing. One sentence.
**Skill:** <skill-name> | New skill candidate: <proposed-name> | All skills
**Type:** open-source | project-specific
**Phase/Area:** Where in the work it surfaced.

**Issue:** What went wrong or was missing, concretely. Name the file, flag,
command or assumption. A reader who was not in the session must be able to
tell whether it still applies.

**Suggested improvement:** What the skill should say or do instead. Specific
enough to apply without re-deriving the analysis.

**Principle:** One sentence, generalisable beyond this session.
```

## The two fields people get wrong

**`Skill: All skills`** is the trigger for principle propagation
(`skill-authoring.md`). Use it only when the lesson genuinely applies to every
skill — it costs every future skill load, so the bar is high.

**`Principle`** must survive losing all the session's specifics. "Check the
`--project` flag" is not a principle; "a runbook written by someone else is a
hypothesis, not a specification" is.

## Batching

Several observations from one session share one date heading and number from
1 within it. Append at the end of the file — chronological order is what makes
the log reviewable.
