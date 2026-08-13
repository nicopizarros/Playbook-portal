# TODO

Open items nobody is working on right now. Each one says what it is, why it
was left, and what has to be true before it's worth doing — so picking one up
doesn't start with re-deriving the context.

---

## 1. News classification

**Status: needs scoping before any code.**

We should do the news classification. Nothing is implemented and the shape of
it is not decided yet, so the first task is defining it, not building it.

What exists today to build on or replace:

- `lib/taxonomy.ts` holds the three axes every article is filed under —
  `scope` (Nacional/Internacional), `sport`, `vertical` (Derechos de TV,
  Patrocinios, M&A, Gobernanza…) — plus the per-product ordering that decides
  which axis leads on each hub.
- Today those tags are written **by hand at drafting time**, by whoever (or
  whatever) runs `publish-newsletter` / `publish-sourced-article`. Nothing
  validates them: a typo mints a tag that no filter or hub can reach, and two
  runs can file the same kind of story differently.
- `priority` (1-5) is likewise a per-run judgment call, and on /noticias it is
  also the layout, so an inflated 5 hogs a feature band.

Questions to answer before writing anything:

1. **Classify what?** Only incoming items at publish time, or a backfill pass
   over the ~87 published rows so the archive is consistent too?
2. **By what?** A fixed controlled vocabulary the skills must choose from
   (cheap, predictable, needs curation), or a model call at publish time
   (flexible, needs a review step), or both — model proposes, vocabulary
   constrains?
3. **Who arbitrates?** If the classifier and the drafting agent disagree,
   which wins, and does a human see it before it goes live?
4. **Does it set `priority` too**, or is priority deliberately editorial and
   out of scope?

Worth doing because the hubs, the archive filters, the related-articles rail
and the homepage ranking all read these fields — they are the site's
navigation, not decoration.

---

## 2. Retire the `industry-shots` source key

**Status: the name is already gone; the identifier is not.**

The product is called **Noticias**, and "Industry Shots" was retired as a name
on 2026-08-08 — both publish skills, `docs/ENCYCLOPEDIA.md` and this file now
say Noticias throughout. Readers never saw the old name anyway
(`SOURCE_LABELS` has always rendered the source as "Noticias").

What is left is the machine key `source: "industry-shots"`, still the value
**68 published rows** are filed under. It is not cosmetic — it is the string
matched by:

- `lib/product-hubs.ts` (`hubForSource`, which is what decides an article gets
  a product template at all), `lib/constants.ts`, `lib/taxonomy.ts`,
  `lib/db/schema.ts`, `lib/rank.ts`
- `app/(public)/noticias/page.tsx`, `app/(public)/articulo/page.tsx`,
  `app/api/update-articles/route.ts`
- the `.article-product-industry-shots` CSS class across six stylesheets
  (`lectura.css` carries the numbered beats and the whole Noticias skin)
- `components/admin/article-entry.ts` and `studio-prompts.ts`, i.e. the CMS
  dropdown an editor picks from
- `components/products/ShotProgress.tsx`'s mark table

Renaming it means a DB migration plus a coordinated rename across all of the
above, and any row missed stops matching a hub, which silently drops the
article out of `/noticias` and off its product template. Worth doing for
consistency, but it is a migration with a rollback plan, not a find-and-
replace. Until then the key is a legacy identifier that happens to spell an
old title, and the skills say so explicitly so no future run "fixes" it.

---

## 3. Stale files and dead weight

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
