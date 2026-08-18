# Ranking Data Audit — Playbook Portal

**Read-only.** No ranking logic, schema, or article records were changed to produce
this report. All numbers come from a single live read of the production Neon
Postgres database (via `POSTGRES_URL`, using its HTTP SQL endpoint — the
sandbox this audit ran in has no outbound access to Postgres's wire-protocol
port 5432, only HTTPS; see **Data access** below) plus static reads of the
`nicopizarros/playbook-portal` source at commit-time of this audit (2026-08-18).

**On "the six-phase structured format we use":** no existing audit-report
template of that description was found anywhere in this repository —
`docs/ENCYCLOPEDIA.md`'s "six phases" refers to the Nov 2025→Jul 2026
static-site→Postgres migration, not a report format, and no prior
`docs/*audit*.md`/`*report*.md` file exists to pattern-match against. This
report is therefore structured around the 10 numbered sections the prompt
itself specified, plus schema reality, assumptions, and data-gap sections
front and back. Flagged here rather than silently invented. See §Assumptions.

**Snapshot instant:** all "today" / "now" figures use the DB's own clock at
pull time: `2026-08-18 17:21:50 UTC` (`SELECT now()`). Corpus at that instant:
**147 rows total — 146 `status='published'`, 1 `status='draft'`** (the draft
is excluded from every count below unless stated otherwise).

---

## Data access

Raw TCP to the Neon endpoint (port 5432) times out in this sandbox — outbound
network here is HTTPS-only through a proxy. Neon also exposes a read/write
**HTTP SQL endpoint** (`POST https://<host>/sql`, `Neon-Connection-String`
header) that the driver stack (`@neondatabase/serverless`) itself uses; it was
reachable, and every query in this audit was a plain `SELECT` issued against
it. No `INSERT`/`UPDATE`/`DELETE`/DDL was ever sent. This is worth recording
because it means the DB's own network posture (open to a bare HTTPS client
carrying the connection string, no separate read replica or audit role) is
itself a fact about this project, not an artifact of the audit method — flagged
as an observation, not something this audit changed or is recommending against.

---

## Section 1 — Schema reality check

From `lib/db/schema.ts` (Drizzle) and `drizzle/0000_rainy_harry_osborn.sql`,
confirmed directly, not from memory:

| Column | Type | Constraint | Notes |
|---|---|---|---|
| `priority` | `smallint` | `NOT NULL DEFAULT 3` | **No `CHECK` constraint at the DB level** — the 1–5 range is an application convention only, enforced nowhere in the schema or migrations (`grep priority drizzle/*.sql` → one hit, the column definition, no `CHECK`). Observed range in the live data: exactly 1–5 (min 1, max 5, no 0s or out-of-range values today), but nothing in the DB stops a 6 or a −1 from being written. |
| `featured` | `boolean` | `NOT NULL DEFAULT false` | |
| `date` | `text` | `NOT NULL` | **Format `YYYY-MM-DD`, a bare calendar date — it carries no time-of-day.** `pg_typeof(date)` → `text` (verified live). This is not a `date`/`timestamp` column; it's a string the app parses with `new Date(`${dateStr}T00:00:00Z`)` (`lib/rank.ts:29`), i.e. every article is treated as if published at exactly midnight UTC regardless of when it actually went live. |
| `source` | `text` | `NOT NULL DEFAULT 'noticias'` | See below — the raw values on file are **not** a clean fixed set. |
| — | — | — | **No `rankScore` column exists.** The score is computed at read time only (`lib/rank.ts:41`), never persisted, never indexed. |

**Does the publication timestamp carry time of day, or only a date?**
Only a date. `date` is `text`, `YYYY-MM-DD`, no time component, and the ranking
code treats every article as landing at UTC midnight on that date. The table
*does* also carry `created_at`/`updated_at` (`timestamp with time zone`, real
UTC instants), but those are DB-row bookkeeping (last write time), not a
publication instant the ranking algorithm reads.

**Is there a secondary sort column today?** No. The only indexes on `articles`
are `articles_date_idx`, `articles_source_idx`, `articles_author_idx`, and a
unique index on `source_url` (dedup key for the webhook) — none of them is a
manual-order/priority column, and no such column exists in the schema at all.

**What is the actual fallback order when `rankScore` ties?** Three layers, in
order:
1. `rankScore` descending (`lib/rank.ts:41`, `priority × 1.5 − daysSince`).
2. If `rankScore` ties exactly: publication `date` string, descending
   (`lib/rank.ts:53`, plain `localeCompare`).
