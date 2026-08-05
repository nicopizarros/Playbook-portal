// One-off maintenance script, NOT wired into any deploy step.
//
// Why this exists (2026-08-04 pre-launch audit): the newsletter forms post
// the reader's address to Substack with method GET and target="_blank".
// They pointed at the publication ROOT, where Substack ignores the
// `?email=` parameter (verified against the real publication — the root
// renders an empty subscribe box, `/subscribe` renders it pre-filled). So
// a reader typed their address, was told "¡Listo! Revisa tu correo.", and
// was in fact never subscribed and never sent anything.
//
// The URL half of that bug is fixed in code for every form at once
// (lib/newsletter-url.ts). This script fixes the other half — the success
// copy, which lives in editable CMS content (site_content.midCta), so no
// code change can reach it. Even with the URL fixed the reader still has
// to press Subscribe on Substack, so the honest message is a hand-off, not
// a delivered email.
//
// Matches on the exact stale string and rewrites only if it is still
// there, so re-running is a no-op and an editor who has since reworded the
// field by hand is never overwritten.
//
// Usage: POSTGRES_URL=<production> npx tsx scripts/fix-newsletter-success-copy.ts
// Add --dry-run to only print what would change, without writing anything.

import { and, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { siteContent, contentRevisions } from '../lib/db/schema';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { siteContent, contentRevisions } });

const STALE = '¡Listo! Revisa tu correo.';
const REPLACEMENT = 'Te abrimos Substack para confirmar tu suscripción.';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`[fix-newsletter-success-copy] starting${DRY_RUN ? ' (dry run, no writes)' : ''}`);

  const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1));
  if (!row) {
    console.log('[fix-newsletter-success-copy] no site_content row found (id=1) -- nothing to do.');
    return;
  }

  const data = row.data as Record<string, unknown>;
  const midCta = data.midCta as { successMessage?: string } | undefined;
  if (!midCta) {
    console.log('[fix-newsletter-success-copy] no midCta section -- nothing to do.');
    return;
  }

  if (midCta.successMessage !== STALE) {
    console.log(`[fix-newsletter-success-copy] midCta.successMessage is "${midCta.successMessage}" (not the stale string) -- nothing to change.`);
    return;
  }

  console.log(`  - current: "${midCta.successMessage}"`);
  console.log(`  - new:     "${REPLACEMENT}"`);

  if (DRY_RUN) {
    console.log('[fix-newsletter-success-copy] done (dry run).');
    return;
  }

  const nextData = { ...data, midCta: { ...midCta, successMessage: REPLACEMENT } };
  const nextVersion = row.version + 1;
  const [updated] = await db
    .update(siteContent)
    .set({ data: nextData, version: nextVersion, updatedAt: new Date() })
    .where(and(eq(siteContent.id, 1), eq(siteContent.version, row.version)))
    .returning();

  if (!updated) {
    throw new Error(
      `[fix-newsletter-success-copy] site_content changed under us (expected version ${row.version}) -- re-run instead of retrying blindly.`,
    );
  }

  await db.insert(contentRevisions).values({
    siteContentVersion: updated.version,
    editorId: null,
    snapshot: nextData,
  });
  console.log('[fix-newsletter-success-copy] done, site_content updated.');
}

main()
  .catch(err => {
    console.error('[fix-newsletter-success-copy] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
