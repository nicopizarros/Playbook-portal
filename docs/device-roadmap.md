# Device roadmap — coverage map + proposed additions

2026-08-13, from the device-by-device audit. **All eight proposals were
built on 2026-08-14** — their entries moved into
`dynamic-element-library.md` per this file's own rule, and what remains
here is the coverage map: what story shape each of the twenty-four
devices owns, so a drafting run — or a human — can route a story shape to
its device in one lookup.

`Pirámide` was added on 2026-08-20, built to measure for the FMF's Nuevo
Modelo Deportivo. It is the first device that came from a story rather than
from an audit, and it closes a blind spot none of the eight proposals below
had spotted: **structure itself** — a division system's tiers, and which
body the new structure leaves outside them. Syntax and limits live in
`dynamic-element-library.md` §2, same as the roadmap eight.

## 1. What the roster covers

| Story shape | Device | The question it answers |
|---|---|---|
| One defining number | `Cifra clave` | ¿Cuál es EL número de esta historia? |
| A two-party relationship | `Jugada` | ¿Entre quiénes es la jugada? |
| A saga over dated milestones | `Cronología` | ¿Cómo se llegó hasta aquí? |
| A total broken into its parts | `Recibo` | ¿De qué se compone la cuenta? |
| The math behind a deal | `Ecuación` | ¿Cómo se calcula el negocio? |
| One metric, before → after | `Salto` | ¿Cuánto cambió? |
| One whole split into proportions | `Reparto` | ¿Cómo se reparte? |
| A roster of actors | `Alineación` | ¿Quiénes están adentro? |
| A market price, one moment | `Cotización` (tile) | ¿Cómo cotiza hoy? |
| A price over time dragging something with it, with a threshold | `Cotización` (track) | ¿Qué arrastra el precio, y cruzó la línea? |
| One institution's reporting period | `Resultados` | ¿Qué líneas del estado dispararon o cayeron? |
| Two actors compared on several metrics | `Duelo` | ¿Quién es más grande, en qué? |
| Two series' shapes over time | `Serie` | ¿Qué forma tuvo el ingreso de cada uno? |
| Countries split into camps | `Mapa` | ¿Dónde están los bandos? |
| An asset changing hands | `Venta` | ¿Quién vendió, quién compró, por cuánto? |
| The succession of owners | `Cadena` | ¿Quién lo ha tenido, y quién capturó el crecimiento? |
| Money crossing borders (La Lana only) | `Ruta del dinero` | ¿Por dónde viaja el dinero? |
| A deal signed for a term | `Contrato` | ¿En qué términos, por cuánto tiempo? |
| The dated road ahead | `Calendario` | ¿Qué sigue, y cuándo? |
| A governance vote | `Votación` | ¿Alcanzó el umbral? |
| N actors on one metric | `Ranking` | ¿Cómo queda la tabla? |
| The path from revenue to margin | `Cascada` | ¿A dónde se fue el dinero? |
| One actor at the center | `Perfil` | ¿Quién es, desde cuándo, por cuánto? |
| Explicit outcomes, Playbook's read | `Escenarios` | ¿Hacia dónde puede ir esto? |
| A market roundup's numbers | `Tablero` | ¿Cómo cerró el mercado? |
| A league system's tiers | `Pirámide` | ¿Quién está en la estructura, y quién no? |

Blind spots the audit found (all CLOSED by the 2026-08-14 build), grouped: **the future** (every temporal device
points backward), **recurring contracts** (a rights deal is not a sale),
**N-actor rankings** (Duelo caps at two actors, Reparto needs one whole),
**institutional money flow** (Ruta is geographic and La Lana-only),
**governance votes** (Reparto fakes it without a passing threshold), **one
actor's profile**, **explicit scenarios**, and **the KPI strip**.

## 2. Proposed devices — BUILT 2026-08-14

All eight shipped in `lib/article-devices.ts` on 2026-08-14, in this
order, each with its exclusive pair registered. Authoring syntax and
limits now live in `dynamic-element-library.md` §2 — the entries below
are kept only as the original design rationale. Every one follows the
house contract: plain-paragraph syntax with ` — ` and ` · ` separators,
parse-or-stay-text (fail loud), computed figures never authored,
count-up/stagger motion from the shared primitives, one per article,
budget-governed.

### 1 · `Contrato:` — the term sheet
The single most common uncovered shape: a rights/sponsorship deal signed for a
term. `Venta` transfers title; a contract RENTS it. Syntax:
`Contrato: Apple TV ↔ MLS · Monto — US$250M por año · Plazo — 2023 a 2032 ·
Cláusula — salida mutua en 2028`. Renders as a document panel: the pairing,
the annual figure counting up, the term drawn as a filled bar from start to
end with "hoy" marked on it, the computed total (`US$2,500M / 10 años`) in the
foot. Excludes `Jugada` (same pairing) the way `Venta` already does.

