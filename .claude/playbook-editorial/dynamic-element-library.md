# The dynamic element library

**One copy, two skills.** Every device below applies identically to
`publish-newsletter` and `publish-sourced-article` output.

**Source of truth is code, not this file.** `lib/article-devices.ts` holds the
parsers, the budget and the mutually-exclusive pairs (`parseX` /
`applyBodyDevices` / `deviceBudgetFor` / `createDeviceLedger` /
`EXCLUSIVE_PAIRS`); `lib/product-hubs.ts` holds `Cifra clave`, `Jugada` and
`Ruta del dinero`; `lib/article-map.ts` holds `Mapa`'s renderer and the full
frame list in its header comment, and `scripts/build-world-map.ts` builds the
frame data it reads; `lib/brand-colors.ts` holds the club-palette registry and
the contrast guard that `Venta` and `Cadena` use. If a limit here ever
disagrees with the code, the code wins and this file is stale — fix it.

Everything is a **plain paragraph on its own line in `bodyMarkdown`**. No HTML,
no special fences. Shared syntax across the whole collection:

- items separated by ` · ` (spaced middle dot)
- key/value separated by ` — ` (spaced dash) — this is the one place an em dash
  is allowed, because it is parser syntax rather than prose
- **a malformed declaration renders as inert plain text, visible to the
  reader.** Devices fail loud, not silent. Over-budget and over-limit
  declarations both degrade this way, so a syntax slip is a shipped mistake.

---

## 1. The budget

Enforced in code by `deviceBudgetFor` / `applyBodyDevices`, not just here.

| `readingTime` | Base budget |
|---|---|
| ≤ 2 min | 1 device |
| 3–5 min | 2 devices |
| 6+ min | 3 devices |

**Plus one at any length when `priority: 5`.** A `priority: 5` story is the
site's own signal for "most likely to lead the homepage" (`lib/rank.ts`'s hero
selection) and should carry the fullest structure the format allows regardless
of how short the four-movement shape keeps `readingTime`. So a `priority: 5` piece
at the ordinary `readingTime: 2` gets **2**, and a 6-minute `priority: 5` La
Lana gets **4**.

`featured` does **not** add to the budget: it decays within a day
(`FEATURED_BOOST_DAYS`) and marks today's placement, not the story's lasting
weight the way `priority` does.

