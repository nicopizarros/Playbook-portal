# TODO

Open items nobody is working on right now. Each one says what it is, why it
was left, and what has to be true before it's worth doing — so picking one up
doesn't start with re-deriving the context.

---

## 00. El contador de lectores propios cuenta bots — bloquea dos métricas ancla

Encontrado el 2026-08-25 al conectar GA4 y poder comparar contra una fuente
independiente por primera vez. Misma ventana (2026-08-10 → 08-25):

|                        | Usuarios | Vistas |
|------------------------|----------|--------|
| GA4 (requiere JS)      | 677      | 2,032  |
| `article_reads`        | 9,067    | 9,304  |

Trece veces. La causa es `lib/bots.ts`: una lista de **catorce** user-agents
literales (`googlebot`, `bingbot`, `facebookexternalhit`…) contra la que se hace
`ua.includes(bot)`. No cubre GPTBot, ClaudeBot, CCBot, PerplexityBot, Bytespider,
Amazonbot, AhrefsBot, SemrushBot, DataForSeoBot, YandexBot, Baiduspider ni el
resto del long tail.

El camino del fallo está en `lib/metering.ts` `resolveEntitlement()`: el chequeo
de bot ocurre ANTES de acuñar la identidad anónima, así que un crawler que no
está en la lista recibe cookie, no la persiste, y en la siguiente petición entra
como lector nuevo. La firma en los datos es inconfundible — lecturas ≈ lectores
todos los días (446/439, 663/661, 692/663), una lectura por identidad.

**Consecuencia:** `lecturas por lector` (1.03) y `% de recurrencia` (1.23 %) no
miden comportamiento, miden tráfico automatizado. Estaban a punto de irse a un
memo de dirección como hallazgo de producto ("el archivo no recircula"); se
corrigieron a tiempo y en el dashboard quedaron reclasificados como diagnóstico.

**Qué hay que hacer**, en orden de valor:

1. Reemplazar la lista por una detección real. Lo mínimo digno es ampliarla con
   los crawlers de IA y las suites SEO; lo correcto es no depender del UA —
   marcar la lectura sólo cuando el cliente demuestra ser un navegador (un ping
   desde JS, por ejemplo), que es justo lo que hace que GA4 no tenga este
   problema.
2. No borrar el histórico: quedará sesgado, pero es la única serie que existe
   antes del 2026-08-10. Marcar la fecha del arreglo y comparar contra GA4.
3. Revisar si el quota de artículos gratis (`FREE_ARTICLES_PER_MONTH`) está
   afectado. Si cada bot estrena identidad, nunca topa el muro — eso es benigno.
   Lo que habría que confirmar es que ningún humano esté siendo contado de más.

---

## 0. Coverage hubs — SHIPPED 2026-08-18, four follow-ups open

`/coberturas/[slug]`, first instance `/coberturas/lfa`. A hub is **not** a
fifth editorial product: products own a `source` and articles are born into
one; a hub GATHERS by tag and is config + assets. `lib/hubs/types.ts` carries
the reasoning; `scripts/scaffold-hub.ts` is the standing test (proved by
scaffolding and removing an `nfl-mexico` hub the same day).

**QA pass before sharing with the LFA (2026-08-25). Publisher ruled on the
two open questions the same day; both are now settled, not pending:**

- **Discoverability: leave it exactly as it is.** `listed: false` is the
  desired state, not a temporary hold. The hub is reachable by URL (verified
  200) and absent from the nav, the sitemap and the index (`robots: noindex,
  nofollow` — all three verified). Publisher, 2026-08-25: *"it is not
  accessible via the home page, but if you know the address you can access
  it."* That is precisely what this flag does — see the a61b4f3 commit title,
  "unlisted means undiscoverable, not unreachable". **Do not flip this to
  `true` to "fix" the header-reachability QA item; the QA item is what is
  wrong, and it has been struck.**
- **Linking out to the LFA: dropped for now.** Publisher, 2026-08-25. The hub
  deliberately carries no outbound link to any league property. Revisit only
  if the league asks.

