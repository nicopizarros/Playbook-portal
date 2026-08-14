# The dynamic element library

**One copy, two skills.** Every device below applies identically to
`publish-newsletter` and `publish-sourced-article` output.

**Source of truth is code, not this file.** `lib/article-devices.ts` holds the
parsers and the budget (`parseX` / `applyBodyDevices` / `deviceBudgetFor`);
`lib/product-hubs.ts` holds `Cifra clave`, `Jugada` and `Ruta del dinero`;
`lib/article-map.ts` holds `Mapa`'s renderer and the full frame list in its
header comment, and `scripts/build-world-map.ts` builds the frame data it
reads. If a limit here ever
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

**Walk all twenty-one shapes** before writing an article off as device-free,
especially on a `priority: 5` piece — exactly the story that should carry the
richest structure. What stays strict is fabrication, not effort: never invent a
milestone, a split, or a figure the piece doesn't already contain just to
manufacture a fit. A story with genuinely no numbers, no timeline, no pairing
and no roster still gets none. That is a real outcome, just a rarer one than it
used to be.

---

## 2. The twenty-one devices

Pick by **story shape**: a saga → `Cronología`; a breakdown → `Recibo`; a split
→ `Reparto`; a pairing → `Jugada`; one number → `Cifra clave`; an earnings
release → `Resultados`; two institutions → `Duelo`; volatility over time →
`Serie`; countries → `Mapa`; progress toward a goal → `Termómetro`; a deal's
terms → `Contrato`; an ordered comparison → `Ranking`; a governance vote →
`Votación`; what's coming → `Calendario`; an appointment → `Perfil`; how big a
number really is → `Escala`; a deadline → `Reloj`.

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
never in the value.

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

- **2–6 items.** Dates ≤14 chars, events ≤70 chars.
- **The 6-item ceiling is a hard code limit, not a stylistic suggestion.**
  `parseTimeline` returns null past 6, and the layout it feeds is a single-row
  flexbox sized for a small count — more items just squeeze narrower, it
  doesn't wrap or scroll. Past the cap the device silently fails to parse and
  the whole thing renders as an inert, unstyled paragraph.

Two directions follow, both from a real case (2026-08-07, a FIFA-governance
saga with 13 independently dated events):

1. **When the story has 6 or more real milestones, USE all 6 slots.** A 3-item
   Cronología on a story that has had six-plus dated beats is under-using the
   device, not being conservative.
2. **When a saga genuinely runs past 6, the device is not where the rest goes.**
   Pick the 6 most load-bearing beats (the spine) and weave the remaining,
   still-sourced events into the prose. A paragraph that names three more dated
   developments in a sentence tells that part of the story fine.

---

### `Recibo:` — the thermal receipt

```
Recibo: Torneos — 10 · Bolsa por evento — US$10M · Total — US$107M
```

For cost breakdowns and who-paid-what. The Total counts up.

- **2–8 lines.** Label ≤42 chars, value ≤24 chars.
- A line whose label starts with **"Total"** gets the total treatment. Include
  one when the sum is the point.

---

### `Ecuación:` — display math

```
Ecuación: 104 partidos × US$6M por partido = US$624M
```

For "the math behind the deal", with counting operands.

- **2–4 terms** plus one result, and exactly one `=`.
- Operators: `×`, `+`, `−`, `/` (a plain `x` and `-` are normalized).
- **Every term must start with a real number.**

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

For growth and shrink stories.

---

### `Reparto:` — the proportion bar

```
Reparto: FIFA — 70% · Federaciones — 20% · Clubes — 10%
```

- **2–5 shares.** Label ≤30 chars; each value must contain a percentage. They
  are normalized, so they should roughly sum to 100.

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

---

### `Cotización:` — the market tile

```
Cotización: Ollamani — MX$14.50 · -34.6% · en el año
```

A market tile with a ▲/▼ delta. For public-company and valuation results.

- Name ≤36 chars; then **2 or 3 items**: value, delta, optional note.
- Value ≤20 chars and must contain a digit.
- Delta ≤14 chars and **must contain `%`**. A leading `−`/`-` sets the down
  treatment.

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

### `Mapa:` — real geography

```
Mapa: Concacaf · En el comunicado — resto · Sin firmar — MEX
```

The frame's countries are drawn from the world dataset and split into labelled
camps, with a legend that counts each camp for itself.

