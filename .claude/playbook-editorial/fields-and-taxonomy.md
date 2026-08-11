# Fields and taxonomy

**One copy, two skills.** The `ArticleInput` shape in
`scripts/publish-newsletter.ts` is identical for both funnels. Only the four
fields marked **differs by funnel** below are set differently, and each skill's
`references/ingestion.md` says how.

Field shape: `title, excerpt, teaser, bodyMarkdown, author, date,
dateFormatted, publication, source, tagsScope, tagsSport, tagsVertical,
priority, featured, mostrarAutor, readingTime, substackUrl, sourceUrl,
imageUrl, imageCredit`.

---

## Editorial fields

- **`title`** — Spanish headline. Full rules in `voice-and-style.md` §3
  (protagonist + movement + data/consequence, ~9 words, three families, no
  teasing, SEO stays in metadata). When the story has a defining figure it
  belongs here verbatim and symbol-prefixed — the hubs and the homepage scrape
  `title` + `excerpt` for it.
- **`excerpt`** — 1–2 sentence hook for the feed card. Makes the reader want to
  click. Carries the defining figure when `title` doesn't.
- **`teaser`** — 1–3 plain sentences, no formatting. RSS description and
  pre-editor fallback. **NOT the body.**
- **`bodyMarkdown`** — see `format-tiers.md`. `**bold**` / `##` formatted prose
  plus any `![alt](url)` images. Never raw HTML.
- **`author`** — leave `""` unless a byline is genuinely known. **Never prepend
  "Por "** yourself: the byline template already renders "Por " ahead of this
  field, and a stored "Por Jane Doe" renders as the double "Por Por Jane Doe"
  (a real 2026-08-08 mistake). For a guest collaboration where the byline
  itself should link out, use inline `[text](url)` markdown, e.g.
  `"[Jane Doe](https://instagram.com/jane), fundadora de [Acme](https://acme.com)"` —
  the byline renderer detects those and makes real external links
  (`target="_blank"`) instead of its normal single internal `/autor?nombre=`
  link.
