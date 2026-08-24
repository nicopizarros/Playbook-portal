// Rolling-window score distribution, for the open question the 2026-08-20
// reclassification could not answer: are the nineties too frequent?
//
// The spec says the 90s should happen "unas cuantas veces al año". The first
// three-week sample produced SEVEN, but that window is not a fair test: it is
// dominated by the FIFA governance crisis, which cascades into many articles
// that each legitimately stack structural + global + México + new-development.
// One atypical window is not evidence that the decena logic is mis-tuned.
//
// So: do not retune from one sample. Measure. Run this weekly (or at any
// point) and append the line to docs/ranking-90s-log.md until there are enough
// ordinary news windows to judge against.
//
//   POSTGRES_URL=... npx tsx scripts/rank-window-stats.ts            # last 21d
//   POSTGRES_URL=... npx tsx scripts/rank-window-stats.ts 2026-08-20 # window ending on a date
//   POSTGRES_URL=... npx tsx scripts/rank-window-stats.ts --history  # every window since scoring began

import { sql } from 'drizzle-orm';
import { db } from '../lib/db/client';
import { articles } from '../lib/db/schema';

const WINDOW_DAYS = 21;

function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type Row = { date: string; score: number };

function summarise(rows: Row[], from: string, to: string) {
  const n = rows.length;
  const nineties = rows.filter(r => r.score >= 90).length;
  const bands = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(d => rows.filter(r => Math.floor(r.score / 10) === d).length);
  const mean = n ? rows.reduce((s, r) => s + r.score, 0) / n : 0;
  return { from, to, n, nineties, pct: n ? (100 * nineties) / n : 0, mean, bands };
}

async function main() {
  const arg = process.argv[2];
  const rows = (await db
    .select({ date: articles.date, score: articles.score })
    .from(articles)
    .where(sql`${articles.score} is not null`)) as Row[];

  if (!rows.length) {
    console.log('No scored articles yet.');
    process.exit(0);
  }

  const latest = rows.map(r => r.date).sort().at(-1)!;
  const earliest = rows.map(r => r.date).sort()[0];

  const windows: { from: string; to: string }[] = [];
  if (arg === '--history') {
    // Non-overlapping 3-week windows, newest first, back to the oldest scored row.
    for (let to = latest; to >= earliest; to = shift(to, -WINDOW_DAYS)) {
      windows.push({ from: shift(to, -(WINDOW_DAYS - 1)), to });
    }
  } else {
    const to = arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? arg : latest;
    windows.push({ from: shift(to, -(WINDOW_DAYS - 1)), to });
  }

  console.log(`window (21d)            n   90s   %90   mean   decena 9 8 7 6 5 4 3 2 1 0`);
  for (const w of windows) {
    const inWin = rows.filter(r => r.date >= w.from && r.date <= w.to);
    if (!inWin.length) continue;
    const s = summarise(inWin, w.from, w.to);
    console.log(
      `${s.from}..${s.to}  ${String(s.n).padStart(3)}   ${String(s.nineties).padStart(3)}  ${s.pct.toFixed(0).padStart(3)}%  ${s.mean.toFixed(1).padStart(5)}   ${s.bands.map(b => String(b).padStart(2)).join(' ')}`,
    );
  }

  console.log(
    `\nAppend the newest line to docs/ranking-90s-log.md. The judgement to make, once there are\n` +
      `several ORDINARY windows on the record: is the 90s rate stable and low, or does the decena\n` +
      `stacking (structural + global + México + new-development) put the ceiling within routine reach?`,
  );
  process.exit(0);
}

main().catch(err => {
  console.error('[rank-window-stats] failed:', err);
  process.exit(1);
});
