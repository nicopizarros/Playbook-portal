// Reclassifies articles under the 0-99 boleta (lib/rank.ts), 2026-08-20.
//
// SCOPE, exactly as briefed: every article published in the last three weeks
// (date >= TODAY - 21d) UNION every article still carrying the legacy 5-star
// rating, deduplicated. Measured against production the day this ran: 87 in
// the window, 41 at five stars, 31 in both, 97 unique.
//
// WHAT THIS SCRIPT DOES NOT DO: it does not decide anything. Every article's
// eleven answers were read off the article's own text and live in
// scripts/data/rank-boletas.json; this script only feeds them to
// scoreFromBoleta() and writes the result. A score can therefore never be
// hand-typed into the database, and any score can be re-derived from the
// stored answers. That is the spec's fourth promise ("se puede auditar")
// made mechanical.
//
// The legacy `priority` column is READ but never written. Dropping it is a
// separate pass, after the publisher has reviewed the before/after.
//
// Usage:
//   POSTGRES_URL=... npx tsx scripts/reclassify-rank.ts --dry-run
//   POSTGRES_URL=... npx tsx scripts/reclassify-rank.ts --apply
//
// Rollback: `update articles set score = null, confirmed = null,
// score_boleta = null;` -- nothing else was touched.

import { readFileSync } from 'node:fs';
import { sql, inArray } from 'drizzle-orm';
import { db } from '../lib/db/client';
import { articles } from '../lib/db/schema';
import { scoreFromBoleta, trackFor, type Boleta } from '../lib/rank';

const WINDOW_DAYS = 21;
const TODAY = process.env.RECLASSIFY_TODAY || '2026-08-20';
const BOLETAS_PATH = new URL('./data/rank-boletas.json', import.meta.url);

function windowStart(today: string, days: number): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

type BoletaRecord = Boleta & { id: string };