**Still open — the same photograph renders twice.**
`/assets/img/lfa-reyes-accion-mayo-2026.jpg` is both the lead story's own cover
(it is the article's `image_url`, rendered by `HubModules.tsx:258`) and the
hardcoded `accessPhoto` for "Desde adentro" (`lib/hubs/lfa.ts`, rendered at
`HubModules.tsx:369`). On the page it reads as a bug rather than a motif.

It cannot be fixed from what is in the repo: `public/hubs/lfa/` holds exactly
three assets, and the only unused one — `board.jpg` — is **not a photograph**.
It is a 1400x788 dark grey texture with a faint grid, the hand-built gradient
the masthead wore before the league's key art replaced it (`78ef043`). Keep it
(publisher, 2026-08-25: a photo is meant to live in that slot) but it cannot
serve as one. **What is needed is one more real, credited LFA photograph for
the access poster.** Until it arrives, the choice is duplicate-the-lead (today)
or drop `accessPhoto` and let the module degrade to type. Do not substitute
stock — `module-inventory.md` forbids exactly that.

**Open, in priority order:**

0. **Route namespace vs. nav label.** The reader-facing zone is now
   **"Exclusivas"** (publisher, 2026-08-18) but the route is still
   `/coberturas/<slug>`. The original justification for that namespace was
   that the nav label and address bar would agree; they no longer do.
   Renaming was free while the hub was unlisted (nothing linked to it, it was
   out of the sitemap) — **it is no longer free**: as of the same day the hub
   is linked from the nav and present in the sitemap, so a rename now needs a
   301 from `/coberturas/*`. Decide deliberately; either answer is defensible,
   but the cost only goes up.

1. **The LFA hub's numbers need public citations — and the page no longer
   says so.** Every figure still traces to a source by construction
   (`HubFigure` cannot be built without a `HubSource`), but as of 2026-08-18
   an uncited source renders **nothing** instead of a visible "sin cita
   pública" chip (publisher's call — the chips read as clutter). The
   consequence: the citation backlog is now invisible on the artefact and
   lives only here. The capital figures on `/coberturas/lfa` are still
   uncited; the expansion figure no longer is — as of 2026-08-25 it is a count
   of the brand kit's own franchise list and cites the KIT. Replace the sources in `lib/hubs/lfa.ts` as citations
   arrive. Every figure on the page
   traces to a source by construction (`HubFigure` cannot be built without a
   `HubSource`), but the expansion and capital figures cite *"Brief editorial
   Playbook (2026-08-18)"* and render a visible **"sin cita pública"** chip.
   That chip is the backlog, on the artefact itself. Replace the sources in
   `lib/hubs/lfa.ts` as citations arrive. Nothing else needs to change.
2. **Contradiction in the source brief:** Monterrey is listed both as an
   established plaza and as a 2027 expansion market. Encoded once, as
   established. Someone has to say which is right (second franchise? error?).
3. **"Jalisco" is a state, not a city.** Recorded verbatim rather than
   resolved to Guadalajara — resolving it would be inventing a fact.
4. **`SPORT_OPTIONS` has no American-football value.** LFA coverage currently
   falls back to `Multi-deporte / Otros`, which is honest but wrong-shaped.
   Adding one is a taxonomy change with a backfill; not done unilaterally.

**Also landed with this work (unrelated pre-existing gaps, fixed in passing):**

- `SOURCE_LABELS` (`lib/constants.ts`) has **no entry for
  `futbol-business-review`**, though 14 published rows carry it. Worked around
  in `components/hubs/HubModules.tsx` via `PRODUCT_HUBS`; the constant itself
  is still wrong and should be fixed at source.
- Footer copyright contrast was **3.77:1** on the always-dark footer — the only
  WCAG AA failure Lighthouse found on any route. Raised to `.55` alpha.
- `app/sitemap.ts`'s tier→column ternary fell through to `tagsVertical` for any
  unlisted tier. Fixed, and `property` is excluded from `/tema` entirely (the
  hub is its canonical destination).

---

## 0b. Editorial reference tree was ORPHANED — fixed 2026-08-18

`.claude/playbook-editorial/` (8 files, ~153 KB) is the single source of truth
for every shared editorial rule, and `_GOVERNANCE.md` states both publish
skills reference it "by symlink from their own `references/`".

**Those symlinks did not exist, and neither SKILL.md referenced the tree at
all.** The two skills were self-contained monoliths (26 KB / 25 KB) while the
tree kept receiving rule edits as recently as this week — i.e. edits were
landing where no drafting run would ever read them. This is precisely the
drift `_GOVERNANCE.md` §1b was written to prevent, happening invisibly.

**Fixed:** `references/` created in both skills, symlinked to all 8 shared
files, and both SKILL.md files now point at the shared taxonomy rule.

**Still open:** the two publish skills are still monoliths with their rules
inlined. Reconnecting the links stops further drift but does not
de-duplicate what already diverged. A real restructure (thin router +
references, as `hub-builder` and `publish-partner-announcement` now
demonstrate) is a separate job — and worth doing, since a 26 KB entry cost is
paid on every run.

---

## 1. News classification — RESOLVED 2026-08-14

The four open questions were answered and the whole thing shipped in one
pass:

1. **Classify what?** Both ends. Publish-time validation plus an archive
   audit. The audit ran against the real DB the same day: 133 rows, zero
   out-of-vocabulary tags, zero empty tiers — the archive was already
   consistent, so there was nothing to backfill.
2. **By what?** The fixed controlled vocabulary that `lib/taxonomy.ts`
   already was, now enforced: `validateTags()` /  `canonicalizeTag()` there
   fold case/accents/whitespace to the canonical option and reject
   everything else with the nearest option suggested. The drafting agent
   proposes; the vocabulary constrains.
3. **Who arbitrates?** The vocabulary. `scripts/publish-newsletter.ts`
   hard-fails the publish on an invalid tag (the human running the skill
   sees the rejection); `app/api/update-articles/route.ts` canonicalizes,
   drops what doesn't fold, and reports `droppedTags` in its response;
   `lib/actions/admin.ts` (saveArticle/createArticle) rejects as a backstop
   — the dashboard's checkbox UI can't produce invalid tags anyway.
4. **Priority?** Deliberately editorial, out of scope. No validator touches
   it.

Still available: `scripts/audit-taxonomy.ts` (report-only by default,
`--fix` canonicalizes folding variants and never invents classifications).
Re-run it if bulk imports ever bypass the gates.

**How the two halves landed:** the *editorial format* half shipped first
(2026-08-13) as the A/B/C/D router (`.claude/playbook-editorial/format-tiers.md`
§1), which classifies every incoming story by depth before drafting; the
*taxonomy* half above (validated tags) followed on 2026-08-14, answering the
four scoping questions the same way the router had set the precedent —
fixed vocabulary constrains, the drafting agent proposes.

---

## 2. Retire the `industry-shots` source key — CODE DONE 2026-08-14, one post-deploy step left

The machine key is now `noticias` across the codebase: `KNOWN_SOURCES`,
`SOURCE_LABELS`, `lib/taxonomy.ts`, `lib/product-hubs.ts`, the schema
default, both pages, the API route, the CMS (dropdown, entry defaults,
studio prompts), `ShotProgress`, and every `.article-product-*` /
`[data-source]` CSS selector across the six stylesheets. The publish-skill
docs (`.claude/playbook-editorial/`) say `noticias` now too.

**The safety net:** `normalizeSource()` in `lib/constants.ts`, applied once
at the data boundary (`lib/data/articles.ts`), maps legacy rows to
`noticias` on read — so the site is correct against BOTH database states,
and `/archivo?source=industry-shots` bookmarks still filter correctly.

**What's left — strictly after the next deploy:**

```
POSTGRES_URL=<production> npx tsx scripts/migrate-source-noticias.ts
```

(93 rows carry the legacy key — verified by `--dry-run` on 2026-08-14; the
TODO's old "68" was the published subset.) Do NOT run it before deploying:
the currently-deployed build matches the literal old string, so migrating
first would empty /noticias until the deploy lands. The script verifies
counts and its header documents the reverse-update rollback. After it runs
clean, `normalizeSource()` becomes a no-op that can stay indefinitely as
cheap insurance.

---

## 3. Stale files and dead weight — the clear calls executed 2026-08-14, the judgment calls still open

**Status: swept on 2026-08-13, on the owner's explicit instruction** ("remove
stale and old code"). Deleted: the pre-Postgres seeds (`articles.json`,
`content.json`, `scripts/migrate-json-to-db.ts` and its npm entry), all
already-executed one-off `fix-*`/`update-*`/backfill scripts plus their npm
entries, `scripts/update-matador-report.ts` (superseded by
`update-article.ts`), the regenerable Substack-backlog snapshot
(`docs/SUBSTACK-ARCHIVE-BACKLOG.md` + its 359 KB JSON twin), and the
superseded `v23` design prototype. `HANDOFF.md` moved to `docs/archive/` with
an archived banner (it is the one place recording what the deleted one-offs
did to production data). Kept: the `v24` prototype and the UX study (design
reference), `playbook-isotope-dark.png` (half of a used pair), and everything
in `lib/`, `components/` and `vendor/` — a 2026-08-13 import audit found zero
orphan modules. Everything deleted is recoverable from git history.

---

## 4. Build the proposed devices (device roadmap) — DONE 2026-08-14

**Status: all eight built**, in the roadmap's recommended order, each with
its exclusive pair registered (`Contrato`×`Jugada`, `Calendario`×`Cronología`,
`Votación`×`Reparto`, `Ranking`×`Duelo`, `Cascada`×`Recibo`,
`Tablero`×`Cifra clave`). Entries moved from the roadmap into
`dynamic-element-library.md` §2 (now twenty-three devices); the roadmap file
keeps the coverage map and the original rationale. Computed figures per the
specs: Contrato's term total and "hoy" marker, Calendario's "en N meses"
chips (relative to the article's own date, threaded as `DeviceContext`
through `applyBodyDevices`/`deviceFromParagraph`), Votación's
`Aprobada`/`No alcanzada` verdict, Cascada's Recibo-style 2.5% sum guard.
Verified: 8/8 render, 5/5 malformed cases stay inert, exclusive pairs lock,
light/dark samplers reviewed. Original scoping notes below.

The 2026-08-13 device-by-device audit shipped one upgrade to each of the
fifteen existing devices and mapped the roster's blind spots: the future
(every temporal device points backward), recurring contracts, N-actor
comparisons, institutional money flow, governance votes, profiles, explicit
scenarios, and the KPI strip. Eight devices are proposed to close them, in
recommended build order:

1. `Contrato:` — the term sheet (a rights deal is not a `Venta`)
2. `Calendario:` — dated FUTURE beats, next one highlighted
3. `Votación:` — the tally with the passing threshold drawn on the bar
4. `Ranking:` — the league table, 3–6 actors on one metric
5. `Cascada:` — the waterfall from revenue to margin, self-checking
6. `Perfil:` — the actor card, brand palette via the existing registry
7. `Escenarios:` — level-4 evidence made visual, fixed likelihood vocabulary
8. `Tablero:` — the 3–4 tile KPI strip for market roundups

Each proposal in the roadmap carries its syntax sketch and its exclusive
pair. When one gets built: implement in `lib/article-devices.ts` (grammar,
fail-loud parse, computed figures), register its exclusive pair, move its
entry from the roadmap into `dynamic-element-library.md`, and add it to the
harness sampler. The roadmap deliberately lives OUTSIDE
`.claude/playbook-editorial/` so no drafting run authors an unbuilt device —
keep it that way until the code exists.

---

## 5. Ads are PAUSED site-wide — one line to bring them back

`ADS_PAUSED = true` in `lib/adsense.ts` (publisher directive 2026-08-24,
"collapse all ad spaces on the app until new notice"). `AdSlot` returns
`null` for every placement regardless of consent or configuration, so no
`.ad-slot` wrapper is mounted anywhere and none of the reserved min-heights
in `styles/ads.css` apply. Verified with advertising consent GRANTED on `/`,
`/articulo`, `/infinitas`: `.ad-slot` count is 0 on all three.

**To resume:** flip that one constant. Nothing else was removed — the six
`<AdSlot>` call sites, all six unit IDs, the `SLOT_FORMATS` map and the
`ADSENSE_SLOT_*` env overrides are untouched, so no unit has to be
re-created in the dashboard.

**Deliberately still live**, because all three are AdSense *account*
prerequisites rather than inventory, and pulling them over a temporary hold
risks the account's standing: the `adsbygoogle` loader and Google's Funding
Choices CMP in `app/layout.tsx`, and `/ads.txt`.

**ONE THING THE CODE CANNOT DO — needs a dashboard click.** With the loader
live, Google's **Auto ads** can place anchor and vignette units on its own,
with no `<AdSlot>` involved. On the checked pages it currently injects one
zero-size probe (`<ins class="adsbygoogle adsbygoogle-noablate"
data-ad-hi="true">`, `display:none`, `data-ad-status="unfilled"`) appended
to `<body>` — nothing renders and nothing occupies layout, so the pause
holds today. But that element proves Auto ads is at least probing, and if a
campaign ever fills it the pause is no longer complete. **Turn Auto ads off
for playbook.la in the AdSense dashboard** to make the hold airtight.

---

## 6. `El tablero de la FIFA` — updated 2026-08-24, two backlogs left

Was stale at its 14 ago state for ten days. Now carries 34 of 210
federations declared (was 20), **82 con Infantino / 125 pidiendo revisión /
3 sin definir**, last movement 24 ago 2026. Fourteen entries added, each
with a date and a source: Alemania (15 jul), Grecia and Jordania (4 ago),
Noruega, Croacia and Albania (7 ago), Hungría (19 ago), Montenegro and
Israel (20 ago), Gibraltar (24 ago) against; Yibuti (2 ago) and Argentina
(7 ago) for; Rumania and República Checa (12 ago) undecided.

The two-way split barely moved because almost every new declaration came
from inside a bloc already counted on that side. Only Romania and Czechia
changed the headline (127 → 125), by moving out of UEFA's silent count into
`sin-definir` — which required widening that bucket's definition from
"explicitly declined" to "declined, OR signalled doubt without declaring",
documented in the file.

Also landed: `ELECTION.vote` sharpened to `2027-03-18` with
`venue: 'Rabat, Marruecos'` (worth naming — Morocco signed the joint letter
backing him, so the ballot is held in a house that has already declared),
and CAF's note now carries the contested-unanimity qualifier.

### Backlog A — federations with a position but no date

`since` is load-bearing: it drives `lastMovement()`, the module's own
staleness check. These are held out until someone pins a date, not dropped:

- **Países Bajos** — appears on published trackers as withdrawn, no date.
- **Dinamarca** — its only dated statement is the 2022 OneLove
  non-endorsement, which is a position on a different fight. Needs a 2026
  statement before it belongs on this board.
- Roughly a dozen African and Asian associations listed as backing him
  (Kuwait, Sri Lanka, RD Congo, Indonesia, Níger, Nigeria, Comoras, Malaui,
  Uganda, Gambia, Paraguay, Mongolia…), all undated on the trackers.

### Backlog B — the model has no candidate axis

The board is a referendum on Infantino: for, against, undecided. It cannot
represent a second candidate, and there may be one — Montagliani is
weighing a run, and Salman bin Ibrahim Al Khalifa, Dariusz Mioduski and
Mattias Grafström have been named as possible alternatives. Nominations
close **18 nov 2026** (`ELECTION.candidaciesClose`, already correct), and a
candidacy needs five member associations to endorse it. **Revisit the data
model after that date**, not before: until the ballot is known, a candidate
dimension would be modelling speculation.

Related: the regional bodies have threatened a **no-confidence vote** (20
ago), which is a separate mechanism from the March ballot and is also
unrepresentable today. Probably prose, not a board column.

### One inconsistency in the archive

The 21 ago article's prose says "la FIFA elige presidente con 211 votos".
The board uses 210 because Nepal is suspended, and its header documents
that reasoning. The board is right; the article prose is loose. Not worth
editing a published piece over, but don't copy the 211 forward.

---

## 7. Diseño rondas 1 y 2 — CÓDIGO ENVIADO 2026-08-27, once huecos de copy y ocho decisiones abiertas

Las dos rondas de diseño para `playbook.la` están construidas. Lo que sigue
abierto **no es código**: es copy que sólo el cliente tiene y decisiones que
sólo el publisher puede tomar. Cada hueco se resolvió omitiendo, nunca
inventando ni imprimiendo el corchete — una maqueta puede mostrar
`[ORGANIZACIÓN]`, una página publicada no.

### 7a. Los once huecos `[BRACKET]` (Handoff Spec.dc.html §7)

Se llenan en una sola pasada. Dónde vive cada uno hoy:

| # | Hueco | Dónde va | Estado en el código |
|---|---|---|---|
| 01 | `[AÑO]` de fundación | Hero de `/nosotros` ("Desde [AÑO]") y `foundingDate` del JSON-LD | La ficha del hero **no se renderiza** y `foundingDate` **no se declara**. Un año inventado en structured data es peor que un campo ausente. |
| 02 | `[AÑO]` horizonte | Visión, `/nosotros#mision` | La frase se publica sin el año: "Que la conversación… se dé con datos públicos, comparables y verificables". Se lee bien y es cierta. |
| 03 | `[ORGANIZACIÓN]` ×4 | Bios de liderazgo | Frase completa omitida en las cuatro bios (`lib/data/leadership.ts`). |
| 04 | `[LOGRO CONCRETO CON CIFRA]` ×4 | Bios de liderazgo | Igual: iba en la misma frase que 03. Sin cifra la bio no hace su trabajo. |
| 05 | `[TEMAS]` | Bio de Aldo Sales | Omitido; se conservó "conduce la franquicia de video de la casa", que sí es cierto. |
| 06 | `[MEDIO O INSTITUCIÓN]` | Bios, quién ha citado su trabajo | Opcional, no se agregó. Es la línea que más pesa de las cuatro. |
| 07 | `[Antes: cargo, organización]` ×4 | Línea de credencial de cada tarjeta | `credential: null`. La tarjeta simplemente no imprime esa línea. |
| 08 | `[USUARIO]` ×4 | Handles de LinkedIn | No hay enlaces de LinkedIn en las tarjetas. |
| 09 | `[RETRATO 4:5]` ×3 | Guillermo, Evelyn, María José | Las cuatro tarjetas caen al **monograma**, que es un estado DISEÑADO ("hueco sin retrato"), no una imagen rota. Aldo tampoco tiene retrato en el repo: el archivo del diseño (`uploads/portraits-…jpg`) no está en `public/` ni en Blob. |
| 10 | `[NÚMERO] suscriptores` | Cuarta cifra de Alcance | No se incluyó, por decisión del propio diseño: sin dato real, tres cifras leen mejor que cuatro con un hueco. |
| 11 | Nombre de Dirección editorial | Liderazgo | Ver 7c.2. |

Las tres cifras de Alcance **sí** son reales: salen de `site_content`
(`statsSection.stats`), la misma fila que alimenta la portada. Un cambio en el
CMS se refleja en `/nosotros` y en el panel del header sin tocar código.

### 7b. `/estandares` está publicada en su versión mínima honesta

El diseño no la maquetó ("No diseñada en esta entrega") pero dos cosas ya
apuntaban ahí — el enlace de `/nosotros` y `publishingPrinciples` del JSON-LD —
así que la ruta tenía que existir o las dos 404eaban. Lo que hay es: las cuatro
reglas aprobadas en extenso, más hechos que ya son ciertos del sitio
(correcciones por `/contacto`, etiquetado de lo comercial, masthead en
`/equipo`). **No inventa política.** El documento largo — política de
correcciones, escalera de fuentes, conflictos de interés — necesita un dueño
editorial que lo escriba y lo firme, y ese dueño es justo la vacante de 7c.2.

### 7c. Decisiones que necesitan al cliente, no al desarrollador

1. **El wordmark de Formula 1 en `f1.svg`.** Va como calado en el sidepod, es
   marca registrada de Formula One Licensing BV, y llega como silueta rellena
   mientras los otros diez son línea. **El chip de F1 se envía sin icono**,
   aplicando la regla del propio cliente. El componente ya está dibujado y
   medido en `components/icons/tema/`: reactivarlo es una línea en
   `TEMA_ICON_BY_TOPIC` cuando el ilustrador lo redibuje.
2. **Falta un nombre para Dirección editorial.** Guillermo Mejía carga hoy
   dirección editorial e inteligencia de negocio. Si eso es permanente,
   `/estandares` ya tiene firmante; si no, es una vacante.
3. **`audiencias.svg` se empasta abajo de 24px.** Rayos, corazón, tres figuras
   y manos finas. A 15px se nota, y se confirmó en captura. Es el único glifo
   que conviene simplificar al mismo conteo de trazos que los otros.
4. **Dónde viven los chips de "Explora por tema".** Se recomendaron en
   `/archivo` porque el filtro por fuente se mudaba allá; con 3b elegida la
   portada conserva su filtro, así que hay que decidirlo por intención de
   búsqueda. Hoy siguen en la portada. El estado "seleccionado" del chip está
   escrito en `styles/sections.css` y **inerte** hasta que se decida.
5. **TFBR no tiene `source`.** Por eso no tiene chip en la tira de la portada
   ni banda de salida. Decidir si editorial acuña `futbol-business-review` o si
   el hub sigue siendo una portada que manda a Substack.
6. **Siguen abiertas dos puertas a La Lana.** Con 3b la banda de salida hace la
   duplicación explícita en vez de resolverla. 3a (las pestañas convertidas en
   navegación) está diseñada y lista si se quiere cerrar.
7. **Cuántos expedientes caben en el cajón.** Nueve hoy, quince funcionan;
   arriba de veinte la pila deja de ser legible. Hay que decidir si se pagina
   por año o si el cajón muestra los últimos N y manda el resto al archivo.
   **No está diseñado.**
8. **El bloque "Acerca de Playbook" de la portada se queda** (decisión del
   publisher, 2026-08-27) pero **hay que reescribirlo** para que deje de
   repetir el descriptor del footer doscientos píxeles abajo. Ese copy vive en
   el CMS (`site_content.aboutSection.body`), no en el código: es una edición,
   no un deploy.

### 7d. Tres cosas que el código dejó anotadas y valen una decisión

1. **El 301 de La Lana rompe el filtro "Sección" del archivo para ese
   producto.** `/archivo?source=la-lana` ahora 301ea al hub (en
   `middleware.ts`), que es exactamente lo que pedía la consolidación — pero el
   archivo tiene una consola de filtros de cuatro tiers, y elegir "La Lana del
   Deporte" en ella ahora saca al lector de la página. Los cruces
   (`?source=la-lana&sport=NFL`) se respetan a propósito. Si eso molesta, la
   salida es quitar `la-lana` de las opciones de ese tier, no revertir el 301.
2. **La escalera de archivados es invisible.** La geometría de la ronda 2 pone
   los expedientes ya leídos en `Y = 60 + |d|·10` con tope de 200px, anclados a
   `top:40%` — o sea entre y≈420 y y≈560 en una pantalla de 900px. La carpeta
   abierta ocupa de 347 a 621 y está en Z +130, así que los tapa por completo.
   Medido, no estimado. El tratamiento de "lomo" (`is-spine`, paso de 10px,
   número a 9px) está implementado y correcto, pero hoy no se ve nada: la
   lámina del cajón empieza en y≈773 y el tope de 200px nunca llega ahí. Para
   que los lomos asomen sobre el filo hace falta mover el mueble hacia arriba o
   ampliar el rango de Y — las dos son decisiones de diseño, no de código.
3. **`.btn` es la cuarta ficha rellena en `--ink-fixed`.** La regla de la ronda
   2 se aplicó a las tres fichas que nombra el diseño (`.filter-btn.active`, el
   CTA de la banda de salida, el chip de tema seleccionado). El botón primario
   tiene el mismo problema sobre `--paper` oscuro y **no** se tocó: es el
   control más usado del sitio y ampliarle la regla sin que nadie lo pida es
   más riesgo que beneficio. Vale la decisión.
