# TODO

Open items nobody is working on right now. Each one says what it is, why it
was left, and what has to be true before it's worth doing — so picking one up
doesn't start with re-deriving the context.

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

Deleted (all recoverable from git history):

- `scripts/update-matador-report.ts` — the table itself said "safe to
  delete once nobody is mid-flight on it"; nobody was.
- `articles.json` + `content.json` — the pre-Postgres seed whose only
  remaining property was the risk of someone re-running
  `scripts/migrate-json-to-db.ts` against the live DB by accident. The
  script stays as the historical record; without its inputs it now fails
  loudly instead of silently reseeding.

Deliberately still here, because "unused" and "unwanted" are different
questions and an autonomous session can't confirm nobody opens them:

| item | size | the open question |
| --- | --- | --- |
| `docs/playbook-portal-v24-medio-consulta(1).html` | 1.7 MB | Most recent design prototype — still consulted as reference? |
| `docs/playbook-portal-v23-medio-consulta.html` | 328 KB | Previous iteration of the same prototype. |
| `docs/playbook-ux-02-trafico-interno-ads.html` | 324 KB | UX study for internal traffic + ads. |
| remaining one-off `fix-*` / `update-*` scripts | ~40 KB | They document what was done to the data; cost nothing to keep. |
| `public/assets/img/playbook-isotope-dark.png` | 12 KB | Dark half of a logo pair whose light half IS used. |

If the team confirms the prototypes are no longer opened, deleting the
three HTML files recovers ~2.3 MB of repo weight (none of it ships to the
browser).
