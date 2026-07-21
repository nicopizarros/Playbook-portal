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
wants that (asking "draft this" without publishing intent means: do steps 1-3
below and show the drafts, skip step 4).

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

## Step 2: Editorial voice

Every article has two layers:
1. The fact: what happened, who, the key numbers, source context.
2. Opinión de Playbook: what it means for the industry, always with a Mexico
   or LATAM angle when relevant.

Tone: direct, analytical, authoritative. No filler, no sensationalism. The
reader should finish each article feeling they got something a press summary
wouldn't give them.

Style rule: never use em dashes (the "—" character) anywhere in the drafted
text, in any field. Use commas, periods, parentheses, or "y"/"pero" instead.

Body word count: 150-300 words for Industry Shots articles with an Opinión de
Playbook layer; 400-600 words for La Lana del Mundial long-form pieces;
100-180 words for brief items that have no Opinión in the source (facts only,
no invented editorializing).

Write the body as **bold**/`##` heading formatted prose (this becomes a TipTap
document, see Step 4), never HTML tags.

## Step 3: Fields per article

- **title**: headline, in Spanish.
- **excerpt**: 1-2 sentence hook for the feed card, makes the reader want to click.
- **teaser**: 1-3 plain sentences, no formatting. RSS description / pre-editor fallback, NOT the body.
- **bodyMarkdown**: see Step 2. Fact layer paragraph(s), then a `**Opinión de Playbook:**` paragraph when the source has one.
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
- **featured** (Destacado): `true` only for clearly THE story of the batch, normally at most one `priority: 5` / `featured: true` article per run. Before setting it `true`, query the DB for existing `featured = true` rows (see verification pattern in Step 5) so you know what you're competing with. It's fine to have several `priority: 5` rows live (the site allows it), just don't blindly stack `featured: true` on top of an unrelated existing one without checking.
- **substackUrl**: the source URL, always required, same for every item from one edition.
- **sourceUrl**: a unique per-item dedupe key: `` `${substackUrl}#<slug-of-title-or-topic>` ``. This is what the DB's unique index dedupes on (`articles.sourceUrl`), so re-running this skill on the same link will no-op on already-inserted stories instead of duplicating them.
- **imageUrl**: see Step 4. Empty string `""` for anything not `priority: 5`.

## Step 4: Images (priority 5 only)

Only `priority: 5` articles get an image. Everything else: `imageUrl: ""`.

For those, find a confirmed free Unsplash photo directly related to the
specific topic (not a generic stadium if the story is about data privacy).
Verify the photo is real and free (not Unsplash+/premium) by fetching the
actual photo page and reading the `images.unsplash.com/photo-[id]` URL off it.
WebSearch alone only gives short slug-style IDs (e.g. `i9CqRlYZCV8`), which
are not the same ID scheme as the `images.unsplash.com/photo-...` CDN URL.
Never invent a photo ID. Format: `https://images.unsplash.com/photo-[id]?w=900&q=80`.

## Step 5: Publish

1. Write a JSON array of article objects (shape: `title, excerpt, teaser,
   bodyMarkdown, author, date, dateFormatted, publication, source, tagsScope,
   tagsSport, tagsVertical, priority, featured, mostrarAutor, readingTime,
   substackUrl, sourceUrl, imageUrl`, see `scripts/publish-newsletter.ts`'s
   `NewsletterArticleInput` type) to a scratch file.
2. Run:
   ```
   npx tsx --env-file=.env.local scripts/publish-newsletter.ts <path-to-json-file>
   ```
   (drop `--env-file` if `POSTGRES_URL` is already exported in the shell).
3. The script prints one line per article (`ok`/`duplicate`) plus a summary
   count. It converts `bodyMarkdown` to a TipTap document (blank-line
   paragraphs, `## ` headings, `**bold**` spans), renders `bodyHtml` the same
   way the admin editor does, slugifies the title into the article `id`
   (retrying with a suffix on collision), and inserts with
   `status: 'published'`, live immediately.
4. Report back a short confirmation per article: title, id, and the live URL
   (`https://playbook-portal-phi.vercel.app/articulo?id=<id>`), not a re-print
   of the full draft. If any came back `duplicate`, say so (it means that
   exact story was already published from a prior run of this same link).

Do not ask for approval before step 5. Publishing without a review step is
the point of this flow. Do flag anything genuinely uncertain (e.g. couldn't
confirm a fact, no free Unsplash photo found for a 5-star story) rather than
guessing silently.