3. **If `date` also ties** (same day, same priority — the common case, see
   §4): whatever order the array was already in survives, because
   `Array.prototype.sort` in V8/Node is stable. That pre-sort order traces
   back to `lib/data/articles.ts:58` — `db.select(LIST_COLUMNS).from(articles).where(eq(articles.status, 'published'))`
   — **with no `.orderBy()` clause at all.** Postgres makes no ordering
   guarantee for a `SELECT` with no `ORDER BY`; in practice, for a small
   table with no recent bulk rewrite, this is usually close to physical/heap
   order, but it is not guaranteed by anything in the SQL standard or by
   Postgres's docs, and can silently change after a `VACUUM FULL`, an
   `UPDATE` that relocates a row, or a different query plan. **This audit
   could not retrieve the true "SQL return order"** (there's no way to ask
   Postgres for it after the fact); `created_at` ascending was used as the
   best available proxy for "insertion order" everywhere below this needed
   it — see §Assumptions.

**Does the DB store UTC?** `created_at`/`updated_at` are `timestamptz`,
session `current_setting('TIMEZONE')` = `GMT`, `SELECT now()` returned
`2026-08-18 17:21:50.47+00` — yes, real timestamps are stored and read as
UTC. `date`, again, is not a real timestamp at all, so "convert `date` to
America/Mexico_City" is a no-op: there is no time-of-day to convert *from*.
Every day-bucketing in this report (§2, §3, §4, `daily.csv`) uses the bare
`date` string directly, because that's genuinely all the column has, and
because doing so exactly matches what `lib/rank.ts`'s own `daysSince()` does.

**`source` is not a clean fixed set.** Raw values currently on file, all
published rows:

| raw `source` | count | status |
|---|---|---|
| `industry-shots` | 97 (66.4%) | legacy key; `LEGACY_SOURCE_ALIASES` (`lib/constants.ts`) maps it to `noticias` at read time via `normalizeSource()` |
| `infinitas` | 18 (12.3%) | in `KNOWN_SOURCES` |
| `futbol-business-review` | 14 (9.6%) | **in neither `KNOWN_SOURCES` nor `LEGACY_SOURCE_ALIASES`** — see below |
| `noticias` | 9 (6.2%) | in `KNOWN_SOURCES`, already-migrated key |
| `la-lana` | 9 (6.2%) | in `KNOWN_SOURCES` |
| `opinion` | 0 | in `KNOWN_SOURCES`, currently unused — zero published rows |

