# The Playbook editorial voice

**One copy, two skills.** `publish-newsletter` and `publish-sourced-article`
both read this file. Nothing in it is source-specific: a Substack edition and
a Reuters link that reach the site should be indistinguishable as writing once
published. If a rule here needs to differ by funnel, it belongs in that skill's
own `references/ingestion.md`, not here.

Everything below is a contract, not a stylistic preference to re-derive per
run. Several sessions publish through these skills and readers see the output
as one publication. The failure mode is real and recent: a 2026-08-07 La Lana
piece shipped as 50 standalone beats with no lead-ins, no devices and no
promise block, next to a Noticias piece carrying all three, and read as a
different site.

---

## 1. The idea central

> Playbook no solo cuenta qué pasó. Explica cómo funciona el movimiento, por
> qué ocurrió y qué cambia después.

Every piece, at any length, carries four things:

| | |
|---|---|
| **Movimiento** | Qué pasó. Actor, acción, monto, socio o decisión. |
| **Mecanismo** | Cómo funciona la operación o el modelo. |
| **Incentivo** | Qué busca cada parte y dónde está el negocio. |
| **Consecuencia** | Qué cambia, para quién y con qué riesgo. |

**Not every piece walks all four steps** (guide, 2026-08-13). A Noticia breve
(format A) may legitimately stop at movimiento + minimal context — that is
what makes it an A. The deeper the format, the more it must open mecanismo,
incentivo and consecuencia; a Deep Dive that skips them isn't one. What no
format at any depth gets to be is flat: even an A is *selected* because
someone who knows the industry finds it worth knowing. The news says what
happened; Playbook decides whether the story ends there or something more
needs explaining.

### Las diez palancas

Before drafting, name which of these the story actually turns on. If you can't
name one, you haven't found the story yet — you've found the press release.

1. Control del activo o de la decisión
2. Captura de valor
3. Inventario comercial
4. Margen y estructura de ingresos
5. Distribución y relación con el fan
6. Reparto del riesgo
7. Poder de negociación
8. Gobernanza
9. Escala y sostenibilidad
10. Datos y capacidad de monetización

**When the primary source is the company's own press release, the palanca has
to be found against the document, not inside it.** (2026-08-18, the Apple/MLB
Friday Night Baseball run.) A `newsroom.company.com` post lists what happened —
a schedule, a feature, a partnership — in the company's own promotional voice,
and it almost never says why the company made that choice or what it reveals
about strategy, because that is not what a release is for. Inheriting its frame
is a subtler version of paraphrasing one competitor: the facts are right and the
reading is the company's. Ask instead **what the company chose not to do**
(expand, spend more, compete harder) and what that choice reveals about what it
actually needs from the deal — revenue, audience, ecosystem lock-in, a hardware
showcase, timing ahead of something else. That question, not the release's own
feature list, is what the palanca should answer on one of these. The same logic
governs the cover image, which is why `images.md` excludes the release's own
promotional graphic.

The palanca is what the Opinión identifies (§7) and usually what the subhead
or the hammer line states. A story about a broadcast deal that never gets past
"who bought the rights" has skipped the mecanismo and the palanca both.

---

## 2. The rhythm

**Paragraph rhythm: 2–3 sentences, roughly 40–80 words. The opening sentence
carries the point.**

Where the range comes from: Nielsen Norman Group's web-scannability research
puts the readable unit for a scanning reader at 2–4 sentences and about 40–70
words. Playbook's range is that, adjusted upward slightly on two counts —
Spanish runs longer than English per word and per sentence at equal content,
and Playbook's register is a business brief rather than a headline ticker, so
it carries a clause of explanation the ticker doesn't.

**The word count is a sanity check, not the gate. The gate is: "is this
paragraph doing two things? If yes, cut."** The two are not the same test and
the second one always wins:

- a paragraph **inside** 40–80 words that does two things **still gets cut**;
- a paragraph **slightly outside** the range that does exactly one thing
  **survives**.

Reach for the count only when a paragraph feels wrong and you can't say why —
a 30-word paragraph is usually a fragment that belongs to its neighbour, and a
110-word paragraph has usually fused two things and you just haven't found the
seam yet.

**One rhythm rule, all formats.** It does not vary by tier. A Flash, a Noticia,
a La Lana section and a long Análisis all run paragraphs of the same shape;
what changes between them is how many paragraphs there are, not how big each
one is. `format-tiers.md` sets total length and structure and deliberately
carries no paragraph range of its own.

