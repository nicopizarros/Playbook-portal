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

## 2. Stale files and dead weight

**Status: verified, deliberately not deleted. Each is a judgment call the team
should make, not a cleanup an agent should do on its own.**

The unambiguous half was already removed on 2026-08-07 (14 MB of orphaned
`la-lana-torito-*` PNGs referenced by neither the repo nor the database, and
the CSS with no markup left behind it: the whole `.skel*` skeleton-loading
system from the pre-Next static site, `.rank-list`/`.rank-item`,
`.news-strip`, `.article-not-found`, `.btn.pulse-once`, `.tfbr-arrow-up`).
What is left is everything where "unused" and "unwanted" are not the same
question:

| item | size | why it was left |
| --- | --- | --- |
| `docs/playbook-portal-v24-medio-consulta(1).html` | 1.7 MB | Design prototype. The `(1)` suffix says it is a duplicate download, but it is also the most recent one. Historical design reference, not code. |
| `docs/playbook-portal-v23-medio-consulta.html` | 328 KB | Previous iteration of the same prototype. |
| `docs/playbook-ux-02-trafico-interno-ads.html` | 324 KB | UX study for internal traffic + ads. |
| `articles.json` + `content.json` | 64 KB | The pre-Postgres seed. Read only by `scripts/migrate-json-to-db.ts`, which ran once. Small, but a stale snapshot someone could re-run against the live DB by accident. |
| one-off `fix-*` / `update-*` scripts | ~40 KB | Already-executed migrations (`fix-lana-rebrand-content`, `fix-newsletter-success-copy`, `fix-testimonial-avatars`, `point-products-at-hubs`, `reassign-playbook-tag`, `strip-tfbr-opinion`, `seed-jugadas`, `backfill-article-standards`). They document what was done to the data and cost almost nothing to keep. |
| `scripts/update-matador-report.ts` | 2 KB | Superseded by `scripts/update-article.ts`, which does the same job generically. Safe to delete once nobody is mid-flight on it. |
| `public/assets/img/playbook-isotope-dark.png` | 12 KB | Unreferenced, but it is the dark half of a logo pair whose light half IS used. Deleting half a pair is worse than keeping 12 KB. |

Total recoverable: ~2.4 MB, almost all of it the three prototype HTML files.
None of it ships to the browser or affects the build; this is repo weight, not
page weight.

**Before deleting the prototypes**, check whether anyone still opens them as
design reference. Everything here is recoverable from git history, so the risk
is losing something people look up, not losing something that runs.