**Exempt, never counted:** the Opinión callout, the automatic devices (lead-in
scan marks, inline figure highlights, bold count-ups), La Lana's `Ruta del
dinero`, and the `Fuentes:` line.

**Rules of placement:**

- **Never repeat a device type in one article.** The renderer refuses the
  second one even under budget.
- **Two pairs are mutually exclusive** and the renderer enforces those too,
  first-declared-wins: `Venta` locks out `Jugada`, and `Cadena` locks out
  `Cronología`. Both pairs would tell the reader the same thing twice — see
  §2's entries for each. The loser stays visible as plain text, so a
  declaration you lose is a mistake you can see.
- **Order matters.** First declared in document order wins the budget, so place
  the device carrying the story's spine first.
- **Keep at least two prose paragraphs between devices.** The renderer does not
  enforce this one; you do.
- **Place a device immediately after the paragraph whose numbers it
  visualizes**, never bunched at the end of the piece. The device is a visual
  stop inside the argument, not an appendix to it.
- **Every number inside a device must appear in, or be directly computable
  from, the verified reporting.** Never invent data to fill a device. A figure
  going into a chart needs the same sourcing bar as one going into a sentence.

### "No device fits" is the exception, not the default

(2026-08-06, publisher directive.) Earlier wording — "only when the story
genuinely has that shape; a forced device is worse than none" — read as license
to skip the whole collection the moment nothing obvious jumped out, and that
quietly made zero devices the normal outcome instead of the rare one.

In practice almost every story fits something once you check the full list
instead of the first shape that comes to mind: a contract has the career-to-date
as a `Cronología`, a fee has a `Reparto` of who gets what or a `Cifra clave` for
the headline number, a signing has a `Jugada` for the two sides, a schedule
change has a `Salto`, an earnings release is a `Resultados`.

**Walk all twenty-three shapes** before writing an article off as device-free,
especially on a `priority: 5` piece — exactly the story that should carry the
richest structure. What stays strict is fabrication, not effort: never invent a
milestone, a split, or a figure the piece doesn't already contain just to
manufacture a fit. A story with genuinely no numbers, no timeline, no pairing
and no roster still gets none. That is a real outcome, just a rarer one than it
used to be.

---

## 2. The twenty-three devices

Pick by **story shape**: a saga → `Cronología`; a breakdown → `Recibo`; a split
→ `Reparto`; a pairing → `Jugada`; one number → `Cifra clave`; an earnings
release → `Resultados`; two institutions → `Duelo`; volatility over time →
`Serie`; countries → `Mapa`; an asset changing hands → `Venta`; a succession
of owners → `Cadena`; **a market price dragging something else with it →
`Cotización` (track form)**; a deal signed for a term → `Contrato`; the dated
road ahead → `Calendario`; a governance vote → `Votación`; N actors on one
metric → `Ranking`; the path from revenue to margin → `Cascada`; one actor at
the center → `Perfil`; explicit outcomes with Playbook's read → `Escenarios`;
a market roundup's numbers → `Tablero`.

---

### `Cifra clave:` — the pull-figure

```
Cifra clave: US$720 millones — el valor del nuevo espacio comercial
```

Renders full-bleed: the number set huge between rules, counting up as the
reader reaches it, with the text after ` — ` as its caption.

- Value must contain a digit and stay **≤24 characters** (longer values are
  left as ordinary text).
- Typically **0–1 per article**. More is legal but dilutes the beat.
- **Never restate the figure in the neighboring paragraph.** The beat replaces the
  sentence, it doesn't decorate it.

**It must be the STORY'S OWN figure, never a context figure.** Calibrated on
real output, 2026-08-05: the LIV Golf piece led its excerpt with the PIF's
historical "6,000 millones" (context) while the story's actual figure, the
rumored US$250M investment, sat unmarked mid-body — and the homepage surfaced
the wrong number. Ask: *"if the reader remembers one number from this story,
which is it?"* That's the Cifra clave. A rumored or unconfirmed figure still
qualifies when it IS the story — declare it with the attribution **in the
caption** ("La inversión que reporta el New York Post; LIV no la confirma"),
never in the value. Since 2026-08-13 a trailing parenthetical on the caption
renders as a small attribution chip — `Cifra clave: US$250M — lo que pide LIV
(Bloomberg)` — which is the designed home for that attribution (≤32 chars,
optional).

**The homepage reads this beat.** "La cifra del día" (sidebar) picks the top
ranked story with a figure and PREFERS its declared Cifra clave over anything
scraped from title/excerpt. Declaring the beat is how you control what number
represents the story site-wide.

**The caption has to work away from the article** (2026-08-07). The rail prints
it under the chip, where it is the only thing telling a reader what the number
measures — a figure alone reads as a price with no unit ("US$8,000 a US$20,000"
under a headline about talent factories). Write the caption to **name the
thing**: "el costo anual del futbol juvenil de alto nivel en Estados Unidos",
not "lo que cuesta". The caption is optional to the parser and mandatory in
practice; a Cifra clave declared without one ships a bare number to the
homepage.

---

### `Jugada:` — the connection strip

```
Jugada: Volkswagen ↔ Bayern
```

A split-flap connection strip in the departures-board language.

- `↔` for a two-way relationship, `→` for a one-way flow (an expansion, a sale,
  a rights move).
- Each side **1–4 words, ≤32 characters** (longer leaves the paragraph as plain
  text).
- An optional ` — nota` after the pairing (2026-08-13) sets what the connection
  IS in one caption line under the strip: `Jugada: Chelsea ↔ Strava —
  patrocinio de 3 años`. ≤60 chars; the bare pairing renders as before.
- **At most ONE per article**, and only when the pairing is documented by the
  piece itself.
- Placement: right after the paragraph that establishes the relationship, usually
  the first.

Use it when the story **is** a relationship (a deal, a partnership, an
investigation pairing, an acquisition). A figure-driven story should prefer
`Cifra clave` — don't stack both unless the story genuinely carries a defining
number AND a defining pairing. For la-lana articles the Jugada usually matches
a connection also being pushed to the departures board; use the same wording in
both places.

---

### `Cronología:` — the drawn timeline

```
Cronología: 2022 — PIF entra · 2024 — recorte · 2026 — salida
```

For sagas: a deal, feud or decline that unfolds over dated milestones.

- **2–8 items.** Dates ≤16 chars, events ≤90 chars. (Capacity raised
  2026-08-13 from 2–6 / 14 / 70: the page now switches to a vertical-spine
  layout past six items, so a long saga no longer squeezes or amputates.)
- **The 8-item ceiling is a hard code limit, not a stylistic suggestion.**
  `parseTimeline` returns null past 8. Up to six items render on the
  horizontal spine; seven or eight automatically stack vertically — both are
  designed layouts, neither needs anything from the author.
- **Every limit fails the same silent way — count, date length, event length,
  and an unspaced dash all make `parseTimeline` (`lib/article-devices.ts`)
  return null and the line ship as plain text.** A 5-entry Cronología
  "mysteriously" rendering unstyled (2026-08-13, the Flag Football piece) was
  one event past the old 70-character limit, not a rendering bug. Check each
  entry against the limits at drafting time, and spot-check the live page
  after publishing a device-carrying piece.

Two directions follow, both from a real case (2026-08-07, a FIFA-governance
saga with 13 independently dated events):

1. **When the story has 8 or more real milestones, USE all 8 slots.** A 3-item
   Cronología on a story that has had eight-plus dated beats is under-using the
   device, not being conservative.
2. **When a saga genuinely runs past 8, the device is not where the rest goes.**
   Pick the 8 most load-bearing beats (the spine) and weave the remaining,
   still-sourced events into the prose. A paragraph that names three more dated
   developments in a sentence tells that part of the story fine.

The LAST milestone renders highlighted (filled dot, bolder event) as "where
the saga stands now" — automatic, nothing to author, so order the beats
chronologically and end on the current state, not on a side note.

---

### `Recibo:` — the thermal receipt

```
Recibo: Torneos — 10 · Bolsa por evento — US$10M · Total — US$107M
```

For cost breakdowns and who-paid-what. The Total counts up.

- **2–8 lines.** Label ≤42 chars, value ≤24 chars.
- A line whose label starts with **"Total"** gets the total treatment. Include
  one when the sum is the point.
- **The receipt checks its own arithmetic** (2026-08-13): when a Total row and
  every other line parse in one denomination, a sum off by more than 2.5%
  rejects the whole device to plain text. A receipt that doesn't add up is the
  one thing a receipt must never be — recheck the figures, don't fudge a line
  to force the render.

---

### `Ecuación:` — display math

```
Ecuación: 104 partidos × US$6M por partido = US$624M
```

For "the math behind the deal", with counting operands.

- **2–4 terms** plus one result, and exactly one `=`.
- Operators: `×`, `+`, `−`, `/` (a plain `x` and `-` are normalized).
- **Every term must start with a real number.**
- **The equation checks itself** (2026-08-13): when every term parses, it is
  evaluated left to right and a result off by more than 3% rejects the device
  to plain text. Terms carrying `%` skip the check (a percentage's face value
  isn't its factor).

Note this device is where the "no arithmetic showmanship" rule
(`voice-and-style.md` §7) bites: reach for it when the math reveals the
business, not to perform rigor.

---

### `Salto:` — the before/after delta

```
Salto: 14 torneos → 10 torneos — el calendario 2027
```

Direction-coloured (green up, red down), computed from the numbers.

- Both sides **≤26 chars** and both must contain a digit.
- Caption after ` — ` is optional.
- **The percent change is computed, never authored** (2026-08-13): when both
  sides share a denomination the device prints a `+98%` / `−29%` chip beside
  the destination figure. Don't restate that percentage in the neighboring
  prose — same rule as `Venta`'s multiple.

For growth and shrink stories.

---

### `Reparto:` — the proportion bar

```
Reparto: FIFA — 70% · Federaciones — 20% · Clubes — 10%
```

- **2–5 shares.** Label ≤30 chars; each value must contain a percentage.
- **The sum is checked** (2026-08-13): 97–103 renders as declared (rounding);
  under 97 the device adds an explicit `Otros` segment for the remainder (so
  make the shares sum to 100 yourself when "Otros" isn't the honest label);
  over 103 rejects to plain text — shares of one whole cannot exceed it.
- Since 2026-08-13 all five segments carry distinct swatches (a dark accent
  anchor, the accent, one flat tint and two striped tints — pattern keeps the
  light steps apart in print and for color-blind readers). Order the shares
  biggest-first when the story allows: the strongest shades land on the
  biggest slices.

**Not only money.** It is the right device any time a story has a countable
universe splitting into camps: members of a body who back / oppose / haven't
said, votes, seats, market share of competing products.

Worked example, 2026-08-07: a FIFA-governance piece used it as "of FIFA's 211
member federations, X% publicly backed the president, Y% opposed, Z% hadn't
taken a position" — computed from **actually-confirmed** individual and bloc
counts. A confederation that voted unanimously counts as its full membership; a
single federation's own statement counts as one; the remainder is whatever is
left of the total universe. **Never estimate the remainder bucket from a
guess** — it should always be `total − everything you can actually source`.

An `Alineación` naming the same actors is the weaker choice whenever a real
number exists for each side: chips show *who*, a Reparto also shows *how big*,
which is usually the more informative half of a camps-and-counts story.

---

### `Alineación:` — the lineup chips

```
Alineación: Madonna · Shakira · Justin Bieber · BTS
```

Numbered chips that flap in. For enumerations of actors: artists, investors,
host cities.

- **2–8 names**, each ≤28 chars.
- An optional parenthetical per name (2026-08-13) sets a small role line under
  the chip — `Alineación: Apple TV (broadcaster) · Nike (kit) · Grupo Salinas
  (dueño)` — for rosters of UNLIKE actors whose roles the prose would otherwise
  have to narrate. ≤20 chars per role; a bare roster renders as before.
- **Each name is resolved against the brand registry** (2026-08-15, publisher
  directive: *"en alineación usa colores de los equipos, si no los tienes
  encuéntralos"*). A chip whose name `lib/brand-colors.ts` knows takes that
  asset's contrast-corrected colours, the same registry and the same guard
  `Venta`, `Cadena` and `Perfil` use, so a roster of clubs stops reading as
  six identical chips for six identities that each own a colour. Nothing to
  author: write the roster, get the colours. The `Nombre #HEX #HEX` escape
  hatch works here too, and it is resolved BEFORE the 28-character name check,
  so the hex spends no part of the name's budget.
  **An unregistered name keeps the product accent** rather than falling to the
  house green — the opposite of `Venta`'s fallback, and deliberate: a roster of
  people (`Madonna · Shakira · BTS`) is the device's original use and must not
  turn green. So a mixed roster of clubs and people is a legitimate, readable
  outcome, not a half-applied one.
  When a club in a roster has no registered palette, **add it to the registry
  rather than eyeballing a hex** — and if no authoritative brand colour can be
  sourced, leave it unregistered. The registry's own rule holds: a genuinely
  monochrome or absent palette is an answer, never a value to invent. (The PWHL
  is the standing example — every source agrees the mark is purple and none
  publishes the hex, so it stays on the accent.)

