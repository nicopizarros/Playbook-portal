# Incoherence audit — last 25 published articles

**Window:** 2026-08-17 → 2026-08-25 (25 most recent `status='published'` rows).
**Structural checks:** run over all 173 rows in the production DB.
**Run:** 2026-08-25, remote session, branch `claude/incoherent-articles-audit-cq13cr`.
**Format:** the six phases required by `.claude/playbook-editorial/_GOVERNANCE.md` §6.
**No fix was applied.** Root cause is established below; every remedy is stated as a
proposal, per the brief.

---

## Phase 1 — Audit

### 1.0 The premise, tested first

No slugs were supplied, so this took the brief's second branch: scan recent
publishing and flag likely candidates.

**No article in the window reads as nonsensical or incoherent.** Five of the
worst-scoring pieces were read end to end (`uefa-y-concacaf-negocian…`,
`arctos-compra-10-de-los-falcons…`, `kalshi-patrocina-a-los-dodgers…`,
`infantino-desafia-a-montagliani…`, `nielsen-vuelve-a-cambiar-la-medicion…`).
All are coherent, sourced, argued and on-format. There is no garbled syntax, no
non-sequitur transition, and no within-article contradiction anywhere in the 25.

Of the six failure categories in the brief, four have **zero** instances:

| Category | Instances | How it was checked |
|---|---|---|
| Hallucinated fact | 0 detectable | All 55 internal `/articulo?id=` cross-links across all 173 articles resolve to real rows. The one device carrying checkable arithmetic is arithmetically correct. External facts were not re-verified against sources — see Assumptions. |
| Non-sequitur transition | 0 | Full read of the five worst-scoring pieces |
| Garbled syntax | 0 | Corpus scan: no double-escaped entities, no stray `**`, no empty `<p>`, no broken links, no doubled words, no placeholder text |
| Duplicated/contradictory content *within* an article | 0 | Same scan |
| Misapplied dynamic device | **2 live** | Ran `applyBodyDevices()` from `lib/article-devices.ts` against every article's stored `body_html` |
| Off-voice tone / format drift | **13 of 25** | `node scripts/check-voice.mjs` |

Plus two findings the brief's categories do not cover: one **cross-article**
factual contradiction, and one same-minute duplicate publish (older than the
window).

So the honest headline is: the pipeline is not producing nonsense. It is
producing **drift**, and the machinery built to catch drift is disconnected.

### 1.1 Per-article findings

**Voice/format drift — 13 of 25 fail `check-voice.mjs`** (house rule: paragraph
2–3 sentences / 40–80 words; one antithesis per piece, no exemptions):

| Article | Median ¶ | p75 ¶ | Antítesis | Failure |
|---|---|---|---|---|
| `uefa-y-concacaf-negocian-una-nations-league-conjunta…` | 119w | 134w | **5** | Both, severe. 6 of 10 ¶ past 110w (one at 184w) |
| `infantino-desafia-a-montagliani…` | 102w | 112w | 2 | Both. 4 of 13 ¶ past 110w (one at 146w) |
| `arctos-compra-10-de-los-falcons…` | 99w | 112w | 0 | Length. 2 of 5 ¶ past 110w; median sentence 35w |
| `kalshi-patrocina-a-los-dodgers…` | 93w | 96w | 0 | Length; median sentence 33w |
| `brasil-se-declara-a-un-paso-de-superar-a-mexico…` | 91w | 107w | 1 | Length |
| `nike-cae-y-adidas-sube-en-el-ranking…` | 88w | — | 0 | Length |
| `amazon-se-queda-con-los-38-partidos…` | 88w | — | 0 | Length |
| `nielsen-vuelve-a-cambiar-la-medicion…` | 73w | 120w | 1 | p75 drift; 2 ¶ past 110w |
| `marc-stad-toma-el-control-de-los-timberwolves…` | 71w | — | **2** | Antithesis cap |
| `dos-miembros-del-consejo-de-la-fifa-rompen…` | 69w | — | **3** | Antithesis cap |
| `goodell-garantiza-equipos-de-la-nfl-fuera…` | 66w | — | **3** | Antithesis cap |
| `la-bundesliga-vence-a-viagogo…` | 66w | — | **2** | Antithesis cap |
| `fifa-probo-privatizar-su-mundial-sub-15…` | 83w | — | **3** | Antithesis cap |

