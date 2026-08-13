# Publishing mechanics — publish-newsletter

No approval gate. This funnel publishes.

---

## Requirements before running

`POSTGRES_URL` must point at the production Neon database and be available to
the shell (exported, or in a local `.env.local` — see `.env.local.example`).

This session's outbound network only supports **HTTPS, not raw TCP**, so the
insert script uses Neon's HTTP driver. **Don't try to reconnect it to
`lib/db/client.ts`'s `pg` Pool** — that is TCP-only, works on Vercel, and does
not work from a sandboxed agent session.

---

## Publish

1. Write a JSON array of article objects to a scratch file. Shape:
   `title, excerpt, teaser, bodyMarkdown, author, date, dateFormatted,
   publication, source, tagsScope, tagsSport, tagsVertical, priority, featured,
   mostrarAutor, readingTime, substackUrl, sourceUrl, imageUrl, imageCredit`
   (`scripts/publish-newsletter.ts`'s `NewsletterArticleInput`). Field rules in
   `fields-and-taxonomy.md`.

2. Run:

   ```
   npx tsx --env-file=.env.local scripts/publish-newsletter.ts <path-to-json-file>
   ```

   (drop `--env-file` if `POSTGRES_URL` is already exported).

3. The script prints one line per article (`ok` / `duplicate`) plus a summary.
   It converts `bodyMarkdown` to a TipTap document (blank-line paragraphs,
   `## ` headings, `**bold**` spans, `![alt](url)` inline images), renders
   `bodyHtml` the same way the admin editor does, slugifies the title into the
   article `id` (retrying with a suffix on collision), and inserts with
   `status: 'published'` — **live immediately**.

   It adds nothing visual of its own. Every treatment is a render-time
   transform reading plain authoring conventions (`format-tiers.md` §6).

---

## Fixing a published body

Never hand-edit stored `body_html`: it is a cache of `body_json`, and the two
drifting apart is invisible until a deploy pulls the CSS out from under it.
Run the corrected `bodyMarkdown` back through the same pipeline:

```
npx tsx --env-file=.env.local scripts/update-article.ts <fix.json> --dry-run
```

It patches only the fields an entry carries, matched on `id` or `sourceUrl`,
and rebuilds `body_json` + `body_html` together whenever `bodyMarkdown` is
present. Drop `--dry-run` once the diff looks right. This is also the tool for
the overlap check's outcome B (folding new facts into an already-published
article).

---

## After publishing a la-lana article: the departures board

**Mandatory.** /la-lana's masthead is a departures board whose rows are the
CONNECTIONS the investigations uncovered, set as flights ("Isaac del Toro ↔ UAE
· EXP. 006 · Abierto"). What qualifies as a connection is editorial and lives
in `format-tiers.md` §4. The run steps:

1. Write `[{ "conexion": "A ↔ B", "articleId": "<the id the insert returned>" },
   …]` to a scratch JSON. As many rows per article as genuinely qualify,
   **capped at 2** (pick the two most central — one article can yield several,
   e.g. the AR Monex piece supports both its sponsor-pipeline route and its star
   rider). Zero is a valid answer for a piece about one actor.
2. Run:
   ```
   npx tsx scripts/update-lana-board.ts <file> --dry-run
   ```
   Check the printed board, then run again without `--dry-run`.
3. The script derives everything else — EXP. number, date, open/archived
   status, link — from the article row itself, and replaces a repeated
   connection instead of duplicating it. An unknown `articleId` is skipped with
   a warning, never invented around.
4. Board-wide it keeps only the **6 most recent curated rows**, so the marquee
   stays relevant. Don't try to preserve old rows manually.

---

## Report back

A short confirmation per article: title, id, and the live URL
(`https://playbook-portal-phi.vercel.app/articulo?id=<id>`). Not a re-print of
the full draft. If any came back `duplicate`, say so — it means that exact
story was already published from a prior run of this same link.

**Report the overlap-check outcomes in the same breath**, one line each: what
was skipped and which article covers it, what was folded into an existing
piece, what ran as a cross-linked second angle. An edition where three of nine
briefs were already covered looks like a thin run otherwise. A skipped item is
work done, not work missing.

**Flag, don't fix, an El Marcador supersession.** If an Infinitas item carries
a metric that beats one on /infinitas' scoreboard, say so in one line ("El
Marcador: la cifra X quedó superada por Y (fuente Z)") so editorial updates it
in the CMS deliberately. Don't edit the board as part of a publish run.

**Say what you couldn't satisfy.** No findable cover photo, no figure in a
figure-less story, a fact that couldn't be confirmed — one line in the report
rather than silently shipping the gap.

---

## Capture feedback for next time, automatically

This skill has no review gate, but the person who asked for the run often
reacts afterward — a tone note, a correction, a "don't do X again." That
reaction is exactly the kind of lesson that should stick permanently instead of
being re-explained on some future run.

1. Ask whether the correction is **durable and generalizable** (would it help
   write the *next* article, on some other topic?) or specific to this one
   article (a fact, a word choice, a one-off structural call). Only the former
   is worth capturing. Article-specific corrections get skipped silently.
2. **Fold it into the right file, not into this one by default.** The
   restructure exists so a lesson lands where it applies:
   - a voice, rhythm, opinion or language rule → `voice-and-style.md`
   - a length, product-architecture or render-contract rule → `format-tiers.md`
   - a device syntax, budget or when-to-use rule → `dynamic-element-library.md`
   - a dedupe judgment → `overlap-check.md`
   - a field, taxonomy or ranking rule → `fields-and-taxonomy.md`
   - an image sourcing or crop rule → `images.md`
   - a Substack-parsing or research-pass lesson → `ingestion.md`
   - a script, gate or reporting lesson → this file

   **Those six shared files are symlinks — editing one changes both skills, which
   is the point.** A Playbook-wide voice rule no longer needs to be written
   twice. Only edit a per-skill file when the lesson genuinely does not apply to
   the other funnel. **Read `references/_GOVERNANCE.md` before editing the
   shared tree** — it carries the placement rules, the no-duplication rule and
   the convergence check every change ships with.

3. Write it in the same dense-prose style as the rest of the document — explain
   the *why*, don't just add a bullet command — placed where it is most
   load-bearing, not appended at the end. Date it and name the source of the
   directive, the way every other entry does: these files get re-litigated, and
   an undated rule loses to a dated one.

4. Run:
   ```
   scripts/sync-skill-feedback.sh "<one-line summary of the lesson>"
   ```
   to push straight to `main`. Do this **without asking for confirmation** —
   it only ever touches `.claude/` skill content, never application code, so it
   doesn't carry the deploy risk a normal code change would. If it reports
   nothing to push, that's fine.

5. Mention in one sentence if you updated the skill. This should stay quiet and
   routine, not a production.