---

### `Cotización:` — the market tile, and the track

Two forms. They are told apart by the **first item**: a `Nombre — valor` opening
is the tile, a bare framing item is the track.

#### The tile — one moment

```
Cotización: Ollamani — MX$14.50 · -34.6% · en el año
```

A market tile with a ▲/▼ delta. For public-company and valuation results.

- Name ≤36 chars; then **2 or 3 items**: value, delta, optional note.
- Value ≤20 chars and must contain a digit.
- Delta ≤14 chars and **must contain `%`**. A leading `−`/`-` sets the down
  treatment.
- An optional `Rango — <lo> a <hi>` item (2026-08-13) draws the 52-week-style
  range track under the tile with the current value marked on it — WHERE in
  its year a price sits. All three figures must share one denomination and the
  value must sit inside the range; a range that doesn't hold its own value
  rejects the device (malformed data, not decoration).

#### The track — a price over time, and what it is dragging with it

```
Cotización: On Holding vs Patrimonio de Federer · Umbral — US$1,000M · ago 2025 — US$50.00 · 11 ago 2026 — US$38.78 vs US$1,004M · 12 ago 2026 — US$31.29 vs US$952M
```

(2026-08-12, publisher directive.) The tile is one moment. This is the same
device given a time axis, a second **independently scaled** track, a threshold
line, and a scroll-driven zoom from the whole arc into the closing window.

- First item names the tracks: `A vs B`, or just `A` for a single line. Each
  side ≤34 chars, and the item must contain no ` — ` (the framing rule `Duelo`,
  `Serie` and `Resultados` all carry).
- `Umbral — US$1,000M` is optional and may sit anywhere in the item list. It
  draws a labelled line on track B's scale.
- Every other item is `punto — valorA` or `punto — valorA vs valorB`. Point
  label ≤16 chars, values ≤20 and each must contain a digit.
- **An item with no ` — ` is an unlabelled track A point**, written bare
  (`47.60`). This is what makes a real ticker declarable: a year of daily
  closes is 250-odd points and only two are ever drawn with a label, so
  spending `fecha — valor` on the interior ones would quadruple the paragraph
  to carry text the renderer discards. Bare values inherit their currency
  from the first labelled point.
- **3–300 points.** The first and last must carry labels, because that is
  what the axis is drawn from. Track B needs at least two real values; a `vs`
  value on a device that never named a second track rejects the whole
  declaration.
- Past ~14 points in a window the dots disappear and the track draws as a bare
  stroke, which is what makes a dense series read as a ticker rather than a
  bead necklace.