### 2 · `Calendario:` — the dated road ahead
Every temporal device points backward; the industry lives on what's NEXT
(votes, opt-outs, expirations, bid deadlines). Syntax:
`Calendario: nov 2026 — Voto de sedes · mar 2027 — Opt-out de TV · 2028 —
Expira el CBA`. Renders like a Cronología but forward: the next beat
highlighted, each item carrying a computed "en N meses" derived from the
article's own date (never authored, so it can't go stale wrong — and pieces
older than the first beat simply show the date).

### 3 · `Votación:` — the governance tally
Votes are the sport-politics story shape, and `Reparto` fakes them badly: it
has no notion of a PASSING THRESHOLD. Syntax:
`Votación: Mundial cada dos años · A favor — 166 · En contra — 22 ·
Abstención — 23 · Umbral — 138 (dos tercios)`. Renders as one bar with the
camps in the fixed ramp and the threshold drawn as a line ON the bar — passed
or failed is visible by construction, same design argument as the Cotización
track's Umbral. Checks that the camps sum to the body's membership when a
total is declared.

### 4 · `Ranking:` — the league table
N actors ordered on one metric — top franchise valuations, salary tables,
attendance. `Duelo` caps at two actors; `Reparto` needs the metric to be
shares of one whole. Syntax: `Ranking: Valor de franquicia NFL · Cowboys —
US$10,100M · Rams — US$7,600M · Giants — US$7,300M`. 3–6 rows, bars scaled to
the leader, positions numbered, an optional `(±N)` per row for movement since
last edition rendered as the direction chip. The device that finally gives
"la tabla" a designed home.

### 5 · `Cascada:` — the waterfall
`Recibo` lists a total's parts; the waterfall shows the PATH — revenue minus
costs to a net, additions and subtractions stepping down to what's left.
Syntax: `Cascada: Ingresos — US$4,210M · Producción — −US$1,900M · Derechos —
−US$1,400M · Margen — US$910M`. First and last are anchors, middle terms
signed; self-checking arithmetic exactly like the Recibo's total guard. The
shape quarterly-margin and "a dónde se fue el dinero" stories actually have.

### 6 · `Perfil:` — the actor card
One person or institution at the story's center, as a card: role, since-when,
the one figure that matters. Syntax: `Perfil: Gianni Infantino · Cargo —
Presidente de FIFA · Desde — 2016 · Mandato — hasta 2027 · Sueldo — CHF3.9M`.
2–5 labelled rows from a fixed vocabulary (unknown label rejects, like
`Venta`), the figure rows counting up. Brand palette via the same
`resolveBrand` registry when the subject is an institution.

### 7 · `Escenarios:` — the fork in the road
The evidence ladder's level 4 (escenario) made visual and explicitly owned:
2–4 outcomes, each with Playbook's read on likelihood, marked as
interpretation. Syntax: `Escenarios: Los derechos de la Liga MX · Renueva con
Televisa — probable · Se parte en paquetes — posible · Streaming puro —
lejano`. Fixed vocabulary (`probable`/`posible`/`lejano`) instead of numbers —
fake-precise percentages are exactly what the aritmética rule bans — and the
device carries a standing "Lectura de Playbook" mark so a scenario can never
be read as reporting. The disclosure argument is the Cotización track's
`Ligado` note, reapplied.

### 8 · `Tablero:` — the KPI strip
Three or four stat tiles in one row for market-wide roundups: transfer-window
totals, a league season's business summary. `Cifra clave` is ONE number;
roundup stories have three that belong together. Syntax: `Tablero: Mercado de
verano 2026 · Gasto total — €9,870M · Operaciones — 412 · Récord — €180M
(Mbappé)`. 2–4 tiles, each value counting up, notes as small captions. The
dataviz stat-tile pattern, in the house language.

## 3. Sequencing note

`Contrato` and `Calendario` close the two biggest gaps and reuse the most
existing machinery (brand registry, KV grammar, bar + countup primitives).
`Votación` and `Ranking` are the cheapest wins after that (one bar each).
`Cascada` needs new geometry; `Perfil`/`Escenarios`/`Tablero` are
panel-layout work. Whichever lands first should also claim its exclusive
pairs up front (`Contrato`×`Jugada`, `Calendario`×`Cronologia`,
`Votación`×`Reparto`, `Ranking`×`Duelo`, `Cascada`×`Recibo`,
`Tablero`×`Cifra clave`) — the overlap arguments are the same ones §1 of the
library already makes for `Venta`×`Jugada` and `Cadena`×`Cronologia`.