`futbol-business-review` (The Futbol Business Review, a real product hub per
`docs/ENCYCLOPEDIA.md`) is passed through `normalizeSource()` unchanged
(it's a no-op for any key not in `LEGACY_SOURCE_ALIASES`) and, because
`NewsGrid`'s pool is "everything except `source === 'opinion'`" rather than
"everything in `KNOWN_SOURCES'`, its 14 articles **do** compete for the
homepage 1+5 and the archive. But they have no filter chip on `/archivo`
(`FILTER_TIERS` in `archivo/page.tsx` iterates `KNOWN_SOURCES` only) and no
label in `SOURCE_LABELS`. This is a real, verifiable gap in the source
taxonomy, not a hypothesis — flagged because any ranking redesign that
iterates `KNOWN_SOURCES` to decide what competes needs to either add this key
or explicitly decide TFBR is out of scope.

---

## Section 2 — Priority distribution and drift

All-time N=146, last-90-days N=130, last-30-days N=97 (windows relative to
the audit's "today", 2026-08-18, inclusive of day 0/day 30/day 90).

| priority | all-time | last 90d | last 30d |
|---|---|---|---|
| 1 | 3/146 (2.1%) | 3/130 (2.3%) | 0/97 (0.0%) |
| 2 | 13/146 (8.9%) | 13/130 (10.0%) | 7/97 (7.2%) |
| 3 | 46/146 (31.5%) | 36/130 (27.7%) | 26/97 (26.8%) |
| 4 | 47/146 (32.2%) | 41/130 (31.5%) | 32/97 (33.0%) |
| 5 | 37/146 (25.3%) | 37/130 (28.5%) | 32/97 (33.0%) |
| **4+5 combined** | **84/146 (57.5%)** | **78/130 (60.0%)** | **64/97 (66.0%)** |

**The share of 4s and 5s is rising, and it is not subtle.** By calendar
month (all published articles, all-time):

| month | N | priority 4+5 | share |
|---|---|---|---|
| 2025-11 | 1 | 0 | 0.0% |
| 2025-12 | 3 | 1 | 33.3% |
| 2026-01 | 3 | 1 | 33.3% |
| 2026-02 | 2 | 0 | 0.0% |
| 2026-03 | 1 | 0 | 0.0% |
| 2026-04 | 3 | 2 | 66.7% |
| 2026-05 | 4 | 2 | 50.0% |
| 2026-06 | 5 | 1 | 20.0% |
| 2026-07 | 60 | 28 | 46.7% |
| **2026-08** | **64** | **49** | **76.6%** |

**Caveat that changes how to read every "all-time" number in this report:**
2025-11 through 2026-06 total **19 articles** — 13.0% of the whole corpus —
against **124 articles (85.0%)** published in July+August 2026 alone. Per
`docs/ENCYCLOPEDIA.md` §2, the Next.js/Postgres site went live 2026-07-20 to
07-22; the pre-migration dates are backfilled/legacy content, not a period
this ranking algorithm (or this site) was actually live for. **"All-time" in
this corpus is functionally "the last ~7 weeks plus a long, thin backfilled
tail"** — treat the monthly table above, not the all-time column, as the
real drift signal.

**Is priority 3 a live grade or a legacy artifact?** Live, not legacy — it is
NOT concentrated in the old backfilled months. 22 of the 46 priority-3
articles (47.8%) were published in 2026-07 or 2026-08 alone, and priority 3
remains the single largest bucket in the last-90d window (36/130, 27.7%).
It is losing *relative* share to 4/5 (31.5% all-time → 26.8% last-30d) but
it is being actively assigned today, not just inherited from backfill.

---

## Section 3 — Publication volume

Published articles per calendar day, over the 51 distinct days that have
≥1 published article (date range 2025-11-26 → 2026-08-17, 265 calendar days
— today, 2026-08-18, has 0 published articles yet at the pull instant):

| stat | value |
|---|---|
| mean | 2.86 |
| median | 1 |
| p90 | 6 |
| max | 11 |
| days with >6 articles | 5/51 (9.8%) |
| distinct days with ≥1 article | 51/265 (19.2%) of the full date range |
| zero-article days, full range | 214/265 (80.8%) |
| zero-article days, last 90d only | 55/90 (61.1%) |
| zero-article days, last 30d only | **8/30 (26.7%)** |

**Sorting problem or capacity problem?** Both, but the *recent* signal (which
is the one that matters for a redesign) leans capacity. The full-range
zero-day rate (80.8%) is dominated by the thin 2025-11→2026-06 backfill tail
and overstates emptiness; the last-30-day rate (26.7% zero days, 73.3% of
days carrying ≥1 article, several days carrying 6–11) is the live cadence.
5 days ever exceeded 6 articles — the exact size of the homepage 1+5 — so on
those 5 days the 1+5 was mathematically incapable of showing everything
published that day even before ranking logic entered into it, which is a
capacity ceiling, not a sorting defect. The 92/146 (63.0%, see §4) rate of
same-day/same-priority collisions is the sorting-side symptom sitting on top
of that same capacity pressure.

---

## Section 4 — Tie analysis

**Same-priority collisions per publication day:** 21/51 published days
(41.2%) have ≥2 articles sharing a priority level; **92/146 articles (63.0%)**
belong to such a same-day/same-priority group.

**Exact `rankScore` collisions, corpus-wide, snapshot at audit time**
(computed with exact rational arithmetic — `Fraction`, not floats, so this is
not a rounding artifact): **99/146 articles (67.8%)**, in **35 distinct
collision groups**, share their exact `rankScore` with at least one other
article right now. 28 of those 35 groups are the same-day/same-priority case
already counted above; **7 groups are genuine cross-date, cross-priority
numeric coincidences** of the formula itself — e.g. a priority-4 article from
2026-07-30 and a priority-2 article from 2026-08-02 landing on the identical
score (`4×1.5 − 19 = −13` and `2×1.5 − 16 = −13`, evaluated as of the audit
instant). This is `rankScore`'s "priority buys days" design working exactly
as commented in `lib/rank.ts:21-26` — it is not a bug, but it does mean the
tiebreak chain (date, then array order) fires more often than "same day"
alone would suggest.

**How many articles have ever had their position decided by insertion order
rather than by score?** Answered by replaying every day of the §5 backtest
(below) and checking, per day, whether any exact `(rankScore, date)` tie
group straddled the boundary between the last admitted top-6 slot and the
first excluded one — i.e. cases where score and date both failed to
distinguish two articles and only their position in the pre-sort array
(`created_at` order, this audit's proxy for insertion order — see
§Assumptions) decided which one made the cut:

- **40 distinct articles, 64 article-days**, were ever on one side of that
  boundary purely by insertion-order tiebreak.
- **24 of those 40 articles** were pushed **out** of the top 6 on at least
  one day by that tiebreak (i.e. would have shown, on score+date alone, but
  lost a coin-flip-equivalent ordering decision to another article).

---

## Section 5 — Homepage residency backtest

Replayed `rankScore = priority × 1.5 − daysSince` (the exact `lib/rank.ts`
logic — `rankArticles`/`selectHero`/`featuredBoost`, ported line-for-line to
Python, `dayWeight` default `1.5`) once per calendar day from **2025-11-26
through 2026-08-18 (266 days)**, reconstructing the homepage 1+5 exactly as
`NewsGrid.tsx` builds it: pool = published articles with `date ≤ that day`
and (`source ≠ 'opinion'` OR `featured`), hero via `selectHero`, list = top 5
of `rankArticles(pool)` excluding the hero object.

**Caveat on "since launch":** this is a **counterfactual** replay, not a true
historical reconstruction, for two reasons. First, the pre-2026-07-20 dates
are backfilled (§2) — the old static site had entirely different code, so no
visitor ever actually saw this algorithm's output on those days. Second, an
article's `date ≤ day` visibility assumption (this audit's necessary proxy
for "was this live yet") is not the same as its real `created_at` — a
backfilled article's DB row may have been inserted in July 2026 even though
its `date` says November 2025, which the live system would not have ranked
that way in real time. Both are stated as assumptions, not hidden.

**Headline metric — articles that never once reached the top 6:**

| priority | never reached top 6 | share |
|---|---|---|
| 1 | 0/3 | 0.0% |
| 2 | 10/13 | **76.9%** |
| 3 | 18/46 | 39.1% |
| 4 | 5/47 | 10.6% |
| 5 | 0/37 | 0.0% |
| **all** | **33/146** | **22.6%** |

Priority 5 and priority 1 both hit 0% — priority 5 because the formula all
but guarantees it a top-6 slot on publication day (5×1.5=7.5 days of
headroom), priority 1 trivially because there are only 3 of them and none
collided with a crowded day. The real "never seen" population is
concentrated in priority 2 (over three-quarters of them, though N=13 is
small — see caveat below) and, in absolute terms, priority 3 (18 articles,
the largest never-seen count of any tier).

*(`articles.csv` carries `ever_top6_current_formula`, `days_in_top6_current_formula`,
`first_top6_date_current_formula`, and `days_publish_to_first_top6_current_formula`
per article for re-slicing.)*

---

## Section 6 — Layout tier frequency

**`/noticias`** (`app/(public)/noticias/page.tsx`) draws only from
`source === 'noticias'` (105 published articles under the normalized key).
The first article by date is rendered as a standalone "última edición" hero,
**outside** `tierFor` entirely — it is a fourth shape not counted below. Of
the remaining 104:

| tier | shape | count | share |
|---|---|---|---|
| `lg` (priority ≥5) | full-width feature band | 26 | 25.0% |
| `md` (priority ≥4) | two-up card | 35 | 33.7% |
| `sm` (rest) | quick/list row | 43 | 41.3% |

**`/archivo`** (`app/(public)/archivo/page.tsx`) uses a *different*,
recency-decayed `tierFor` (`ARCHIVE_TIER_DAY_WEIGHT=30`, "1★ ≈ 1 month," not
`/noticias`'s raw-priority one), applied only to the **archive pool** — the
full corpus minus whatever the homepage 1+5 currently shows (140 articles
today). Snapshotted at the audit instant:

| tier | count | share |
|---|---|---|
| 5 | 19 | 13.6% |
| 4 | 36 | 25.7% |
| 3 | 26 | 18.6% |
| 2 | 27 | 19.3% |
| 1 | 32 | 22.9% |

**Important mismatch with the prompt's own framing:** the prompt asked for
"full-width band / two-up card / list row" as if both pages shared one
3-shape model. They don't. `/archivo`'s render code
(`groupRiver`/`CARDS_PER_ROW=4`) is a genuine river with a 4-column grid —
tier-5 is `ArchiveFeatureRow` (full-width, matches), tier-1/2 is
`ArchiveLineRow` (list row, matches), but tier-3/4 is `ArchiveGridCard` in
clusters of **1 to 4 cards per row** after the merge/tiling passes, not a
fixed pair. Collapsing tiers 3+4 into one bucket for comparability with
`/noticias`'s "two-up": **62/140 (44.3%)** grid cards, **59/140 (42.1%)**
line rows, **19/140 (13.6%)** full-width — reported this way, but flagged
that "two-up" is not literally what `/archivo` renders.

**Full-width rate per week, last 90 days:**
- `/noticias` `lg` (priority ≥5, static — no recency decay): **27 published
  in the last 90 days ÷ 12.9 weeks = 2.10/week.**
- `/archivo` tier-5: this is recency-decayed, so "rate" needs a different
  read. A weekly *stock* snapshot (how many tier-5 articles sit in the
  archive pool at once) over the last 13 weeks: **[19, 14, 9, 5, 4, 2, 0, 0,
  0, 0, 0, 0, 0]**, average **4.08**. The trend line is the real finding:
  tier-5 status decays to zero within **6–7 weeks** of the snapshot instant
  — nothing in this corpus has ever stayed "full-width-worthy" by recency
  alone past ~day 45–52 of its life. This is a stock, not an admission-rate
  flow; a true "how often does a *new* article first earn tier-5" number
  would need per-article first-tier-5-date tracking, which this audit did
  not build (out of scope for the time available — flagged in §Data gaps).

---

## Section 7 — Engagement correlation

**Could not be retrieved. Both data sources are unconfigured in this
environment**, checked directly rather than assumed:

- GA4 (`lib/ga4.ts`): `isConfigured()` requires `GA4_PROPERTY_ID`,
  `GA4_SERVICE_ACCOUNT_EMAIL`, and `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` — **none
  of the three are set** in this session's environment (`env | grep -i GA4`
  returns nothing).
- Vercel Analytics (`lib/vercel-analytics.ts`): requires `VERCEL_PROJECT_ID`
  and `VERCEL_ANALYTICS_TOKEN` — **neither is set.**

Per the task's own rule ("if a number cannot be obtained, say so and say
why — do not estimate, interpolate, or fill gaps"), no pageview, visitor, or
engagement-by-priority number appears anywhere in this report. This is not a
"data too sparse" case (§7's fallback instruction) — it's zero access, full
stop, from this environment. A future run with those four env vars present
(likely available in the actual Vercel deployment, per
`docs/archive/HANDOFF.md`'s 2026-08 entries on this exact configuration gap)
could complete this section using the same `lib/ga4-analytics.ts`/
`lib/vercel-analytics.ts` call shapes already in the codebase.

---

## Section 8 — Proposed matrix backfill

**Scoring rubric — this audit's own proposal, not something the task
specified.** The prompt defined the two axes and eight binary modifiers
categorically but gave no point values, and asked for a decade mapping
"assuming the cell maps to a decade" — so a transparent rubric was designed
here for backfill purposes only. Treat every number in this section as
downstream of this rubric, not as a fact about the corpus independent of it:

| Axis A (proximity) | pts | Axis B (magnitude) | pts |
|---|---|---|---|
| Mexico-specific | 40 | Structural/regulatory/ownership | 40 |
| LATAM regional | 30 | Transaction with disclosed figures | 30 |
| Intl. w/ named LATAM effect | 20 | Commercial move, no figures | 15 |
| Intl., no LATAM link | 5 | Update/context on known story | 5 |

Base score = Axis A + Axis B (range 10–80). Modifiers, additive, applied on
top: exclusive/first +8 · hard figure disclosed +6 · names a regular entity
+4 · continues a thread +3 · chart-worthy data +5 · affects >1 market +5 ·
proprietary analysis +6 · unconfirmed/rumor **−15**. Total clipped to [0,99];
`decade = total ÷ 10` (integer division, 0–9).

**Detection method per field** (both are in `articles.csv`, distinguishable
by a `_method` column on every field):

| field | method | how |
|---|---|---|
| hard figure disclosed | **detected** | `lib/figures.ts`'s own `FIGURE_INLINE_RE`, applied verbatim to title+excerpt+teaser+body text |
| chart-worthy data present | **detected** | regex over the 16 device-syntax markers in `lib/article-devices.ts` (`Tablero:`, `Cascada:`, `Ranking:`, `Cifra clave:`, etc.) found in `body_html` |
| names a regularly-covered entity | **detected** | the 115-name brand registry in `lib/brand-colors.ts` — **substitution flagged**: the prompt said "entity list from the tag taxonomy," but `lib/taxonomy.ts` has no entity list at all (only scope/sport/vertical tag *categories*). `brand-colors.ts`'s registry of clubs/leagues/brands with dedicated colour treatment is the nearest real, deterministic entity list this codebase has, used in its place. |
| proximity (Axis A), magnitude (Axis B), exclusive/first, continues thread, proprietary analysis, unconfirmed/rumor, affects >1 market | **judged** | LLM classification per article from title+excerpt+teaser+first ~600 chars of body text+existing tags, batched 15/article-batch across 10 independent passes; each row carries a one-sentence `_why` |

**Deterministic detection rates:** hard figure disclosed 92/146 (63.0%) ·
chart-worthy data 58/146 (39.7%) · names a covered entity 118/146 (80.8%).

**Judged rates:** exclusive/first-to-report **0/146 (0.0%)** — Playbook's
copy never makes this claim in-text, at least not in the title/excerpt/teaser
/opening paragraph the classifier saw · continues existing thread 11/146
(7.5%) · proprietary analysis 42/146 (28.8%) · unconfirmed/rumor 5/146
(3.4%) · affects multiple markets 41/146 (28.1%).

**4×4 matrix (Axis A × Axis B), cell counts:**

| | Structural | Transaction+fig. | Commercial, no fig. | Update/context | row total |
|---|---|---|---|---|---|
| **Mexico** | 8 | 1 | 5 | 20 | 34 (23.3%) |
| **LATAM regional** | 2 | 0 | 1 | 0 | 3 (2.1%) |
| **Intl. + LATAM effect** | 5 | 3 | 3 | 12 | 23 (15.8%) |
| **Intl., no LATAM** | 19 | 21 | 19 | 27 | 86 (58.9%) |
| **col. total** | 34 (23.3%) | 25 (17.1%) | 28 (19.2%) | 59 (40.4%) | 146 |

The single largest cell is Mexico × Update/context (20 articles, 13.7% of
the corpus) — a Mexico-specific angle on an already-known story is the modal
content type, not a fresh structural or transactional one. Intl./no-LATAM
dominates the corpus overall (58.9%), consistent with Playbook's stated remit
covering global sports business generally, not exclusively Mexico/LATAM
stories.

**Decade distribution** (full per-article score, base + modifiers):

| decade | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| count | 0 | 5 | 31 | 20 | 17 | 33 | 18 | 11 | 4 | 7 |
| share | 0.0% | 3.4% | 21.2% | 13.7% | 11.6% | 22.6% | 12.3% | 7.5% | 2.7% | 4.8% |

For reference, the **base-only** distribution (pure 4×4 cell, no modifiers —
what "the cell maps to a decade" means most literally): decades cluster
lower and never reach 9 at all (max base = 80 = decade 8): 1→27 (18.5%),
2→31 (21.2%), 3→24 (16.4%), 4→**40 (27.4%, the largest single bucket)**,
5→8, 6→5, 7→3, 8→8, 9→0. Modifiers are what pushes 11 articles (7.5%) into
decades 8–9 at all.

---

## Section 9 — Counterfactual simulation

Replayed the exact §5 backtest engine, swapping only the score function to
`score = points × 0.13 − daysSince` (`points` = the §8 total, per article),
keeping `selectHero`/`featuredBoost` mechanics unchanged (the prompt did not
ask to change those, only the base score).

| metric | value |
|---|---|
| days where top-6 composition differs from the current formula | **37/266 (13.9%)** |
| articles that never reach top-6, current formula | 33/146 (22.6%) |
| articles that never reach top-6, counterfactual formula | **50/146 (34.2%)** |
| of the 33 previously-never-seen, how many now surface | **7/33 (21.2%)** |
| any article >14 days old ever outranks a same-day article, at w=0.13 | **NO — zero violations** |

**The "must come back zero" check passed, with room to spare.** Checked
exhaustively across all 266 backtest days (every same-day/older-than-14-days
pair actually co-present on each day), not just the theoretical worst case.
The exact breakeven weight — the smallest `w` at which *any* real pair in
this corpus would flip — is **w ≈ 0.2083**, found at the pair
`fox-sports-mexico-pierde-a-izzi-y-sky-y-tambien-el-nombre` (93 points, age
15 days) vs. `liv-golf-cancela-su-ultima-fecha-y-acumula-proveedores-sin-cobrar`
(21 points, age 0 days) on 2026-08-17. At the proposed `w=0.13`, that leaves
**0.078 of headroom** before the rule would start breaking — real margin,
not a coincidence of rounding.

**The formula is not a wash — it concentrates attention harder, not
softer.** This is the counterintuitive finding worth flagging explicitly:
despite letting 7 previously-buried articles surface, the counterfactual
formula pushes the *total* never-seen count from 33 up to 50 (+17 net). The
0–99 point scale spreads articles out far more than the 1–5 priority scale
did (a 1-point gap at the bottom of the scale is nothing compared to an
84-point gap at the top), so mid-tier articles that used to eke into the top
6 on a slow day now get buried under whichever high-point article happens to
be within its freshness window. A wider scoring range does not automatically
mean more articles get seen — here it means fewer do, just a different 50.

---

## Section 10 — What the data says about three open decisions

**1. How many of the ten decades should be reserved for stories currently
graded 4 or 5?**

Evidence points to **4 of the 10 (decades 6–9), not 5 or more.** The
correlation between today's `priority` and the §8 score is only moderate
(Pearson r = 0.43 across the full corpus) — priority and the new axes
measure related but genuinely different things, so there is no clean
one-to-one mapping. But the correlation is strongest exactly at the top of
the new scale: decade ≥6 is 90.0% priority-4/5 (36/40), decade ≥7 is 95.5%
(21/22), decade ≥5 drops to 79.5% (58/73) — a real elbow between decades 5
and 6. Reserving decades 6–9 for "what used to be graded 4/5" keeps the
false-positive rate (old-3-or-below articles admitted) under 10%, while
decade 5 alone would import a meaningfully larger share of old-3s (20.5%).
This does **not** mean 4/10 of the *corpus* should be 4/5-equivalent — under
this rubric only 40/146 (27.4%) of articles actually land in decades 6–9
today, well below the current (drifted) 57.5–76.6% priority-4/5 share in
§2 — which is itself evidence that today's priority grading has drifted
upward relative to a more differentiated scale, not that the new scale is
miscalibrated.

**2. How rare should a full-width band be, expressed as a target rate per
week?**

The two existing full-width mechanisms disagree by roughly **7×**, and that
gap is itself the finding. `/noticias` currently ships one every **2.10/week**
(27 in the last 90 days) — a raw-priority gate, no decay, no scarcity by
design. `/archivo`'s recency-decayed tier-5 behaves completely differently:
its own weekly stock trend (§6: 19→14→9→5→4→2→0…) shows tier-5 status
decaying to zero within 6–7 weeks of any snapshot, meaning across a longer
window it self-rations far below 2/week. If the proposed decade scheme's
top band (decades 8–9, 11/146 articles = 7.5% of the corpus, all-time) were
the new full-width gate, and those 11 articles were spread evenly across the
~38-week span the corpus covers, that is **≈0.29/week** — an order of
magnitude rarer than `/noticias` today. **Recommendation: target
0.5–1/week**, roughly midway between `/archivo`'s natural decay-driven
scarcity and a level still frequent enough to matter editorially; **2/week
(the `/noticias` status quo) is too loose** for a mechanism meant to signal
genuine rarity, and events on the highest-volume days shown in §3 (up to 11
articles/day) already prove there's no shortage of `/noticias`-tier-5
candidates competing for that slot on a normal day.

**3. Should the 125 existing articles be re-scored, formula-mapped, or left
alone?**

*(Note: the live count is 146, not 125 — flagged as a discrepancy between
the prompt's assumption and the current DB, not corrected silently.)*

**Re-scored, not formula-mapped, and not left alone.** The r=0.43
correlation between `priority` and the new score is the direct evidence: a
cheap `priority → decade` lookup table would misfile a meaningful share of
the corpus in both directions — e.g. 4/40 articles (10%) in the "high
decade" band (≥6) are priority ≤3 today, and conversely a large share of
priority-4/5 articles land in the corpus's middle decades (2–4) rather than
the top. Formula-mapping would silently promote and bury the wrong
articles. At the same time, "leave alone" isn't viable either — priority
alone cannot express the axes this redesign is being built around (a
Mexico-specific commercial update and an international structural deal both
already sit at whatever priority an editor assigned, no distinguishing
signal survives the collapse to one 1–5 number). Given the corpus is small
enough that this audit's own 10-batch LLM classification pass covered all
146 articles in under 4 minutes of wall-clock time (parallelized), a full
re-score against the actual proposed axes — ideally by an editor validating
or correcting this audit's `judged` fields in `articles.csv` rather than
starting from zero — is the practical, evidence-backed path, not a
from-scratch manual pass.

---

## Assumptions

Listed exhaustively, in the order they matter to the numbers above:

1. **"Insertion order" proxy.** The live `getAllArticles()` query has no
   `ORDER BY` (§1), so there is no way to retrieve the true row-return order
   after the fact. `created_at` ascending was used everywhere this audit
   needed a stable base order (§4's insertion-order-tiebreak detection, §5/§9's
   backtest pool ordering). This is a reasonable proxy, not a verified fact.
2. **"Launch" date for the §5/§9 backtests** was taken as 2026-07-20 (the
   start of the Next.js/Postgres migration window per
   `docs/ENCYCLOPEDIA.md` §2), used only to frame the caveat about
   backfilled pre-migration dates — the backtest itself still runs the full
   2025-11-26→2026-08-18 range rather than truncating, so the reader can see
   both.
3. **Article visibility in the backtest** = `date ≤ simulated day`. This
   is the only visibility signal the schema offers (no real "went live at"
   timestamp separate from the editorial `date`); for backfilled/migrated
   rows this does not necessarily match when the row actually existed in
   this database (§5's full caveat).
4. **"Today"** = the DB's own clock at pull time, 2026-08-18 (UTC date);
   all window/day-bucketing (§2, §3, §6, §9) is relative to this instant, not
   to whenever this report is read.
5. **Entity list substitution (§8).** The prompt specified "entity list
   from the tag taxonomy"; `lib/taxonomy.ts` has no entity list (only
   scope/sport/vertical *tag categories*). `lib/brand-colors.ts`'s 115-name
   club/league/brand registry was used instead, as the nearest real
   deterministic list in the codebase, and is flagged as a substitution, not
   presented as what the prompt asked for.
6. **§8 scoring rubric** (point values per axis level and modifier) is this
   audit's own design, not specified by the prompt — see §8's full framing.
   Every downstream §8/§9/§10 number inherits this choice.
7. **Judged fields (§8)** come from an LLM reading title + excerpt + teaser +
   first ~600 characters of body text + existing tags per article — not the
   full article body (to keep the classification batches a manageable size).
   A classifier with the full body available might call a small number of
   these differently, particularly `continues_thread` and
   `proprietary_analysis`, which are more likely to be established later in
   a piece than in its opening paragraph.
8. **`/archivo` full-width "rate," §6.** Reported as a weekly *stock*
   snapshot (how many tier-5 articles exist at once), not an admission
   *flow* (how often a new article first reaches tier-5) — building the
   latter needs per-article first-tier-5-date tracking this audit did not
   construct. Flagged, not silently substituted.
9. **§9's "0.13" weight and the rest of the counterfactual mechanics**
   (keeping `selectHero`/`featuredBoost` unchanged, pool definition
   identical to §5) follow the prompt's literal formula and the current
   `NewsGrid` pool definition exactly; no other counterfactual variant was
   tried.

## Data this audit could not retrieve

- **All of §7** (GA4 pageviews, Vercel Analytics pageviews, engagement by
  priority, top-6-vs-never-top-6 comparison) — no GA4 or Vercel Analytics
  credentials are present in this session's environment. See §7 for the
  exact env vars checked.
- **The true SQL row-return order** underlying the innermost tiebreak layer
  in §1/§4 — Postgres gives no ordering guarantee for a query with no
  `ORDER BY`, and there is no way to query for "what order did that past
  query return rows in." `created_at` was used as a documented proxy (see
  Assumption 1).
- **A true `/archivo` tier-5 admission-*rate*** (as opposed to the stock
  snapshot reported in §6) — would need per-article first-tier-5-date
  tracking not built in this pass.
- **Whether the pre-migration (2025-11 to 2026-06) article dates reflect
  real original publication dates or a backfill convenience date** — nothing
  in the schema or the code distinguishes these, and no separate "original
  publication" field exists to check against.