Category: **off-voice tone**. Not one of these reads as incoherent — they read
as a different, longer, more rhetorical publication than the one
`voice-and-style.md` describes.

**Misapplied dynamic device — 2 live, both shipping a declared device as a bare
label in the prose:**

1. `fifa-quiere-us-4-000-millones-por-dos-mundiales-de-estados-unidos` —
   `Ecuación: 832 spots × US$300,000 por spot = US$249.6 millones` renders as
   plain text. `readingTime` 6 + `priority` 5 gives a budget of 4 and exactly 4
   devices were declared, so this is **not** budget exhaustion. It is a parser
   bug — see §2.2. The equation itself is arithmetically correct.
2. `los-enhanced-games-costaron-us-52-millones-y-facturaron-us-17-7-millones` —
   `Cotización: Enhanced Group — US$1.71 · -84% · en el año` renders as plain
   text. Budget 1 (`readingTime` 2, `priority` 2), two devices declared. This
   one is the designed graceful degradation working as intended; the editorial
   miss is declaring two devices against a budget of one.

Two further **latent** collisions, currently harmless: `El calendario:` and
`El perfil:` used as ordinary bold lead-ins in
`infantino-propone-vender-el-20-del-mundial…` and
`francisco-iturbide-asume-la-presidencia-de-liga-mx…`. Both match the device
registry's accent-tolerant `(?:El\s+|La\s+)?Perfil:` / `Calendario:` prefixes.
They fail to parse today, so they stay as prose — but a lead-in whose body
happens to parse would be silently swallowed and rendered as a chart. The prose
lead-in convention and the device prefix grammar occupy the same namespace with
nothing arbitrating.

**Cross-article contradiction (1):**

- `oceania-apoya-a-infantino-y-nueva-zelanda-rompe-filas` (08-15): *"En marzo
  votan 210 federaciones, porque Nepal está suspendida y no tiene voto."*
- `uefa-y-concacaf-negocian-una-nations-league-conjunta…` (08-21): *"la FIFA
  elige presidente con 211 votos… Ganar requiere mayoría simple, 106 votos, o
  dos tercios, 141."*

Six days after the archive established 210 eligible voters, a later piece
reverts to 211 **and derives a threshold from it**: two-thirds of 211 is 141,
of 210 it is 140. This is the closest thing in the window to a stale/hallucinated
fact, and it is exactly what `Step 1`'s "check whether Playbook already published
on the earlier step" exists to prevent.

**Duplicate publish (1, predates the window):** `industry-shots` and
`infinitas` both published the Liga Femenil BBVA relaunch at **2026-07-28
20:48**, the same minute, from two different Substack editions — the precise
case `scripts/find-duplicates.mjs` names in its own header comment. A second
pair (`Cinco hermanos Buss…` draft 08-17 / `Jeanie Buss impugna…` published
08-18) is workflow residue, not a live duplicate.

### 1.2 Which skill produced each article — **not answerable from the data**

There is no field anywhere that records the producing skill. The `source`
column is a *section*, not a producer: both SKILL.md files instruct writing
`source: "industry-shots"` for a Noticias piece
(`publish-newsletter/SKILL.md:201`, `publish-sourced-article/SKILL.md:367`).

Evidence in the window: 24 of 25 rows carry `source='industry-shots'`, yet 20 of
them have a third-party `source_url` (marca.com, nytimes.com, theguardian.com,
sportico.com, zeit.de…) and **no** `substack_url` — i.e. they are
publish-sourced-article output filed in the newsletter's bucket. Across the
whole archive, 117 `industry-shots` rows carry only 54 `substack_url`s.