- First item is the **FRAME**: `mundo`, `concacaf`, `conmebol`, `uefa`, `ofc`,
  `europa`, `áfrica`, `asia`, `oceanía`, `norteamérica`, `sudamérica`, or
  `auto` (which frames exactly the countries the groups name — use it for any
  set that isn't one of the above, e.g. World Cup hosts).
- Every item after it is a group: `Etiqueta — MEX, USA, CAN` with **ISO3**
  codes, or `Etiqueta — resto` for every framed country no other group claimed.
- **One to three groups.**

**The visual ramp is fixed and means the same thing on every map:** group 1 is
the filled mass, group 2 is **hollow with a heavy outline** (the exception, the
holdout, the one that's missing), group 3 is a mid tint. So "everyone except X"
is written as `Grupo — resto · X — MEX` and X reads as the hole in the map,
which is exactly the shape a "who signed and who didn't" story has.

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

Frames are data (`scripts/build-world-map.ts`): **CAF and AFC aren't pre-baked
yet**, so a story about those confederations needs `auto` plus an explicit code
list, or a new frame added to that script.

---

### `Termómetro:` — progress toward a goal

```
Termómetro: US$720M — meta US$1,000M — Recaudación del fondo de expansión
```

Value, then `meta <goal>`, then an optional caption (≤80 chars). Value and
goal ≤24 chars each and **must share the same unit** (`US$…M` against
`US$…M`) — the fill percentage is their ratio, and comparing across units is
refusing to parse, not rounding. Renders a big count-up value, the goal in
small caps, and an accent-filled track with a target tick. For funding
rounds, expansion fees collected, attendance targets, quota progress.

### `Contrato:` — the term sheet

```
Contrato: Partes — Necaxa ↔ Apollo · Vigencia — 2026-2031 · Monto — US$120M · Cláusula — Opción de compra
```

2–6 key/value rows (label ≤22, value ≤48). Renders a bordered term-sheet
panel with signature lines. For any deal story whose reporting names the
actual terms: acquisitions, broadcast agreements, naming rights, player
contracts. Numeric values count up.

### `Ranking:` — the ordered comparison

```
Ranking: Cowboys — US$10.1B · Yankees — US$7.9B · Real Madrid — US$6.6B
```

3–6 rows, name — value (name ≤28, value ≤20), already in the order you mean.
When every value shares one unit the rows grow proportional bars; mixed
units render as a clean list without bars. For valuation tables, salary
rankings, attendance leaders.

### `Votación:` — the tally

```
Votación: A favor — 28 · En contra — 7 · Abstención — 3 · Mayoría — 24
```

2–3 cast rows (integers) plus an optional `Mayoría — N` threshold. Renders a
segmented bar (for = product accent, against = red, abstention = gray), a
threshold tick, and the tally legend. For assembly votes, board decisions,
FIFA congress counts. The device draws the count — the verdict stays in
your prose.

### `Calendario:` — the forward agenda

```
Calendario: 11 jun — Inauguración en el Azteca · 19 jun — México vs Corea · 5 jul — Octavos en Guadalajara
```

2–5 rows, date — event (date ≤16 chars, event ≤72). `Cronología`'s
counterpart: what's coming, listed with boxed date badges, not what
happened, drawn on a spine. Never use both in one article for the same
sequence of events.

### `Perfil:` — the who-is card

```
Perfil: Mikel Arriola — Presidente ejecutivo de la Liga MX · Antes — IMSS · Mandato — 2030
```

First item is name — role (name ≤32, role ≤44); then 1–4 quick facts
(label ≤18, value ≤36). Renders a monogram card. For appointments,
departures, Players interviews — any story whose subject is a person taking
or leaving a chair.

### `Escala:` — the sense of size

```
Escala: US$4,200M — FIFA Forward Enterprise · US$1,400M — Ingresos anuales de la Liga MX · US$210M — Presupuesto de la FMF
```

2–4 rows, value — label (value ≤20, label ≤52), the story's own figure
FIRST — it draws at full width and the comparators scale under it. All
values must share one unit, and **every comparator must come from the
reporting**, same rule as every number here. For the story whose real
substance is "how big is that, actually".

### `Reloj:` — the countdown

```
Reloj: 2026-06-11 — Inauguración del Mundial
```

One ISO date (`YYYY-MM-DD`) — label (≤64). The server computes days
remaining at render time, fresh per view — "faltan N días", "es hoy", or
"fue hace N días" once past. For deadline stories: a vote date, a
ratification window, days to kickoff.

---

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

1. Full twenty-one-device list walked against the story **before** concluding it
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
