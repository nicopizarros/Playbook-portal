// One-off maintenance script, NOT wired into any deploy step.
//
// Why this exists: 2026-08-01, Roadmap Agosto 2026 Fase 1, item 1 ("borrar
// el tag Playbook y traspasar todos sus artículos al tag Noticias"). The
// same-day commit removed 'playbook' from KNOWN_SOURCES/SOURCE_LABELS
// (lib/constants.ts), changed the articles table's column defaults, and
// updated articles.json -- but exactly like the La Lana rebrand earlier
// this same day (see scripts/fix-lana-rebrand-content.ts), none of that
// touches rows that already exist in production Postgres. Any article with
// source='playbook' there stays that way until something explicitly
// reassigns it -- and with 'playbook' no longer a member of the `Source`
// type, those rows would render with no source-filter chip to find them
// under and no color-coded left border (the CSS rules for
// [data-source="playbook"] were deleted along with the token).
//
// Usage: POSTGRES_URL=<production> npx tsx scripts/reassign-playbook-tag.ts
// Add --dry-run to only print what would change, without writing anything.
//
// Uses Neon's HTTP driver, same reasoning as scripts/publish-newsletter.ts
// and scripts/fix-lana-rebrand-content.ts: this runs from environments
// (Claude Code sessions, CI) whose egress only permits HTTPS, not the raw
// TCP lib/db/client.ts's node-postgres Pool needs.

import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { articles } from '../lib/db/schema';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`[reassign-playbook] starting${DRY_RUN ? ' (dry run, no writes)' : ''}`);

  const stale = await db
    .select({ id: articles.id, title: articles.title, publication: articles.publication })
    .from(articles)
    .where(eq(articles.source, 'playbook'));

  console.log(`[reassign-playbook] articles with source='playbook': ${stale.length}`);
  for (const row of stale) {
    console.log(`  - ${row.id} (${row.title}): publication="${row.publication}"`);
  }

  if (DRY_RUN || !stale.length) {
    console.log(`[reassign-playbook] done. articles ${DRY_RUN ? 'would be' : ''} reassigned: ${stale.length}.`);
    return;
  }

  for (const row of stale) {
    await db
      .update(articles)
      .set({ source: 'industry-shots', publication: 'Noticias', updatedAt: new Date() })
      .where(eq(articles.id, row.id));
  }
  console.log(`[reassign-playbook] done. articles reassigned: ${stale.length}.`);
}

main()
  .catch(err => {
    console.error('[reassign-playbook] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
