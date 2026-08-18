# Skill authoring and regeneration

Read this whenever creating a skill, regenerating one from observations, or
propagating a principle.

## Mandatory checklist

Before writing any skill file, read `cross-cutting-principles.md` in the
workspace. Every **Active Principle** there applies to the skill you are
about to write. That file is the reason the check is mandatory rather than
advisory: it is the only mechanism by which a lesson reaches skills that did
not exist when it was learned.

## Architecture — thin router plus references

The convention this project already uses (`publish-newsletter`,
`publish-sourced-article`, `hub-builder`, `publish-partner-announcement`):

- **`SKILL.md` is a router.** It carries the mental model, the step order, and
  the gates. It does not carry the detail. Entry cost is paid on every load,
  so keep it small and **report the cost** when you change it.
- **`references/` carries the detail**, one file per topic, loaded on demand.
- **Share, never fork.** Where a rule already exists in a shared tree
  (`.claude/playbook-editorial/`), **symlink it** into `references/`. A rule
  that exists in two places has already begun to drift.

**Verify the links resolve.** `ls -la .claude/skills/*/references/`. On
2026-08-18 the shared editorial tree was found orphaned: `_GOVERNANCE.md`
asserted symlinks that did not exist, and neither publish skill referenced the
tree at all, so weeks of rule edits were landing where no run would read them.
An assertion in a governance document is not a check.

## Principle propagation

When an observation is logged with `Skill: All skills`:

1. Surface it to the user explicitly. **Do not propagate unprompted** — it
   changes every skill.
2. On approval, add it to the **Active Principles** section of
   `cross-cutting-principles.md`, worded as a checkable instruction.
3. Note in the observation which skills were updated, then mark it
   `ACTIONED (YYYY-MM-DD)`.

## Regenerating a skill from observations

1. Collect every OPEN observation tagged to it.
2. Group by whether they change the **model** (belongs in SKILL.md) or the
   **detail** (belongs in a reference file).
3. Rewrite the affected sections; do not bolt fixes onto the end. A skill that
   grows only by accretion becomes the 1,300-line file nobody can diff.
4. Report entry-token cost before and after.
5. Mark each observation `ACTIONED (YYYY-MM-DD)`.
