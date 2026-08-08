# La Lana del Deporte: the exact shape of an article

The checkable version of what `.claude/skills/publish-newsletter/SKILL.md`
Step 3 describes in prose. The skill stays the source of truth for *why*;
this is the list you walk before and after publishing, and the reference for
anyone (human or agent) fixing a piece that shipped wrong.

Written 2026-08-07, after a La Lana article went live missing four of these
items at once. What that run got wrong is recorded at the bottom, because the
failure mode matters as much as the checklist.

---

## 1. The body, movement by movement

A La Lana body is four movements in this order. Every published edition wears
this shape; a piece that doesn't isn't a La Lana piece.

### Movement 1 — the cold open

**Two to four paragraphs.** The tension goes in the first line. No
scene-setting, no "en los últimos años". Then the turn.

### Movement 2 — the promise block

Verbatim, as its own bold paragraph:

```
**Si lees este artículo podrás responder las siguientes preguntas:**
```

Followed by **exactly three** questions, as a markdown bullet list. They are
the reader's questions, not the newsroom's, and the piece has to actually
answer all three.

This is the movement that gets skipped, because the prose reads fine without
it. It is not optional.

### Movement 3 — six to eight `##` sections

Each heading **states a position**, never labels a topic. *"Mover dinero no es
quedarse con él"*, not *"El acuerdo"*. The sections carry the reporting: named
parties, figures against comparable figures, what each actor did differently.

**Inside a section: one or two blocks of 80-100 words, each opening with a bold
lead-in.**

```
**El costo de entrar:** Estados Unidos aparece en el otro extremo. Uno de los
saltos económicos más fuertes llega entre los 10 y los 12 años, justo cuando
comienza a definirse quién puede seguir dentro del sistema.
```

This is the same lead-in the short products put on every paragraph, applied
per *block* rather than per sentence — the piece is longer, the unit is bigger,
the texture is identical. They render as product-colored scan marks
(`markLeadIns`), so readers skim the argument off them alone; each must be 2-5
words, colon-terminated, specific to its block, and **never repeated** in the
piece (a repeat now visibly repeats on the page). Prefer an argument over a
label: *"Quién se queda fuera:"* over *"Los datos:"*.

Exactly four kinds of paragraph go without a lead-in: the cold open, device
declarations, `Foto: Playbook` captions, and the Opinión bullets.

**Not this** — the same words as eight standalone beats:

```
Estados Unidos aparece en el otro extremo.

Uno de los saltos económicos más fuertes llega entre los 10 y los 12 años.

Cerca del 70% de los niños abandona el deporte alrededor de los 13 años.
```

That is the short-beat format the publisher reversed on 2026-08-06 — it reads
choppy on the article page and it undercuts the calm analytical register. It is
also what the 2026-08-07 guest piece shipped in: 50 paragraphs at a 23-word
median and not one lead-in, next to an Industry Shots article carrying one on
every paragraph. Same site, two different publications.

### Movement 4 — the closing take

```
## La Opinión de Playbook
```

as an `##` heading, then **exactly three bullets** — not two, not four, and a
markdown list rather than loose paragraphs. Bullets run 30-37 words each
(median 33, never under 15 or over 60). Three verdicts of the same weight: what
the story established, who read it best or worst, what has to hold for the
thing to keep working.

> **La Lana uses the heading form.** The inline `**Opinión de Playbook:**`
> lead-in belongs to the short products (Noticias, Infinitas). Both shapes get
> the same render-time callout — the green fenced box with the bottle-cap
> kicker (`markOpinionCallout` → `.shot-opinion`), which as of 2026-08-07
> recognizes the `## La Opinión de Playbook` heading plus its list, not only
> the inline paragraph. Write either shape as plain markdown and the box
> appears; never hand-wrap one in HTML to fake it (§5).

---

## 2. Devices — the budget is a floor, not a ceiling to avoid

Enforced in code by `deviceBudgetFor` / `applyBodyDevices`
(`lib/article-devices.ts`):

| reading time | devices | `priority: 5` |
| --- | --- | --- |
| ≤2 min | 1 | +1 |
| 3-5 min | 2 | +1 |
| 6+ min | 3 | +1 |

**Zero devices on a full-length La Lana piece is a bug, not restraint.** Walk
all ten shapes against the story before concluding none fits:

`Cifra clave:` · `Jugada:` · `Cronología:` · `Recibo:` · `Ecuación:` ·
`Salto:` · `Reparto:` · `Alineación:` · `Cotización:` · `Duelo:`

Rules that bite:

- Each is a **plain paragraph on its own line**, items separated by ` · `,
  key/value by ` — `. (The em-dash ban in the prose does not apply to device
  syntax; the parsers require it.)
- Never repeat a device type in one article — the second one silently renders
  as plain text.
- First declared in the document wins the budget. Put the device carrying the
  story's spine first.
- Over-budget declarations render as visible plain paragraphs. A reader sees
  the mistake.
- At least two prose paragraphs between devices (nothing enforces this but you).
- **Every number inside a device must already be in the piece.** Never invent
  one to fill a shape.
- A `Cifra clave` **replaces** its sentence — never restate the figure in the
  neighbouring paragraph.

Also: bold the single most important figure in the prose (`**70%**`), because
a bold span that is purely a figure counts up on the page. Plain ones get the
inline highlight automatically.

**Write the `Cifra clave` caption so it works in two places.** The article page
prints it under the pull-figure, and the homepage's "La cifra del día" rail
prints the same line under the chip — where it is the *only* thing telling a
reader what the number measures. A caption that reads fine beside the
paragraph it came from ("lo que cuesta") is useless in the rail; name the
thing. `US$8,000 a US$20,000 — el costo anual del futbol juvenil de alto nivel
en Estados Unidos` survives both.