**Beyond about ten points, paste, don't type.** A 258-point declaration is
~2,200 characters and is generated from real market data, not authored by
hand. That is the intended workflow for a ticker: pull the closes, format them
as ` · `-separated values, and label only the ends. It also means the usual
sourcing bar applies with more force, not less, because nobody is reading each
number on the way in.

**Why this is not `Serie`.** `Serie` puts both series on ONE shared Y axis and
its own rules require the same kind of measure, because the shared axis is what
makes the two shapes comparable. A share price of US$31.29 and a fortune of
US$952M are not the same measure, and forcing them onto one axis flattens the
smaller series into the baseline. Here each track carries its own scale: the
reader is being shown **correlation in time**, not magnitude against magnitude.
Reach for `Serie` when the two series are the same measure and the comparison
IS the point; reach for this when one number is visibly driving another.

**Track B may start late, and that is the feature.** A price has a quote every
day; a fortune is estimated occasionally. Give track B a value only at the
points where a real one exists and its line simply begins there. The
alternative is interpolating the missing net-worth values, which the
"every number must be in the reporting" rule forbids — so the gap is what keeps
the device honest, not a limitation to work around.

**The threshold is the story, when there is one.** Track B is scaled
symmetrically about the declared `Umbral`, so the line sits at mid-box at every
zoom level and above/below it means something the reader can see. This also
stops the two tracks rendering as one line: without it, any two-point window
auto-scales both tracks corner to corner and they come out exactly collinear,
which is worst at the most magnified moment. Declare an `Umbral` whenever the
story turns on a level being crossed (a billion, a covenant, a market cap).

