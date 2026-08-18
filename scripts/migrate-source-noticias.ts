// One-off maintenance script, NOT wired into any deploy step.
//
// TODO #2 (executed 2026-08-14): retire the launch-era machine key
// source='industry-shots' in favor of 'noticias', so the identifier
// matches the product name readers have always seen. The same-day code
// change renamed the key across lib/constants.ts, lib/product-hubs.ts,
// lib/taxonomy.ts, the pages, the admin CMS and six stylesheets, and added
// normalizeSource() at the data boundary (lib/data/articles.ts) so
// UNMIGRATED rows keep filing under Noticias regardless of when this
// script runs.
//
// ORDERING MATTERS: run this only AFTER the code change above is deployed.
// The pre-change production build matches the literal string
// 'industry-shots', so migrating the rows first would empty /noticias and
// drop every news article off its product template until the deploy lands.
// The new code reads both keys, so with it live this script can run at any
// time.
//
// Usage:
//   POSTGRES_URL=<production> npx tsx scripts/migrate-source-noticias.ts --dry-run
//   POSTGRES_URL=<production> npx tsx scripts/migrate-source-noticias.ts
//
// Rollback (the reverse update, safe because 'noticias' had zero rows
// before this ran — verified by the pre-flight count below):
//   UPDATE articles SET source = 'industry-shots' WHERE source = 'noticias';
//   ALTER TABLE articles ALTER COLUMN source SET DEFAULT 'industry-shots';
//
// Uses Neon's HTTP driver, same reasoning as scripts/reassign-playbook-tag.ts:
// this runs from environments whose egress only permits HTTPS, not the raw
// TCP lib/db/client.ts's node-postgres Pool needs.

import { eq, sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { articles } from '../lib/db/schema';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });

const DRY_RUN = process.argv.includes('--dry-run');

async function countBySource(source: string): Promise<number> {
  const rows = await db.select({ id: articles.id }).from(articles).where(eq(articles.source, source));
  return rows.length;
}

async function main() {
  console.log(`[migrate-source-noticias] starting${DRY_RUN ? ' (dry run, no writes)' : ''}`);

  const legacyBefore = await countBySource('industry-shots');
  const canonicalBefore = await countBySource('noticias');
  console.log(`[migrate-source-noticias] before: industry-shots=${legacyBefore}, noticias=${canonicalBefore}`);

  if (canonicalBefore > 0) {
    console.log(
      `[migrate-source-noticias] note: ${canonicalBefore} rows already say 'noticias' ` +
        `(admin saves since the code change do this organically). They are left untouched.`,
    );
  }

  if (DRY_RUN || legacyBefore === 0) {
    console.log(
      `[migrate-source-noticias] done. rows ${DRY_RUN ? 'that would be' : ''} migrated: ${legacyBefore}.`,
    );
    return;
  }

  // Single set-based update (not per-row) — an interrupted loop would
  // leave the table split across both keys; one statement is atomic.
  await db
    .update(articles)
    .set({ source: 'noticias', updatedAt: new Date() })
    .where(eq(articles.source, 'industry-shots'));

  // The column default rename that lib/db/schema.ts already declares on
  // the code side.
  await db.execute(sql`ALTER TABLE articles ALTER COLUMN source SET DEFAULT 'noticias'`);

  const legacyAfter = await countBySource('industry-shots');
  const canonicalAfter = await countBySource('noticias');
  console.log(`[migrate-source-noticias] after: industry-shots=${legacyAfter}, noticias=${canonicalAfter}`);

  const expected = legacyBefore + canonicalBefore;
  if (legacyAfter !== 0 || canonicalAfter !== expected) {
    console.error(
      `[migrate-source-noticias] VERIFICATION FAILED: expected industry-shots=0, noticias=${expected}. ` +
        `See rollback SQL in the header comment.`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(`[migrate-source-noticias] verified: all ${canonicalAfter} news rows now carry 'noticias'.`);
}

main().catch(err => {
  console.error('[migrate-source-noticias] failed:', err);
  process.exitCode = 1;
});
