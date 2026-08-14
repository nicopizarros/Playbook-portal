// TODO #1 (news classification), archive half — the publish-time half is
// the validateTags() gate in lib/taxonomy.ts, wired into
// scripts/publish-newsletter.ts, app/api/update-articles/route.ts and
// lib/actions/admin.ts.
//
// Audits every row's tags against the controlled vocabulary:
//   - CANONICALIZABLE: folds to a real option (case/accents/whitespace) —
//     `--fix` rewrites these, and only these.
//   - OUT OF VOCABULARY: reported with the nearest option; never auto-fixed
//     (deciding what a story is about is editorial, not mechanical).
//   - EMPTY TIERS: reported as informational — a row with no vertical is
//     invisible to that filter axis.
//
// Usage:
//   POSTGRES_URL=<db> npx tsx scripts/audit-taxonomy.ts          # report only
//   POSTGRES_URL=<db> npx tsx scripts/audit-taxonomy.ts --fix    # canonicalize
//
// Neon HTTP driver, same reasoning as the sibling scripts.

import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { articles } from '../lib/db/schema';
import { canonicalizeTag, type TaxonomyTier } from '../lib/taxonomy';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });
const FIX = process.argv.includes('--fix');

const TIER_COLUMNS: Record<TaxonomyTier, 'tagsScope' | 'tagsSport' | 'tagsVertical'> = {
  scope: 'tagsScope',
  sport: 'tagsSport',
  vertical: 'tagsVertical',
};

async function main() {
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      tagsScope: articles.tagsScope,
      tagsSport: articles.tagsSport,
      tagsVertical: articles.tagsVertical,
    })
    .from(articles);

  let outOfVocab = 0;
  let canonicalizable = 0;
  let emptyTiers = 0;
  let fixed = 0;

  for (const row of rows) {
    const updates: Partial<Record<'tagsScope' | 'tagsSport' | 'tagsVertical', string[]>> = {};
    for (const tier of Object.keys(TIER_COLUMNS) as TaxonomyTier[]) {
      const column = TIER_COLUMNS[tier];
      const values = row[column] ?? [];
      if (!values.length) {
        emptyTiers++;
        console.log(`[empty] ${row.id} (${row.status}): sin etiquetas de ${tier}`);
        continue;
      }
      const canonical: string[] = [];
      let changed = false;
      for (const value of values) {
        const c = canonicalizeTag(tier, value);
        if (c === value) {
          canonical.push(value);
        } else if (c) {
          canonicalizable++;
          changed = true;
          if (!canonical.includes(c)) canonical.push(c);
          console.log(`[canonicalizable] ${row.id}: ${tier} "${value}" → "${c}"`);
        } else {
          outOfVocab++;
          // Out-of-vocabulary values are kept as-is even under --fix:
          // dropping or renaming them is an editorial call.
          canonical.push(value);
          console.log(`[out-of-vocab] ${row.id} (${row.status}): ${tier} "${value}"`);
        }
      }
      if (changed) updates[column] = canonical;
    }

    if (FIX && Object.keys(updates).length) {
      await db.update(articles).set({ ...updates, updatedAt: new Date() }).where(eq(articles.id, row.id));
      fixed++;
    }
  }

  console.log(
    `[audit-taxonomy] rows=${rows.length} canonicalizable=${canonicalizable} ` +
      `out-of-vocab=${outOfVocab} empty-tiers=${emptyTiers}` +
      (FIX ? ` fixed-rows=${fixed}` : ' (report only — use --fix to canonicalize)'),
  );
}

main().catch(err => {
  console.error('[audit-taxonomy] failed:', err);
  process.exitCode = 1;
});