**`Ligado — sí` makes track B move with track A between its anchors**
(2026-08-12, publisher directive: "fluctuate it more with the stock, as it
impacts"). A fortune that is mostly one shareholding moves every day that
stock moves, but nobody publishes it daily, so a straight line between four
Forbes estimates asserts the one thing we know is false: that the wealth sat
still for seven months.

With the flag on, the device marks track B to market. Net worth = k × price +
everything else; `k` comes from the LAST anchor pair, the only place a wealth
move and a price move cover the same interval, and the residual is
interpolated linearly between anchors to absorb the drift a share price
cannot explain. The curve passes exactly through every declared value, so no
sourced figure is disturbed.

**Check the source's own figures against each other before one drives a
curve.** (2026-08-12, on the Federer ticker.) Forbes published both a stake
("about 2.5% of On") and a same-day loss ("at least US$52 million" on a 19%
fall). Those cannot both hold: On's market cap counts both share classes,
about 638M shares, so 2.5% is roughly 16M shares and the day would have cost
about US$126M, some 2.4 times the figure the same article reported. The
published dollar moves imply an exposure nearer 1.1%.

The rule that follows: **derive a device's sensitivity from direct
observations of the quantity being plotted**, not from a descriptive
attribute mentioned in passing. Two net-worth readings a day apart are two
measurements of the line you are drawing; a percentage is a characterisation
that ages (a 2019 stake dilutes through an IPO and later issuance, and
insiders sell). When they disagree, prefer the measurements, drop the
conflicting attribute from the copy rather than printing both, and say in the
run report that they did not reconcile. Printing both invites a reader to
multiply and catch the publication out.

**This is a level-3 reading, and the device says so.** Every point the model
adds is flagged internally: it gets no dot and prints no figure, because a
marker is a claim that someone published that number. A disclosure line sits
**above** the chart naming how many estimates are real and what the rest is,
and the same sentence goes into the `aria-label`. Never turn this on to make
a flat line look livelier — turn it on when the second track is genuinely
driven by the first, and say so in the prose too.

**The ticker wears its own brand.** Track A's name is resolved against the
same registry `Venta` and `Cadena` use, so a `Cotización` on On Holding opens
with the same colour-block crest a `Venta` on the Lakers does, and track A's
line and figures take that company's contrast-corrected ink. The two device
families read as one visual language: the asset announces itself, then the
data. An unregistered ticker falls back to Playbook's own palette exactly as
the transfer devices do.

**The zoom window scales with the series.** It is the last 8% of the points,
never fewer than two: a three-point declaration lands on its final move, a
258-day ticker lands on its last three weeks, which is the crash WITH the days
either side of it. A window that opens on an unlabelled interior point gets no
left-hand tick rather than a borrowed one, because an axis that says
"1 ago 2025" over a three-week window is worse than an axis with one end.

**The zoom needs the arc to be worth zooming out of.** The device renders two
complete, independently projected layers, the full range and the last two
points, and the motion pushes from one to the other on scroll. Both are correct
at rest and the `lect-cot-detail` strip under the chart always carries the
closing numbers as text, so a reader with no JS or reduced motion loses the
animation and nothing else. Spend the extra points on real history: a
three-point declaration works, but the push-in earns its place when the wide
view has a shape the closing window contradicts.

The closing percentage move is **computed** from the last two track A values,
like `Venta`'s multiple. Don't restate it in the neighbouring paragraph.

---

### `Resultados:` — the statement panel

```
Resultados: Fox Corporation, Q4 fiscal 2026 · Ingresos — US$4,210M (+28%) · Publicidad — US$1,916M (+78%) · Utilidad neta — US$696M
```

One line per metric, value right-aligned on tabular numerals, its change in a
fixed gutter after it, so a reader can run down the column of ▲/▼ without
reading a single figure.

**This is the device for an earnings release or a filing** — the shape the
collection was missing until 2026-08-11. `Recibo` lists labelled amounts but
knows nothing about a delta; `Cotización` carries a value AND a delta but only
as a single tile; `Salto` moves one metric from before to after; `Duelo` needs
two different actors. A quarterly report is none of those. It is four to six
lines belonging to the **same company** over **one period**, each moving by its
own amount, and the story is almost always in which lines disagree with each
other. Fox's advertising up 78% against total revenue up 28% is the whole
article in two rows.

- First item is the **subject and period** and must NOT contain a ` — ` (same
  way `Duelo` and `Serie` spend their first item on framing). ≤52 chars.
- Every item after it is `etiqueta — valor`, with an **optional** signed
  percentage in parentheses at the end.
- **2–6 rows.** Label ≤42 chars; value ≤24 chars and must contain a digit.
- Each row with a delta also draws a thin **delta-magnitude bar** (2026-08-13),
  scaled to the panel's largest move and colored by direction — the
  divergence between lines reads in one pass. Automatic, nothing to author.

**The delta is optional per row on purpose.** A filing routinely reports a line
with no comparable in the prior period (a segment that did not exist, a first
reported quarter), and the honest answer is to leave the parenthetical off,
which renders as an empty gutter. Never fill it with a number you computed to
make the column look complete, and never carry a percentage across from a
different line because it is nearby in the release.

**Direction colour follows `Salto`** (green up, red down) rather than guessing
whether "up" is good for that particular line: an expense rising draws green
here exactly as a `Salto` on the same expense would, and the label plus the
prose carry the judgement. The arrow already states the sign, so the rendered
delta drops it (`▲ 28%`, `▼ 38%`) and the authored `(+28%)` / `(−38%)` is just
how you write it.

**The prose must NOT recite the grid** the panel already prints — same rule
`Serie` carries, for the same reason. Name the source, state the one or two
lines the argument turns on, and let the rest live in the device. A paragraph
repeating all eight numbers next to a table of the same eight numbers is what a
reader calls a crossword.

---

### `Duelo:` — the butterfly chart

```
Duelo: UEFA vs FIFA · Ingresos 2022-2025 — €20,163M vs US$10,083M · Reservas — €522M vs US$2,699M
```

Two actors, 1–4 metric rows, bars anchored on the centre line and growing
outwards. For "X gana más que Y" comparisons — the shape `Reparto` and `Salto`
can't cover, because `Reparto` splits ONE whole into slices and `Salto` moves
ONE metric from before to after, while this puts two separate institutions
against each other on several measures at once.

- First item names the sides (`A vs B`, each ≤26 chars); every item after it is
  `etiqueta — valorA vs valorB`.
- A row whose two values aren't both numeric renders as a **bare text row with
  no bars**, so a `Sede — Nyon vs Zúrich` line can sit under the money without
  faking a magnitude.
- A value with a leading minus (`−€46.2M`) bars its magnitude in the loss
  treatment, red bar and red figure, so a `Resultado del año` row can sit next
  to revenue rows without a longer bar reading as a bigger win.
- **The per-row ratio is computed, never authored** (2026-08-13): when both
  sides are positive figures in one denomination and differ by ≥1.15×, a small
  `2.0×` chip appears beside the row label, tinted with the winning side.
  Don't restate the ratio in prose — same rule as `Venta`'s multiple.

**One scale for the whole device** (publisher directive, 2026-08-08). Every bar
is a share of the single largest magnitude in the device, so rows are readable
against each other — a reserve that is a tenth of a year's revenue draws a
tenth of the top bar, and an annual deficit draws the sliver it actually is.
This is the point of the shape, so **write all rows in one unit**. A percentage
row next to money rows can't share a scale and silently drops the whole device
back to per-row scaling, where every row peaks at 100% and four different
magnitudes end up looking identical.

Mixed currencies are allowed and the bars compare raw magnitudes, so only put
two currencies in one row when the piece has already told the reader why that
comparison holds.

**Check that both numerators cover the same activity** before putting two
institutions' spending side by side. Each body classifies its money its own way
and a matching category name is not evidence that the contents match. Worked
example, 2026-08-08: UEFA's €3,861M distribution against FIFA's US$748M
"Development & Education" line implied a five-to-one gap, but FIFA books Club
World Cup prize money (US$1,000M in 2025) under Competitions & Events, so the
comparable figure was US$1,748M. Read it off each side's OWN statements, never
off the label.

---

### `Serie:` — two lines on one axis

```
Serie: UEFA vs FIFA · 2022 — €4,052M vs US$5,769M · 2023 — €4,321M vs US$1,170M · 2024 — €6,777M vs US$483M · 2025 — €5,014M vs US$2,661M
```

Drawn left to right on scroll, with each point's value printed on the line.
Deliberately the same grammar as `Duelo` (first item names the sides, then
`punto — valorA vs valorB`), except the rows are points in **time** and **3–8**
of them are required.

Use it for **volatility**, the one thing no single-moment device can show: two
bodies can post the same four-year total while one collects it evenly and the
other collects it in a single spike, and only the shape says which. The
2026-08-08 FIFA/UEFA piece is the worked example — FIFA swung 12× between its
weakest and strongest year while UEFA moved 1.7×, and the lines cross, which is
the whole argument in one image.

- **Every point must be numeric on both sides.** A chart cannot carry a gap the
  way a `Duelo` row carries a text value, since one hole makes every later x
  position lie.
- Both series share one Y axis, so the values must be the same kind of measure.
- Series A takes the product accent, series B a blue. **Red is deliberately not
  available here** because it means "a loss" everywhere else in the collection,
  and a permanently red line would read as a verdict at every point, including
  the ones where that series is ahead.
- When the two series use different period conventions (a July–June season
  against a calendar year), say so in the prose — the axis can only carry one
  set of labels.

**The "every device number must be in the piece" rule bends here, and only
here.** A `Serie` prints its own values on the lines, so restating all eight or
twelve of them in the paragraph above produces exactly the number dump a chart
exists to replace. What the prose owes a `Serie` instead: name the **source**
the series comes from, and state the **extremes** that carry the argument (the
peak, the floor, the range each side moved in). Interior points can live on the
chart alone. The rule's purpose is that no figure appears without provenance a
reader can check, and a named source plus printed values satisfies it.

**Pair it with a `Duelo` rather than repeating one in the other.** When both run
in one piece they divide the labour: the `Serie` shows how the money ARRIVES
over time, the `Duelo` what each side DOES with it (distributions, result,
reserves). The 2026-08-08 piece first shipped a `Duelo` whose top rows were the
series' own minimum and maximum, which drew the same comparison twice; moving
the butterfly onto the distribution/result/reserves data made the two devices
complementary instead of redundant.

---

### `Venta:` — the deed

```
Venta: Lakers · Precio — US$12,500M · De — Mark Walter · A — Josh Kushner y Bob Iger · Anterior — US$10,000M (2025) · Fecha — Agosto 2026
```

The transfer of title itself: the asset's own colours across the top, the two
parties either side of a transfer arrow, the price as the largest thing in the
device. **This is the device for an acquisition** — the shape the collection
was missing until 2026-08-12. `Jugada` names the two sides and drops the
price; `Salto` moves the price and drops the sides; `Cifra clave` prints the
number alone. A sale is all three facts in one beat or it is not the story.

- First item is the **asset** and must NOT contain a ` — ` (same framing rule
  `Duelo`, `Serie` and `Resultados` carry). ≤32 characters after resolution.
- Then labelled rows, in any order. **`Precio`, `De` and `A` are required**;
  `Anterior` and `Fecha` are optional. **Any other label rejects the whole
  declaration** — a silently-dropped row in a deed is a fact the reader never
  learns was declared.
- `Precio` and `Anterior` ≤24 chars and must contain a digit; `De`/`A` ≤48;
  `Fecha` ≤24. `Anterior` takes an optional parenthetical: `US$10,000M (2025)`.
- **At most ONE per article**, and it **locks out `Jugada`** (see §1).

**The multiple is computed, never authored.** Declare `Anterior` and the device
divides it into `Precio` and prints `1.25×` in the direction colours (counting
up from zero as the deed enters view, as of 2026-08-13). Do not
also state the multiple in the prose — same rule the `Mapa` legend carries, for
the same reason: a figure the device derives cannot contradict the copy. It is
omitted silently when the two figures are denominated differently (`€900M` into
`US$1,200M` is a currency change, not growth), so if you expected a multiple and
don't see one, the units are the thing to check.

---

### `Cadena:` — the chain of title

```
Cadena: Lakers · 1979 — Jerry Buss — US$67.5M · 2025 — Mark Walter — US$10,000M · 2026 — Kushner y Iger — US$12,500M
```

Every owner the asset has had, drawn **down** the page, with each era's bar as
long as the era lasted. Use it when the succession IS the argument: the Lakers
spent 46 years with one family and then changed hands twice in fourteen months,
and that shape is the story.

- First item is the asset, same rule as `Venta`. Then **2–6 links**, each
  `cuándo — quién — precio` (the em dash splits twice).
- `cuándo` ≤14 chars, `quién` ≤32, `precio` ≤20 and must contain a digit. A
  link carrying a third dash is malformed and rejects the device.
- **Each handover's own multiple is computed** (2026-08-13): every link after
  the first shows what it paid over the previous price (`4.0×`), beside its
  price, when the denominations match — which owner captured the growth, not
  just that the chain grew. Don't restate these in prose.
- Years must run **forwards**; an out-of-order chain rejects rather than drawing
  a negative span.
- **It locks out `Cronología`** (see §1) — a chain of title that also runs a
  timeline is two timelines.

**The hold bars only draw when every link carries a real year.** A chain dated
"los ochenta" renders fine, without bars, because a span drawn from a guess
would be the one part of the device a reader can't check. The whole-chain
multiple (first price into last) is computed on the same terms as `Venta`'s.

**Prefer `Venta` when the story is today's transaction** and `Cadena` when it
is the succession. They are not exclusive of each other — a big enough sale
earns both, the deed for what just happened and the chain for what it took to
get here — but that is two of your budget slots, so it wants a `priority: 5`
piece.

---

### Both: the asset wears its own colours

`Venta` and `Cadena` are the only devices that don't take the product accent.
The asset's palette comes from the registry in `lib/brand-colors.ts` (NBA, NFL,
MLB, Liga MX, LaLiga, Premier, Serie A, Bundesliga, Ligue 1, MLS, plus the
leagues and confederations themselves), matched on the name you write —
accents and punctuation are ignored, so `Lakers`, `lakers` and `L.A. Lakers`
all land.