### What counts as "one thing"

One movement of §1's structure: the movimiento, or the mecanismo, or the
incentivo, or the consecuencia. Not one sentence and not one fact. A paragraph
that establishes the mecanismo across three sentences of figures is doing one
thing. A paragraph that finishes the mecanismo and then opens the consecuencia
is doing two, and the cut goes at the seam.

**A movement is normally one paragraph and may run two** when the reporting
genuinely demands it. That is how a piece grows past roughly 320 words without
breaking the rhythm: more paragraphs, never longer ones. Two consequences worth
stating, because they are the only places this is visible on the page:

- **The lead-in opens the movement, not every paragraph.** A continuation
  paragraph inside the same movement carries none (§5).
- **The Opinión is always exactly one paragraph.** `**Opinión de Playbook:**`
  is matched against a single `<p>`, so a split Opinión drops its second half
  outside the callout (`format-tiers.md` §3). If the closing take won't fit in
  80 words, it is carrying an argument the body should have made.

### Never take away length, only add

**Standing publisher directive.** Total-length ranges are floors that shape a
brief, not ceilings that license cutting the source down to them. Whatever
reporting an edition or a source carries survives into the portal: every named
party, every figure, every piece of context the original spent a sentence on.
Research, the regional angle and the extra clause that explains a background
fact are all additive, and a source item that already runs long stays long.

**Length is added in paragraphs, not in paragraph size.** The rhythm range
above is not the thing that flexes: a story with more reporting gets more
paragraphs, and a movement that has genuinely earned it runs two.

Concretely: the short Noticias/Infinitas briefs in an edition run the four
movements at `readingTime: 2`, while that edition's lead feature keeps its own
`##` sections, its quotes and its carried-over images and lands nearer
900–1,100 words at `readingTime: 4` (see the 2026-08-02 Tour de France Femmes
piece). Compressing a feature into the brief shape to satisfy a table is the
mistake, not the compliance.

The only things ever removed are the source's own chrome (mastheads, section
dividers, "(Acá más info)" pointers) and material the overlap check says
already lives on the site.

### The hammer line

Land one short, flat sentence that states the conclusion the evidence just
earned, at the point where the reader has been given enough to agree with it.
**Inside the paragraph, as its last sentence**, not promoted to a paragraph of
its own. Real ones from the archive:

- *Las sedes reciben la vitrina. FIFA vende la vitrina.*
- *No todo lo que se puede vender conviene venderlo.*
- *Mover dinero no es quedarse con él.*
- *Sin aceptación ciudadana, el discurso de grandes eventos se desgasta rápido.*

They work because they come **after** the evidence. The same line opening a
section is a slogan; after two sentences of figures it is a verdict. It is not
a quota — it appears when the text has earned it.

### Negative parallelism: exactly one, at the thesis

The "no es X, es Y" shape, used three or four times across one piece, stops
reading as analysis and starts reading as a tic, every point arriving in the
same rhetorical costume.

**The whole family counts against the one cap.** There is no softer variant
that comes free:

- "no es X, es Y"
- **"no solo X, sino Y"** — the guide lists this on its own watch-list of
  fórmulas bajo vigilancia (§7), and an exemption for it was exactly how a
  piece ended up wearing the costume twice while passing the check once
- "el golpe no vino de A, vino de B"
- "deja de ser A y se convierte en B"

The 2026-08-06 archive measurement says where the one belongs: Playbook
averages **about one per piece** (La Lana 0.21, Ensayo 0.38, Infinitas 0.90 per
1,000 words), and it lands on the sentence the article exists to make. So don't
avoid it — spend it. One per article, at the thesis beat, and state every other
point directly. Zero is fine. It must never appear because the budget hasn't
been spent.

TFBR runs this move hardest and calls it **definitional antithesis** — see
`format-tiers.md`. Same cap there: once, at the thesis.

### check-voice.mjs

```
node scripts/check-voice.mjs <draft.json>
```

Tuned to the rhythm rule above: it reports median paragraph words and sentences
per paragraph, flags paragraphs past ~110 words (two movements fused, the point
where the seam is worth hunting), and enforces the em-dash ban and the
one-antithesis cap **including the "no solo … sino" form**.

