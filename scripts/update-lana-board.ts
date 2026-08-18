// Maintenance script for La Lana's masthead departures board — the
// publish-newsletter skill runs this after publishing la-lana articles to
// keep the board's curated connections current (2026-08-05 user request:
// the hub's dynamic elements must feed themselves from publish runs).
//
// Input: a JSON file with the connections a run extracted, e.g.
//   [{ "conexion": "Infantino ↔ Trump", "articleId": "la-llamada-que-expuso-a-fifa" }]
// Everything else about a row is DERIVED here from the article row, so
// the caller can't drift from the site's own logic: fecha comes from
// dateFormatted, the flight number from the case's chronological number
// (same computation as lib/product-hubs.ts's caseNumber), estado from the
// same open/archived window the stamps use, url from the article id. An
// articleId that doesn't exist (or isn't la-lana) skips with a warning
// instead of inventing a row.
//
// Merge rules (the board is a marquee, not an archive):
//   - New rows go on top. A row whose conexion matches an existing one
//     (case/whitespace/accent-insensitive) REPLACES it rather than
//     duplicating, taking the fresher article's fields.
//   - The curated list is capped at MAX_CURATED_ROWS; oldest fall off.
//     (The hub page separately caps what it displays, including the
//     auto-derived route rows.)
//
// Usage: POSTGRES_URL=<production> npx tsx scripts/update-lana-board.ts <rows.json>
// Add --dry-run to print the resulting board without writing anything.

import { readFileSync } from 'node:fs';
import { and, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { siteContent, contentRevisions, articles } from '../lib/db/schema';
import { productHubsContent, type LanaBoardRow, type ProductHubsContent } from '../lib/product-hubs-content';
import { CASE_OPEN_DAYS } from '../lib/product-hubs';

export const MAX_CURATED_ROWS = 6;

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { siteContent, contentRevisions, articles } });
const DRY_RUN = process.argv.includes('--dry-run');

type IncomingConnection = { conexion: string; articleId: string };
type CaseRow = { id: string; date: string; dateFormatted: string; featured: boolean };

function normalizeKey(conexion: string): string {
  return conexion
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Same chronology as lib/product-hubs.ts's caseNumber/caseStatus, restated
// over the minimal columns this script selects.
function buildRow(conexion: string, article: CaseRow, all: CaseRow[], now: Date): LanaBoardRow {
  const chronological = all
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id));
  const index = chronological.findIndex(a => a.id === article.id);
  const published = new Date(`${article.date}T00:00:00Z`);
  const days = (now.getTime() - published.getTime()) / 86400000;
  const abierto = article.featured || (!Number.isNaN(published.getTime()) && days <= CASE_OPEN_DAYS);
  return {
    fecha: article.dateFormatted,
    conexion: conexion.trim(),
    expediente: `EXP. ${String(index + 1).padStart(3, '0')}`,
    estado: abierto ? 'Abierto' : 'Archivado',
    url: `/articulo?id=${encodeURIComponent(article.id)}`,
  };
}

// Exported for direct testing (the neon-http driver can't reach a local
// Postgres, so the merge logic is verifiable without a Neon round-trip).
export function mergeBoardRows(existing: LanaBoardRow[], incoming: LanaBoardRow[]): LanaBoardRow[] {
  const merged = incoming.slice();
  const taken = new Set(incoming.map(r => normalizeKey(r.conexion)));
  for (const row of existing) {
    if (taken.has(normalizeKey(row.conexion))) continue;
    taken.add(normalizeKey(row.conexion));
    merged.push(row);
  }
  return merged.slice(0, MAX_CURATED_ROWS);
}

async function main() {
  const inputPath = process.argv.find(arg => arg.endsWith('.json'));
  if (!inputPath) {
    throw new Error('usage: npx tsx scripts/update-lana-board.ts <rows.json> [--dry-run]');
  }
  const incoming = JSON.parse(readFileSync(inputPath, 'utf8')) as IncomingConnection[];
  if (!Array.isArray(incoming) || incoming.some(c => !c?.conexion || !c?.articleId)) {
    throw new Error('input must be an array of { conexion, articleId }');
  }
  console.log(`[update-lana-board] starting${DRY_RUN ? ' (dry run, no writes)' : ''} — ${incoming.length} connection(s) in`);

  const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1));
  if (!row) {
    console.log('[update-lana-board] no site_content row found (id=1) -- nothing to do.');
    return;
  }
  const cases = (await db
    .select({
      id: articles.id,
      date: articles.date,
      dateFormatted: articles.dateFormatted,
      featured: articles.featured,
    })
    .from(articles)
    .where(and(eq(articles.source, 'la-lana'), eq(articles.status, 'published')))) as CaseRow[];

  const now = new Date();
  const built: LanaBoardRow[] = [];
  for (const conn of incoming) {
    const article = cases.find(c => c.id === conn.articleId);
    if (!article) {
      console.log(`  ! articleId "${conn.articleId}" is not a published la-lana article -- skipped "${conn.conexion}".`);
      continue;
    }
    built.push(buildRow(conn.conexion, article, cases, now));
  }
  if (!built.length) {
    console.log('[update-lana-board] no valid connections to add -- nothing to change.');
    return;
  }

  const data = row.data as Record<string, unknown> & { productHubs?: ProductHubsContent };
  const hubs = productHubsContent(data.productHubs);
  const nextRows = mergeBoardRows(hubs.lana.boardRows, built);

  console.log('  resulting board (curated rows, newest first):');
  nextRows.forEach(r => console.log(`    ${r.expediente || '—'}  ${r.conexion}  [${r.estado}]`));
  const dropped = hubs.lana.boardRows.length + built.length - nextRows.length;
  if (dropped > 0) console.log(`  (${dropped} row(s) merged or dropped past the cap of ${MAX_CURATED_ROWS})`);

  if (DRY_RUN) {
    console.log('[update-lana-board] done (dry run).');
    return;
  }

  const nextData = {
    ...data,
    productHubs: { ...hubs, lana: { ...hubs.lana, boardRows: nextRows } },
  };
  const [updated] = await db
    .update(siteContent)
    .set({ data: nextData, version: row.version + 1, updatedAt: new Date() })
    .where(and(eq(siteContent.id, 1), eq(siteContent.version, row.version)))
    .returning();
  if (!updated) {
    throw new Error('[update-lana-board] site_content changed under us -- re-run instead of retrying blindly.');
  }
  await db.insert(contentRevisions).values({
    siteContentVersion: updated.version,
    editorId: null,
    snapshot: nextData,
  });
  console.log('[update-lana-board] done, board updated.');
}

// Only run as a script — mergeBoardRows is also imported by tests.
if (process.argv[1] && /update-lana-board/.test(process.argv[1])) {
  main()
    .catch(err => {
      console.error('[update-lana-board] failed:', err);
      process.exitCode = 1;
    })
    .finally(() => process.exit(process.exitCode ?? 0));
}
