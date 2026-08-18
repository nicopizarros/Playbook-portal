# TODO

Open items nobody is working on right now. Each one says what it is, why it
was left, and what has to be true before it's worth doing — so picking one up
doesn't start with re-deriving the context.

---

## 0. Coverage hubs — SHIPPED 2026-08-18, four follow-ups open

`/coberturas/[slug]`, first instance `/coberturas/lfa`. A hub is **not** a
fifth editorial product: products own a `source` and articles are born into
one; a hub GATHERS by tag and is config + assets. `lib/hubs/types.ts` carries
the reasoning; `scripts/scaffold-hub.ts` is the standing test (proved by
scaffolding and removing an `nfl-mexico` hub the same day).

**Open, in priority order:**

0. **Route namespace vs. nav label.** The reader-facing zone is now
   **"Exclusivas"** (publisher, 2026-08-18) but the route is still
   `/coberturas/<slug>`. The original justification for that namespace was
   that the nav label and address bar would agree; they no longer do.
   Renaming was free while the hub was unlisted (nothing linked to it, it was
   out of the sitemap) — **it is no longer free**: as of the same day the hub
   is linked from the nav and present in the sitemap, so a rename now needs a
   301 from `/coberturas/*`. Decide deliberately; either answer is defensible,
   but the cost only goes up.

1. **The LFA hub's numbers need public citations — and the page no longer
   says so.** Every figure still traces to a source by construction
   (`HubFigure` cannot be built without a `HubSource`), but as of 2026-08-18
   an uncited source renders **nothing** instead of a visible "sin cita
   pública" chip (publisher's call — the chips read as clutter). The
   consequence: the citation backlog is now invisible on the artefact and
   lives only here. The expansion and capital figures on `/coberturas/lfa`
   are still uncited. Replace the sources in `lib/hubs/lfa.ts` as citations
   arrive. Every figure on the page
   traces to a source by construction (`HubFigure` cannot be built without a
   `HubSource`), but the expansion and capital figures cite *"Brief editorial
   Playbook (2026-08-18)"* and render a visible **"sin cita pública"** chip.
   That chip is the backlog, on the artefact itself. Replace the sources in
   `lib/hubs/lfa.ts` as citations arrive. Nothing else needs to change.
2. **Contradiction in the source brief:** Monterrey is listed both as an
   established plaza and as a 2027 expansion market. Encoded once, as
   established. Someone has to say which is right (second franchise? error?).
3. **"Jalisco" is a state, not a city.** Recorded verbatim rather than
   resolved to Guadalajara — resolving it would be inventing a fact.
4. **`SPORT_OPTIONS` has no American-football value.** LFA coverage currently
   falls back to `Multi-deporte / Otros`, which is honest but wrong-shaped.
   Adding one is a taxonomy change with a backfill; not done unilaterally.

**Also landed with this work (unrelated pre-existing gaps, fixed in passing):**

- `SOURCE_LABELS` (`lib/constants.ts`) has **no entry for
  `futbol-business-review`**, though 14 published rows carry it. Worked around
  in `components/hubs/HubModules.tsx` via `PRODUCT_HUBS`; the constant itself
  is still wrong and should be fixed at source.
- Footer copyright contrast was **3.77:1** on the always-dark footer — the only
  WCAG AA failure Lighthouse found on any route. Raised to `.55` alpha.
- `app/sitemap.ts`'s tier→column ternary fell through to `tagsVertical` for any
  unlisted tier. Fixed, and `property` is excluded from `/tema` entirely (the
  hub is its canonical destination).

---

## 0b. Editorial reference tree was ORPHANED — fixed 2026-08-18

`.claude/playbook-editorial/` (8 files, ~153 KB) is the single source of truth
for every shared editorial rule, and `_GOVERNANCE.md` states both publish
skills reference it "by symlink from their own `references/`".

**Those symlinks did not exist, and neither SKILL.md referenced the tree at
all.** The two skills were self-contained monoliths (26 KB / 25 KB) while the
tree kept receiving rule edits as recently as this week — i.e. edits were
landing where no drafting run would ever read them. This is precisely the
drift `_GOVERNANCE.md` §1b was written to prevent, happening invisibly.

**Fixed:** `references/` created in both skills, symlinked to all 8 shared
files, and both SKILL.md files now point at the shared taxonomy rule.

**Still open:** the two publish skills are still monoliths with their rules
inlined. Reconnecting the links stops further drift but does not
de-duplicate what already diverged. A real restructure (thin router +
references, as `hub-builder` and `publish-partner-announcement` now
demonstrate) is a separate job — and worth doing, since a 26 KB entry cost is
paid on every run.

---

## 1. News classification — RESOLVED 2026-08-14

The four open questions were answered and the whole thing shipped in one
pass:

1. **Classify what?** Both ends. Publish-time validation plus an archive
   audit. The audit ran against the real DB the same day: 133 rows, zero
   out-of-vocabulary tags, zero empty tiers — the archive was already
   consistent, so there was nothing to backfill.
2. **By what?** The fixed controlled vocabulary that `lib/taxonomy.ts`
   already was, now enforced: `validateTags()` /  `canonicalizeTag()` there
   fold case/accents/whitespace to the canonical option and reject
   everything else with the nearest option suggested. The drafting agent
   proposes; the vocabulary constrains.
3. **Who arbitrates?** The vocabulary. `scripts/publish-newsletter.ts`
   hard-fails the publish on an invalid tag (the human running the skill
   sees the rejection); `app/api/update-articles/route.ts` canonicalizes,
   drops what doesn't fold, and reports `droppedTags` in its response;
   `lib/actions/admin.ts` (saveArticle/createArticle) rejects as a backstop
   — the dashboard's checkbox UI can't produce invalid tags anyway.