Attribution below is therefore *inferred* from `substack_url` presence, not read:

| Inferred producer | Rows in window |
|---|---|
| `publish-sourced-article` (third-party `source_url`, no `substack_url`) | 24 |
| `publish-newsletter` (`substack_url` present) | 1 (`por-que-azcarraga-quiere-otro-mundial…`, La Lana) |

Note the single La Lana piece is also the **only** article in the window that
passes `check-voice.mjs` cleanly at length (55 ¶, median 23w). Every drifted
piece is inferred sourced-article output.

### 1.3 Was the `ingestion.md` fallback used? — **not answerable, and the file is gone**

`.claude/skills/publish-sourced-article/references/ingestion.md` and
`publishing-mechanics.md` **do not exist** in this checkout, in either publish
skill. `_GOVERNANCE.md` §1 names both as the legitimate skill-local files.

Git says: added by `8c2328d`, deleted by `5031b46`, restored by `6986589`
(that restore is task-observer Observation 14, ACTIONED 2026-08-13), and
**deleted again by `cf60a93` on 2026-08-18** — 118+197 lines of `ingestion.md`
and 161+144 lines of `publishing-mechanics.md`. The reconnect commit four hours
later (`540a060`) restored the eight shared symlinks but **not** these two files.
They have been missing ever since.

A narrower paywall rule now lives inline at `publish-sourced-article/SKILL.md:60-77`
(ask the human for pasted text; otherwise fall back to secondary coverage and
note the gap). The three-rung ladder, the `sourceUrl` / `Fuentes:` / run-report
rules that Observation 8 recorded as written into `ingestion.md`, and the
terminal case Observation 10 flagged as undefined, are all gone.

Whether the fallback fired on any specific article is unrecoverable: the three
pieces in the window whose *origen* is a paywalled Athletic/NYT link
(`jed-york-dueno-de-los-49ers…`, `fifa-probo-privatizar-su-mundial-sub-15…`,
`goodell-garantiza-equipos-de-la-nfl…`) carry **no transparency marker** in the
body, and their `Fuentes:` lines credit The Athletic as origen either way. The
run leaves no trace distinguishing "read the primary" from "fell back to
secondaries."

### 1.4 Did the shared reference tree resolve? — **yes on disk, no in practice**

All eight symlinks in both publish skills' `references/` resolve
(`find .claude/skills -type l ! -exec test -e {} \; -print` returns nothing).
Nothing is broken.

**But neither SKILL.md names them.** Grep of the two current SKILL.md files:

| Reference file | Named by publish-sourced-article | Named by publish-newsletter |
|---|---|---|
| `dynamic-element-library.md` | yes (3×) | no |
| `fields-and-taxonomy.md` | yes (1×) | yes (1×) |
| `voice-and-style.md` | **no** | **no** |
| `format-tiers.md` | **no** | **no** |
| `overlap-check.md` | **no** | **no** |
| `postura-editorial.md` | **no** | **no** |
| `images.md` | **no** | **no** |

Zero mentions in either file of `check-voice`, `find-duplicates`, "overlap",
"checklist", or the sensitivity protocol.

Before `cf60a93`, `publish-sourced-article/SKILL.md` was **68 lines**: a ten-step
router table where every step named its reference file — Step 0 overlap-check,
Step 2b postura-editorial, Step 3 format-tiers, Step 4 voice-and-style, Step 7
the twelve-point checklist *and* `check-voice.mjs`, Steps 8–9
publishing-mechanics. `publish-newsletter/SKILL.md` was **54 lines** with the
same shape. Today they are **520** and **434** lines of monolith.

So the answer to the brief's question is a third option it did not offer: the
symlinks did not fail to load — **nothing ever asked for them.** The corpus is
present, intact, maintained, and unreferenced. That is the same orphaning
`_GOVERNANCE.md` §1b was written about, and the same one Observation 14
recorded and closed.