- **An unregistered asset is a normal outcome, not a failure.** Media rights, a
  stadium, a league stake, a club nobody has added yet: the device renders in
  **Playbook's own house palette** — the same on Noticias, La Lana, Infinitas
  and TFBR alike, because "this asset has no crest" is one state and should
  look like one thing. Declare `Venta` for **any asset worth the beat**, not
  for registered clubs only.
- **Escape hatch:** `Venta: Wrexham AFC #FF0000 #FFFFFF · …` — the asset name
  followed by two hex values, primary then secondary. Use it for a one-off; if
  the club will come up again, add it to the registry instead.
- **Every palette is contrast-corrected per theme automatically**, so you never
  have to think about whether a colour will read. Lakers gold darkens to an
  ochre as a rule on cream paper and returns to full gold on the dark theme;
  Nets black lifts to a grey there. If a rendered colour looks unlike the club's
  actual one, that is the guard working, not a registry error.

---

### `Mapa:` — real geography

```
Mapa: Concacaf · En el comunicado — resto · Sin firmar — MEX
```

The frame's countries are drawn from the world dataset and split into labelled
camps, with a legend that counts each camp for itself.

- First item is the **FRAME**: `mundo`, `concacaf`, `conmebol`, `uefa`, `ofc`,
  `caf`, `afc`, `europa`, `áfrica`, `asia`, `oceanía`, `norteamérica`,
  `sudamérica`, or `auto` (which frames exactly the countries the groups
  name — use it for any set that isn't one of the above, e.g. World Cup hosts).
- Every item after it is a group: `Etiqueta — MEX, USA, CAN` with **ISO3**
  codes, a **confederation name** that expands to its federations
  (`Respaldan — CAF, CONMEBOL, OFC`), or `Etiqueta — resto` for every framed
  country no other group claimed.
- **One to five groups.**
- An optional **PALETTE** follows the frame name: `Mapa: mundo bandos`.

**A group may name a confederation** (2026-08-15), because that is the unit a
governance story actually splits on, and spelling one out by hand is 41 to 55
ISO3 codes in a paragraph. Two rules make the expansion trustworthy, both
enforced in `lib/article-map.ts`:

1. **A confederation named in a GROUP expands to its FIFA MEMBERS, not its full
   roster.** The six confederations have 218 members between them and FIFA has
   211: nine associations play in a confederation without holding a FIFA seat
   (six in Concacaf, two in the OFC, one in the AFC). A legend counting an
   electorate has to count votes, so those nine draw as context and are never
   tallied. Framing is untouched, so `Mapa: concacaf` still draws all 41. This
   is what lets a legend that says 136 sit next to prose that says 136.
2. **A country named explicitly outranks the same country arriving via its
   confederation**, whatever the group order. So "the bloc, minus the one that
   broke ranks" is two groups and the defector is counted once, not twice:
   `Piden revisión — UEFA, AFC, CONCACAF · Rompen filas — MEX, NZL` leaves
   Mexico out of Concacaf's own tally and the counts still sum to 211.

Frame names win over ISO3 codes inside a group. **Exactly one collision exists
in the whole vocabulary: `CAF` is both the confederation and the Central
African Republic**, and inside a group it means the confederation. The country
is still drawn by the `caf`, `áfrica` and `mundo` frames and by any `resto`
group, which is the only way it has ever come up.

**The visual ramp is fixed and means the same thing on every map:** group 1 is
the filled mass, group 2 is **hollow with a heavy outline** (the exception, the
holdout, the one that's missing), group 3 is a mid tint. So "everyone except X"
is written as `Grupo — resto · X — MEX` and X reads as the hole in the map,
which is exactly the shape a "who signed and who didn't" story has.

**A fourth group** (2026-08-15) takes the accent fill AND the heavy outline.
At four groups the ramp stops being an order and becomes two variables: the
**fill** says which side a country is on, the **outline** says it spoke in its
own name instead of inheriting its bloc's position. Groups 1 and 3 are the two
silent masses, group 2 is whoever broke away from group 1's side, group 4 is
whoever said it out loud on that side. Declare them in that order and the map
explains itself without a sentence of setup.

**Group 1 takes the product accent, so put the side the accent should mean
there.** On a Noticias article that accent is Playbook's green, and a reader
reads green as the affirmative — so a governance map whose group 1 is the camp
demanding somebody's head will say the opposite of what it means, in the
loudest colour on the page. Order by what the colour asserts, not by which camp
is biggest (2026-08-15, caught in review on the FIFA electorate map, where the
first pass painted 127 federations asking for an independent review in the
approval colour).

### The `bandos` palette — two camps that are equally the story

```
Mapa: mundo bandos · Lo apoya su confederación — CAF, CONMEBOL, OFC · Lo apoyan por su cuenta — MEX, QAT · Pidió revisión su confederación — UEFA, AFC, CONCACAF · En contra por su cuenta — ENG, NZL · Sin definir — USA, CAN, SAU
```

The default ramp is one hue plus a hollow exception, which is right for "who
signed and who didn't": one camp is the subject, the other is its absence. It
is wrong when both camps are the story, because a single hue makes one side
look like a weaker version of the other, and the accent hands one of them the
approval colour whatever you do.

`bandos` (2026-08-15, publisher directive: the two sides need contrast) uses
**two opposed hues** — the house green against the Noticias blue — plus a flat
neutral for whoever has not chosen. Declared on the frame item, opt-in, so
every published map keeps the ramp it shipped with. Its slot order is fixed:

| Slot | Treatment | Means |
|---|---|---|
| 1 | green | camp A, position inherited from its bloc |
| 2 | green + heavy outline | camp A, **said it in its own name** |
| 3 | blue | camp B, inherited |
| 4 | blue + heavy outline | camp B, **said it in its own name** |
| 5 | flat neutral | has not taken a position |

Two variables, not five arbitrary colours: **hue says which side, the outline
says the country spoke for itself.** A reader learns it once. Both hues are
theme-adaptive tokens, so the contrast holds in dark mode. Use it for an
election, a vote, a split that will run for months; keep the default ramp for
a one-sided "everyone except X".

Use it when the story's unit is **countries** and their split is the argument:
signatories vs holdouts, hosts vs bidders, the markets a rights deal covers,
where a league is carried. It is the wrong device for a split with no geography
(that's `Reparto`) and for naming people (`Alineación`).

Territories too small to draw at this size render as dots rather than shapes,
which is most of the Caribbean and much of Oceania. A Concacaf map is 19 shapes
and 22 dots, and that is correct, not a data gap.

**The legend counts are computed from the codes, so the count in the prose and
the count on the map cannot disagree.** That is the device's main advantage
over asserting "40 of 41" in a sentence, and it is why a `Cifra clave`
restating the same ratio next to it is redundant — spend the second slot on
something else.

Frames are data (`scripts/build-world-map.ts`), and **all six confederations
are pre-baked** since 2026-08-15, CAF and AFC included. Any other set still
needs `auto` plus an explicit code list, or a new frame added to that script,
which also asserts every frame's expected size and that the six confederations
partition FIFA's 211 voters exactly once.

---

### `Contrato:` — the term sheet

```
Contrato: Apple TV ↔ MLS · Monto — US$250M por año · Plazo — 2023 a 2032 · Cláusula — salida mutua en 2028
```

A rights/sponsorship deal signed for a term — `Venta` transfers title, a
contract RENTS it. First item is the pairing (`↔` or `→`, each side ≤32);
then labelled rows from a fixed vocabulary (unknown label rejects):
`Monto` (required, ≤32 incl. an optional `por año`/`al año`/`anual`),
`Plazo` (required, `AAAA a AAAA`), `Cláusula` (optional, ≤60). The term
draws as a filled bar with **"hoy" marked on it** (computed at render), and
a per-year Monto also computes the term total in the foot — `US$2,500M /
10 años`, seasons counted inclusively. **Mutually exclusive with `Jugada`**:
the deed says the same pairing with the price attached.

### `Calendario:` — the dated road ahead

```
Calendario: nov 2026 — Voto de sedes · mar 2027 — Opt-out de TV · 2028 — Expira el CBA
```

`Cronología` points backward; this points forward. 2–5 beats, date — event
(date ≤16: `AAAA`, `mmm AAAA` or `d mmm AAAA` with Spanish month
abbreviations; event ≤72). Each beat carries a computed **"en N meses/años"**
derived from the article's own date — computed, never authored, so it reads
as "as of this piece" and can't go stale wrong — and the first beat after
the article date is highlighted as what's next. **Mutually exclusive with
`Cronología`**: both are the story on a dated spine.

### `Votación:` — the governance tally

```
Votación: Mundial cada dos años · A favor — 166 · En contra — 22 · Abstención — 23 · Umbral — 138 (dos tercios)
```

First item is the motion (≤64). Then `A favor` and `En contra` (required),
`Abstención`, `Umbral` (with an optional parenthetical note) and `Total` —
all integers, fixed vocabulary, unknown label rejects. A declared `Total`
must equal the camps' sum EXACTLY or the device rejects. Renders one bar
with the camps (for = product accent, against = red, abstention = neutral)
and the threshold drawn as a line ON the bar — passed or failed is visible
by construction, and the `Aprobada`/`No alcanzada` chip is computed, never
authored. **Mutually exclusive with `Reparto`**, which has no notion of a
passing threshold.

### `Ranking:` — the league table

```
Ranking: Valor de franquicia NFL · Cowboys — US$10,100M · Rams — US$7,600M (+1) · Giants — US$7,300M (−1)
```

First item names the ONE metric (≤48); then 3–6 rows, name — value (name
≤28, value ≤20), already in the order you mean. Every value must share one
denomination — a table mixing currencies rejects. Bars scale to the leader,
positions are numbered, and an optional `(±N)`/`(=)` tail per row is
movement since the last edition, rendered as a direction chip. **Mutually
exclusive with `Duelo`**, which caps at two actors.

### `Cascada:` — the waterfall

```
Cascada: Ingresos — US$4,210M · Producción — −US$1,900M · Derechos — −US$1,400M · Margen — US$910M
```

`Recibo` lists a total's parts; the waterfall shows the PATH. 3–7 rows:
first and last are unsigned anchors, every middle term carries its sign
(`−`/`+` — an unsigned middle is ambiguous and rejects). One denomination
throughout, and the arithmetic is CHECKED: first + Σ(middles) must land on
the last anchor within the Recibo's same 2.5% rounding tolerance, or the
device rejects. **Mutually exclusive with `Recibo`.**

### `Perfil:` — the actor card

```
Perfil: Gianni Infantino · Cargo — Presidente de FIFA · Desde — 2016 · Mandato — hasta 2027 · Sueldo — CHF3.9M
```

One person or institution at the story's center. First item is the name
(≤48, runs through the brand registry — an institution it knows wears its
own palette, exactly like `Venta`'s crest); then 2–5 rows from a fixed
vocabulary: `Cargo` (required), `Desde`, `Mandato`, `Sueldo`, `Antes`,
`Edad`, `Sede` (values ≤40, unknown label rejects). Figure rows count up.

### `Escenarios:` — the fork in the road

```
Escenarios: Los derechos de la Liga MX · Renueva con Televisa — probable · Se parte en paquetes — posible · Streaming puro — lejano
```

The evidence ladder's level 4 made visual and explicitly owned. First item
is the question (≤64); then 2–4 outcomes (≤52) each tagged from the FIXED
likelihood vocabulary — `probable` / `posible` / `lejano`, nothing else —
because fake-precise percentages are exactly what the aritmética rule bans.
The device carries a standing **"Lectura de Playbook"** mark in its label
so a scenario can never be read as reporting (the `Cotización` track's
`Ligado` disclosure argument, reapplied).

### `Tablero:` — the KPI strip

```
Tablero: Mercado de verano 2026 · Gasto total — €9,870M · Operaciones — 412 · Récord — €180M (Mbappé)
```

Three or four stats that belong together, for market-wide roundups —
`Cifra clave` is ONE number; a transfer-window story has several. First
item is the strip's title (≤48); then 2–4 tiles, label — value (label ≤26,
value ≤20 and numeric), with an optional parenthetical note as the tile's
caption. Every value counts up. **Mutually exclusive with `Cifra clave`.**

## 3. Automatic elements — nothing to author

These need no syntax and never touch the budget:

- **Bold lead-ins** (`**El plan:**`) → product-colored scan marks, plus a
  numbered beat (`01`, `02`) down the margin on Noticias and La Lana. They are
  load-bearing UI; see `voice-and-style.md` §5.
- **A bold span that is only a figure** (`**70%**`, `**US$9,612 millones**`) →
  counts up on scroll. Keep the single most important figure bold.
- **Money and percentages in plain prose** → marker-swipe highlight, capped at
  6 per article, applied client-side.
- **`**Opinión de Playbook:**`** and **`## La Opinión de Playbook`** → the green
  fenced callout, signed with the product's mark. See `format-tiers.md` §6.
- **`Fuentes: …`** → foot apparatus below the end mark. `format-tiers.md` §6.
- **`Ruta del dinero: A → B → C`** (La Lana only) → animated route line.
  `format-tiers.md` §4.

---

## 4. Per-run checklist

Walk this for every article before publishing:

1. Full twenty-three-device list walked against the story **before** concluding it
   gets none.
2. Budget computed from `readingTime` **and** `priority` (+1 at `priority: 5`).
3. No repeated device type.
4. Devices in document order, spine first, ≥2 prose paragraphs between them.
5. Every value inside the syntax limits above — re-read the declaration
   character by character, because an over-limit value ships as visible plain
   text.
6. Every number sourced from the reporting; no remainder buckets estimated.
7. Prose does not recite what `Resultados` or `Serie` already prints.
8. `Cifra clave` is the story's own figure and has a caption that names the
   thing.
9. No mutually exclusive pair declared together (`Venta`/`Jugada`,
   `Cadena`/`Cronología`) — the second one ships as visible plain text.
10. `Venta`/`Cadena` multiples are left to the device, not restated in prose,
    and both figures in a multiple carry the same currency.
