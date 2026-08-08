---
name: publish-newsletter
description: Turn one or more Playbook Substack newsletter links into articles and publish them live to the Playbook site, with zero human review. Use when asked to process, draft, or publish a Substack link (Noticias, La Lana del Deporte, Infinitas) into Playbook.
---

# Publish Newsletter: Substack link to live article, no human in the loop

This is the automated editorial pipeline for Playbook, a Spanish-language sports
business media brand for Mexico/LATAM. Given one or more Substack URLs, this
skill fetches them, drafts each individual news item as a full Playbook
article, and inserts it directly into the production database as
`status: 'published'`. It goes live immediately: there is no draft/review
step and no human copy-pastes anything. Only run this when the user actually
wants that (asking "draft this" without publishing intent means: do steps 1-5
below and show the drafts, skip step 6).

## Requirements before running

`POSTGRES_URL` must point at the production Neon database and be available to
the shell (either exported in the environment, or in a local `.env.local`,
see `.env.local.example`). This session's/agent's outbound network only
supports HTTPS, not raw TCP, so the insert script uses Neon's HTTP driver.
Don't try to reconnect it to `lib/db/client.ts`'s `pg` Pool (TCP-only, works on
Vercel, does not work from a sandboxed agent session).

## Step 0: The overlap check (run it before drafting anything)

Playbook ingests through two funnels — this skill for the Substack editions,
`publish-sourced-article` for third-party links — feeding four products that
legitimately cover overlapping ground. The same story reaches the newsroom
twice all the time: a Reuters link and a Noticias item, or an
Infinitas edition and a digest brief two days apart. `articles.sourceUrl`'s
unique index does not catch any of it; it only stops the *same URL* being run
twice.

Run this on **every item, not every edition** — a digest with nine briefs is
nine checks:

```
node scripts/find-duplicates.mjs "<the item's headline or one-line topic>"
node scripts/find-duplicates.mjs --draft <path-to-draft.json>   # a whole batch
```

It scores the candidate against everything published and prints `MISMA
HISTORIA` (treat as a duplicate until proven otherwise) or `revisar` (open it
before drafting). No hits means clear.

### The decision, in two questions

For every candidate the script surfaces, open the published article and ask,
in this order:

1. **Is it the same underlying event?** Not the same topic, the same event. A
   second story about Liga F is not a duplicate; the same rights deal is.
2. **Does the incoming source carry a fact the published article doesn't
   have?**

That gives four outcomes. Three of them mean no second article.

**A. Same event, nothing new → don't publish it.** The story already lives on
the site. This is what the newsroom already does by hand: the 2026-08-04
Noticias edition carried a Netflix/Mundial Femenil brief and pointed
its "(Acá más info)" at the Infinitas article from two days earlier instead
of minting a second one. Skip the item and say so in the run report, with the
id of the article that covers it.

Which product keeps the story when both could claim it: the one whose
vertical it belongs to (a women's-sport story is Infinitas' even if a digest
carried it first), and on a tie, whoever published first.

**B. Same event, the source adds facts → upgrade the existing article.** Still
no second article. Fold the new facts into the published one where they
belong, and:

- keep the original `date` — the archive's chronology is a record, not a
  field to refresh — and let `updated_at` move on its own;
- update `title` and `excerpt` too if the new fact changes the claim they
  make, since the hubs and the homepage read them;
- if a figure in the published piece turns out to be wrong, correct it and
  state the correction in one plain sentence inside the body rather than
  silently overwriting it;
- keep the existing cover image unless the new source genuinely has a better
  one. Re-running the Step 5a search on an upgrade is wasted work.

Write the update the same way an insert is written (markdown → TipTap →
`bodyHtml`) — `scripts/update-article.ts` does exactly that, patching only
the fields you give it and regenerating `body_json` + `body_html` together
whenever `bodyMarkdown` is present:

```
npx tsx --env-file=.env.local scripts/update-article.ts <fix.json> --dry-run
```

Never hand-edit a stored `body_html` instead: it is a cache of `body_json`,
and the two drifting apart is invisible until a deploy pulls the CSS out
from under whatever the HTML picked up (see Step 3's render-time rule).

**C. A new development on a story already covered → a new article that links
back.** The test: the new piece must be able to state, in its own headline,
something that was not true when the earlier one ran. A rights auction
opening after an investment closed passes. "More reaction to the same deal"
does not. Then follow the existing back-link rule in Step 3: one inline link
inside a sentence that is already stating the new fact, never a paragraph
that narrates Playbook's own prior reporting.

**D. Same event, different product, genuinely different thesis → both may
run, and each must link the other.** Infinitas asking what the Liga Femenil
BBVA is building and Noticias reporting its identity launch are two real
pieces. The tiebreaker against outcome A is strict: **if you cannot write the
second piece's thesis without restating the first piece's core fact, it is
not a different angle — it is A.** When both run, neither may repeat the
other's central figure as if it were news.

### When the sources disagree

Two funnels on one story will sometimes carry different numbers. The more
specific, better-attributed figure wins (a company filing over a wire
summary, a wire over a newsletter brief). If the published article has the
weaker one, that is outcome B and the correction is part of the upgrade.

### If it was already published twice

Found after the fact, the fix depends on how long the duplicate has been
live. Inside about 48 hours, fold its unique facts into the canonical piece
and set the duplicate's `status` to `'draft'`, which unpublishes it. Past
that, leave both up and cross-link them instead: a live URL may already be
shared, and breaking it costs more than the duplication does. Either way, say
which one you did in the report.

## Step 1: Read the sources

Fetch every Substack URL given (use WebFetch; it follows the `open.substack.com`
to `<pub>.substack.com` redirect automatically, re-fetch the redirect URL it
reports). For each edition, identify individual news items: each story in an
Noticias or La Lana del Deporte edition is a separate article. Also
fetch the page a second time asking specifically for the exact publication
date shown, and a third time asking for item order, exact headings, which
items have an "Opinión"/editorial sentence vs. which are brief facts-only, and
what outlet each item cites. These details drive whether a La Lana piece
supports a second Opinión paragraph (Step 3) and the Importancia call
below. Don't guess the publish date from context; confirm it from the page.
Fetch the page a fourth time asking specifically for every image URL embedded
in the post (the actual `substackcdn.com` / `substack-post-media.s3.amazonaws.com`
src, not a description of the image), the order they appear in, and which
news item/section each one sits next to. This feeds Step 5b: every one of
these (other than pure masthead/avatar chrome) always gets carried over into
the relevant article's body, in that same order, never skipped and never
used as the cover image.

## Step 2: Independent research

Applies to Noticias and Infinitas items. Does **not** apply to La Lana
del Mundial: its fact/analysis content tracks the source as written, never
supplemented with outside research (see Step 3's La Lana section).

Mandatory, always attempted, for every Noticias/Infinitas item: search
for at least one concrete fact the Substack brief doesn't fully spell out, a
number, a comparable deal size, a market/audience figure, relevant history
(prior similar deals, past precedents), a regulatory detail, or a quote from
an official source. Use WebSearch/WebFetch to find it from a reputable
outlet (wire services, established sports-business or general press, the
company's/league's own newsroom), not a random blog or forum.

Rules:
- Fetch the actual source page and confirm the figure/fact there. Never take
  a search-snippet at face value and never invent a number.
- Only use it if it's genuinely additive, context or scale the Substack item
  omitted, not a restatement of what's already there.
- Write it as its own full paragraph in Playbook's voice (Step 3's tone),
  woven into the article's flow like any other paragraph, never a bare
  citation or a "según [fuente]" data dump bolted on.
- The search itself must happen every time, don't skip it by default. If,
  after genuinely trying multiple angles, nothing solid can be verified,
  fall back to an additional genuine detail pulled straight from the source
  (a second figure, a second named party, more of its own context) so the
  paragraph still exists, just built from the source instead of outside
  research.
- This research is always paragraph 2 of Step 3's structure below, and can
  sharpen the priority/Importancia call in Step 4.
- **Research the Mexico/LATAM angle too, don't reason your way to it.** The
  Opinión paragraph almost always reaches for a regional hook, and the
  temptation is to derive it from the story's logic (a league is shrinking,
  therefore its Mexican stop is presumably at risk) instead of checking. On
  2026-08-05 that inference was exactly backwards: the venue's next edition
  had already been confirmed by the league months earlier, which made the
  real angle the opposite of the drafted one. Before writing the Opinión,
  run the searches that would falsify it: does this league/competition
  actually play in Mexico, at which venue, is the next edition confirmed,
  who is the local commercial partner, and which Mexican or LATAM athletes
  are involved. Those specifics (a named club, a named promoter, named
  players and their team) are also what turns a generic "esto importa para
  la región" closer into something a reader can't get elsewhere.

