// Backfill for the property tags that are DERIVED, not judged
// (lib/taxonomy.ts REQUIRED_PROPERTY_BY_SOURCE).
//
// The sibling sweep, scripts/backfill-hub-tags.ts, is report-only and takes
// explicit ids on purpose: whether a story about an outside property IS
// coverage of it is an editorial judgment a regex cannot make. This one is the
// opposite case and that is why it is a separate script rather than a flag.
// A product tag is a fact about the row — every `source: 'infinitas'` article
// belongs on /infinitas by definition — so it can be applied in bulk, and
// leaving it to judgment is what let the tag and the source drift apart in the
// first place.
//
//   npx tsx --env-file=.env.local scripts/backfill-required-property-tags.ts
//   npx tsx --env-file=.env.local scripts/backfill-required-property-tags.ts --apply
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { articles } from '../lib/db/schema';
import { REQUIRED_PROPERTY_BY_SOURCE } from '../lib/taxonomy';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });
const apply = process.argv.includes('--apply');

async function main() {
  const rows = await db.select().from(articles);
  let missing = 0;
  let stale = 0;

  for (const [source, tag] of Object.entries(REQUIRED_PROPERTY_BY_SOURCE)) {
    const inSource = rows.filter(r => r.source === source);
    const needs = inSource.filter(r => !(r.tagsProperty || []).includes(tag));
    // The mirror case: a row tagged for the product that is no longer filed
    // under it. Reported, never auto-removed — a tag pointing at a destination
    // is a claim someone made, and unmaking it is an editorial call.
    const orphans = rows.filter(r => r.source !== source && (r.tagsProperty || []).includes(tag));

    console.log(`\n${source} → "${tag}"`);
    console.log(`  ${inSource.length} rows with source='${source}', ${needs.length} missing the tag`);
    for (const r of needs) console.log(`    + ${r.id}`);
    if (orphans.length) {
      console.log(`  ${orphans.length} row(s) carry "${tag}" but are filed elsewhere — review by hand:`);
      for (const r of orphans) console.log(`    ? ${r.id} (source=${r.source})`);
    }
    missing += needs.length;
    stale += orphans.length;

    if (apply) {
      for (const r of needs) {
        const next = [...(r.tagsProperty || []).filter(Boolean), tag];
        await db.update(articles).set({ tagsProperty: next }).where(eq(articles.id, r.id));
        console.log(`    written ${r.id} → [${next.join(', ')}]`);
      }
    }
  }

  console.log(
    `\n${apply ? 'applied' : 'dry run'}: ${missing} row(s) ${apply ? 'tagged' : 'would be tagged'}` +
      `${stale ? `, ${stale} orphan(s) left for review` : ''}`,
  );
  if (!apply && missing) console.log('re-run with --apply to write.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
