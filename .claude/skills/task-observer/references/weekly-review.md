# Periodic review

Turns OPEN observations into actual skill edits. **User-initiated** — it
rewrites skills, so it is never something to start mid-task.

## When

`last-review-date.txt` is `never` or older than ~7 days, **and** the user asks.
Otherwise just mention it is due and carry on.

## The pass

1. **Read** every `OPEN` entry in `log.md`.
2. **Group by skill.** Entries against the same skill are usually one edit,
   not several.
3. **Triage each group:**
   - *Act* — the improvement is clear and the skill exists → edit it.
   - *Create* — several entries describe a workflow with no skill → author one
     (`skill-authoring.md`).
   - *Escalate* — `Skill: All skills` → principle propagation, needs approval.
   - *Decline* — no longer applies, or the user says no → `DECLINED (date)`
     **with a one-line reason appended to the entry.**
4. **Apply**, following `skill-authoring.md`'s architecture rules.
5. **Mark** each entry `ACTIONED (YYYY-MM-DD)` or `DECLINED (YYYY-MM-DD)`.
   Never delete.
6. **Stamp** `last-review-date.txt` with today's date.
7. **Report**: what was actioned, created, declined, and what stayed OPEN and
   why.

## The failure mode to avoid

A log that only grows. If entries sit OPEN across several reviews, either the
bar for capturing is too low or the review is not really running. Say so in
the report rather than letting the file quietly become a graveyard.