**It is a mirror, not a gate.** It exits 0 by default so it can never block a
deliberate editorial choice, and its word counts are the sanity check, not the
rule — a flagged paragraph that genuinely carries one movement can ship. What
is not a judgment call is the antithesis count: a second one is a rewrite, not
a discussion.

A run reporting one more paragraph than the piece has is usually the `Fuentes:`
line being counted (see `format-tiers.md`), not a structural problem.

---

## 3. Titles

**Protagonista + movimiento + dato o consecuencia.** On the portada, editorial
clarity wins. **SEO lives in metadata only** — never bend a headline toward a
query string.

| Sí | No |
|---|---|
| *Fox Sports México pierde distribución y marca* | *Todo lo que debes saber sobre la nueva estrategia de Fox Sports México* |

Measured over 91 archive titles (2026-08-06): **around 9 words**, in one of
three families —

- a question the piece answers (*"¿Por qué FIFA nunca pierde con el Mundial?"*,
  27% of titles);
- a claim with a colon splitting subject from turn (*"Airbnb y WSL: cuando
  patrocinar también es resolver"*, 21%);
- a flat declarative naming the actor and the consequence (*"El deal que le
  volteó el tablero a Infantino"*).

20% carry a figure, and when the story has a defining number it belongs here
(see the `Cifra clave` rule in `dynamic-element-library.md` — the hubs and the
homepage scrape `title` + `excerpt` for it).

Playbook titles say what happened or what is at stake. They never tease ("Lo
que nadie te contó de…") and they never lead with the newsletter's own name.

### One clause, roughly 45–70 characters

(Publisher, 2026-08-24, on the Infantino/Caribe piece.) The article page's `h1`
(`styles/article.css`) has **no truncation and no line-clamp** — it wraps in a
large serif display face, so a long headline is never quietly shortened
anywhere, it balloons into three or four lines and swallows the hero exactly as
written. Aim for **45–70 characters, rarely past 80**.

Length is the symptom; the disease is stacking clauses. That piece published at
*"Infantino desafía a Montagliani y reparte fondos de FIFA en el Caribe,
mientras la coalición que lo quiere fuera se resquebraja"* (129 characters) —
three separate claims joined by "y" and "mientras", trying to fit the whole
five-paragraph story into the headline. It was cut after publication to
*"Infantino desafía a Montagliani en el Caribe"* (45 characters, one clause).
**Pick the single fact that most makes someone click, state that, and let the
body carry the rest** — the same discipline §1 already asks for when it says
pick one palanca instead of gesturing at five. A genuinely two-part story (an
action AND its consequence, both load-bearing) can still take two clauses, but
that is a deliberate call, not the default shape.

The fix belongs at draft time. A headline shortened after publication leaves
the slug behind — `nielsen-vuelve-a-cambiar-la-medicion-pero-el-rating-ya-no-sube`
and `infantino-desafia-a-montagliani-…-se-resquebraja` are both live rows whose
id no longer matches their title, because the id is minted at insert and never
migrates.

---

## 4. Openings

**En frío.** Two to four paragraphs that put the tension on the table in the first
line. No scene-setting, no "en los últimos años", no general framing, and no
announcing that the topic is important.

Worked example (La Lana): *"Las pausas de hidratación llegaron al Mundial con
una explicación fácil de comprar: calor, humedad y cuidado de los jugadores."*
Then the turn: *"Pero bastaron unos partidos para que la conversación
cambiara."*

**The editing question:** does the reader understand, within the first three
paragraphs, what changed and why it is worth continuing?

The cold open is one of the four kinds of paragraph that carries **no** bold
lead-in (§5).

---

## 5. Subheads and lead-ins advance the argument

Both are arguments, never labels.

**`##` subheads.** Every La Lana heading in the archive states a position:
*"Mover dinero no es quedarse con él"*, *"El descanso se volvió inventario"*,
*"Sobrevivir no es salir limpio"*. None is a topic label. They also don't need
to sound like a postcard caption.

| Mejor | Más débil |
|---|---|
| El descanso se volvió inventario | El acuerdo comercial |
| La cuenta ya no da | Contexto financiero |
| El dinero viene con condiciones | La situación actual |
| FIFA encontró qué vender | Nuevas oportunidades |

Never `Contexto`, `Antecedentes`, `El acuerdo`.

**Bold lead-ins are load-bearing UI.** Every movement opens with a short bold
lead-in, 2–5 words, ending in a colon inside the bold (`**El plan:**`,
`**El comparativo:**`, `**Los números:**`). The article page renders it as a
product-colored scan mark, and on Noticias and La Lana as a numbered beat
(`01`, `02`) down the margin. Readers skim the whole argument off them, so:

- each must be **specific to its movement** — a generic label repeated across
  movements now visibly repeats down the margin;
- vary the wording per article rather than reusing the same word every piece;
- prefer *"**El precio real:**"* over *"**El acuerdo:**"*, same standard as the
  subheads;
- **never default to the `El movimiento` / `La mecánica` / `El contexto` /
  `El impacto` set** (guide, 2026-08-13). The *logic* repeats across articles;
  the *headings* must not — those four carry no information a reader couldn't
  guess from the section they're about to read, and reused across pieces they
  make the catalog read as a filled-in template.

**Five kinds of paragraph go without one**, in any product: the cold open, the
device declarations, the `Foto: Playbook` captions, the Opinión bullets, and a
**continuation paragraph inside a movement** (§2 — the lead-in marks where a
movement starts, so a second one mid-movement would split a beat the reader is
still inside).

---

## 6. La Opinión de Playbook

**The opinion does not summarize the body. It adds a second layer.** Three
moves, in order:

1. **Reencuadra** — ¿qué es realmente la noticia detrás del anuncio?
2. **Identifica la palanca** — ¿qué activo, ingreso, derecho, relación o
   posición de poder está en juego? (§1's list.)
3. **Marca la consecuencia** — ¿qué cambia, quién gana margen y qué riesgo
   queda abierto?

**The test:** could this opinion be pasted under a different story by swapping
only the names? If yes, it is still too generic. Rewrite it until it can't.

A weak read does more damage than a short piece with no opinion at all. The
Opinión explains the mecanismo; it does not deliver a moraleja.

### How each format uses it

| Format | Opinión |
|---|---|
| A · Noticia breve / Industry Shots Tier 2 | **None** (guide, 2026-08-13 — it stopped being "not obligatory" and became not carried) |
| B · Noticia Playbook (Noticias) | One or two short paragraphs, a concrete second layer |
| C · Deep Dive | One or two paragraphs synthesizing the read obtained **after** the analysis — never a recap |
| D · La Lana del Deporte | Three bullets of roughly equal weight |
| Infinitas | As the format it adopts (A/B/C), with the women's-sport read |
| TFBR | **None** — the partner's `## La visión de Interticket` closes it |

`**Opinión de Playbook:**` as an inline lead-in is a **UI contract**, not just
house style — see `format-tiers.md` for the exact strings and what the renderer
does with each shape. Never restyle it to "Nuestra opinión" or "El análisis de
Playbook".

### When an athlete's name is on the venture, the story is what they know

(Publisher, 2026-08-20, on Publicis/Travis Kelce's NIL agency.) The lazy read of
an athlete-backed company is celebrity: a famous name rented to a business that
needed attention. That is almost never where the value sits, and writing it that
way makes the piece a launch notice.

Ask instead **what the athlete knows that the buyer cannot hire.** Someone who
spent a career inside the sport has read contracts, agents, locker rooms and
calendars from the side that signs them, and that judgment is the scarce input in
any deal that has to clear a league, a school or a federation. State that as the
palanca and the piece stops being about fame.

Two things make the read concrete rather than a compliment:

- **The athlete's own operating record**, when there is one. Kelce had already
  built New Heights (2022) and licensed it to Amazon's Wondery in a three-year
  deal reported near US$100M, so he arrives as an operator and the piece can say
  so with a figure instead of an adjective.
- **One proven comparable**, named and costed. Magic Johnson is the archive case:
  4.5% of the Lakers for US$10M in 1994, then US$50M for 2.3% of the Dodgers in
  2012, a franchise Forbes now values at US$4,800M, plus LAFC, the Sparks and a
  Commanders stake at a US$6,050M sale. Put the entry price next to today's
  valuation and let the reader do the division (§7's aritmética rule).

The closing beat this supports is a real pattern rather than a warm sentiment:
athletes overwhelmingly reinvest **inside** the sport when they stop playing,
because it is the one industry where their judgment is worth money on day one.
Say it where the reporting carries it, and skip it where the venture is genuinely
just a licensing deal with a signature on it.

### When the filing brags and the number doesn't back it

(Publisher, 2026-08-20, on the Enhanced Games' first quarterly results.) A
company's own release is written to survive being read by people who will not
check it, and the tell is almost always **in the same document**: the Enhanced
Games' Q2 statement said the event "engaged one billion people globally" and,
two lines later, that it drew 4 million live views, a figure the company itself
compared to a regular-season NBA game. Put those two next to each other and the
piece has its read; take the first at face value and the piece is a press
release with a Playbook byline.

So on any story about a challenger property, read the **result** before the
pitch. Two questions do most of the work: did the audience actually show up at
the scale being claimed, and did the thing the property exists to prove
actually happen? The Enhanced Games failed both in one weekend, clean athletes
finishing above much of the enhanced field, which is the comparison the whole
format was built to win.

The register stays a business brief, not a takedown: state the two figures, say
which one is load-bearing, and let the gap do the arguing. What earns the
sharper close is that the audience read is a genuine finding and not a
preference. Fans do not turn up for a record on its own; they turn up for clean
competition in sports they already follow, and a property betting against that
is betting against its own distribution. Where that holds, say plainly what it
means for the property's ceiling ("no le va a disputar nada al calendario
olímpico en el corto plazo") rather than hedging it into nothing. That is an
interpretation, evidence level 03, and it belongs in the Opinión where it is
marked as Playbook's read, never smuggled into the fact movements as though the
company had conceded it.

### On a running political story, read the alignment — don't keep score

(Publisher feedback, 2026-08-10, on a FIFA-governance follow-up.) The tempting
shape, and the one to avoid, is a tally of who looks bad: X backed the loser,
the count came to 40, X is alone. That lands as stingy, and worse, it is the
smallest true thing available.

What the reader wants from a fight with a known end date is where the sides are
**forming** and what the fight will **cost to run**. Concretely:

- name both blocs, not just the isolated party;
- look for where the emerging blocs cut **across** the formal institutions
  rather than along them. In the worked example, the AFC signed a letter
  against the FIFA president while its own Gulf federations backed him, exactly
  the split Concacaf had with Mexico — which turns "Mexico is alone" into "the
  camps don't respect confederation borders", a bigger and more useful read;
- close on the **attrition**: the months of process, the venues and calendars
  and development money spent while it plays out, the cost of holding a
  position in public for that long. A closing beat about the wear on everyone
  involved is a better ending than a verdict on one party.

This is also the case where a second paragraph after the callout earns itself.

---

## 7. Language and tone

Natural, direct, with its own criterion. **Tono de brief de negocios, no de
alerta de última hora** — calm and analytical even when the underlying story is
dramatic. The reader should finish feeling they got something a press summary
wouldn't give them.

This is easiest to get wrong in the fact movement, where translating a source too
literally carries its urgency across with its facts. A Reuters paragraph is
built to be lifted whole; rebuild the paragraph in Playbook's register instead of
carrying the source's shape over.

### Sí — hablar como la industria

Control, margen, inventario, derechos, distribución, data, audiencia,
inversión, riesgo, negociación, gobernanza. Explained without sounding like
consulting.

### No — escribir para parecer sofisticado

Accumulated Spanglish, abstractions, moralejas, grandiloquent phrasing, or
corporate language that could come out of any deck.

**The operative word is ACCUMULATED** (publisher, 2026-08-12, on the Federer
piece: *"aquí sí usa spanglish porque se oye mucho mejor"*). A single English
term that is the register the industry actually speaks in LATAM is not the
failure this rule names, and reaching for a technically-correct Spanish word
the reader never uses is its own kind of stiffness. `billionaire` beat
`milmillonario` in a headline for exactly that reason, and the same holds for
the vocabulary already all over this guide: `private equity`, `naming rights`,
`streaming`, `merchandising`.

The test is **frequency and necessity, not language**: one borrowed term
carrying a meaning Spanish handles worse is voice; three or four in a
paragraph, or an English word standing in for a Spanish one that reads fine
(`el deal` for `el acuerdo`, `performance` for `desempeño`), is the accumulation
the rule bans. When one is used, use it consistently through the piece rather
than alternating with a translation — a headline that says `billionaire` and a
body that says `milmillonario` reads as indecision.

### Fórmulas bajo vigilancia

Not banned. But every time one appears, ask: **can I say this more specifically
and less interchangeably?**

- "confirma una tendencia"
- "el mensaje es claro"
- "no es un detalle menor"
- "marca la ruta"
- "el verdadero examen"
- "más allá de la anécdota"
- "la pregunta ya no es…"
- "no solo X, sino Y"
- "para México/LATAM…"

### La aritmética

**Do the math when it reveals the business. Skip it when it only performs
rigor.** Recovering an investment several times over without losing control is
analysis; dividing for the sake of dividing is not.

Corollary, from a 2026-08-05 review round: don't compute a ratio or percentage
the sources didn't publish in order to land a rhetorical punch ("el rescate
vale menos del 5% de lo que costó llegar hasta aquí", "la aritmética es
brutal"). Put the two real figures next to each other and say what the gap
means in business terms; the reader does the division. A calculated stat
wearing a verdict reads as a hot take.

Where a long piece genuinely does arithmetic, do it out loud and invite the
reader in: *"Analicemos esto: En 104 partidos, dos pausas de tres minutos por
juego significan 624 minutos nuevos de inventario potencial."*

### Hard mechanical rules

- **Never use an em dash (`—`) in drafted text**, in any field. Use commas,
  periods, parentheses, or "y"/"pero". (The device syntaxes in
  `dynamic-element-library.md` are the sole exception: their ` — ` separator is
  parser syntax, not prose.)
- **Metric units always.** Convert feet, miles, yards, pounds, acres into
  meters/kilometers/kilos before they reach any field. "7,300 pies de altura"
  is a unit the reader has to translate mid-sentence; "más de 2,200 metros" is
  one they feel. Sport-specific units genuinely used in Spanish-language
  coverage of that sport (yardas in golf/NFL) are the exception.
- **Figures carry their currency symbol** in the house shapes ("US$250
  millones", "MX$42.8 millones", "€3M"), never spelled out ("250 millones de
  dólares"). Every extractor on the site ranks symbol-prefixed money above bare
  counts, so the spelled-out form loses to any bare number appearing earlier.
  Money and percentages in plain prose get an automatic marker highlight
  (capped at 6 per article); the single most important figure goes **bold**,
  which makes it count up.
- **Explain the financial mechanism in the reader's words, not the filing's.**
  (Publisher, 2026-08-15, on a deep dive about a federal probe into an owner's
  insurance companies: *"entidades afiliadas, por algo más simple"* and *"que
  sea más fácil de entender para no financieros"*.) The audience knows the
  business of sport; it does not necessarily know insurance accounting,
  securities procedure or private credit, and a term lifted from a disclosure
  reads as precision while landing as nothing. Say what the money actually did:
  *"prestado a empresas del mismo dueño"* beats *"inversiones en entidades
  afiliadas"*, *"un gran jurado ordenó entregar documentos, el paso con el que
  se decide si hay algo que perseguir"* beats *"citaciones de un gran jurado"*,
  and *"sus auditores no les pusieron objeción alguna"* beats *"opiniones sin
  salvedades"*. This is the same instinct as the background-fact rule below,
  applied to vocabulary instead of context, and it costs a clause. The test:
  read the sentence as someone who follows the league and has never opened a
  10-K. Where the plain phrasing would lose a distinction that matters, keep
  the technical term AND gloss it once; where it would not, the technical term
  was decoration. This is not dumbing down, it is the difference between a
  reader who finishes the paragraph knowing what happened and one who finishes
  it knowing a phrase.
- **Explain a background fact, don't name-drop it.** When a paragraph references
  something the reader can't be assumed to carry (a state's incentive package,
  a canceled event, a prior lawsuit, a regulatory ruling), spend the extra
  clause. "Luisiana espera la devolución de 1.2 millones de dólares de un
  acuerdo de sede" tells a reader nothing; the same fact with its shape (a
  7.2-million incentive package, 5 of it a hosting fee, 1.2 already advanced,
  the event canceled in April, the money never returned) is what makes the
  piece worth reading. It costs one sentence and it is usually the sentence a
  competitor's recap left out.
- Write the body as `**bold**` / `##` formatted prose plus any `![alt](url)`
  images. **Never raw HTML tags.**

---

## 8. Four evidence levels that never blend

| | Level | How it is written |
|---|---|---|
| 01 | **Hecho confirmado** | Direct, with a clear source. |
| 02 | **Reporte de terceros** | Attributed. Never presented as Playbook's own finding. |
| 03 | **Interpretación** | Playbook explains what the evidence suggests. |
| 04 | **Escenario** | Marked as a possibility, with what would have to happen. |

A rumored figure is level 2 or 4 and must be attributed **in the caption or the
prose**, never smuggled into a device value or a headline as level 1. Every
number that feeds a device needs the same sourcing bar as any other fact —
never a rounder guess because it's going into a chart instead of a sentence.

**When sources disagree**, the more specific, better-attributed figure wins: a
company filing over a wire summary, a wire over a newsletter brief.

### "Según reportó X" only when X actually broke it

(Publisher, 2026-08-17.) Level 02 says *attributed*. It does not say attributed
**to a newsroom**, and the habit of reaching for one is the single most common
way a Playbook piece ends up reading like a rewrite of somebody else's article.
The archive shows how routine it had become: the 2026-08-10 Liverpool piece
carries "según reportó Sky Sports" and "según reportó Yahoo Sports" in
consecutive movements, for facts that a dozen outlets were carrying the same
morning.

**The test is exclusivity, not convenience.** Name the outlet only when the fact
exists *because that newsroom found it* — when no one else had it and the
reporting is itself the news. Everything else gets stated directly, or
attributed to the **party**, which is who actually knows:

| Sí | No |
|---|---|
| Clearlake negocia comprar las participaciones de Boehly y Walter | Según reportó Sports Business Journal, Clearlake negocia… |
| FIFA confirmó que la relación laboral terminó el 17 de agosto | Según reportó un medio, FIFA habría terminado la relación |
| El New York Post reportó una inversión cercana a US$250 millones; LIV no la confirma | *(correct as written — the Post had that figure alone)* |

Two live examples of the exception, both legitimate: the **New York Post**'s
US$250M LIV financing figure, which no other outlet had and LIV never confirmed,
and **The Athletic**'s 2026-08-17 confirmation of Kevin Lamour's exit, published
under its own EXCLUSIVE flag with a FIFA statement given to it directly. In both
the newsroom is a primary source for that fact and belongs in the prose **and**
on the `Fuentes:` line.

This is the prose-side twin of a rule that already governs the credit line
(`format-tiers.md` §6: only primary sources, "the one exception is an
**exclusive**"). Same test, applied in the body. The failure it prevents is
subtle and expensive: attributing a widely-carried fact to whichever outlet
happened to supply the link silently promotes a conduit to a source, tells the
reader that Playbook's contribution was finding somebody else's article, and
buries the party who actually made the decision behind the party who wrote it
up.

**When several outlets carry the same fact off one originating scoop, credit the
origin, not the relay.** A story reaching Playbook through an aggregator that
credits the Financial Times is a Financial Times fact; the aggregator's name
never enters the piece.

---

## 9. The regional connection (México / LATAM)

**Not obligatory.** It enters when there is a concrete actor, market, capital,
sede, precedent or consequence. Never as a forced closer, and never as "México
debería aprender".

**"Cuando sea relevante" is a real permission not to** (publisher, 2026-08-11,
on a batch of four foreign business stories). Research the regional stake every
time — it is a research task, not something to reason out at drafting time —
but when the honest answer is that the region has no stake, close on a global
industry read. A tacked-on final sentence reaching for the region because the
format seems to demand one reads as filler and tells the reader nothing.

Worked example from that batch: the F1 quarter genuinely bears on the region,
because a shrinking calendar makes the Gran Premio de México's confirmed date
through 2028 worth more, so it kept the angle. Fox's advertising quarter, a
naming-rights reversal in Kansas City, and a prediction market buying ATP
streaming had no honest regional stake, and all three closed on the industry
read instead. **Both outcomes are correct.**

The same rule, stated earlier with a different example (team directive,
2026-08-08, after a Premier League sponsorship-renewal piece shipped with a
bolted-on closing line comparing it to LATAM stadium naming rights that had no
basis in the story): a lot of items are genuinely region-neutral — a shirt
sponsorship between two European entities, an executive appointment at a league
with no LATAM footprint, a stadium-tech vendor deal. Forcing a "para
México/LATAM…" sentence onto one of those reads as a template being filled in
rather than a read on the news, which is the opposite of what the Opinión is
for. In that case the real read was already in the story: brand stability as a
commercial asset, and the deal resetting the shirt-sponsorship price benchmark.
**A strong industry-wide close beats a forced regional comparison every time.**

**The bar for "genuine" is a fact in the piece, not a theme the story happens
to touch.** (Publisher, 2026-08-20, on the NBA ad-revenue piece.) A Mexican or
LATAM person, company, deal or figure that is actually in the reporting is
genuine: Juan Carlos Rodríguez in the FIFA Sub-15 piece, a Liga MX rights
number, a Mexico City host city. *"This general business dynamic also applies to
Mexican leagues"* is not, even when true — and the tell is that it would be
equally true bolted onto a dozen other stories with nothing Mexican in them.
That piece closed on *"esto es exactamente la pregunta que hoy se hacen las
ligas y las televisoras en México y América Latina"* for a story that never
mentioned a single LATAM party, deal or figure. The fix was to end on the global
insight itself — what the jump from US$10M to US$874M proves about streaming ad
economics — and stop there.

**A genuine regional angle can still lose to the story's own mechanism**
(publisher, 2026-08-12, on the record Lakers sale). The rule above is about
*forced* angles; this is the case one step in. The draft closed on Liga MX
having just eliminated promotion and relegation and put two slots up for sale,
which is a real, researched, non-forced parallel and still the wrong ending:
the bigger read was why US franchise prices are compounding at all (a closed
league, national media contracts, rationed expansion, so the franchise prices
like an income asset with guaranteed growth), and spending the close on a
smaller market's version of it traded the mechanism for a comparison.

So the test is not only "is this angle real?" but **"is it the most load-bearing
thing I can end on?"** When the story's own structure is the more interesting
finding, close on that and leave the region out entirely, even when a
defensible regional parallel exists. This is a third outcome alongside the two
above, not a replacement for either.

**Research it, don't infer it.** The failure mode is deriving the angle from
the story's own logic instead of checking. On 2026-08-05 a draft argued that a
shrinking league would probably drop its Mexican stop; the league had already
announced that venue's next edition months earlier, so the honest read was the
reverse — a shorter calendar makes a surviving venue *more* important. Before
writing the Opinión, run the searches that would falsify it:

- does this league/competition actually play in Mexico, and at which venue?
- is the next edition already confirmed?
- who is the local commercial partner?
- which Mexican or LATAM athletes are involved, and on which team?

Those specifics — a named club, a named promoter, named players — are also what
turns a generic "esto importa para la región" closer into something a reader
can't get elsewhere.

---

## 10. Building on prior Playbook coverage

When the overlap check (`overlap-check.md`) surfaces an earlier Playbook piece
on the same running story, this is a follow-up, not a fresh explainer that
re-establishes everything.

Don't re-explain what the earlier piece established. Weave **one inline link**
back to it into a sentence that is already stating a new fact
(`[what it covered](/articulo?id=<id>)` — a relative path resolves fine on the
same site). Never as the paragraph's opening frame.

Concretely: never open with "Horas después de que Playbook reportó…" or any
variant narrating the newsroom's own reporting process. That reads as the
outlet talking about itself instead of about the news. State the new
development directly, with the backlink sitting inside that sentence. What
belongs in this piece is what **changed** since the earlier one, not a recap.

---

## 11. Qué se queda fuera

Length does not demonstrate depth. Selection does.

- Full biographies when two antecedents suffice.
- Operational detail that doesn't change the business read.
- Corporate quotes that only repeat the communiqué.
- Three secondary stories competing with the main one.
- A regional connection added only to close.

---

## 12. Checklist de publicación

Run these twelve before considering a piece done (guide, 2026-08-13). This is
the last gate in both skills' decision flow.

1. ¿Elegimos correctamente entre A, B, C y D? (`format-tiers.md` §1)
2. ¿El movimiento principal aparece desde el inicio?
3. ¿Hay una sola historia central?
4. ¿El nivel de contexto corresponde al formato?
5. ¿Cada párrafo hace una sola cosa?
6. ¿El dato fuerte aparece pronto?
7. ¿La opinión añade una segunda capa real (y el formato la lleva)?
8. ¿Separamos hecho, reporte, interpretación y escenario?
9. ¿La conexión con México/LATAM es concreta?
10. ¿Los gráficos explican algo o solo decoran?
11. ¿Quitamos la frase intercambiable o demasiado perfecta?
12. ¿El texto termina antes de explicar de más?

> **La definición final.** Playbook escribe para alguien que conoce el deporte
> y quiere entender mejor su negocio. Abre con el movimiento, elimina el
> lenguaje del comunicado, pone las cifras que importan y explica quién gana
> control, dinero, margen, audiencia o poder.