async function main() {
  const apply = process.argv.includes('--apply');
  if (!apply && !process.argv.includes('--dry-run')) {
    console.error('Refusing to run: pass --dry-run or --apply explicitly.');
    process.exit(1);
  }

  const from = windowStart(TODAY, WINDOW_DAYS);
  const records: BoletaRecord[] = JSON.parse(readFileSync(BOLETAS_PATH, 'utf8'));

  // Scope is recomputed from the database rather than trusted from the file,
  // so a row published since the boletas were written shows up as a MISSING
  // error instead of being silently skipped.
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      date: articles.date,
      source: articles.source,
      priority: articles.priority,
    })
    .from(articles)
    .where(sql`${articles.priority} = 5 or ${articles.date} >= ${from}`);

  const byId = new Map(records.map(r => [r.id, r]));
  const scoped = new Set(rows.map(r => r.id));

  const missing = rows.filter(r => !byId.has(r.id));
  const orphaned = records.filter(r => !scoped.has(r.id));
  if (missing.length || orphaned.length) {
    for (const m of missing) console.error(`MISSING boleta: ${m.id} (${m.date}, ${m.priority}star)`);
    for (const o of orphaned) console.error(`ORPHANED boleta (not in scope): ${o.id}`);
    console.error(`\nRefusing to write a partial reclassification. Every scoped article needs a boleta.`);
    process.exit(1);
  }

  const scored = rows.map(row => {
    const boleta = byId.get(row.id)!;
    const { id: _id, ...answers } = boleta;
    const breakdown = scoreFromBoleta(answers as Boleta);
    return {
      ...row,
      track: trackFor(row.source),
      kind: boleta.kind,
      ...breakdown,
      // Editorial boletas have no `confirmed` question -- an investigation is
      // not "unconfirmed", the concept does not apply. Null, not true: the
      // column must not claim an answer nobody was asked.
      confirmed: boleta.kind === 'news' ? boleta.confirmed : null,
      ambiguous: boleta.ambiguous ?? [],
      answers,
    };
  });

  // ---------------------------------------------------------------- Report
  const inWindow = (d: string) => d >= from;
  const sets = {
    both: scored.filter(a => inWindow(a.date) && a.priority === 5).length,
    windowOnly: scored.filter(a => inWindow(a.date) && a.priority !== 5).length,
    fiveStarOnly: scored.filter(a => !inWindow(a.date) && a.priority === 5).length,
  };
  console.log(`\nSCOPE  window >= ${from}  |  total ${scored.length}`);
  console.log(`  last 3 weeks only : ${sets.windowOnly}`);
  console.log(`  legacy 5-star only: ${sets.fiveStarOnly}`);
  console.log(`  both              : ${sets.both}`);

  console.log(`\nDECENA DISTRIBUTION`);
  for (let d = 9; d >= 0; d--) {
    const n = scored.filter(a => a.decena === d).length;
    if (n) console.log(`  ${d}0-${d}9  ${String(n).padStart(3)}  ${'#'.repeat(n)}`);
  }

  console.log(`\nTRACK`);
  for (const t of ['news', 'editorial'] as const) {
    const g = scored.filter(a => a.track === t);
    if (!g.length) continue;
    const avg = g.reduce((s, a) => s + a.score, 0) / g.length;
    console.log(`  ${t.padEnd(9)} ${String(g.length).padStart(3)} articles, mean ${avg.toFixed(1)}`);
  }
  const conflicts = scored.filter(a => (a.kind === 'news') !== (a.track === 'news'));
  if (conflicts.length) {
    console.log(`\nTRACK CONFLICTS (scored on one boleta, routed to the other track): ${conflicts.length}`);
    for (const c of conflicts) console.log(`  ${c.source.padEnd(16)} ${c.kind.padEnd(9)} ${c.score} ${c.id}`);
  }

  const unconfirmed = scored.filter(a => a.confirmed === false);
  console.log(`\nUNCONFIRMED (rule 03: -2 decenas AND barred from the top slot): ${unconfirmed.length}`);
  for (const a of unconfirmed) console.log(`  ${String(a.score).padStart(2)}  ${a.date}  ${a.id}`);

  const flagged = scored.filter(a => a.ambiguous.length);
  console.log(`\nAMBIGUOUS ANSWERS: ${flagged.length} articles, ${flagged.reduce((s, a) => s + a.ambiguous.length, 0)} questions`);
  const byQuestion = new Map<string, number>();
  for (const a of flagged) for (const q of a.ambiguous) byQuestion.set(q, (byQuestion.get(q) ?? 0) + 1);
  for (const [q, n] of [...byQuestion].sort((x, y) => y[1] - x[1])) console.log(`  ${String(n).padStart(3)}  ${q}`);

  console.log(`\nLEGACY 5-STAR, BEFORE -> AFTER (the group most likely to move)`);
  const five = scored.filter(a => a.priority === 5).sort((a, b) => b.score - a.score);
  for (const a of five) {
    console.log(`  5star -> ${String(a.score).padStart(2)}  ${a.date}  ${a.track === 'editorial' ? 'ED ' : '   '}${a.title.slice(0, 68)}`);
  }
  const fiveAvg = five.reduce((s, a) => s + a.score, 0) / five.length;
  console.log(`  mean ${fiveAvg.toFixed(1)}, range ${Math.min(...five.map(a => a.score))}-${Math.max(...five.map(a => a.score))}`);

  console.log(`\nFULL RANKING (raw boleta score, undecayed)`);
  for (const a of [...scored].sort((a, b) => b.score - a.score)) {
    console.log(
      `  ${String(a.score).padStart(2)}  d${a.decena}u${a.unit}  ${a.date}  ${String(a.priority)}star  ${a.confirmed === false ? 'UNCONF ' : '       '}${a.title.slice(0, 62)}`,
    );
  }

  if (!apply) {
    console.log(`\n--dry-run: nothing written.`);
    process.exit(0);
  }

  // ---------------------------------------------------------------- Write
  // One statement per article rather than a bulk CASE: 97 rows is nothing,
  // and a per-row update keeps the failure mode legible if one row rejects.
  let written = 0;
  for (const a of scored) {
    await db
      .update(articles)
      .set({
        score: a.score,
        confirmed: a.confirmed,
        scoreBoleta: {
          version: 1,
          scoredAt: TODAY,
          kind: a.kind,
          answers: a.answers,
          decena: a.decena,
          unit: a.unit,
          score: a.score,
          trace: a.trace,
          legacyPriority: a.priority,
        },
      })
      .where(inArray(articles.id, [a.id]));
    written++;
  }
  console.log(`\nWROTE ${written} rows (score, confirmed, score_boleta). Legacy priority untouched.`);

  const check = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(articles)
    .where(sql`${articles.score} is not null`);
  console.log(`VERIFY: ${check[0].n} rows now carry a score.`);
  process.exit(0);
}

main().catch(err => {
  console.error('[reclassify-rank] failed:', err);
  process.exit(1);
});