### 1.5 task-observer log

Committed log (`docs/skill-observations/log.md`, 15 entries) ends at
**2026-08-13**. There is nothing covering 2026-08-14 → 2026-08-25, so no
observation flags anything in this window. The workspace log at
`~/.claude/projects/-home-user-Playbook-portal/skill-observations/` does not
exist in this container (fresh remote session).

The reason the recurrence went unlogged is itself part of the failure:
`cf60a93` deleted `.claude/skills/task-observer/` wholesale (SKILL.md, 446
lines, plus LICENSE) alongside `.claude/skills/graphify/` (10 files, ~1,589
lines). The observer was restored eight hours later by `ab6479a` — after the
commit it existed to catch had already landed.

OPEN entries that bear on this audit:

- **Obs 14** (ACTIONED 2026-08-13) — *"A commit that edits a skill's content
  must not change the skill's architecture as a side effect."* This is a
  verbatim description of what `cf60a93` did five days later.
- **Obs 10** (OPEN) — the unreachable-source ladder has no documented bottom
  rung. Moot now: the ladder itself is deleted.
- **Obs 13** (OPEN) — a regression test keyed to live data can be erased by the
  workflow it guards. `scripts/test-duplicate-detection.mjs` survives, but
  nothing invokes it or `find-duplicates.mjs` from either skill.
- **Obs 6** (OPEN) — "fetch the page, never the snippet" lived in the deleted
  `ingestion.md`.
- **Obs 12 / 15** (OPEN) — an agent's impression that a tool "didn't fire" is
  not evidence. Applied this session: the graphify guard was verified from the
  hook messages themselves (offline mode, CLI absent), not from impression.

---

## Phase 2 — Root cause

### 2.1 Primary: commit `cf60a93` re-monolithised both publish skills, and the repair was partial

`cf60a93` (2026-08-18 12:16 UTC, authored by Claude, on `main`) carries a
message about *one editorial rule* — how to read a company press release and
not use its promotional image as a cover. Its actual diff:

- deleted all 8 shared-tree symlinks from **both** publish skills' `references/`
- deleted `ingestion.md` (118 + 197 lines) and `publishing-mechanics.md`
  (161 + 144 lines)
- deleted the entire `graphify` skill (10 files, ~1,589 lines)
- deleted the entire `task-observer` skill (SKILL.md 446 lines + LICENSE)
- re-inflated `publish-newsletter/SKILL.md` by +465 lines and
  `publish-sourced-article/SKILL.md` by +508 lines

`540a060` (same day, 22:30 UTC) reconnected the symlinks and `ab6479a` restored
task-observer — but **neither restored the router text inside SKILL.md**, and
neither restored `ingestion.md` / `publishing-mechanics.md`. The links came
back; the instructions to follow them did not.

Every category in this audit falls out of that single fact:

| Symptom | Severed pointer |
|---|---|
| 13/25 fail the voice rule; nobody ran the mirror | Step 4 → `voice-and-style.md`; Step 7 → §12 checklist + `check-voice.mjs` |
| Paragraph/tier bloat concentrated in long pieces | Step 3 → `format-tiers.md` §1 |
| Same-minute cross-product duplicate; no dedupe run | Step 0 → `overlap-check.md`, `find-duplicates.mjs` |
| 211-vs-210 contradiction against the archive | Step 1's prior-coverage query, now inline prose rather than a gated step |
| "Was the fallback used?" unanswerable | `ingestion.md` + `publishing-mechanics.md` run-report rules, deleted |
| Sensitivity protocol never applied | Step 2b → `postura-editorial.md` |
| Devices are the *least* damaged area | `dynamic-element-library.md` is the one shared file still named |

That last row is the control that makes the diagnosis load-bearing: the single
shared file the monolith kept pointing at is the single area with no editorial
regression. The two device defects that do exist are code bugs, not rule loss.

