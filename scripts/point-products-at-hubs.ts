// One-off maintenance script, NOT wired into any deploy step.
//
// Why this exists: the 2026-08-05 product-hubs session gave each editorial
// product its own internal hub (/industry-shots, /la-lana,
// /futbol-business-review, /infinitas — see lib/product-hubs.ts) and
// content.json's seed already points the four "Productos editoriales"
// cards at them. Production's site_content still carries the old URLs
// (/archivo?source=… for three cards, Substack for The Futbol Business
// Review), so the live cards keep bypassing the hubs until this runs.
//
// Matches by `imageAlt` (stable, editor-visible identity of each card)
// rather than array index, same reasoning as fix-testimonial-avatars.ts /
// update-la-lana-description.ts: site_content is editor-editable and
// position could drift.
//
// Usage: POSTGRES_URL=<production> npx tsx scripts/point-products-at-hubs.ts
// Add --dry-run to only print what would change, without writing anything.

import { and, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { siteContent, contentRevisions } from '../lib/db/schema';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { siteContent, contentRevisions } });

const DRY_RUN = process.argv.includes('--dry-run');

// imageAlt → hub path. Kept in sync with lib/product-hubs.ts by hand — the
// alt texts are card data, not source values, so there's nothing to join on.
const HUB_URLS: Record<string, string> = {
  'Noticias by Playbook': '/noticias',
  'La Lana del Deporte': '/la-lana',
  'The Futbol Business Review': '/futbol-business-review',
  Infinitas: '/infinitas',
};

type Product = { imageAlt?: string; url?: string; [key: string]: unknown };

async function main() {
  console.log(`[point-products-at-hubs] starting${DRY_RUN ? ' (dry run, no writes)' : ''}`);

  const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1));
  if (!row) {
    console.log('[point-products-at-hubs] no site_content row found (id=1) -- nothing to do.');
    return;
  }

  const data = row.data as Record<string, unknown>;
  const productsSection = data.productsSection as { products?: Product[] } | undefined;
  const products = productsSection?.products;
  if (!Array.isArray(products)) {
    console.log('[point-products-at-hubs] no productsSection.products array found -- nothing to do.');
    return;
  }

  let changes = 0;
  const nextProducts = products.map(p => {
    const hubUrl = p.imageAlt ? HUB_URLS[p.imageAlt] : undefined;
    if (!hubUrl || p.url === hubUrl) return p;
    console.log(`  - ${p.imageAlt}: "${p.url}" -> "${hubUrl}"`);
    changes += 1;
    return { ...p, url: hubUrl };
  });
  const missing = Object.keys(HUB_URLS).filter(alt => !products.some(p => p.imageAlt === alt));
  missing.forEach(alt => console.log(`  ! no product card with imageAlt="${alt}" found -- skipped.`));

  if (!changes) {
    console.log('[point-products-at-hubs] all product URLs already point at their hubs -- nothing to change.');
    return;
  }
  if (DRY_RUN) {
    console.log(`[point-products-at-hubs] done (dry run, ${changes} card(s) would change).`);
    return;
  }

  const nextData = { ...data, productsSection: { ...productsSection, products: nextProducts } };
  const [updated] = await db
    .update(siteContent)
    .set({ data: nextData, version: row.version + 1, updatedAt: new Date() })
    .where(and(eq(siteContent.id, 1), eq(siteContent.version, row.version)))
    .returning();

  if (!updated) {
    throw new Error(
      `[point-products-at-hubs] site_content changed under us (expected version ${row.version}) -- re-run instead of retrying blindly.`,
    );
  }

  await db.insert(contentRevisions).values({
    siteContentVersion: updated.version,
    editorId: null,
    snapshot: nextData,
  });
  console.log(`[point-products-at-hubs] done, ${changes} card(s) updated.`);
}

main()
  .catch(err => {
    console.error('[point-products-at-hubs] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
