---
name: publish-newsletter
description: Turn one or more Playbook Substack newsletter links into articles and publish them live to the Playbook site, with zero human review. Use when asked to process, draft, or publish a Substack link (Industry Shots, La Lana del Deporte, Infinitas) into Playbook.
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
Industry Shots or La Lana del Deporte edition is a separate article. Also
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
del Deporte: its fact/analysis content tracks the source as written, never
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

Tone (both sections above): direct, analytical, authoritative. No filler,
no sensationalism. Playbook reads closer to a business brief than to a
news alert, calm and analytical even when the underlying story is
dramatic, rather than adopting the urgent, developing-situation pacing a
breaking-news source might use for the same facts. The reader should
finish each article feeling they got something a press summary wouldn't
give them.

Style rule: never use em dashes (the "—" character) anywhere in the drafted
text, in any field. Use commas, periods, parentheses, or "y"/"pero" instead.

Write the body as **bold**/`##` heading formatted prose, plus any
`![alt](url)` in-body images carried over per Step 5b (this becomes a TipTap
document, see Step 6), never HTML tags.

## Step 4: Fields per article

- **title**: headline, in Spanish.
- **excerpt**: 1-2 sentence hook for the feed card, makes the reader want to click.
- **teaser**: 1-3 plain sentences, no formatting. RSS description / pre-editor fallback, NOT the body.
- **bodyMarkdown**: see Step 3. For Industry Shots/Infinitas: fact, Step 2 research, detail, then `**Opinión de Playbook:**`, always all four paragraphs. For La Lana del Deporte: the existing fact/analysis content unchanged, plus a second `**Opinión de Playbook:**` paragraph only when genuinely supportable.
- **author**: leave `""` unless a byline is genuinely known. `mostrarAutor` stays `false` either way.
- **publication** / **source**: pick the pair matching the source:
    - Industry Shots: `"Noticias"` / `"industry-shots"`
    - La Lana del Deporte: `"La Lana del Deporte"` / `"la-lana"`
    - Infinitas: `"Infinitas"` / `"infinitas"`
    - A bylined opinion piece (the item is presented as one person's
      argument/column, explicitly labeled Opinión on the source page, or
      the user identifies it as one) rather than a newsletter news item:
      `"Opinión"` / `"opinion"` (`opinion` is a real `KNOWN_SOURCES` value,
      see `lib/constants.ts`; it has its own homepage section and `/tema`
      filter, distinct from the `**Opinión de Playbook:**` closing
      paragraph every Industry Shots/La Lana/Infinitas item already gets,
      which is a paragraph within a news article, not this).
    - Anything else: `"Noticias"` / `"industry-shots"` (the old `"Playbook"` /
      `"playbook"` fallback was retired 2026-08-01, folded into Noticias —
      see `lib/constants.ts`)

  "Industry Shots" is only this skill's internal name for that Substack
  newsletter, used to pick the fields above. It is never a label readers
  see: `SOURCE_LABELS['industry-shots']` in `lib/constants.ts` renders it as
  "Noticias" everywhere on the site. Never write the literal string
  "Industry Shots" into any visible field (title, excerpt, teaser, body,
  author).
All three tag fields below are arrays in the schema (`lib/db/schema.ts`) and
the site renders every value given as its own chip/filter
(`ArticleTopics`/`TagPillRow`, `/tema`). Assign **every value in each tier
that genuinely applies to the story**, not just a single "best" one — a
2026-08-02 audit of live articles found most had exactly one tag per tier
even when several plainly fit, which makes the story harder to find via
`/tema` for no reason. This doesn't mean padding with anything
tangential: still only tag what the story is actually, substantively about.

- **tagsScope**: any of `Nacional`, `Internacional` (array, can be empty).
  Most stories are cleanly one or the other; tag both only when the story
  genuinely has both angles (e.g. a Liga MX club's international transfer
  saga).
- **tagsSport**: choose only from (case-sensitive, don't invent new ones):
  `Fútbol, Liga MX, NFL, NBA, Béisbol, Tenis, Golf, F1, Olímpico, Multi-deporte / Otros` (see `lib/taxonomy.ts`, `SPORT_OPTIONS`).
  A 2026-07-31 audit of live articles found stories sitting on a generic
  bucket one tier up from the tag that actually fit; the guidance below
  still holds, but don't read it as "pick exactly one" — apply every value
  that's true at once:
    - The story is specifically about the Liga MX competition/organization
      itself (its rules, its clubs collectively, its front office, e.g. a
      promotion-and-relegation change or a league-structure story) → tag it
      **both** `Liga MX` **and** `Fútbol` (Liga MX is football; a reader
      filtering by either should find it). `Fútbol` alone, without `Liga
      MX`, is for football stories that aren't about the Liga MX
      competition as an entity: a single club's business, the national
      team, FIFA/a tournament, or similar.
    - A single-sport story (baseball, tennis, golf, F1, Olympic) →
      that sport's own tag, not `Multi-deporte / Otros`. That bucket is for
      stories that are genuinely cross-sport (a multi-team ownership group,
      a broadcaster's general sports deal) or for a sport with no tag of
      its own (e.g. cycling) — not a stand-in for "didn't check if a
      specific tag existed." Concretely: a story about MLB's Home Run
      Derby is `Béisbol`, not `Multi-deporte / Otros`.
  Before writing the final value(s), re-read the story's own core subject
  (not just sports mentioned in passing) and list every tag above that
  genuinely fits, not just the single closest match.
- **tagsVertical**: choose only from `lib/taxonomy.ts`'s `VERTICAL_OPTIONS`:
  `Gobernanza y Regulación, Derechos de TV y Streaming, Fusiones y Adquisiciones, Patrocinios, Infraestructura y Venues, Sedes y Eventos, Finanzas y Negocio, Private Equity e Inversiones, Mercadotecnia Deportiva, Gestión de Talento, Audiencias y Consumo, Fan Experience, Naming Rights`.
  Same rule: apply every vertical the story genuinely touches, not just
  one. In particular, a story centered on a governing body (FIFA, Concacaf,
  a federation, a league's own regulatory arm) should carry `Gobernanza y
  Regulación` **alongside** its `tagsSport` value(s), not instead of them —
  there is no separate "governing bodies" sport tag; this vertical is what
  carries that angle.
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

**Exception, `source: 'opinion'` articles only:** use the Substack post's own
cover image, not an external search. Substack sets a dedicated cover photo
for each post (the hero image shown above the title/byline on the post page
itself and in its social/share preview), separate from any images embedded
further down in the body. Fetch the post page and ask specifically for that
cover image's own URL (the `substackcdn.com` src of the header/hero photo,
not a body image and not a search-result guess), and use that as `imageUrl`.
Set `imageCredit` to whatever the post itself credits the photo to; if the
post gives no credit, credit it to the publication, e.g. `"Foto: [Nombre del
autor] / Substack"`. Only fall back to the external-search process below if
the post genuinely has no cover image of its own. This does not apply to
Industry Shots, La Lana del Deporte, or Infinitas items, which keep the
external-search process below.

For every other source, **always, always, always search for the best and
most related cover photo for each article, trying different search angles
and different sources before giving up, and always give credit in
`imageCredit`.** Never publish
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