4. **Priority?** Deliberately editorial, out of scope. No validator touches
   it.

Still available: `scripts/audit-taxonomy.ts` (report-only by default,
`--fix` canonicalizes folding variants and never invents classifications).
Re-run it if bulk imports ever bypass the gates.

**How the two halves landed:** the *editorial format* half shipped first
(2026-08-13) as the A/B/C/D router (`.claude/playbook-editorial/format-tiers.md`
§1), which classifies every incoming story by depth before drafting; the
*taxonomy* half above (validated tags) followed on 2026-08-14, answering the
four scoping questions the same way the router had set the precedent —
fixed vocabulary constrains, the drafting agent proposes.

---

## 2. Retire the `industry-shots` source key — CODE DONE 2026-08-14, one post-deploy step left

The machine key is now `noticias` across the codebase: `KNOWN_SOURCES`,
`SOURCE_LABELS`, `lib/taxonomy.ts`, `lib/product-hubs.ts`, the schema
default, both pages, the API route, the CMS (dropdown, entry defaults,
studio prompts), `ShotProgress`, and every `.article-product-*` /
`[data-source]` CSS selector across the six stylesheets. The publish-skill
docs (`.claude/playbook-editorial/`) say `noticias` now too.

**The safety net:** `normalizeSource()` in `lib/constants.ts`, applied once
at the data boundary (`lib/data/articles.ts`), maps legacy rows to
`noticias` on read — so the site is correct against BOTH database states,
and `/archivo?source=industry-shots` bookmarks still filter correctly.

**What's left — strictly after the next deploy:**

```
POSTGRES_URL=<production> npx tsx scripts/migrate-source-noticias.ts
```

(93 rows carry the legacy key — verified by `--dry-run` on 2026-08-14; the
TODO's old "68" was the published subset.) Do NOT run it before deploying:
the currently-deployed build matches the literal old string, so migrating
first would empty /noticias until the deploy lands. The script verifies
counts and its header documents the reverse-update rollback. After it runs
clean, `normalizeSource()` becomes a no-op that can stay indefinitely as
cheap insurance.

---

## 3. Stale files and dead weight — the clear calls executed 2026-08-14, the judgment calls still open

**Status: swept on 2026-08-13, on the owner's explicit instruction** ("remove
stale and old code"). Deleted: the pre-Postgres seeds (`articles.json`,
`content.json`, `scripts/migrate-json-to-db.ts` and its npm entry), all
already-executed one-off `fix-*`/`update-*`/backfill scripts plus their npm
entries, `scripts/update-matador-report.ts` (superseded by
`update-article.ts`), the regenerable Substack-backlog snapshot
(`docs/SUBSTACK-ARCHIVE-BACKLOG.md` + its 359 KB JSON twin), and the
superseded `v23` design prototype. `HANDOFF.md` moved to `docs/archive/` with
an archived banner (it is the one place recording what the deleted one-offs
did to production data). Kept: the `v24` prototype and the UX study (design
reference), `playbook-isotope-dark.png` (half of a used pair), and everything
in `lib/`, `components/` and `vendor/` — a 2026-08-13 import audit found zero
orphan modules. Everything deleted is recoverable from git history.

---

## 4. Build the proposed devices (device roadmap) — DONE 2026-08-14

**Status: all eight built**, in the roadmap's recommended order, each with
its exclusive pair registered (`Contrato`×`Jugada`, `Calendario`×`Cronología`,
`Votación`×`Reparto`, `Ranking`×`Duelo`, `Cascada`×`Recibo`,
`Tablero`×`Cifra clave`). Entries moved from the roadmap into
`dynamic-element-library.md` §2 (now twenty-three devices); the roadmap file
keeps the coverage map and the original rationale. Computed figures per the
specs: Contrato's term total and "hoy" marker, Calendario's "en N meses"
chips (relative to the article's own date, threaded as `DeviceContext`
through `applyBodyDevices`/`deviceFromParagraph`), Votación's
`Aprobada`/`No alcanzada` verdict, Cascada's Recibo-style 2.5% sum guard.
Verified: 8/8 render, 5/5 malformed cases stay inert, exclusive pairs lock,
light/dark samplers reviewed. Original scoping notes below.

The 2026-08-13 device-by-device audit shipped one upgrade to each of the
fifteen existing devices and mapped the roster's blind spots: the future
(every temporal device points backward), recurring contracts, N-actor
comparisons, institutional money flow, governance votes, profiles, explicit
scenarios, and the KPI strip. Eight devices are proposed to close them, in
recommended build order:

1. `Contrato:` — the term sheet (a rights deal is not a `Venta`)
2. `Calendario:` — dated FUTURE beats, next one highlighted
3. `Votación:` — the tally with the passing threshold drawn on the bar
4. `Ranking:` — the league table, 3–6 actors on one metric
5. `Cascada:` — the waterfall from revenue to margin, self-checking
6. `Perfil:` — the actor card, brand palette via the existing registry
7. `Escenarios:` — level-4 evidence made visual, fixed likelihood vocabulary
8. `Tablero:` — the 3–4 tile KPI strip for market roundups

Each proposal in the roadmap carries its syntax sketch and its exclusive
pair. When one gets built: implement in `lib/article-devices.ts` (grammar,
fail-loud parse, computed figures), register its exclusive pair, move its
entry from the roadmap into `dynamic-element-library.md`, and add it to the
harness sampler. The roadmap deliberately lives OUTSIDE
`.claude/playbook-editorial/` so no drafting run authors an unbuilt device —
keep it that way until the code exists.