## Step 3: Editorial voice

### The uniformity contract — read this before drafting a word

Several sessions publish through this skill, and readers see the output as
one publication. Everything below is what makes four products look like one
masthead; none of it is a stylistic preference to re-derive per run. The
failure mode is real and recent: a 2026-08-07 La Lana piece shipped as 50
standalone beats with no lead-ins, no devices and no promise block, next to
a Noticias piece carrying all three, and read as a different site.

| | Noticias (`industry-shots`) · Infinitas | La Lana del Deporte | TFBR |
|---|---|---|---|
| **Body shape** | 4 paragraphs, fixed | cold open → promise block → 6-8 `##` sections → Opinión | free-form essay, one idea |
| **Blocks** | 80-100 words each | 80-100 words each, 1-2 per section | 80-100 words each |
| **Bold lead-in** | every paragraph | every block inside a `##` section | every block |
| **Closing take** | `**Opinión de Playbook:**` paragraph | `## La Opinión de Playbook` + exactly 3 bullets | none, `## La visión de Interticket` instead |
| **Devices** | budget by length + priority | same budget | same budget |
| **Length** | 300-500 words | 400-600 (guest essays run longer) | as the edition runs |

Never carrying a lead-in, in any product: the cold open, device
declarations, `Foto: Playbook` captions, and the Opinión bullets.

**What the page does with all this, so nobody rebuilds it by hand.** Every
visual treatment is a RENDER-time transform reading plain authoring
conventions — write the markdown, get the design:

- `**Label:**` at the start of a block → a product-colored scan mark, and on
  Noticias and La Lana a numbered beat (`01`, `02`) down the margin.
- `**70%**` (a bold span that is only a figure) → counts up on scroll.
  Money and percentages in plain prose → an automatic marker highlight.
- The closing take, in EITHER shape → the green fenced callout, signed with
  the product's own mark: the Playbook bracket for Noticias (the same
  symbol that closes the body), a stack of coins for La Lana, the
  lemniscate for Infinitas, a forward arrow for TFBR (`--isotope-bracket`
  and the `--mark-*` tokens in `styles/tokens.css`).
- `Cifra clave:` / `Jugada:` / the seven other device lines → their designed
  elements, within budget.

Corollary, learned the hard way: **never post-process the HTML at publish
time to fake any of this.** See the render-time rule further down this step.

### The rhythm (publisher directive, 2026-08-06, round 2 — supersedes the archive measurement)

Playbook's portal articles are written as **four substantial blocks**, one
per movement of the structure below, at roughly **80-100 words each**. That
is the shape the site has been publishing, and it is the shape to write.

A short-beat experiment ran earlier the same day and was reversed after a
single article shipped in it. That version split every movement into two or
three paragraphs of 25-35 words with standalone hammer lines between them;
on the article page it read choppy and it undercut the calm analytical
register the brief format depends on. Don't reach for it again, and don't
re-derive it from the numbers in the next paragraph.

Worth stating plainly so the reversal isn't mistaken for an oversight: a
2026-08-06 measurement of the Substack archive's editorial-viewpoint prose
(La Lana, TFBR, the weekly essays, headings and bullets excluded) does put
its median paragraph near 30 words, not 90. That measurement is real and it
describes **the newsletter**. The portal is a different product with a
different reading posture, and its four-block brief is a deliberate
editorial choice rather than drift away from the newsletter's rhythm. If the
two are ever meant to converge, that is the publisher's call to make
explicitly, not something to infer from the newsletter numbers.

Two things hold regardless of paragraph length:

**The hammer line.** Land one short, flat sentence that states the
conclusion the evidence just earned, at the point where the reader has been
given enough to agree with it. Inside the block, as its last sentence, not
promoted to a paragraph of its own. Real ones from the archive:

- *Las sedes reciben la vitrina. FIFA vende la vitrina.*
- *No todo lo que se puede vender conviene venderlo.*
- *Mover dinero no es quedarse con él.*
- *Sin aceptación ciudadana, el discurso de grandes eventos se desgasta rápido.*

They work because they come **after** the evidence, never before. The same
line opening a section is a slogan; after two sentences of figures it is a
verdict.

**Headings and lead-ins are arguments, not labels.** Every La Lana heading
in the archive states a position: *"Mover dinero no es quedarse con él"*,
*"El descanso se volvió inventario"*, *"Sobrevivir no es salir limpio"*.
None is a topic label like "Contexto" or "El acuerdo". The same standard
applies to the bold lead-ins: prefer *"**El precio real:**"* over
*"**El acuerdo:**"*.

`scripts/check-voice.mjs` is retuned to this format: it now flags only
runaway blocks (past ~130 words, which are two movements fused) and still
enforces the em-dash ban and the one-negative-parallelism-per-piece cap. It
no longer asks for short beats or standalone hammer paragraphs.

### Noticias / Infinitas

Every article is four paragraphs, always: three paragraphs of information,
then a separate Opinión de Playbook paragraph.

1. Fact paragraph: what happened, who, the key numbers, source context.
2. Independent research paragraph (Step 2, mandatory): the data point,
   comparison, or history the Substack brief didn't have, in Playbook's
   voice, not a citation dump.
3. Detail paragraph: more from the source itself, background, mechanics,
   additional named parties, why it happened, whatever rounds the story out.
4. Opinión de Playbook: what it means for the industry, always with a Mexico
   or LATAM angle when relevant. Always present, every article, in the same
   direct/analytical register as the rest, grounded in what's actually in
   the piece rather than reaching for a take that isn't there.

No exceptions to the four-paragraph structure: a "brief, no real angle"
story still gets all four, it just stays tight and grounded rather than
padded or invented.

If an item is itself a follow-up to a story Playbook already covered (a
prior Noticias/Infinitas item, findable by querying the DB), don't
re-explain what that earlier piece established, link back to it inline
from within a sentence that's stating the new fact (`/articulo?id=<id>`),
and never open a paragraph narrating that Playbook covered it before
("Horas después de que Playbook reportó..." reads as the outlet talking
about itself rather than the news). See `publish-sourced-article`'s Step 3
for the fuller treatment of this, it comes up more often there.

Readability: every paragraph, not only the Opinión one, opens with a short
bold lead-in (2-5 words, ending in a colon, e.g. `**El plan:**`,
`**El comparativo:**`, `**Los números:**`), specific to what that paragraph
covers, not a generic repeated label. Four paragraphs of unbroken prose
read as one dense block on the article page (font size and line height
leave no visual break beyond the paragraph gap); the bold lead-in gives a
reader something to scan before committing to the paragraph, the same way
`**Opinión de Playbook:**` already does for the fourth. Vary the lead-in's
wording per article rather than reusing the same word in every piece.

Word-count range: roughly 300-500 words across the four paragraphs.

### La Lana del Deporte

Content stays exactly as it would without Step 2: don't run outside
research on La Lana pieces, and don't otherwise pad or alter what the
source says. The fact/analysis layers keep their existing length target,
roughly 400-600 words, unchanged.

The one addition: if a second Opinión de Playbook paragraph is genuinely
supportable, i.e. there's a real second point to make, add it, in the exact
same tone and voice as the first (direct, analytical, same Mexico/LATAM
lens where relevant), not filler stretched to hit a length. If there isn't
a genuine second point, leave the single Opinión paragraph as before rather
than padding it.

