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
what outlet each item cites. These details drive word count and Importancia
below. Don't guess the publish date from context; confirm it from the page.
Fetch the page a fourth time asking specifically for every image URL embedded
in the post (the actual `substackcdn.com` / `substack-post-media.s3.amazonaws.com`
src, not a description of the image), the order they appear in, and which
news item/section each one sits next to. This feeds Step 5b: every one of
these (other than pure masthead/avatar chrome) always gets carried over into
the relevant article's body, in that same order, never skipped and never
used as the cover image.

## Step 2: Independent research

Before drafting, for each news item look for at least one concrete fact the
Substack brief doesn't fully spell out: a number, a comparable deal size, a
market/audience figure, relevant history (prior similar deals, past
precedents), a regulatory detail, or a quote from an official source. Use
WebSearch/WebFetch to find it from a reputable outlet (wire services,
established sports-business or general press, the company's/league's own
newsroom), not a random blog or forum.

Rules:
- Fetch the actual source page and confirm the figure/fact there. Never take
  a search-snippet at face value and never invent a number.
- Only use it if it's genuinely additive, context or scale the Substack item
  omitted, not a restatement of what's already there.
- If nothing solid turns up after a couple of honest attempts, don't force
  it: a shorter, fact-accurate article beats a padded one with a
  manufactured detail.
- This research feeds Step 3's paragraph/word-count expansion below, and can
  sharpen the priority/Importancia call in Step 4.

## Step 3: Editorial voice

Every article has up to three layers:
1. The fact: what happened, who, the key numbers, source context.
2. Added context: the data point, comparison, or history surfaced in Step 2,
   when the research turned up something genuinely additive.
3. Opinión de Playbook: what it means for the industry, always with a Mexico
   or LATAM angle when relevant.

Tone: direct, analytical, authoritative. No filler, no sensationalism. The
reader should finish each article feeling they got something a press summary
wouldn't give them.

Style rule: never use em dashes (the "—" character) anywhere in the drafted
text, in any field. Use commas, periods, parentheses, or "y"/"pero" instead.

Body length: at least three paragraphs whenever the story supports it, using
the Step 2 research to build a genuine additional paragraph rather than
padding the fact layer. Word-count ranges: 250-450 words for Industry Shots
articles with an Opinión de Playbook layer; 500-700 words for La Lana del
Mundial long-form pieces; 100-180 words for brief items that have no
Opinión in the source and no researchable angle (facts only, still fine to
stay short and two paragraphs when there's genuinely nothing more to
responsibly add, no invented editorializing).

Write the body as **bold**/`##` heading formatted prose, plus any
`![alt](url)` in-body images carried over per Step 5b (this becomes a TipTap
document, see Step 6), never HTML tags.

## Step 4: Fields per article

- **title**: headline, in Spanish.
- **excerpt**: 1-2 sentence hook for the feed card, makes the reader want to click.
- **teaser**: 1-3 plain sentences, no formatting. RSS description / pre-editor fallback, NOT the body.
- **bodyMarkdown**: see Step 3. Fact layer paragraph(s), the Step 2 research paragraph when there is one, then a `**Opinión de Playbook:**` paragraph when the source has one.
- **author**: leave `""` unless a byline is genuinely known. `mostrarAutor` stays `false` either way.
- **publication** / **source**: pick the pair matching the source:
    - Industry Shots: `"Noticias"` / `"industry-shots"`
    - La Lana del Mundial: `"La Lana del Mundial"` / `"la-lana"`
    - Infinitas: `"Infinitas"` / `"infinitas"`
    - Anything else: `"Playbook"` / `"playbook"`
- **tagsScope**: any of `Nacional`, `Internacional` (array, can be empty).
- **tagsSport**: choose only from (case-sensitive, don't invent new ones):
  `Fútbol, Liga MX, NFL, NBA, Béisbol, Tenis, Golf, F1, Olímpico, Multi-deporte / Otros` (see `lib/taxonomy.ts`, `SPORT_OPTIONS`).
- **tagsVertical**: choose only from `lib/taxonomy.ts`'s `VERTICAL_OPTIONS`:
  `Gobernanza y Regulación, Derechos de TV y Streaming, Fusiones y Adquisiciones, Patrocinios, Infraestructura y Venues, Sedes y Eventos, Finanzas y Negocio, Private Equity e Inversiones, Mercadotecnia Deportiva, Gestión de Talento, Audiencias y Consumo, Fan Experience, Naming Rights`.
- **date**: `YYYY-MM-DD`, confirmed from the page (Step 1), not guessed.
- **dateFormatted**: e.g. `"21 jul 2026"` (day, 3-letter lowercase month, year).
- **readingTime**: `1` for brief items, `2` for standard Industry Shots pieces with an Opinión, `3` for La Lana long-form.
- **priority** (Importancia): 1-5, objective scale:
    - `5` = Mexico/LATAM-specific regulatory, structural, or major business story.
    - `4` = Major international story with clear LATAM or business implication.
    - `3` = Interesting but secondary: global trends, platform moves, product launches.
    - `2` = Brief update: follow-up, niche, or no strong opinion angle.
    - `1` = Minor, rarely used.
- **featured** (Destacado): `true` only for clearly THE story of the batch, normally at most one `priority: 5` / `featured: true` article per run. Before setting it `true`, query the DB for existing `featured = true` rows (see verification pattern in Step 6) so you know what you're competing with. It's fine to have several `priority: 5` rows live (the site allows it), just don't blindly stack `featured: true` on top of an unrelated existing one without checking.
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