---

## 3. Fields

| field | rule |
| --- | --- |
| `publication` / `source` | `"La Lana del Deporte"` / `"la-lana"`, always |
| `title` | ~9 words; question, colon-claim, or flat declarative |
| `excerpt` | **the story's biggest figure verbatim** — the /la-lana hub hero pulls it from `title` + `excerpt` and renders nothing without it |
| `imageUrl` | required; ratio between ~1.4:1 and 1.8:1 (it gets force-cropped to 16:10) |
| `imageCredit` | required, specific — it backs the takedown clause in Términos |
| `author` | never prepend "Por "; the template already does |
| `mostrarAutor` | `false` by default; `true` for a guest collaboration |
| in-body images | `![alt](url)` straight off Substack, each followed by a `Foto: Playbook` caption paragraph, in source order |

**Guest bylines.** When a guest byline should link out, the `author` field
takes inline markdown: `"[Jane Doe](https://…), fundadora de [Acme](https://…)"`,
which `renderAuthorByline` turns into real external links. A plain string makes
the *whole* descriptor one internal `/autor?nombre=…` link, so
`"Jane Doe, fundadora de Acme"` becomes an author archive keyed on the
descriptor — and the same person filed under a different descriptor next time
gets a second, unrelated author page. Decide the links deliberately; never
invent a URL to satisfy the syntax.

---

## 4. After publishing — the step that has no reminder

**Push the piece's connections to the departures board.** /la-lana's masthead
is a board of the CONNECTIONS the investigations uncovered. Nothing does this
automatically:

```bash
# [{ "conexion": "A ↔ B", "articleId": "<the id the insert returned>" }]
npx tsx scripts/update-lana-board.ts <rows.json> --dry-run   # read the board it prints
npx tsx scripts/update-lana-board.ts <rows.json>
```

A connection is a two-party relationship the piece actually **documents** as
central — not every named entity qualifies. Max two per article, `↔` for
two-way and `→` for one-way flows, 1-3 words a side. Zero is a valid answer for
a piece about a single actor. Everything else (EXP. number, date, status, URL)
is derived from the article row; never write an EXP. number into copy.

---

## 5. How the 2026-08-07 break happened, and the rule that prevents it

Three separate things went wrong in one afternoon. All three are worth knowing.

**1. A publish-time HTML wrapper duplicated a render-time device.**
`wrapOpinionBox` was added to `scripts/publish-newsletter.ts` to draw a green
box around the closing take, unaware that the article page had since grown
`markOpinionCallout` (`lib/product-hubs.ts` → `.shot-opinion`), which already
did exactly that, per-product tinted. Stacking both produced nested
`<div class="opinion-box"><aside class="shot-opinion">` markup.

It was solving a real gap, though, and the gap outlived the revert: the device
only recognized the inline `**Opinión de Playbook:**` paragraph, so the two La
Lana pieces using the `## La Opinión de Playbook` heading form closed on a bare
subhead while every Noticias piece closed in a branded green box. Fixed at the
device (2026-08-07), which is what the wrapper should have been in the first
place: one regex in `markOpinionCallout`, and both existing articles picked the
box up on the next render with no rows touched and nothing to migrate. That is
the whole argument for render-time in one line.

> **The rule:** article body presentation is decided at **render** time, in
> `app/(public)/articulo/page.tsx`'s transform chain, never at publish time.
> `publish-newsletter.ts` converts markdown to TipTap and renders that TipTap
> to HTML — nothing else. If a body needs a new visual treatment, it becomes a
> device in `lib/article-devices.ts` or `lib/product-hubs.ts`, driven by a
> plain authoring convention, so it applies to the whole existing catalog and
> can be changed without touching a single stored row.

**2. Reverting the code did not revert the article.** The wrapper had been
written into the row's `body_html` while `body_json` never knew about it. When
the code and its CSS were removed, the `<div>` stayed baked into the live
article with no stylesheet behind it, which is what "out of style" looked like
on the page. `body_html` is a **cache of `body_json`**, so a body fix means
regenerating both through the insert pipeline:

```bash
npx tsx --env-file=.env.local scripts/update-article.ts <fix.json> --dry-run
```

Hand-editing stored HTML is how the two drift apart, and drift is invisible
until a deploy removes the CSS underneath it.

**3. The build break hid inside an already-red check.** The regex `s` (dotAll)
flag in the new code needs ES2018 and `tsconfig` targets ES2017, so `next build`
failed its type check and Vercel could not deploy. It should have been caught
on push — except CI had been failing on an unrelated lint error since the day
before, so a red check said nothing new. Two habits follow:

- Run the full CI triple locally before pushing anything to `main`:
  ```bash
  npm run typecheck && npm run lint && npm run build
  ```
- **Never let `main` sit red.** A permanently-failing check is not noise, it is
  a disabled alarm.

---

## 6. The pre-flight, in one block

```bash
node scripts/find-duplicates.mjs "<headline>"        # Step 0, per item
node scripts/check-voice.mjs <draft.json>            # rhythm, em dashes, antithesis cap
npx tsx --env-file=.env.local scripts/publish-newsletter.ts <draft.json>
npx tsx scripts/update-lana-board.ts <rows.json>     # §4 — nothing reminds you
npm run typecheck && npm run lint && npm run build   # only if code changed
```

And the read-through, once the piece is live: cold open ≤4 paragraphs · promise
block present with three questions · 6-8 argument headings · `## La Opinión de
Playbook` with three bullets · devices at budget · biggest figure in the excerpt
· board rows pushed.