**La Lana's architecture is fixed — reproduce it (measured 2026-08-06:
present in 8 of 8 published editions).** These pieces are not free-form
long-form. They run the same four movements every time, and a La Lana
article that doesn't wear this shape isn't one.
`docs/la-lana-article-spec.md` is the same four movements plus the fields,
the device budget and the post-publish board step as a walkable checklist —
read it back against the piece once it's live, which is when the misses
(2026-08-07: promise block skipped, zero devices, no figure in the excerpt,
board never updated) are still cheap to fix:

1. **The cold open.** Two to four short paragraphs that put the tension on
   the table in the first line. No scene-setting, no "en los últimos años".
   *"Las pausas de hidratación llegaron al Mundial con una explicación fácil
   de comprar: calor, humedad y cuidado de los jugadores."* Then the turn:
   *"Pero bastaron unos partidos para que la conversación cambiara."*
2. **The promise block**, verbatim in this wording, followed by exactly
   three questions the piece will answer:
   `Si lees este artículo podrás responder las siguientes preguntas:`
   The questions are the reader's, not the newsroom's: *"¿Por qué FIFA hizo
   obligatorias las pausas?"*, *"¿Esta medida se queda o es una rareza del
   Mundial 2026?"*. Write them as a markdown bullet list.
3. **Six to eight `##` sections**, each heading an argument (see the
   headings rule above). **Inside a section: one or two substantial blocks
   of 80-100 words, each opening with its own bold lead-in** — the same
   `**El costo de entrar:**` shape the short products use on every
   paragraph, applied per block rather than per sentence, which is what
   makes a long piece scan like the rest of the catalog instead of like a
   different publication. The lead-ins render as product-colored scan marks
   (`markLeadIns`), so a reader skims the whole argument off them; that
   also means they have to be specific and never repeat across the piece.
   Only four kinds of paragraph go without one: the cold open, the device
   declarations, the `Foto: Playbook` captions and the Opinión bullets.
   A section written as eight standalone 20-word beats has the same words
   and none of the structure — that is the short-beat format the publisher
   reversed (see the rhythm section above), and it is what the 2026-08-07
   guest piece shipped in before it was reformatted.
   The sections carry the reporting: named parties,
   figures against comparable figures, what each actor did differently.
   Where the piece does arithmetic, do it out loud and invite the reader in
   — *"Analicemos esto: En 104 partidos, dos pausas de tres minutos por
   juego significan 624 minutos nuevos de inventario potencial."*
4. **`## La Opinión de Playbook`, exactly three bullets.** Not two, not
   four, and written as a markdown list, not as loose paragraphs. One point
   per bullet: what the story established, who read it best or worst, and
   what has to hold for the thing to keep working. `**Opinión de
   Playbook:**` as an inline lead-in is for the short products; La Lana uses
   the heading form.

   The Opinión is the most metrically uniform thing Playbook writes, and it
   is worth matching exactly: across the 2026 editions its bullets run
   **p25 30, median 33, p75 37 words — zero under 15, zero over 60.** No
   hammer lines here and no blocks either. The register is even and
   declarative, three verdicts of the same weight; a one-line zinger in this
   position reads as a tweet, and a 70-word bullet reads as a fourth section
   that lost its heading.

`Por eso` is La Lana's closing connector (the densest in the archive,
0.84 per 1,000 words) — it earns a conclusion off the preceding section.
Use it where you've actually just proven something.

### The Futbol Business Review

TFBR is ghostwritten by Playbook for Interticket and it is the most
distilled version of the house mind: no news peg, no figures parade, one
commercial idea taken apart until it's obvious. Written in Spanish for the
portal even though the source edition is in English.

The move that defines it is **definitional antithesis**, and it is denser
here than anywhere else in the archive (1.38 per 1,000 words): name the
thing the reader assumes it is, reject it in a short sentence, then say
what it actually is in the next one. From the real editions:

- *"The difference is not who has access to football, it is who can make
  that access make sense faster."*
- *"The strongest opportunities are not always the biggest. They are the
  ones where the brand has a clearer role and a better reason to be there."*
- *"It comes from understanding that these matches are not just games. They
  are cultural events."*

In Spanish that is *"La diferencia no está en quién tiene acceso al futbol,
está en quién puede volverlo útil más rápido."* Place it at the thesis
beat — the sentence the whole piece exists to earn — and only once (see the
negative-parallelism cap below; the cap and this move are the same rule seen
from two sides: used once at the thesis it IS the voice, used four times it
is a tic).

