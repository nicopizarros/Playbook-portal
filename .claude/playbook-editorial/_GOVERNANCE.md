# Governance — how to edit this tree

Read this before changing a rule here. It is about editing the files, not about
editorial content, so it is deliberately short and is not part of a normal
drafting run.

**1. Single source of truth.** This tree holds every shared editorial rule.
Both publishing skills reference it by symlink from their own `references/`.
**Never fork or duplicate a rule into a skill-local file.** A rule that exists
in two places has already started drifting; the two skills stopped being one
masthead the moment it did. Skill-local files (`ingestion.md`,
`publishing-mechanics.md`) are only for what genuinely differs by funnel.

**1b. Why this tree exists at all.** On 2026-08-11 a session editing the
then-monolithic `publish-newsletter/SKILL.md` truncated it by ~1,200 lines while
intending a narrow change to the Mexico-angle rule. Nobody noticed: the two
commits that followed re-derived the device rules from `docs/` and described
them as "previously just a pointer", and the reinstated `Fuentes:` line, the
"Noticias" rename and the dead `playbook` source key all silently reverted with
it. A 1,300-line file nobody can diff at a glance is what made that invisible.
Small, single-topic files that both skills share are the fix. **Keep them
small.**

**2. Place before you create.** Before adding or editing a rule, check whether
it belongs in a file that already exists:

| File | Owns |
|---|---|
| `voice-and-style.md` | voice, rhythm, titles, openings, lead-ins, Opinión method, language, evidence levels, region, the publication checklist |
| `format-tiers.md` | total length, tiers, per-product architecture, render contracts, hub reads |
| `dynamic-element-library.md` | the devices, their syntax, the budget and the exclusive pairs |
| `overlap-check.md` | dedupe and the four outcomes |
| `fields-and-taxonomy.md` | the `ArticleInput` fields, taxonomy, priority, dates |
| `images.md` | cover sourcing, credits, the crop check, in-body images |
| `postura-editorial.md` | the sensitivity protocol: when a story touches an ally/prospect/source — relevance × sensitivity matrix, protocolo amarillo, publicar/escalar/frenar |

A seventh file is a last resort, not a first instinct. If a rule seems not to
fit anywhere, it is usually a rule about an existing topic stated at the wrong
altitude.

**3. One rule, one home.** A rule is stated once, in the file that owns it, and
cross-referenced from anywhere else that needs it. Restating it "for
convenience" is how a per-tier paragraph range gets reintroduced after being
deliberately removed. Cross-reference by file and section (`voice-and-style.md`
§2), never by copy.

**4. Date it and name its source.** Every directive carries the date and who
issued it. These files get re-litigated and an undated rule loses to a dated
one. When a new directive supersedes an old one, **replace the old one** — do
not layer the new on top and leave both live.

**5. Every change ships with a convergence check.** After editing this tree:

- run both skills against one comparable test article each (no DB writes);
- run `node scripts/check-voice.mjs` on both drafts;
- diff the two outputs against the rules and confirm **zero divergence** beyond
  what ingestion legitimately causes (`Fuentes:` line, in-body images,
  provenance of the research movement);
- confirm the **entry-token cost has not regressed** — each `SKILL.md` stays a
  trigger plus a decision flow, nothing more.

**6. Report in six phases.** Any future work on these skills reports as: audit
/ restructure / inject / integrate / convergence-check / accounting, with a
before/after token table and an assumptions section.

**7. Syncing.** `scripts/sync-skill-feedback.sh "<summary>"` pushes
`.claude/skills/` **and** `.claude/playbook-editorial/` to `main` together. If a
future refactor moves shared content again, update that script's `SYNC_PATHS`
in the same commit or the feedback loop silently stops carrying it.
