// One-off maintenance script, NOT wired into any deploy step.
//
// Why this exists: commit f7359f1 ("Rebrand La Lana del Mundial to La Lana
// del Deporte", 2026-07-31) only changed articles.json/content.json + code.
// migrate-json-to-db.ts (the script that turns those files into Postgres
// writes) is a MANUAL command -- predeploy-migrate.ts, which *does* run
// automatically on every production build, only applies Drizzle schema
// migrations, never re-syncs content. So any article or site_content row
// that already existed in Postgres before the rebrand commit keeps the old
// "La Lana del Mundial" text and the old banner asset path forever, until
// something explicitly rewrites those rows. Re-running `npm run
// migrate:json` would NOT reliably fix this either: it only upserts rows
// whose id already exists in the current articles.json snapshot, so any
// article the Make.com webhook inserted directly into Postgres after that
// snapshot was taken (with the pre-rebrand `detectPublication()`) would
// still be missed.
//
// This script instead does a narrow, global find/replace across every row
// that could plausibly carry the old brand string or the old asset path --
// safe to run against real production data because both search strings are
// specific enough that no legitimate content is expected to contain them
// (a real article ABOUT the World Cup says "el Mundial 2026", never the
// four-word brand phrase "La Lana del Mundial").
//
// Usage: POSTGRES_URL=<production> npx tsx scripts/fix-lana-rebrand-content.ts
// Add --dry-run to only print what would change, without writing anything.

import { and, eq, like, or } from 'drizzle-orm';
import { db } from '../lib/db/client';
import { articles, siteContent, contentRevisions } from '../lib/db/schema';

const OLD_BRAND = 'La Lana del Mundial';
const NEW_BRAND = 'La Lana del Deporte';
const OLD_BANNER_PATH = '/assets/img/lana-banner.webp';
const NEW_BANNER_PATH = '/assets/img/lana-banner.jpg';

const DRY_RUN = process.argv.includes('--dry-run');

function replaceBrand(value: string): string {
  return value.split(OLD_BRAND).join(NEW_BRAND).split(OLD_BANNER_PATH).join(NEW_BANNER_PATH);
}

// Walks an arbitrary JSON value (site_content.data), rewriting every string
// leaf that contains either stale string. Returns a new value plus whether
// anything actually changed, so the caller can skip writing when nothing
// matched.
function deepReplace(value: unknown): { value: unknown; changed: boolean } {
  if (typeof value === 'string') {
    const next = replaceBrand(value);
    return { value: next, changed: next !== value };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map(item => {
      const result = deepReplace(item);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: next, changed };
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const result = deepReplace(val);
      if (result.changed) changed = true;
      next[key] = result.value;
    }
    return { value: next, changed };
  }
  return { value, changed: false };
}

async function fixArticles() {
  const stale = await db
    .select({ id: articles.id, title: articles.title, publication: articles.publication, imageUrl: articles.imageUrl })
    .from(articles)
    .where(or(like(articles.publication, `%${OLD_BRAND}%`), like(articles.imageUrl, `%${OLD_BANNER_PATH}%`)));

  console.log(`[fix-lana] articles with stale brand/asset text: ${stale.length}`);
  for (const row of stale) {
    console.log(`  - ${row.id} (${row.title}): publication="${row.publication}" imageUrl="${row.imageUrl}"`);
  }

  if (DRY_RUN || !stale.length) return stale.length;

  for (const row of stale) {
    await db
      .update(articles)
      .set({
        publication: replaceBrand(row.publication),
        imageUrl: replaceBrand(row.imageUrl),
        updatedAt: new Date(),
      })
      .where(eq(articles.id, row.id));
  }
  return stale.length;
}

async function fixSiteContent() {
  const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1));
  if (!row) {
    console.log('[fix-lana] no site_content row found (id=1) -- nothing to do.');
    return false;
  }

  const { value: nextData, changed } = deepReplace(row.data) as { value: Record<string, unknown>; changed: boolean };
  if (!changed) {
    console.log('[fix-lana] site_content: no stale brand/asset text found.');
    return false;
  }

  console.log('[fix-lana] site_content: stale brand/asset text found, will rewrite affected fields.');
  if (DRY_RUN) return true;

  const nextVersion = row.version + 1;
  const [updated] = await db
    .update(siteContent)
    .set({ data: nextData, version: nextVersion, updatedAt: new Date() })
    .where(and(eq(siteContent.id, 1), eq(siteContent.version, row.version)))
    .returning();

  if (!updated) {
    throw new Error(
      `[fix-lana] site_content changed under us (expected version ${row.version}) -- re-run the script instead of retrying blindly.`,
    );
  }

  await db.insert(contentRevisions).values({
    siteContentVersion: updated.version,
    editorId: null,
    snapshot: nextData,
  });
  return true;
}

async function main() {
  console.log(`[fix-lana] starting${DRY_RUN ? ' (dry run, no writes)' : ''}`);
  const articleCount = await fixArticles();
  const siteContentChanged = await fixSiteContent();
  console.log(
    `[fix-lana] done. articles ${DRY_RUN ? 'would be' : ''} fixed: ${articleCount}. site_content ${
      siteContentChanged ? (DRY_RUN ? 'would be updated' : 'updated') : 'unchanged'
    }.`,
  );
}

main()
  .catch(err => {
    console.error('[fix-lana] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