Note also that Observation 14 already recorded this exact failure mode and was
marked ACTIONED. It recurred anyway, because the fix was a *restoration*, not a
*guard* — nothing in the repo makes a symlink deletion or a SKILL.md inflation
fail a check.

### 2.2 Independent code bug: `magnitudeOf()` is a relative comparator used as an absolute evaluator

`lib/article-devices.ts:1138-1157`. `SCALES` is expressed **in units of
millions** (`billones → 1_000_000`, `mil millones → 1_000`, `millones → 1`), so
`magnitudeOf("US$249.6 millones")` returns `249.6`. A figure with no scale word
is returned at face value: `magnitudeOf("US$300,000")` returns `300000`. The two
are on different units.

`parseEquation`'s self-check (line ~2247) evaluates left-to-right in those mixed
units and rejects past 3% drift. For the FIFA piece:

```
832 × 300,000 = 249,600,000   (unscaled units)
vs. result 249.6              (millions)
→ rejected as "wrong arithmetic"
```

The equation is correct; the guard is comparing dollars against millions of
dollars. Verified by bisection: identical equations pass when the result is
written `US$249,600,000` and fail with `US$249.6 millones` or `US$249.6 M`.

This is a **false negative** in a guard whose comment says "A device doing
display math that is wrong is worse than no device." The rejection is silent —
the reader gets a bare `Ecuación:` label mid-article.

Scope check: a corpus-wide scan for comparative devices (`duelo`, `serie`,
`ranking`, `reparto`, `resultados`, `cascada`, `cotizacion`, `salto`, `recibo`,
`tablero`) mixing a scale-worded figure with a large bare figure found **zero**
live instances, so no wrong chart is currently shipping. The bug is confined to
silent drops today, but the same unit confusion sits under every bar the
library draws.

### 2.3 Independent design gap: device prefixes and prose lead-ins share a namespace

`deviceTextRe()` (line 2569) makes every device label match `El `/`La ` +
label + `:`, which is also the shape of the house's bold prose lead-in. Two live
articles already collide (`El calendario:`, `El perfil:`); they survive only
because their bodies fail to parse. Nothing arbitrates between the two
conventions.

---

## Phase 3 — Restructure (**proposed, not executed**)

1. Restore the router table at the top of both SKILL.md files from `6986589`
   (68 / 54 lines), pointing every step at its reference file.
2. Relocate the genuinely new content added by `cf60a93` and its successors —
   the press-release-frame rule, the paywall-ask rule at
   `publish-sourced-article/SKILL.md:60-77`, the format-tier routing, the
   headline-length rule from `dfa3cc6` — into the corpus files that own those
   topics, per `_GOVERNANCE.md` §2. Do not re-fork them into SKILL.md.
3. Recreate `ingestion.md` and `publishing-mechanics.md` in both skills from
   `6986589`, then reconcile against what has landed inline since. This is the
   one step that needs a human read: four months of inline edits have to be
   merged, not overwritten.

## Phase 4 — Inject (**proposed, not executed**)

1. Add `sourceSkill` (or a `provenance` jsonb) to `articles`. Without it, "which
   skill produced this" stays unanswerable and this audit is not repeatable.
2. Record the ingestion outcome per article — primary read / human-pasted /
   secondary fallback — so §1.3's question has an answer next time.
3. Fix `magnitudeOf`: normalise every figure to a single absolute unit before
   the equation self-check, and add regression cases for
   `832 spots × US$300,000 por spot = US$249.6 millones` and the
   `US$249,600,000` form.
4. Reserve the device namespace: require a device paragraph to be the whole
   paragraph and item-separated, or forbid the `El `/`La ` prefix leniency, so a
   prose lead-in can never be swallowed.
5. Correct the 211/210 contradiction in
   `uefa-y-concacaf-negocian-una-nations-league-conjunta…` (211 → 210 voters,
   two-thirds 141 → 140), or state the members-vs-eligible-voters distinction
   explicitly.

## Phase 5 — Integrate / convergence check (**proposed, not executed**)