- **`mostrarAutor`** — stays `false` by default regardless of whether the author
  is known. Flip it `true` only when a human explicitly asks the byline to show
  (a guest collaboration is exactly that case; a normal Substack item usually
  isn't).

---

## Product routing

**`publication` / `source`** — pick the pair matching the product:

| Product | `publication` | `source` | `readingTime` |
|---|---|---|---|
| Noticias | `"Noticias"` | `"industry-shots"` | `2` |
| La Lana del Deporte | `"La Lana del Deporte"` | `"la-lana"` | `3` |
| Infinitas | `"Infinitas"` | `"infinitas"` | `2` |
| The Futbol Business Review | `"The Futbol Business Review"` | `"futbol-business-review"` | `3` |
| Anything else | `"Noticias"` | `"industry-shots"` | `2` |

This pair is what selects the product's mark on the Opinión callout, the hub
the piece lists on, the `.tag-mini` chip colour, and the taxonomy-row ordering
(`lib/taxonomy.ts`'s `topicsForSection`). **A wrong pair is a visible mistake,
not just a filing error.**

The old `"playbook"` source was deleted in Fase 1 (2026-08-01) — inserting it
would create articles no filter or hub can reach.

`readingTime` above is the standard; a feature that genuinely runs 900–1,100
words takes `4` (see `format-tiers.md` §2). It also drives the device budget.

**Never write the literal string "Industry Shots" into any visible field.** See
`format-tiers.md` §8 for why the key survives when the name doesn't.

---

## Taxonomy

**`tagsScope`** — any of `Nacional`, `Internacional`. Array, can be empty.

**`tagsSport`** — choose only from (case-sensitive, don't invent):
`Fútbol, Liga MX, NFL, NBA, Béisbol, Tenis, Golf, F1, Olímpico,
Multi-deporte / Otros` (`lib/taxonomy.ts`, `SPORT_OPTIONS`).

**Pick the most specific value the story actually supports** before falling
back to a broader one. A 2026-07-31 audit of live articles found several
stories sitting on the generic bucket one tier up from the tag that actually
fit:

- The story is specifically about the **Liga MX competition/organization
  itself** (its rules, its clubs collectively, its front office — a
  promotion-and-relegation change, a league-structure story) → `Liga MX`, not
  `Fútbol`. `Fútbol` is for the sport in general: a single club's business, the
  national team, FIFA/a tournament, or any story that isn't about the Liga MX
  competition as an entity.
- A **single-sport story** (baseball, tennis, golf, F1, Olympic) → that sport's
  own tag, not `Multi-deporte / Otros`. That bucket is for genuinely cross-sport
  stories (a multi-team ownership group, a broadcaster's general sports deal) or
  a sport with no tag of its own (e.g. cycling). It is not a stand-in for
  "didn't check if a specific tag existed." A story about MLB's Home Run Derby
  is `Béisbol`.

Before writing the final value, re-read the story's own core subject — not just
the sports mentioned in passing — and check it against the list.

**`tagsVertical`** — choose only from `lib/taxonomy.ts`'s `VERTICAL_OPTIONS`:
`Gobernanza y Regulación, Derechos de TV y Streaming, Fusiones y Adquisiciones,
Patrocinios, Infraestructura y Venues, Sedes y Eventos, Finanzas y Negocio,
Private Equity e Inversiones, Mercadotecnia Deportiva, Gestión de Talento,
Audiencias y Consumo, Fan Experience, Naming Rights`.

---

## Ranking

**`priority`** (Importancia) — 1–5, objective scale:

| | |
|---|---|
| `5` | Mexico/LATAM-specific regulatory, structural, or major business story. |
| `4` | Major international story with clear LATAM or business implication. |
| `3` | Interesting but secondary: global trends, platform moves, product launches. |
| `2` | Brief update: follow-up, niche, or no strong opinion angle. |
| `1` | Minor, rarely used. |

Set it honestly. On /noticias it is also the **layout**: 5 renders as a
full-width feature band, 4 as a two-up card, the rest as compact rows. An
inflated 5 hogs a band; a lazy 2 buries a real story. It also buys an extra
device slot at 5 (`dynamic-element-library.md` §1).

**Breaking News override** (team directive, 2026-08-01): when the source itself
is presented as a flash/urgent update outside the normal cadence (its own title
reads "Breaking News:" or equivalent, rather than a scheduled edition), set
`priority: 5` regardless of where the story would otherwise land, **and**
`featured: true`. Breaking news is meant to run as the portal's top story every
time. This deliberately overrides the "at most one 5-star/featured live at a
time" norm below — each new breaking-news item is meant to bump whatever was
previously featured. That's the intended effect, not a conflict to resolve.

**`featured`** (Destacado) — `true` only for clearly THE story of the batch,
normally at most one `priority: 5` / `featured: true` article per run (Breaking
News is the deliberate exception). Before setting it `true`, **query the DB for
existing `featured = true` rows** so you know what you're competing with. It's
fine to have several `priority: 5` rows live; just don't blindly stack
`featured: true` on top of an unrelated existing one without checking.

---

## Dates

- **`date`** — `YYYY-MM-DD`, **confirmed from the source page**, never guessed
  from context.
- **`dateFormatted`** — e.g. `"21 jul 2026"` (day, 3-letter lowercase month,
  year).

For a fast-developing story where the exact time matters (a vote, an
announcement tied to a specific wire timestamp), it's fine to fold a time onto
the end: `"30 jul 2026, 10:01 hrs"`, converted to Mexico City local time
(UTC-6; Mexico hasn't observed DST since 2022) from whatever timestamp the
source gives. There is no separate time column in the schema
(`lib/db/schema.ts`'s `articles` table has `date` and this free-text
`dateFormatted`), so this is the only place time-of-day precision can live.
It's optional; most stories don't need it.

---

## Identity and dedupe — **differs by funnel**

- **`substackUrl`** — populated by `publish-newsletter` (the source edition URL,
  same for every item from one edition); always `""` in
  `publish-sourced-article`. `app/(public)/articulo/page.tsx` renders a "Ver en
  Substack" button whenever this field is non-empty, and that label is wrong for
  a third-party link. There is no generic "ver fuente" variant of that button
  today.
- **`sourceUrl`** — the DB's unique dedupe key (`articles.sourceUrl`), so
  re-running a skill on the same link no-ops (`duplicate`) instead of
  publishing twice. **Internal only, never rendered**, and not a substitute for
  the `Fuentes:` credit line. Built differently per funnel:
  `publish-newsletter` uses `` `${substackUrl}#<slug-of-title-or-topic>` `` (one
  edition yields many items); `publish-sourced-article` uses the primary
  reference URL as-is (one link, one article).

Note this key only catches the *same URL* run twice. Same-story-different-URL is
what `overlap-check.md` exists for.

---

## Images

**`imageUrl` / `imageCredit`** — required for every article regardless of
priority. See `images.md`.
