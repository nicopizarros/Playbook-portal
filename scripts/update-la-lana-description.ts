// One-off maintenance script, NOT wired into any deploy step.
//
// Why this exists: user-requested copy change for the "La Lana del
// Deporte" card in site_content.productsSection.products (2026-08-01) --
// production's description still said "Los negocios, decisiones y
// tensiones alrededor del Mundial 2026" (stale World Cup framing, same
// family of leftover as the Fase 0 "Mundial" rebrand bugs, just never
// caught because it's not the literal brand phrase). Replaced with the
// user's copy, trimmed to match the other three product cards' length
// (~90-110 chars, all short declarative taglines) -- the user's original
// ("Un espacio semanal para meternos a fondo en...") ran to ~123 chars,
// longer than every sibling card, and "semanal" duplicates what `meta:
// "Viernes"` already conveys on the same card.
//
// Matches by `imageAlt === 'La Lana del Deporte'` (stable, confirmed
// present in production) rather than array index, same reasoning as
// fix-testimonial-avatars.ts: site_content is editor-editable and
// position could drift.
//
// Usage: POSTGRES_URL=<production> npx tsx scripts/update-la-lana-description.ts
// Add --dry-run to only print what would change, without writing anything.

import { and, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { siteContent, contentRevisions } from '../lib/db/schema';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { siteContent, contentRevisions } });

const NEW_DESCRIPTION = 'El dinero, el poder y las decisiones que mueven al deporte fuera de la cancha.';

const DRY_RUN = process.argv.includes('--dry-run');

type Product = { imageAlt?: string; description?: string; [key: string]: unknown };

async function main() {
  console.log(`[update-la-lana-description] starting${DRY_RUN ? ' (dry run, no writes)' : ''}`);

  const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1));
  if (!row) {
    console.log('[update-la-lana-description] no site_content row found (id=1) -- nothing to do.');
    return;
  }

  const data = row.data as Record<string, unknown>;
  const productsSection = data.productsSection as { products?: Product[] } | undefined;
  const products = productsSection?.products;
  if (!Array.isArray(products)) {
    console.log('[update-la-lana-description] no productsSection.products array found -- nothing to do.');
    return;
  }

  const target = products.find(p => p.imageAlt === 'La Lana del Deporte');
  if (!target) {
    console.log('[update-la-lana-description] no product with imageAlt="La Lana del Deporte" found -- nothing to do.');
    return;
  }

  if (target.description === NEW_DESCRIPTION) {
    console.log('[update-la-lana-description] description already matches -- nothing to change.');
    return;
  }

  console.log(`  - current: "${target.description}"`);
  console.log(`  - new:     "${NEW_DESCRIPTION}"`);

  if (DRY_RUN) {
    console.log('[update-la-lana-description] done (dry run).');
    return;
  }

  const nextProducts = products.map(p => (p === target ? { ...p, description: NEW_DESCRIPTION } : p));
  const nextData = { ...data, productsSection: { ...productsSection, products: nextProducts } };
  const nextVersion = row.version + 1;
  const [updated] = await db
    .update(siteContent)
    .set({ data: nextData, version: nextVersion, updatedAt: new Date() })
    .where(and(eq(siteContent.id, 1), eq(siteContent.version, row.version)))
    .returning();

  if (!updated) {
    throw new Error(
      `[update-la-lana-description] site_content changed under us (expected version ${row.version}) -- re-run instead of retrying blindly.`,
    );
  }

  await db.insert(contentRevisions).values({
    siteContentVersion: updated.version,
    editorId: null,
    snapshot: nextData,
  });
  console.log('[update-la-lana-description] done, site_content updated.');
}

main()
  .catch(err => {
    console.error('[update-la-lana-description] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