`_GOVERNANCE.md` §5's convergence check cannot pass today: it requires running
`check-voice.mjs` on drafts from both skills, and neither skill mentions the
script. Proposed:

1. A CI or pre-commit guard that fails when a commit deletes a `references/`
   symlink, deletes a sibling skill, or grows a SKILL.md past ~120 lines. This
   is the guard Observation 14 lacked, and its absence is why the same failure
   landed twice.
2. Wire `check-voice.mjs --strict` and `find-duplicates.mjs` back into Step 0 /
   Step 7 of both skills, as gates rather than mentions.
3. Then run the §5 check for real: both skills against one comparable article,
   `check-voice` on both drafts, zero divergence beyond ingestion.
4. Backfill task-observer entries for the 08-18 recurrence and for §2.2.

## Phase 6 — Accounting

**Entry-token cost — regressed 6–8×, in violation of `_GOVERNANCE.md` §5:**

| File | At `6986589` (2026-08-13) | Now (HEAD) | Change |
|---|---|---|---|
| `publish-sourced-article/SKILL.md` | 68 lines / 4,777 B | 520 lines / 30,660 B | **+6.4×** |
| `publish-newsletter/SKILL.md` | 54 lines / 3,504 B | 434 lines / 28,075 B | **+8.0×** |
| Both, combined entry cost | 8,281 B | 58,735 B | **+7.1×** |

**Corpus reachability:**

| Shared file | Bytes | Reachable from a run that follows SKILL.md |
|---|---|---|
| `dynamic-element-library.md` | 68,087 | yes (sourced-article only) |
| `voice-and-style.md` | 32,116 | **no** |
| `format-tiers.md` | 28,409 | **no** |
| `fields-and-taxonomy.md` | 13,136 | yes |
| `images.md` | 12,259 | **no** |
| `overlap-check.md` | 7,174 | **no** |
| `postura-editorial.md` | 6,384 | **no** |
| `_GOVERNANCE.md` | 3,976 | n/a (editing only) |
| **Unreachable total** | **86,342 B** | **50% of the tree** |

Deleted and never restored: `ingestion.md` (10,771 + 5,997 B),
`publishing-mechanics.md` (6,199 + 7,357 B) — **30,324 B**.

**Corpus scanned:** 173 articles total, 25 read in the window, 5 read in full,
55 internal cross-links verified, 24 device declarations re-rendered against
`lib/article-devices.ts`.

### Assumptions and limits

1. **External facts were not re-verified.** "Hallucinated fact: 0 detectable"
   means no *internally* detectable fabrication — dangling cross-links, failed
   device arithmetic, contradiction against Playbook's own archive. Confirming
   that every figure matches its cited outlet needs a fetch pass this audit did
   not run.
2. **Producing skill is inferred**, from `substack_url` presence and
   `source_url` domain, because nothing records it. §1.2's table could be wrong
   for any individual row.
3. **`check-voice.mjs` was fed `body_html` converted back to markdown**, not the
   original `bodyMarkdown`. Block structure is preserved (`</p>` → paragraph
   break) and device lines are still caught by the script's `STRUCTURAL` filter,
   but paragraph counts could differ by one or two from a draft-time run.
4. **Device rendering was reproduced, not observed.** `applyBodyDevices()` was
   run against stored HTML with each row's real `readingTime`/`priority`; the
   live site should match, but this was not confirmed against a rendered page.
5. **Timeline claims come from a fully deepened clone.** The session's initial
   checkout was shallow (53 commits, back to 2026-08-19), which is enough to
   have mis-concluded that `ingestion.md` never existed. `git fetch --unshallow`
   (471 commits) is what produced §1.3 and §2.1.
6. **No fix was applied**, per the brief. Phases 3–5 are proposals.
7. **This session's observations are session-local.** The container's
   task-observer workspace is ephemeral; the entries proposed in Phase 5.4 must
   be carried into `docs/skill-observations/log.md` by hand.
