---
name: publish-newsletter
description: Turn one or more Playbook Substack newsletter links into articles and publish them live to the Playbook site, with zero human review. Use when asked to process, draft, or publish a Substack link (Industry Shots, La Lana del Mundial, Infinitas) into Playbook.
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

## Step 1: Read the sources

Fetch every Substack URL given (use WebFetch; it follows the `open.substack.com`
to `<pub>.substack.com` redirect automatically, re-fetch the redirect URL it
reports). For each edition, identify individual news items: each story in an
Industry Shots or La Lana del Mundial edition is a separate article. Also
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

Applies to Industry Shots and Infinitas items. Does **not** apply to La Lana
del Mundial: its fact/analysis content tracks the source as written, never
supplemented with outside research (see Step 3's La Lana section).

Mandatory, always attempted, for every Industry Shots/Infinitas item: search
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

### Industry Shots / Infinitas

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
prior Industry Shots/Infinitas item, findable by querying the DB), don't
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

### La Lana del Mundial

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

- **All products** — `**Opinión de Playbook:**` lead-in exact (fenced
  opinion callout on the article page); `priority` set honestly on the
  1-5 rubric — on /noticias it is also the LAYOUT: 5 renders as a
  full-width feature band, 4 as a two-up card, the rest as compact rows,
  so an inflated 5 hogs a band and a lazy 2 buries a real story;
  `imageUrl` present (feature bands and cards on /noticias show it;
  text-only there is a visible hole at priority ≥4); "Cifra clave:"
  beat considered when the story is number-driven (step above) — the
  story's OWN figure, not a context figure, symbol-prefixed, rumored
  figures attributed in the caption; value ≤24 chars with a digit,
  caption after ` — `; "Jugada:" strip
  considered when the story is a two-party relationship (step above,
  sides ≤32 chars, one max); every paragraph's bold lead-in specific
  and colon-terminated (they render as scan marks now); key figures in
  house shapes, the single most important one bold.
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

- **Don't lean on negative parallelism.** The "no es X, es Y" shape (and its
  variants: "el golpe no vino de A, vino de B", "en un calendario de 14 era
  una plaza más; en uno de 10, es indispensable", "deja de ser A y se
  convierte en B") is genuinely useful once in a piece. Used three or four
  times across four paragraphs it stops reading as analysis and starts
  reading as a tic, every point arriving in the same rhetorical costume.
  Cap it at one per article, and prefer just stating the thing directly.
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

- **title**: headline, in Spanish.
- **excerpt**: 1-2 sentence hook for the feed card, makes the reader want to click.
- **teaser**: 1-3 plain sentences, no formatting. RSS description / pre-editor fallback, NOT the body.
- **bodyMarkdown**: see Step 3. For Industry Shots/Infinitas: fact, Step 2 research, detail, then `**Opinión de Playbook:**`, always all four paragraphs. For La Lana del Mundial: the existing fact/analysis content unchanged, plus a second `**Opinión de Playbook:**` paragraph only when genuinely supportable.
- **author**: leave `""` unless a byline is genuinely known. `mostrarAutor` stays `false` either way.
- **publication** / **source**: pick the pair matching the source:
    - Industry Shots: `"Noticias"` / `"industry-shots"`
    - La Lana del Mundial: `"La Lana del Deporte"` / `"la-lana"` — the
      Substack may still say "La Lana del Mundial", but the site brand is
      "La Lana del Deporte" (Fase 0 rebrand, 2026-08-01; production
      articles were all rewritten to it by `fix:lana-rebrand`). Never
      write "La Lana del Mundial" into `publication`.
    - Infinitas: `"Infinitas"` / `"infinitas"`
    - The Futbol Business Review: `"The Futbol Business Review"` /
      `"futbol-business-review"` — the hub at /futbol-business-review
      lists this source automatically; TFBR content published with this
      pair is what turns that page from its "las ediciones viven en
      Substack" state into a live list. `readingTime: 3`.
    - Anything else: `"Noticias"` / `"industry-shots"` (the old
      `"playbook"` source was deleted in Fase 1, 2026-08-01 — inserting
      it would create articles no filter or hub can reach).

  "Industry Shots" is only this skill's internal name for that Substack
  newsletter, used to pick the fields above. It is never a label readers
  see: `SOURCE_LABELS['industry-shots']` in `lib/constants.ts` renders it as
  "Noticias" everywhere on the site. Never write the literal string
  "Industry Shots" into any visible field (title, excerpt, teaser, body,
  author).
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
- **readingTime**: `2` for Industry Shots/Infinitas (four-paragraph standard), `3` for La Lana long-form.
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
