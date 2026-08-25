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
| Noticias | `"Noticias"` | `"noticias"` | `2` |
| La Lana del Deporte | `"La Lana del Deporte"` | `"la-lana"` | `3` |
| Infinitas | `"Infinitas"` | `"infinitas"` | `2` |
| The Futbol Business Review | `"The Futbol Business Review"` | `"futbol-business-review"` | `3` |
| Anything else | `"Noticias"` | `"noticias"` | `2` |

The machine key for Noticias is `"noticias"` since 2026-08-14 (TODO #2): the
launch-era `"industry-shots"` key was retired everywhere in code, and
`normalizeSource()` (`lib/constants.ts`) maps any leftover legacy rows. Never
write `"industry-shots"` into a new row.

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

**Enforced since 2026-08-14 (TODO #1):** the publish script and every other
write path validate tags against `lib/taxonomy.ts` with `validateTags()`.
Case/accent/whitespace variants get canonicalized; anything else **fails the
publish** with the nearest option named in the error. Copy values verbatim
from the lists below — a typo can no longer mint a tag, it stops the run.
`priority` stays an editorial judgment; no validator touches it.

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

### `tagsProperty` — the coverage tier (hubs)

**Fourth tier, added 2026-08-18** (`lib/taxonomy.ts`, `PROPERTY_OPTIONS`).
Current vocabulary: `LFA`. Array, **normally empty** — most articles carry no
property tag at all, and that is the steady state, not a gap.

This tier is not a topic. The other three describe what a piece is *about*;
this one declares which permanent coverage destination it *belongs to*
(`/coberturas/<slug>`). It drives a route, so it has to stay stable, and
membership is binary rather than descriptive.

**The boundary rule — apply it mechanically, do not weigh it.**

Tag `LFA` if, and only if, **both** hold:

1. **Subject test.** The LFA (Liga de Fútbol Americano Profesional, commercially
   "LFA FINSUS") — the league itself, one of its franchises, its ownership, its
   investors, its plazas, its partners, its media or its events — is the
   **grammatical subject of the story's core claim**, not a party mentioned
   inside someone else's story.
2. **Business test.** The piece carries a business fact about that subject:
   capital, ownership, expansion, sponsorship, licensing, media rights,
   attendance, venue or governance. A match report, a roster move with no
   commercial figure, or a result is **not** LFA coverage for our purposes.

If either test fails, **do not tag it.** There is no "partial" or "adjacent"
value; a mention is not coverage.

**Explicitly out of scope** — the near misses that will actually come up:

| Story | Tag `LFA`? | Why |
|---|---|---|
| NFL plays a regular-season game in México | **No** | Subject is the NFL's international strategy. Mexican market, different property. |
| A brand signs the NFL for the Mexican market | **No** | NFL story. `NFL` in `tagsSport`. |
| ONEFA / college American football in México | **No** | Different property. |
| An LFA player signed by an NFL team | **No** by default | Subject is the NFL club's signing. Tag `LFA` **only** if the core claim is about the LFA's pipeline as a business asset. |
| Flag football's growth in México | **No** | Different discipline. A passing mention that the LFA also runs flag tournaments does not flip it — in the 2026-08-18 backfill this exact case was the sole string match and was rejected. |
| The LFA takes foreign investment | **Yes** | Subject ✓, business fact ✓. |
| A brand becomes an official LFA partner | **Yes** | Subject ✓, licensing/sponsorship ✓. |
| The LFA announces an expansion plaza | **Yes** | Subject ✓, business fact ✓. |

**Tag the property tier in addition to, never instead of, the other three.**
A tagged piece surfaces on `/coberturas/lfa`, so a wrong value is not cosmetic —
it puts the wrong story on a destination page. Note the sport vocabulary has no
American-football value today; `Multi-deporte / Otros` is the honest fallback
until one is added.

**Adding a property.** A new value here means a new hub. Do not invent one while
drafting — hubs are created by the `hub-builder` skill, which owns the intake
gate and registers the vocabulary in the same commit.


---

## Ranking

**The 0–99 boleta replaced the star system on 2026-08-20** (`lib/rank.ts`).
This section described `priority` as *the* ranking input for four months after
that stopped being true, and on 2026-08-25 a run followed it and nearly shipped
five articles graded on the retired scale. Read this part first.

**`boleta`** — the eleven yes/no answers that produce `score` (0–99). Set it on
every new article. `scripts/publish-newsletter.ts` takes it on `ArticleInput`,
calls `scoreFromBoleta()` and writes `score` / `confirmed` / `score_boleta`.
**Omitting it is not neutral:** the row lands at `score = null` and falls back to
`bridgeScore(priority)`, i.e. it gets ranked on the very system the boleta
replaced. As of 2026-08-25, 14 post-cutover rows carry that defect.

The number is never authored. `scoreFromBoleta()` is the only place a score may
be produced, so what you decide are the *answers*, and the score falls out:

- **decena** (tens) — what the story REPORTS. Pick exactly one `reports` level
  (news: `structural` 6 / `transaction-with-figure` 5 / `commercial-no-figure` 3
  / `recap` 1), then the modifiers: `globallyRelevant` +1, `mexico` +2,
  `regional` +1, `newDevelopment` +1, and `confirmed: false` **−2 decenas** plus
  a hard bar from the top slot. Stacked modifiers clamp at 9.
- **unit** (ones) — how well it is made, summing to exactly 9: `hardFigure` +2,
  `chartable` +2, `ownAnalysis` +2, `multiMarket` +2, `habitualEntity` +1.

Two of the unit questions are stricter than they look, and answering them
loosely is what the 2026-08-20 calibration pass was fixing:

- **`hardFigure`** is money attached to *the fact being reported* — the price,
  fee, loss or valuation of the thing that happened. Background, a precedent, a
  comparison or a third party's market size does NOT count. (The same trap as
  `Cifra clave`'s "story's own figure" rule in `dynamic-element-library.md`: a
  2026-08-25 draft led its Cifra clave with a national betting handle, which
  fails both rules for the same reason.)
- **`chartable`** needs at least three values comparable on ONE axis, in
  practice a series device (`Cronología`, `Reparto`, `Duelo`, `Recibo`,
  `Cotización`, `Resultados`, `Comparativo`). The single-value and non-numeric
  devices (`Cifra clave`, `Salto`, `Jugada`, `Alineación`, `Tablero`, `Mapa`)
  do **not** qualify, and neither does a `Duelo` carrying only one row — that is
  two values, not three.

Record genuinely arguable answers in `ambiguous` and say why in `notes`; the
whole point of storing the boleta is that a disputed running order becomes an
argument about one answer rather than about taste.

**`priority`** (Importancia) — 1–5. **Legacy.** No longer decides ranking, but
still required: the column is `NOT NULL`, `deviceBudgetFor()` still reads
`priority === 5` for the extra device slot, and the archive's visual tiering
still uses it. Keep setting it honestly on the scale below until it is dropped.

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

**Check precedent before you set it** (2026-08-11): query two or three
comparable published stories, same vertical or same running story, and match
them rather than reading the scale fresh. The rubric above is qualitative and
the 3/4 boundary carries most of the archive, so applied cold it drifts — a
Trump/FIFA follow-up went out at 4 off the "international, not Mexico-specific"
line while every other article in that saga was filed at 5.

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
