# The overlap check — run it before drafting anything

**One copy, two skills.** Playbook ingests through two funnels feeding four
products that legitimately cover overlapping ground. The same story reaches the
newsroom twice all the time: a Reuters link and a Noticias item, or an Infinitas
edition and a digest brief two days apart. `articles.sourceUrl`'s unique index
does not catch any of it; it only stops the *same URL* being run twice.

**Do not draft until this call is made.** Deciding after a draft exists biases
the answer toward publishing it.

Run it on **every item, not every edition** — a digest with nine briefs is nine
checks.

```
node scripts/find-duplicates.mjs "<the item's headline or one-line topic>"
node scripts/find-duplicates.mjs --draft <path-to-draft.json>   # a whole batch
```

It scores the candidate against everything published and prints `MISMA
HISTORIA` (treat as a duplicate until proven otherwise) or `revisar` (open it
before drafting). No hits means clear.

**Query the story's CLAIM, not its colour.** (2026-08-28, the ESPN NFL-sedes
run.) The script scores on shared entities, so a query built from a story's
most vivid specifics buries the article it should have found. That run asked
"ejecutivos de la NFL evalúan Londres, Ciudad de México, Toronto y Berlín" —
four city names, all of them shared with unrelated pieces — and the top hit
came back at 23% on a Fanatics story, while the actual precursor, Playbook's
own piece on Goodell guaranteeing teams outside the US eleven days earlier,
never appeared. It surfaced only because a separate `priority`-precedent query
listed NFL rows by title. So run the check on the protagonist plus the core
claim ("Goodell / franquicia de la NFL fuera de Estados Unidos"), and on a
story that reads like a follow-up, **also query the DB by the protagonist
entity alone** before concluding nothing exists. A missed precursor does not
just cost a backlink: it lets a piece re-argue a read the site already
published, which is outcome A wearing outcome C's clothes.

The check doubles as the **follow-up detector**. When it surfaces an earlier
piece on the same running story, the new piece becomes a follow-up rather than
a fresh explainer that re-establishes everything from scratch — which changes
how it gets written (`voice-and-style.md` §10).

---

## The decision, in two questions

For every candidate the script surfaces, open the published article and ask, in
this order:

1. **Is it the same underlying event?** Not the same topic, the same *event*. A
   second story about Liga F is not a duplicate; the same rights deal is.
2. **Does the incoming source carry a fact the published article doesn't have?**

That gives four outcomes. Three of them mean no second article.

### A. Same event, nothing new → don't publish it

The story already lives on the site. This is what the newsroom already does by
hand: the 2026-08-04 Noticias edition carried a Netflix/Mundial Femenil brief
and pointed its "(Acá más info)" at the Infinitas article from two days earlier
instead of minting a second one. Skip the item and say so in the run report,
with the id of the article that covers it.

Which product keeps the story when both could claim it: the one whose vertical
it belongs to (a women's-sport story is Infinitas' even if a digest carried it
first), and on a tie, whoever published first.

### B. Same event, the source adds facts → upgrade the existing article

Still no second article. Fold the new facts into the published one where they
belong, and:

- **keep the original `date`** — the archive's chronology is a record, not a
  field to refresh — and let `updated_at` move on its own;
- update `title` and `excerpt` too if the new fact changes the claim they make,
  since the hubs and the homepage read them;
- if a figure in the published piece turns out to be wrong, correct it and
  **state the correction in one plain sentence inside the body** rather than
  silently overwriting it;
- keep the existing cover image unless the new source genuinely has a better
  one. Re-running the image search on an upgrade is wasted work.

Write the update the same way an insert is written (markdown → TipTap →
`bodyHtml`). `scripts/update-article.ts` does exactly that, patching only the
fields you give it and regenerating `body_json` + `body_html` together whenever
`bodyMarkdown` is present:

```
npx tsx --env-file=.env.local scripts/update-article.ts <fix.json> --dry-run
```

**Never hand-edit a stored `body_html` instead:** it is a cache of `body_json`,
and the two drifting apart is invisible until a deploy pulls the CSS out from
under whatever the HTML picked up (`format-tiers.md` §6, the render-time rule).

### C. A new development on a story already covered → a new article that links back

**The test:** the new piece must be able to state, in its own headline,
something that was not true when the earlier one ran. A rights auction opening
after an investment closed passes. "More reaction to the same deal" does not.

Then follow the back-link rule in `voice-and-style.md` §10: one inline link
inside a sentence that is already stating the new fact, never a paragraph that
narrates Playbook's own prior reporting.

**C can carry a correction to the earlier piece, and that is not outcome B**
(publisher, 2026-08-18, on the Buss family trust fight over the Lakers' last
17.8%). The four outcomes are exclusive about *minting a second article*, not
about leaving the archive asserting something the site itself now contradicts.
On a story that turns over inside a day, the earlier piece's `title` and
`excerpt` were written against a fact that has since become contested: the
2026-08-17 brief said Jeanie Buss "deja de ser gobernadora" and hours later
that outcome was under legal challenge. The follow-up passed C's headline test
cleanly, and the published piece still needed the qualifier.

So when the new development **contradicts or makes conditional** the claim the
earlier article's title or excerpt makes, C ships with a minimal correction on
that article: soften the title and excerpt to what is actually established, add
**one plain sentence** in the body stating the new development with the inline
link forward to the follow-up, and keep its original `date` (the same rules
outcome B already sets, applied to the fields the new fact touched, not a fold
of the whole story). Everything else about the earlier piece stays as
published. `scripts/update-article.ts` is the tool, same as for B.

### D. Same event, different product, genuinely different thesis → both may run, cross-linked

Infinitas asking what the Liga Femenil BBVA is building and Noticias reporting
its identity launch are two real pieces. The tiebreaker against outcome A is
strict: **if you cannot write the second piece's thesis without restating the
first piece's core fact, it is not a different angle — it is A.**

When both run, each must link the other, and neither may repeat the other's
central figure as if it were news.

---

## When the sources disagree

Two funnels on one story will sometimes carry different numbers. **The more
specific, better-attributed figure wins** (a company filing over a wire
summary, a wire over a newsletter brief). If the published article has the
weaker one, that is outcome B and the correction is part of the upgrade.

## If it was already published twice

Found after the fact, the fix depends on how long the duplicate has been live.

- **Inside about 48 hours:** fold its unique facts into the canonical piece and
  set the duplicate's `status` to `'draft'`, which unpublishes it.
- **Past that:** leave both up and cross-link them instead. A live URL may
  already be shared, and breaking it costs more than the duplication does.

Either way, say which one you did in the report.

## Reporting

Report the outcomes in the same breath as the publish confirmation, because an
edition where three of nine briefs were already covered looks like a thin run
otherwise. One line each: what was skipped and which article covers it, what
was folded into an existing piece, and what ran as a cross-linked second angle.
**A skipped item is work done, not work missing.**
