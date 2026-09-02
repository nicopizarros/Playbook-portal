# Ingestion — Playbook's own Substack editions

This is the only part of the pipeline that is specific to this funnel.
Everything downstream (voice, tiers, devices, fields, images) is shared with
`publish-sourced-article`.

---

## Step 1: Read the sources

Fetch every Substack URL given with **WebFetch**. It follows the
`open.substack.com` → `<pub>.substack.com` redirect automatically; re-fetch the
redirect URL it reports.

**One edition is many articles.** Each story in a Noticias or La Lana del
Deporte edition is a separate Playbook article.

Fetch each page **four times**, each pass asking for something different — one
combined ask reliably loses detail:

1. **Content.** The individual news items and their text.
2. **The exact publication date shown on the page.** Don't guess it from
   context; confirm it. `date` and `dateFormatted` both depend on it, and the
   weekday badge on /noticias derives from `date`.
3. **Structure.** Item order, exact headings, which items have an
   "Opinión"/editorial sentence vs. which are brief facts-only, and what outlet
   each item cites. These drive whether a La Lana piece supports a second
   Opinión and sharpen the `priority` call.
4. **Images.** Every image URL embedded in the post — the actual
   `substackcdn.com` / `substack-post-media.s3.amazonaws.com` **src**, not a
   description — the order they appear in, and which news item or section each
   one sits next to. This feeds the in-body image carry-over in
   `images.md` §2: every one of these (other than pure masthead/avatar chrome)
   gets carried into the relevant article's body, in that same order, never
   skipped and never used as the cover.

### For a La Lana ingest, WebFetch cannot satisfy the verbatim contract

(2026-08-28, the casas-de-apuestas edition.) WebFetch answers a prompt about a
page through a small model, so what comes back is a faithful *summary* — and
`format-tiers.md` §4 requires a La Lana edition to ship word-for-word, down to
the typos. Those two facts are incompatible, and the four-pass ask above does
not fix it: four summaries are still four summaries.

Pull the post's own stored HTML instead. Substack embeds the whole post in the
page as `window._preloads = JSON.parse("…")`; parse that, take the object
carrying `body_html`, and read `title`, `subtitle`, `post_date` and
`publishedBylines` off the same object rather than guessing them. Walking that
HTML block by block (`<p>`, `<h3>`, `<li>`, `<figure>`) gives the paragraphs,
the subheads, the promise-block bullets, the author's own bold and links, and
every `substackcdn.com` image src in document order — which is also everything
`images.md` §2's carry-over rule needs. Do the extraction with a script, never
by retyping: the value of the verbatim contract is that no sentence passes
through a paraphrase, and a hand-copied paragraph has already broken it.

Two things that extraction reliably gets wrong if you are not watching: a
naive `</p>` replace silently welds consecutive paragraphs into run-on blocks,
and the Opinión's bullets can collapse into the preceding text — count the
`<li>` elements against the rendered output before trusting it (that edition
had six: three promise-block questions and three Opinión bullets).

Then run the **overlap check** (`overlap-check.md`) on every item before
drafting anything.

---

## Step 2: Independent research

**Applies to Noticias and Infinitas items. Does NOT apply to La Lana del
Deporte** — its fact/analysis content tracks the source as written, never
supplemented with outside research (see the La Lana note at the bottom).

**Mandatory, always attempted, for every Noticias/Infinitas item.** Search for
at least one concrete fact the Substack brief doesn't fully spell out: a
number, a comparable deal size, a market or audience figure, relevant history
(prior similar deals, past precedents), a regulatory detail, or a quote from an
official source. Use WebSearch/WebFetch to find it from a reputable outlet
(wire services, established sports-business or general press, the
company's/league's own newsroom), not a random blog or forum.

Rules:

- **Fetch the actual source page and confirm the figure there.** Never take a
  search snippet at face value and never invent a number.
- **Only use it if it is genuinely additive** — context or scale the Substack
  item omitted, not a restatement of what's already there.
- **Write it as its own full block in Playbook's voice**, woven into the
  article's flow like any other block. Never a bare citation or a "según
  [fuente]" data dump bolted on. It becomes movement 2 of the four-movement structure
  (`format-tiers.md` §3).
- **The search itself must happen every time.** Don't skip it by default. If,
  after genuinely trying multiple angles, nothing solid can be verified, fall
  back to an additional genuine detail pulled straight from the source (a second
  figure, a second named party, more of its own context) so the movement still
  exists, just built from the source instead of outside research.
- It can also sharpen the `priority` call.

### Research the Mexico/LATAM angle too — don't reason your way to it

The Opinión reaches for a regional hook often enough that the temptation is to
derive it from the story's logic instead of checking. The full rule, the
falsification searches to run, and the 2026-08-05 worked example where the
inference was exactly backwards live in **`voice-and-style.md` §9**. Run those
searches in this step, alongside the fact search — the angle is research, not
drafting.

And per the same section: when the honest answer is that Mexico and LATAM have
no stake, closing on a global industry read is the **correct** outcome, not a
gap to paper over.

---

## Product-specific ingestion notes

**La Lana del Deporte.** Content stays exactly as it would without Step 2:
don't run outside research, and don't otherwise pad or alter what the source
says. The fact/analysis layers keep their existing length target, roughly
400–600 words.

The one addition: if a **second** Opinión de Playbook point is genuinely
supportable — a real second thing to say — add it, in the exact same register as
the first. If there isn't a genuine second point, leave the single one rather
than padding. (Note the shape: La Lana's Opinión is the `## La Opinión de
Playbook` heading with exactly three bullets, per `format-tiers.md` §4. "A
second Opinión paragraph" is guidance from when this product used the inline
form; today it means the third bullet must earn its place rather than repeat
the second.)

**TFBR.** Written in Spanish for the portal even though the source edition is
in English. Translate the argument, don't translate the sentences — a literal
rendering carries English cadence into Spanish prose. The edition's own closing
section belongs to Interticket and gets its own `## La visión de Interticket`
heading; TFBR carries no Opinión de Playbook at all.

**Features vs. briefs.** An edition's four short items are four-movement briefs at
`readingTime: 2`. Its lead feature is a different animal — it keeps its own
`##` sections, its quotes and its carried-over images, and lands nearer
900–1,100 words at `readingTime: 4`. Compressing a feature into the brief shape
is the mistake, not the compliance (`voice-and-style.md` §2, "never take away
length").

**What gets removed, ever.** Only the newsletter's own chrome — mastheads,
section-divider banners, "(Acá más info)" pointers — and material an overlap
check outcome says already lives on the site.