Other TFBR habits worth keeping: the piece argues from operator experience
rather than from data it just looked up (*"la experiencia acumulada en
varias campañas apunta a una realidad consistente"*), and it closes on the
practical test a reader can run tomorrow (*"Antes de colgar tu activo del
Mundial, intenta venderlo sin mencionarlo"*).

Attribution matters on this product: the edition's own closing section
belongs to the partner. Render it under its own `## La visión de
Interticket` heading and never fold it into a Playbook opinion. Per
editorial decision 2026-08-06, TFBR articles carry **no** `Opinión de
Playbook` paragraph at all — the analysis is the author's and it already
closes with the partner's read.

### The product hub pages read the body (2026-08-05)

Each product now has its own front page (`/noticias`, `/la-lana`,
`/infinitas`, `/futbol-business-review` — see `lib/product-hubs.ts`) that
updates itself from the DB within ~60 seconds of an insert: nothing in
this skill needs to "add the article to the hub". But the hubs and the
article template read three things out of what this skill writes, so get
them right at drafting time:

- **The `**Opinión de Playbook:**` lead-in is load-bearing.** On every
  product article, the article page detects that exact lead-in and renders
  the paragraph as a visually fenced opinion callout (the explicit
  fact/opinion separation). Keep the wording exactly `Opinión de
  Playbook:` — don't ever restyle it to "Nuestra opinión", "El análisis
  de Playbook", or similar, and don't fold the opinion into another
  paragraph. This already matched the standard structure above; it is now
  also a UI contract.
  **Both shapes get the same box (2026-08-07).** La Lana's `## La Opinión
  de Playbook` heading plus its three bullets is detected too, so the
  closing take is one recognizable green-fenced element across every
  product instead of a branded box on Noticias and a bare subhead on La
  Lana. Write whichever shape the product calls for as plain markdown and
  the callout appears; the heading is replaced by the callout's own
  kicker, so don't repeat the label inside the bullets.
  **Each product signs the box with its own mark**, set in CSS from the
  `--mark-*` tokens (`styles/tokens.css`) and picked by the article's
  `source`: the Playbook bracket for Noticias, coins for La Lana, the
  lemniscate for Infinitas, a forward arrow for TFBR. Nothing to write at drafting time —
  getting `publication`/`source` right (Step 4) is what selects the mark,
  which is one more reason a wrong source pair is a visible mistake and
  not just a filing error.
- **Body presentation is decided at RENDER time, never at publish time
  (2026-08-07).** Everything in this section is a plain authoring
  convention that `app/(public)/articulo/page.tsx`'s transform chain turns
  into markup as the page renders. `scripts/publish-newsletter.ts` converts
  markdown to TipTap and renders that TipTap to HTML; it adds nothing of
  its own. Never reach for a publish-time HTML post-processor to give a
  body some new visual treatment — a `wrapOpinionBox` that wrapped the
  closing take in a green `<div>` did exactly that, unaware the article
  page already had `markOpinionCallout` doing the same job per-product
  tinted, and shipped nested `<div class="opinion-box"><aside
  class="shot-opinion">` markup. Two things make render-time the only
  correct place: the treatment applies to the whole existing catalog with
  zero re-editing, and it can be changed or reverted without touching a
  single stored row. A wrapper written into `body_html` outlives the code
  that wrote it — when that revert landed, the dead `<div>` stayed baked
  into the live article with no stylesheet behind it. If a body genuinely
  needs a new element, it becomes a device in `lib/article-devices.ts` or
  `lib/product-hubs.ts`, driven by a plain paragraph convention.
- **Fixing a published body: regenerate it, never hand-edit the HTML.**
  `body_html` is a cache of `body_json`, and the two silently drifting
  apart is what left that dead wrapper live. Run the corrected
  `bodyMarkdown` back through the same pipeline the insert uses:
  `npx tsx --env-file=.env.local scripts/update-article.ts <fix.json>`
  (`--dry-run` first; it patches only the fields an entry carries, matched
  on `id` or `sourceUrl`, and rebuilds `body_json` + `body_html` together
  whenever `bodyMarkdown` is present). This is also the tool for Step 0's
  outcome B, folding new facts into an already-published article.
- **La Lana: the money trail.** When (and only when) a La Lana story
  genuinely traces money moving between named places — a fee flowing from
  a country to a federation's HQ, a sale crossing borders, an investor
  entering from abroad — add one plain paragraph on its own line in
  `bodyMarkdown`, at the point in the story where that flow is described:
  `Ruta del dinero: México → Zúrich → Riad` (2 to 5 stops, `→` between
  them, short place names). The article page replaces that paragraph with
  an animated route line that draws itself as the reader scrolls. Never
  invent a route the story doesn't state, and never add more than one per
  article. Stories with no geographic flow simply don't get one.
- **La Lana: the hero figure.** The hub's case-file hero pulls the
  story's single biggest number out of `title` + `excerpt` (e.g.
  "€3M/año", "US$9,612m", "MX$42.8 millones") and displays it huge. When
  the story has a defining figure, make sure it appears verbatim in the
  title or the excerpt — not only buried in a middle paragraph — or the
  hero renders without its hook.
- **La Lana: the departures board (mandatory step after publishing).**
  /la-lana's masthead is a departures board whose rows are the
  CONNECTIONS the investigations uncovered, set as flights ("Isaac del
  Toro ↔ UAE · EXP. 006 · Abierto"). After inserting la-lana articles,
  extract each piece's connections and push them to the board:
    1. A connection is a two-party relationship the piece actually
       DOCUMENTS as central to the case — a person/org/company/place
       pair whose link is the story ("AR Monex ↔ Europa", "Infantino ↔
       UEFA y Concacaf"). Not every named entity qualifies: if the piece
       doesn't establish the relationship, it's not a row. Zero
       connections is a valid answer for a piece that's about one actor.
    2. Per article: as many as genuinely qualify, capped at 2 (pick the
       two most central — one article CAN yield several, e.g. the AR
       Monex piece supports both its sponsor-pipeline route and its star
       rider). Board-wide, `scripts/update-lana-board.ts` keeps only the
       6 most recent curated rows, so the marquee stays relevant instead
       of bulky — don't try to preserve old rows manually.
    3. Write `[{ "conexion": "A ↔ B", "articleId": "<the id the insert
       returned>" }, …]` to a scratch JSON and run
       `npx tsx scripts/update-lana-board.ts <file> --dry-run`, check the
       printed board, then run without `--dry-run`. The script derives
       everything else (EXP. number, date, open/archived status, link)
       from the article row itself and replaces a repeated connection
       instead of duplicating it; an unknown articleId is skipped with a
       warning, never invented around.
    4. Use "↔" for two-way relationships and "→" only when the piece
       describes a one-way flow. Keep each side short (1-3 words) — the
       board is a flap panel, not a sentence.
- **All products: the "Cifra clave:" pull-figure beat (2026-08-05).** A
  plain paragraph on its own line in `bodyMarkdown` of the form
  `Cifra clave: US$720 millones — el valor del nuevo espacio comercial`
  renders as a full-bleed pull-figure on the article page: the number set
  huge between rules, counting up as the reader reaches it, with the text
  after the ` — ` (dash with spaces; optional) as its caption. Rules:
  the value must contain a digit and stay short (≤24 characters — longer
  values are left as ordinary text); use it when a story has ONE defining
  number that deserves a full visual stop, typically 0-1 per article
  (more is legal but dilutes the beat); never restate the figure in the
  neighboring paragraph — the beat replaces the sentence, not decorates
  it. Separately, any `**bold**` span in body text that is purely a
  figure ("US$9,612 millones", "22%") counts up inline automatically —
  no syntax needed, just keep bolding key figures as the standard
  structure already asks.
  - **The Cifra clave must be the STORY'S OWN figure, never a context
    figure** (calibrated on real output, 2026-08-05: the LIV Golf piece
    led its excerpt with the PIF's historical "6,000 millones" — context
    — while the story's actual figure, the rumored US$250M investment,
    sat unmarked mid-body; the homepage surfaced the wrong number). Ask:
    "if the reader remembers one number from this story, which is it?"
    That's the Cifra clave. A rumored or unconfirmed figure still
    qualifies when it IS the story — declare it with the attribution in
    the caption ("La inversión que reporta el New York Post; LIV no la
    confirma"), never in the value.
  - **The homepage reads this beat.** "La cifra del día" (sidebar) picks
    the top ranked story with a figure and PREFERS its declared Cifra
    clave over anything scraped from title/excerpt — declaring the beat
    is how you control what number represents the story site-wide.
  - **The caption has to work away from the article too (2026-08-07).**
    The rail prints it under the chip, where it is the only thing telling
    a reader what the number measures — a figure alone reads as a price
    with no unit ("US$8,000 a US$20,000" under a headline about talent
    factories). So write the caption to NAME the thing, not to lean on
    the sentence it came from: "el costo anual del futbol juvenil de alto
    nivel en Estados Unidos", not "lo que cuesta". A caption is optional
    to the parser and mandatory in practice; a Cifra clave declared
    without one ships a bare number to the homepage.
  - **Write figures with their currency symbol** in the house shapes
    ("US$250 millones", "MX$42.8 millones", "€3M") — never spelled out
    ("250 millones de dólares"): every extractor ranks symbol-prefixed
    money above bare counts, so the spelled-out form loses to any bare
    number that appears earlier.
- **All products: the "Jugada:" connection strip (2026-08-05, round 2).**
  A plain paragraph `Jugada: Volkswagen ↔ Bayern` renders as a split-flap
  connection strip — the story's central two-party relationship in the
  departures-board language. Use it when the story IS a relationship
  (a deal, a partnership, an investigation pairing, an acquisition):
  `↔` for two-way relationships, `→` for a one-way flow (an expansion, a
  sale, a rights move). Each side 1-4 words, ≤32 characters (longer
  leaves the paragraph as plain text). At most ONE per article, and only
  when the pairing is documented by the piece itself — same "never invent
  links" standard as the La Lana board. Placement: right after the
  paragraph that establishes the relationship, usually the first. A
  figure-driven story should prefer "Cifra clave:" — don't stack both
  unless the story genuinely carries both a defining number AND a
  defining pairing. For la-lana articles the jugada usually matches a
  connection you're also pushing to the departures board — same wording
  in both places.
- **All products: the device collection (2026-08-05, round 3) — pick by
  story shape.** Beyond Cifra clave and Jugada, seven more one-paragraph
  conventions render as designed, animated elements (see
  `lib/article-devices.ts`; all product-tinted, all inert if malformed).
  Syntax rules shared by all: items separated by ` · ` (spaced middle
  dot), key—value separated by ` — ` (spaced dash), plain paragraph on
  its own line:
    - `Cronología: 2022 — PIF entra · 2024 — recorte · 2026 — salida` →
      a drawn timeline. For sagas: a deal, feud or decline that unfolds
      over dated milestones (2-6, dates ≤14 chars, events ≤70). **The
      6-item ceiling is a hard code limit, not a stylistic suggestion**
      (`parseTimeline` in `lib/article-devices.ts` returns null past 6,
      and the layout it feeds is a single-row flexbox sized for a small
      count — more items just squeeze narrower, it doesn't wrap or
      scroll). Two directions follow from that, both from a real case
      (2026-08-07, a FIFA-governance saga with 13 independently dated
      events): first, when the story has 6 or more real milestones, USE
      all 6 slots — a 3-item Cronología on a story that's actually had
      six-plus dated beats is under-using the device, not being
      conservative. Second, when a saga genuinely runs past 6 (this one
      had 13), the device is not the place to fit the rest: pick the 6
      most load-bearing beats for the Cronología (the ones that carry
      the spine of the story) and weave the remaining, still-sourced
      events into the prose paragraphs instead — a paragraph that names
      three more dated developments in a sentence tells that part of the
      story fine without needing a tenth timeline slot that doesn't
      exist. Never respond to "I want a bigger timeline" by writing more
      than 6 items into the paragraph anyway; past the cap the device
      silently fails to parse and the whole thing renders as an inert,
      unstyled paragraph instead of a timeline, which reads worse than a
      tight 6-item one.
    - `Recibo: Torneos — 10 · Bolsa por evento — US$10M · Total — US$107M`
      → a thermal receipt whose Total counts up. For cost breakdowns and
      who-paid-what (2-8 lines; a line whose label starts with "Total"
      gets the total treatment — include one when the sum is the point).
    - `Ecuación: 104 partidos × US$6M por partido = US$624M` → display
      math with counting operands. For "the math behind the deal" — every
      term must start with a real number; operators ×, +, −, / and one =.
    - `Salto: 14 torneos → 10 torneos — el calendario 2027` → before/after
      delta, direction-colored (green up, red down, computed from the
      numbers). For growth/shrink stories; optional caption after ` — `.
    - `Reparto: FIFA — 70% · Federaciones — 20% · Clubes — 10%` → a
      proportion bar with legend. For how money/rights split (2-5 shares,
      percentages; they're normalized, so they should roughly sum to 100).
      Not only money: it's the right device any time a story has a
      countable universe splitting into camps — members of a body who
      back/oppose/haven't said, votes, seats, market share of competing
      products. (2026-08-07: a FIFA-governance piece used it as "of
      FIFA's 211 member federations, X% publicly backed the president,
      Y% opposed, Z% hadn't taken a position" — computed from actually
      -confirmed individual/bloc counts, e.g. a confederation that voted
      unanimously counts as its full membership, a single federation's
      own statement counts as one, and the remainder is whatever's left
      of the total universe. Never estimate the remainder bucket from a
      guess — it should always be `total - everything you can actually
      source`, and every figure that feeds it needs the same sourcing
      bar as any other fact in the piece, not a rounder guess because
      it's going into a chart instead of a sentence.) An Alineación
      naming the same actors is the weaker choice whenever a real
      number is available for each side: chips show who, a Reparto also
      shows how big, which is usually the more informative half of a
      camps-and-counts story.
    - `Alineación: Madonna · Shakira · Justin Bieber · BTS` → numbered
      lineup chips that flap in. For enumerations of actors — artists,
      investors, host cities (2-8 names, each ≤28 chars).
    - `Cotización: Ollamani — MX$14.50 · -34.6% · en el año` → a market
      tile with ▲/▼ delta. For public-company/valuation results: name,
      value, signed percent delta, optional note.
    - `Duelo: UEFA vs FIFA · Ingresos 2022-2025 — €20,163M vs US$10,083M
      · Reservas — €522M vs US$2,699M` → a butterfly chart: two actors,
      1-4 metric rows, bars anchored on the centre line and growing
      outwards. For "X gana más que Y" comparisons — the shape Reparto
      and Salto can't cover, because Reparto splits ONE whole into
      slices and Salto moves ONE metric from before to after, while this
      puts two separate institutions against each other on several
      measures at once. First item names the sides (`A vs B`, ≤26 chars
      each), every item after it is `etiqueta — valorA vs valorB`. A row
      whose two values aren't both numeric renders as a bare text row
      with no bars, so a `Sede — Nyon vs Zúrich` line can sit under the
      money without faking a magnitude. Mixed currencies are allowed and
      the bars compare the raw magnitudes, so only put two currencies in
      one row when the piece has already told the reader why that
      comparison holds. A value written with a leading minus (`−€46.2M`)
      bars its magnitude in the loss treatment, red bar and red figure,
      so a `Resultado del año` row can sit next to the revenue rows
      without a longer bar reading as a bigger win.
      **One scale for the whole device** (publisher directive,
      2026-08-08): every bar is a share of the single largest magnitude
      in the device, so rows are readable against each other — a reserve
      that is a tenth of a year's revenue draws a tenth of the top bar,
      and an annual deficit draws the sliver it actually is. This is the
      point of the shape, so **write all rows in one unit**; a percentage
      row next to money rows can't share a scale and silently drops the
      whole device back to per-row scaling, where every row peaks at 100%
      and four different magnitudes end up looking identical.
      **Check that both numerators cover the same activity** before
      putting two institutions' spending side by side. Each body
      classifies its money its own way and a matching category name is
      not evidence that the contents match. Worked example, 2026-08-08:
      UEFA's €3,861M distribution against FIFA's US$748M "Development &
      Education" line implied a five-to-one gap, but FIFA books Club
      World Cup prize money (US$1,000M in 2025) under Competitions &
      Events, so the comparable figure was US$1,748M. Read it off each
      side's OWN statements, never off the label.
  Rules of use — **the device budget (round 4, 2026-08-06, priority-aware
  now, enforced in code by `applyBodyDevices`/`deviceBudgetFor`, not just
  here):** designed devices scale with `readingTime` **and** `priority`.
  Base budget by length — **≤2 min → 1 device · 3-5 min → 2 · 6+ min →
  3** — then **+1 whenever `priority: 5`**, on top of whatever the length
  already gives. A `priority: 5` story is the site's own signal for "most
  likely to lead the homepage" (`lib/rank.ts`'s hero selection), and it's
  meant to carry the fullest structure the format allows regardless of
  how short the standard four-paragraph shape keeps `readingTime` — so a
  `priority: 5` piece at the ordinary `readingTime: 2` gets a budget of
  2, not 1, and a 6-minute `priority: 5` La Lana piece gets 4. `featured`
  doesn't add to the budget: it decays within a day
  (`FEATURED_BOOST_DAYS`) and marks today's placement, not the story's
  lasting weight the way `priority` does.
  The Opinión callout, the automatic devices (lead-ins, highlights,
  count-ups) and La Lana's money trail are EXEMPT and never count.
  Never repeat a device type in one article (the renderer refuses the
  second one even under budget). Declarations beyond the budget render
  as plain text — visible to the reader — so writing over budget is a
  shipped mistake, not a silent one. Order matters: first declared in
  the document wins the budget, so place the device that carries the
  story's spine first. Keep at least two prose paragraphs between
  devices (renderer doesn't enforce this one — you do). Choose by
  shape: a saga → Cronología, a breakdown → Recibo, a split → Reparto,
  a pairing → Jugada, one number → Cifra clave.
  Every number inside a device must appear in (or be directly
  computable from) the newsletter being published — never invent data
  to fill a device.
  - **"No device fits" is the exception, not the default (2026-08-06,
    publisher directive).** The earlier wording here ("only when the
    story genuinely has that shape; a forced device is worse than
    none") read as license to skip the whole collection the moment
    nothing obvious jumped out, and that quietly made zero devices the
    normal outcome instead of the rare one. In practice almost every
    story fits something once you check the full list instead of the
    first one or two shapes that come to mind: a contract has the
    career-to-date as a Cronología, a fee has a Reparto of who gets
    what or a Cifra clave for the headline number, a signing has a
    Jugada for the two sides, a schedule change has a Salto. Before
    writing an article off as device-free, walk all nine shapes against
    it, especially on a `priority: 5` piece, which is exactly the story
    that should carry the richest structure. What stays strict is
    fabrication, not effort: never invent a milestone, a split, or a
    figure the piece doesn't already contain just to manufacture a fit
    — a story that genuinely has no numbers, no timeline, no pairing
    and no roster still gets none, that's a real outcome, just one that
    should be rarer than it was under the old wording.
- **All products: lead-ins are now UI (2026-08-05, round 2).** The
  standard bold lead-in every paragraph already opens with
  (`**La sanción:** …`) renders as a product-colored scan mark — readers
  skim the article by lead-ins alone. This raises the bar on writing
  them: each must be specific to its paragraph (a generic label repeated
  across paragraphs now VISIBLY repeats), 2-5 words, always ending in a
  colon inside the bold. No formatting change — just know they're
  load-bearing UI now.
- **All products: figures highlight themselves.** Money amounts and
  percentages in plain prose get an automatic marker-swipe highlight on
  the article page (capped at 6 per article, applied client-side). No
  action needed at drafting time beyond what the standards already say:
  write figures in the house shapes ("US$3,400 millones", "MX$42.8
  millones", "22%") and keep the SINGLE most important one bold — bold
  figures count up, plain ones highlight.
- **Infinitas: El Marcador.** The hub shows a scoreboard of sourced
  women's-sports business metrics, editable in the admin CMS ("Hubs de
  producto" tab — no deploy needed; defaults live in
  `lib/product-hubs-content.ts`). If an Infinitas item being published
  contains a headline metric that supersedes one on the board (a new
  attendance record, a new revenue projection from a named source), don't
  edit anything as part of the publish run — flag it in one line of the
  run report ("El Marcador: la cifra X quedó superada por Y (fuente Z)")
  so editorial updates it in the CMS deliberately.

### Dynamic-elements checklist — walk it per article, every run

Each hub page renders itself from what a run inserts, so a field written
carelessly is a hub rendering worse for weeks. Before reporting back,
walk this list for every article in the batch (it takes a minute and
every item maps to a visible element):

- **Rhythm, every article** — run
  `node scripts/check-voice.mjs <draft.json>` before Step 6 and read what it
  prints. It measures each draft against the editorial-prose archive: median
  paragraph 25-35 words, p75 under 45, median sentence ≤20, at most one
  paragraph in ten over 60 words, at least one hammer line, and at most one
  negative-parallelism construction. It
  is a mirror, not a gate — a flagged long paragraph that genuinely carries
  one idea can ship, but the default answer to a flag is to split the
  paragraph, not to argue with it.
- **All products except TFBR** — `**Opinión de Playbook:**` lead-in exact
  (fenced opinion callout on the article page). TFBR carries none by
  editorial decision (Step 3); La Lana uses the `## La Opinión de Playbook`
  heading form with three paragraphs instead of the inline lead-in.
  Then, for every product: `priority` set honestly on the
  1-5 rubric — on /noticias it is also the LAYOUT: 5 renders as a
  full-width feature band, 4 as a two-up card, the rest as compact rows,
  so an inflated 5 hogs a band and a lazy 2 buries a real story;
  `imageUrl` present (feature bands and cards on /noticias show it;
  text-only there is a visible hole at priority ≥4); the full device
  collection walked against the story BEFORE deciding it gets none — does
  it fit a Cifra clave (one defining number, the story's OWN figure, not
  a context one, symbol-prefixed, rumored figures attributed in the
  caption, value ≤24 chars with a digit, caption after ` — `), a Jugada
  (a two-party relationship, sides ≤32 chars, one max), or a Cronología /
  Recibo / Ecuación / Salto / Reparto / Alineación / Cotización — "no
  device fits" should be the rare finding, not the default one; and the
  device BUDGET respected (≤2 min read → 1 designed device, 3-5 min → 2,
  6+ → 3, **+1 more at any length when `priority: 5`**; no repeated
  types; data only from the piece itself, never invented to force a
  fit); every paragraph's bold lead-in specific and colon-terminated
  (they render as scan marks now); key figures in house shapes, the
  single most important one bold.
- **Noticias** — if the story is number-driven, its biggest figure
  verbatim in `title` or `excerpt` (the feature band pulls it out as the
  green chip); `date` correct (the weekday badge derives from it).
- **La Lana** — biggest figure verbatim in title/excerpt (hub hero);
  "Ruta del dinero: A → B → C" paragraph when the story genuinely traces
  a geographic flow (article route + auto board row); connections
  extracted and pushed via `scripts/update-lana-board.ts` (board rows —
  step above). Remember the numbering is computed: never write "EXP."
  numbers into article copy, they'd go stale when a backlog upload
  renumbers the catalog.
- **Infinitas** — Marcador supersession flagged in the report when a
  published metric beats the board (step above).
- **TFBR** — the `"The Futbol Business Review"` /
  `"futbol-business-review"` pair (Step 4) is what lists an edition on
  /futbol-business-review at all.

If a run can't satisfy an item (no findable cover photo, no figure in a
figure-less story), say so in the report in one line rather than
silently shipping the gap — same standard as Step 5a's image rule.

Tone (both sections above): direct, analytical, authoritative. No filler,
no sensationalism. Playbook reads closer to a business brief than to a
news alert, calm and analytical even when the underlying story is
dramatic, rather than adopting the urgent, developing-situation pacing a
breaking-news source might use for the same facts. The reader should
finish each article feeling they got something a press summary wouldn't
give them.

Style rule: never use em dashes (the "—" character) anywhere in the drafted
text, in any field. Use commas, periods, parentheses, or "y"/"pero" instead.

Three more style rules, all from a 2026-08-05 review round where the human
read a draft back as stiff and formulaic:

- **Negative parallelism: exactly one, at the thesis.** The "no es X, es Y"
  shape (and its variants: "el golpe no vino de A, vino de B", "deja de ser
  A y se convierte en B") used three or four times across four paragraphs
  stops reading as analysis and starts reading as a tic, every point
  arriving in the same rhetorical costume. The 2026-08-06 archive
  measurement confirms the cap is right and says where the one belongs:
  Playbook averages **about one per piece** (La Lana 0.21, Ensayo 0.38,
  Infinitas 0.90 per 1,000 words), and it lands on the sentence the article
  exists to make. So don't avoid it — spend it. One per article, at the
  thesis beat, and state every other point directly. The softer "no … sino"
  (2.15 per 1,000 words in Infinitas) doesn't count against this and can
  carry the load elsewhere.
- **No arithmetic showmanship.** Don't compute a ratio or percentage the
  sources didn't publish in order to land a rhetorical punch ("el rescate
  vale menos del 5% de lo que costó llegar hasta aquí", "la aritmética es
  brutal"). Put the two real figures next to each other and say what the
  gap means in business terms; the reader does the division. This reads as
  a business brief; a calculated stat wearing a verdict reads as a hot take.
- **Metric units always.** Convert anything a US or UK source gives in feet,
  miles, yards, pounds, or acres into meters/kilometers/kilos before it
  reaches any field. Playbook's reader is in Mexico and LATAM; "7,300 pies
  de altura" is a unit they have to translate mid-sentence, "más de 2,200
  metros" is one they feel. Sport-specific units that are genuinely used in
  Spanish-language coverage of that sport (yardas in golf/NFL) are the
  exception, keep those.

Related: when a paragraph name-drops a background fact the reader can't be
assumed to carry (a state's incentive package, a canceled event, a prior
lawsuit, a regulatory ruling), spend the extra clause explaining it rather
than dropping the bare reference. "Luisiana espera la devolución de 1.2
millones de dólares de un acuerdo de sede" tells a reader nothing;
the same fact with its shape (a 7.2-million incentive package, 5 of it a
hosting fee, 1.2 already advanced, the event canceled in April, the money
never returned) is the kind of detail that makes the piece worth reading.
It costs one sentence and it's usually the sentence a competitor's recap
left out.

Write the body as **bold**/`##` heading formatted prose, plus any
`![alt](url)` in-body images carried over per Step 5b (this becomes a TipTap
document, see Step 6), never HTML tags.

## Step 4: Fields per article

- **title**: headline, in Spanish. Shape it the way the archive does
  (measured over 91 titles, 2026-08-06): **around 9 words**, and one of
  three families — a question the piece answers (*"¿Por qué FIFA nunca
  pierde con el Mundial?"*, 27% of titles), a claim with a colon splitting
  subject from turn (*"Airbnb y WSL: cuando patrocinar también es
  resolver"*, 21%), or a flat declarative that names the actor and the
  consequence (*"El deal que le volteó el tablero a Infantino"*). 20% carry
  a figure, and when the story has a defining number it belongs here (see
  the Cifra clave rule). Playbook titles say what happened or what is at
  stake; they never tease ("Lo que nadie te contó de…") and they never lead
  with the newsletter's own name.
- **excerpt**: 1-2 sentence hook for the feed card, makes the reader want to click.
- **teaser**: 1-3 plain sentences, no formatting. RSS description / pre-editor fallback, NOT the body.
- **bodyMarkdown**: see Step 3. For Noticias/Infinitas: fact, Step 2 research, detail, then `**Opinión de Playbook:**`, always all four paragraphs. For La Lana del Deporte: the existing fact/analysis content unchanged, plus a second `**Opinión de Playbook:**` paragraph only when genuinely supportable.
- **author**: leave `""` unless a byline is genuinely known. Never prepend "Por " yourself, the byline template
  (`app/(public)/articulo/page.tsx`) already renders "Por " ahead of this field, a stored "Por Jane Doe" renders as
  the double "Por Por Jane Doe" (a real 2026-08-08 mistake). For a guest collaboration piece where the byline itself
  should link out (the author's own social profile, their company site), use inline `[text](url)` markdown, e.g.
  `"[Jane Doe](https://instagram.com/jane), fundadora de [Acme](https://acme.com)"`, the byline renderer detects
  and turns those into real external links (`target="_blank"`) instead of its normal single internal
  `/autor?nombre=` link, same `[text](url)` syntax `bodyMarkdown` already uses. `mostrarAutor` stays `false` by
  default regardless of whether author is known, flip it `true` only when the human explicitly asks the byline to
  show (a guest collaboration is exactly that case, a normal Substack item usually isn't).
- **publication** / **source**: pick the pair matching the source:
    - Noticias: `"Noticias"` / `"industry-shots"`
    - La Lana del Deporte: `"La Lana del Deporte"` / `"la-lana"`
    - Infinitas: `"Infinitas"` / `"infinitas"`
    - The Futbol Business Review: `"The Futbol Business Review"` /
      `"futbol-business-review"` — the hub at /futbol-business-review
      lists this source automatically; TFBR content published with this
      pair is what turns that page from its "las ediciones viven en
      Substack" state into a live list. `readingTime: 3`.
    - Anything else: `"Noticias"` / `"industry-shots"` (the old
      `"playbook"` source was deleted in Fase 1, 2026-08-01 — inserting
      it would create articles no filter or hub can reach).

  **The product is called Noticias. "Industry Shots" is retired
  (publisher, 2026-08-08)** — it was this skill's internal nickname for
  that Substack newsletter, and it is not one any more, in prose or in
  conversation. Readers never saw it either way:
  `SOURCE_LABELS['industry-shots']` in `lib/constants.ts` has always
  rendered the source as "Noticias" everywhere on the site. Never write
  the literal string "Industry Shots" into any visible field (title,
  excerpt, teaser, body, author).

  `"industry-shots"` survives ONLY as the `source` key, because it is the
  value 68 published rows are filed under and the string every hub filter,
  CSS product class and rank rule matches on. Keep writing it verbatim in
  that one field; renaming the key is a migration, tracked in
  `docs/TODO.md`. Reading it as a product name is the mistake — it is a
  database identifier that happens to spell an old title.
- **tagsScope**: any of `Nacional`, `Internacional` (array, can be empty).
- **tagsSport**: choose only from (case-sensitive, don't invent new ones):
  `Fútbol, Liga MX, NFL, NBA, Béisbol, Tenis, Golf, F1, Olímpico, Multi-deporte / Otros` (see `lib/taxonomy.ts`, `SPORT_OPTIONS`).
  Pick the **most specific** value the story actually supports before
  falling back to a broader one — a 2026-07-31 audit of live articles found
  several stories sitting on the generic bucket one tier up from the tag
  that actually fit:
    - The story is specifically about the Liga MX competition/organization
      itself (its rules, its clubs collectively, its front office, e.g. a
      promotion-and-relegation change or a league-structure story) → `Liga
      MX`, not `Fútbol`. `Fútbol` is for the sport in general: a single
      club's business, the national team, FIFA/a tournament, or any other
      story that isn't about the Liga MX competition as an entity.
    - A single-sport story (baseball, tennis, golf, F1, Olympic) →
      that sport's own tag, not `Multi-deporte / Otros`. That bucket is for
      stories that are genuinely cross-sport (a multi-team ownership group,
      a broadcaster's general sports deal) or for a sport with no tag of
      its own (e.g. cycling) — not a stand-in for "didn't check if a
      specific tag existed." Concretely: a story about MLB's Home Run
      Derby is `Béisbol`, not `Multi-deporte / Otros`.
  Before writing the final value, re-read the story's own core subject (not
  just the sports mentioned in passing) and check it against the list above
  for the closest match.
- **tagsVertical**: choose only from `lib/taxonomy.ts`'s `VERTICAL_OPTIONS`:
  `Gobernanza y Regulación, Derechos de TV y Streaming, Fusiones y Adquisiciones, Patrocinios, Infraestructura y Venues, Sedes y Eventos, Finanzas y Negocio, Private Equity e Inversiones, Mercadotecnia Deportiva, Gestión de Talento, Audiencias y Consumo, Fan Experience, Naming Rights`.
- **date**: `YYYY-MM-DD`, confirmed from the page (Step 1), not guessed.
- **dateFormatted**: e.g. `"21 jul 2026"` (day, 3-letter lowercase month, year).
- **readingTime**: `2` for Noticias/Infinitas (four-paragraph standard), `3` for La Lana long-form.
- **priority** (Importancia): 1-5, objective scale:
    - `5` = Mexico/LATAM-specific regulatory, structural, or major business story.
    - `4` = Major international story with clear LATAM or business implication.
    - `3` = Interesting but secondary: global trends, platform moves, product launches.
    - `2` = Brief update: follow-up, niche, or no strong opinion angle.
    - `1` = Minor, rarely used.
  - Breaking News override (team directive, 2026-08-01): when the Substack source itself
    is presented as a flash/urgent update outside its normal newsletter cadence (its own
    title reads "Breaking News:" or equivalent, rather than a scheduled Industry
    Shots/La Lana/Infinitas edition), set `priority: 5` regardless of where the story would
    otherwise land on the rubric above, and set `featured: true` too, breaking news is
    meant to run as the portal's top story every time. This deliberately overrides the "at
    most one 5-star/featured live at a time" norm in the next bullet: each new breaking-news
    item is meant to bump whatever was previously featured, so don't hold off setting it out
    of caution, that's the intended effect, not a conflict to resolve.
- **featured** (Destacado): `true` only for clearly THE story of the batch, normally at most one `priority: 5` / `featured: true` article per run (Breaking News items are the deliberate exception, see above). Before setting it `true`, query the DB for existing `featured = true` rows (see verification pattern in Step 6) so you know what you're competing with. It's fine to have several `priority: 5` rows live (the site allows it), just don't blindly stack `featured: true` on top of an unrelated existing one without checking.
- **substackUrl**: the source URL, always required, same for every item from one edition.
- **sourceUrl**: a unique per-item dedupe key: `` `${substackUrl}#<slug-of-title-or-topic>` ``. This is what the DB's unique index dedupes on (`articles.sourceUrl`), so re-running this skill on the same link will no-op on already-inserted stories instead of duplicating them.
- **imageUrl** / **imageCredit**: the cover photo, see Step 5a. Required for every article, regardless of priority. Never one of the source article's embedded images (those go inline in `bodyMarkdown` instead, see Step 5b).

## Step 5: Images (every article, as of 2026-07-24)

Every article gets a cover image, not just `priority: 5` ones (this used to
be priority-5-only; the policy changed to raise every article to the same
visual standard). `imageUrl: ""` is no longer acceptable for a published
article. There are two separate image jobs, and they use different sources,
never the same one:

### 5a. Cover image (`imageUrl` / `imageCredit`)

This is the hero photo at the top of the article and the feed-card thumbnail.
It is **never** one of the images embedded in the source Substack article
(see 5b) — those are for the body, not the cover.

**Always, always, always search for the best and most related cover photo
for each article, trying different search angles and different sources
before giving up, and always give credit in `imageCredit`.** Never publish
with no cover image and never settle for a generic/unrelated one when a
genuinely on-topic photo is findable: not a generic stadium if the story is
about data privacy, not a generic football pitch if the story is about a
business deal, match the actual subject (the company, the sport, the venue,
the person).

Playbook doesn't restrict sourcing to free-license libraries, and sourcing
should be genuinely wide, not limited to whatever a first search turns up.
Cast a wide net across distinct platforms, not just varied queries on the
same one, before settling: general image search (Google Images, Bing
Images), Wikimedia Commons, Flickr (Creative Commons), official
team/league/company press rooms and media galleries, and editorial photo
agencies (Reuters Pictures, Shutterstock, and LATAM sports agencies such as
Mexsport or Imago7 when the subject is Mexican/LATAM), not just
Unsplash/Pexels-style free libraries. Search in English first even when the
article is in Spanish, English-language queries tend to surface far better
and more specific editorial photography than Spanish ones, but for a
Mexico/LATAM-specific subject also try Spanish-language sources and local
agencies directly, they sometimes have the only photo that actually shows
the right person, team, or venue. If the first search angle or platform
only turns up generic results, keep trying others (the company/person name,
the venue, the specific event, sport + business angle, a different image
search engine or agency entirely) before settling.

Exception: never pull the image from an agency known to pursue unlicensed
use aggressively (Getty Images foremost among them, this includes iStock
since it's owned by Getty; treat AP Images/AP Photo the same way). If a
search turns up exactly the right photo but it's hosted on one of these,
keep searching for another source or angle rather than using it.

Confirm the image actually exists and is genuinely on-topic before using it:
fetch the photo's page (not just a search-result thumbnail) and confirm what
it depicts. Never invent or guess an image URL or ID. Set `imageCredit` to
identify the real source, whatever it is, for example `"Foto: [Fotógrafo] /
Unsplash"`, `"Foto: [Agencia]"`, `"Foto: [Fotógrafo] / Getty Images"`, or
`"Foto: [Club/Liga/Organización]"`, matched to whatever the photo's own page
attributes it to. It renders as a small caption under the lead photo, so
every article must have one, this is what backs the takedown-contact clause
in the site's Términos y Condiciones (`app/(public)/terminos/page.tsx`): a
correct, specific credit is what lets a rights holder actually identify
their photo if they ever reach out. If a cover photo genuinely cannot be
sourced for a topic after trying multiple search angles and platforms, say
so explicitly rather than guessing.

**No cropped-looking cover images (team directive, 2026-08-04):** the site
never shows a cover photo at its native aspect ratio. `.lead-photo`/
`.article-photo` (homepage hero and every article page, `styles/hero.css`,
`styles/article.css`) force `aspect-ratio: 16/10` with `object-fit: cover`,
and the archive grid forces `4/3` or `1/1` (`.archive-grid-photo`,
`styles/article.css`). A tall portrait or square source photo gets centered
and the excess top/bottom sliced off automatically, with no control over
which part survives, this is exactly what cut a subject's face in half on
a prior run and, on a later run, silently cropped four separate cover
photos down to the wrong slice before anyone noticed. Before finalizing any
`imageUrl`, check the actual pixel dimensions of the candidate (fetch the
file, don't guess from the thumbnail) and compute its ratio: anything
between roughly 1.4:1 and 1.8:1 survives a 16:10 crop with only minor,
harmless trimming at the edges, so prefer photos already in that range.
A portrait or square photo (ratio below ~1.3:1, this includes most single-
subject action shots and headshots) will lose most of its vertical content
when forced into 16:10, so either find a different, naturally wide-format
photo of the same subject (a wide match/celebration/podium shot instead of
a tight vertical portrait), or, if the best available photo of the subject
is portrait-oriented, pre-crop it yourself to 16:10 around the part that
matters (the face, the branding, the key detail) using an image tool
before publishing, the same fix used for a custom graphic and for a
Wikimedia portrait earlier in the project's history. A self-cropped image
needs the same hosting path as any other custom asset: commit it to
`public/assets/img/`, push, and use the resulting
`https://playbook-portal-phi.vercel.app/assets/img/...` URL, since Wikimedia
and Unsplash only serve their own original crops. Never publish a cover
photo without doing this ratio check first, regardless of how good the
photo looks in isolation.

### 5b. In-body images, carried over from the source article

Any image embedded in the source Substack post next to that specific news
item (see the image pass in Step 1) always gets carried over into the
article body itself, integrated inline with the text, never just used as
the cover. Skip only pure page chrome (the publication's masthead logo, the
author's avatar headshot); everything else that's part of the post's actual
content (photos, banners, infographics, charts) gets carried over.

- Preserve the exact order the images appear in in the Substack source,
  relative to each other and to the surrounding text/sections.
- Place each image in `bodyMarkdown` right at the point in the body that
  corresponds to where it sat in the source (e.g. an infographic that
  illustrated one specific section goes inside that section, not bunched at
  the top or bottom).
- Insert it as its own block, on its own blank-line-separated line, using
  `![alt text](url)` (standard markdown image syntax), where `url` is the
  real image src straight off the Substack page (the `substackcdn.com` /
  `substack-post-media.s3.amazonaws.com` URL), not a re-description or a
  substitute. Fetch the URL first to confirm it actually resolves to an
  image before using it.
- Immediately follow each image block with its own short caption paragraph
  reading exactly `Foto: Playbook`, regardless of what byline or watermark
  the original newsletter shows.
- `scripts/publish-newsletter.ts`'s markdown-to-TipTap converter turns each
  `![alt](url)` block into an inline `image` node in the body, in the same
  position, so this only works through that exact syntax, not a raw `<img>`
  tag or a description of the image.

## Step 6: Publish

1. Write a JSON array of article objects (shape: `title, excerpt, teaser,
   bodyMarkdown, author, date, dateFormatted, publication, source, tagsScope,
   tagsSport, tagsVertical, priority, featured, mostrarAutor, readingTime,
   substackUrl, sourceUrl, imageUrl, imageCredit`, see
   `scripts/publish-newsletter.ts`'s `NewsletterArticleInput` type) to a
   scratch file.
2. Run:
   ```
   npx tsx --env-file=.env.local scripts/publish-newsletter.ts <path-to-json-file>
   ```
   (drop `--env-file` if `POSTGRES_URL` is already exported in the shell).
3. The script prints one line per article (`ok`/`duplicate`) plus a summary
   count. It converts `bodyMarkdown` to a TipTap document (blank-line
   paragraphs, `## ` headings, `**bold**` spans, `![alt](url)` inline images),
   renders `bodyHtml` the same way the admin editor does, slugifies the title
   into the article `id` (retrying with a suffix on collision), and inserts
   with `status: 'published'`, live immediately.
4. Report back a short confirmation per article: title, id, and the live URL
   (`https://playbook-portal-phi.vercel.app/articulo?id=<id>`), not a re-print
   of the full draft. If any came back `duplicate`, say so (it means that
   exact story was already published from a prior run of this same link).

   Report the Step 0 outcomes in the same breath, because an edition where
   three of nine briefs were already covered looks like a thin run otherwise.
   One line each: what was skipped and which article covers it, what was
   folded into an existing piece, and what ran as a cross-linked second angle.
   A skipped item is work done, not work missing.

Do not ask for approval before step 6. Publishing without a review step is
the point of this flow. Do flag anything genuinely uncertain (e.g. couldn't
confirm a fact, no free Unsplash photo found for a story) rather than
guessing silently.

## Step 7: Capture feedback for next time, automatically

This skill has no review gate, but the person who asked for the run often
still reacts afterward, a tone note, a correction, a "don't do X again."
That reaction is exactly the kind of lesson that should stick permanently
instead of getting re-explained on some future run. If the human reacts
with a correction that's genuinely generalizable (would help write the
*next* article, on some other topic, not just fix this one), fold it into
this file (and `publish-sourced-article/SKILL.md` if it's a voice rule
that applies there too) in the same dense-prose style as the rest of the
document, then run
`scripts/sync-skill-feedback.sh "<one-line summary of the lesson>"` to
push it straight to `main`, no need to ask first, the script only ever
touches `.claude/skills/`. Article-specific corrections (a fact, a word
choice for this one story) aren't worth capturing, skip those silently.
Mention in one sentence if you updated the skill; this should stay quiet
and routine, not a production.
