# Nineties frequency — rolling 3-week log

**Why this file exists.** The 0-99 boleta (`lib/rank.ts`) says the nineties
should be rare: per the spec, they "exigen un cambio estructural, de peso
global, sobre México… unas cuantas veces al año". The first reclassification
(2026-08-20, 97 articles) produced **seven**. That is not yet evidence the
decena logic is mis-tuned, because the window is not ordinary: it is dominated
by the FIFA/Infantino governance crisis, which cascades into many articles that
each legitimately stack `structural + globallyRelevant + México +
newDevelopment`. Publisher's call (2026-08-20): **change nothing yet, measure
instead.**

**How to add a line.**

```bash
POSTGRES_URL="$(grep '^POSTGRES_URL=' .env.local | cut -d= -f2- | tr -d '"')" \
  npx tsx scripts/rank-window-stats.ts
```

Run it weekly and append. The judgement to make, once several *ordinary* news
windows are on the record: is the 90s rate stable and low, or does the decena
stacking put the ceiling within routine reach?

**Reading the numbers.** Only windows marked ✅ are fair samples. A window is
fair only if every article published in it was scored. The 2026-08-20 pass
scored `last 3 weeks OR legacy 5-star`, so **anything before 2026-07-31 contains
only 5-star articles** and its 90s rate is inflated by construction — those rows
are recorded for completeness, not for comparison.

| window (21d) | n | 90s | %90 | mean | fair sample? | note |
|---|---|---|---|---|---|---|
| 2026-07-31 .. 2026-08-20 | 79 | 6 | 8% | 64.7 | ✅ | Baseline. FIFA governance crisis window — atypically newsy. |
| 2026-07-10 .. 2026-07-30 | 17 | 1 | 6% | 67.9 | ❌ | 5-star rows only; not comparable. |
| 2026-06-19 .. 2026-07-09 | 1 | 0 | 0% | 65.0 | ❌ | 5-star rows only; n=1. |

Note the baseline says **6**, not the 7 reported on 2026-08-20: the seventh
90 (`Francisco Iturbide asume la presidencia de Liga MX`, 93) is dated
2026-07-28 and falls outside a true 21-day window ending 2026-08-20. It was in
scope only because it carried a legacy 5-star rating.

## What would settle it

Three or four consecutive ✅ windows without a governance cascade. If the 90s
rate holds near 8% of published articles, the decena stacking is too generous
and the candidates to change are, in order:

1. Stop `mexico` (+2) and `regional` (+1) from stacking — currently a Mexico
   story with a named LATAM effect takes +3.
2. Cap the decena at 8 unless `confirmed && globallyRelevant && mexico`.
3. Reduce `newDevelopment` to a unit-digit question rather than a decena
   modifier, since it rewards saga coverage rather than the fact reported.

Two rows already hit the clamp at decena 10 → 9 in the first pass
(`Concacaf firma contra Infantino`, `México respalda a Infantino`), which is
the signal to watch: clamping means the scale has run out of room to express a
real difference.
