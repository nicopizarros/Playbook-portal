// One-off maintenance script, NOT wired into any deploy step.
//
// Why this exists: Roadmap Agosto 2026 Fase 0 ("las fotos de los
// testimoniales no cargan"). Checked production directly (2026-08-01):
// none of the 3 rows in site_content.testimonialsSection.testimonials
// have an `avatar` field at all -- not a broken path, just never set.
// content.json (the local seed, already correct) and
// public/assets/img/testimonial-{barbara,juan}.jpg (committed since
// 71128cb) have the real answer; Adriana never had a photo in the seed
// either, so leaving her without one is correct, not a gap.
//
// Matches by `name` rather than array index, since site_content is
// editor-editable and the order/count could have drifted since this was
// written -- only fills in an avatar for a testimonial whose name matches
// exactly and that doesn't already have one; never overwrites an existing
// value (an editor may have deliberately set a different photo since).
//
// Usage: POSTGRES_URL=<production> npx tsx scripts/fix-testimonial-avatars.ts
// Add --dry-run to only print what would change, without writing anything.

import { and, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { siteContent, contentRevisions } from '../lib/db/schema';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { siteContent, contentRevisions } });

const KNOWN_AVATARS: Record<string, string> = {
  'Bárbara González Briseño': '/assets/img/testimonial-barbara.jpg',
  'Juan Pablo Robert': '/assets/img/testimonial-juan.jpg',
};

const DRY_RUN = process.argv.includes('--dry-run');

type Testimonial = { name: string; role: string; quote: string; avatar?: string };

async function main() {
  console.log(`[fix-testimonial-avatars] starting${DRY_RUN ? ' (dry run, no writes)' : ''}`);

  const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1));
  if (!row) {
    console.log('[fix-testimonial-avatars] no site_content row found (id=1) -- nothing to do.');
    return;
  }

  const data = row.data as Record<string, unknown>;
  const testimonialsSection = data.testimonialsSection as { testimonials?: Testimonial[] } | undefined;
  const testimonials = testimonialsSection?.testimonials;
  if (!Array.isArray(testimonials)) {
    console.log('[fix-testimonial-avatars] no testimonialsSection.testimonials array found -- nothing to do.');
    return;
  }

  let changed = false;
  const next = testimonials.map(t => {
    const known = KNOWN_AVATARS[t.name];
    if (known && !t.avatar) {
      console.log(`  - ${t.name}: setting avatar to "${known}"`);
      changed = true;
      return { ...t, avatar: known };
    }
    return t;
  });

  if (!changed) {
    console.log('[fix-testimonial-avatars] nothing to change (already set, or no name matched).');
    return;
  }

  if (DRY_RUN) {
    console.log('[fix-testimonial-avatars] done (dry run).');
    return;
  }

  const nextData = { ...data, testimonialsSection: { ...testimonialsSection, testimonials: next } };
  const nextVersion = row.version + 1;
  const [updated] = await db
    .update(siteContent)
    .set({ data: nextData, version: nextVersion, updatedAt: new Date() })
    .where(and(eq(siteContent.id, 1), eq(siteContent.version, row.version)))
    .returning();

  if (!updated) {
    throw new Error(
      `[fix-testimonial-avatars] site_content changed under us (expected version ${row.version}) -- re-run instead of retrying blindly.`,
    );
  }

  await db.insert(contentRevisions).values({
    siteContentVersion: updated.version,
    editorId: null,
    snapshot: nextData,
  });
  console.log('[fix-testimonial-avatars] done, site_content updated.');
}

main()
  .catch(err => {
    console.error('[fix-testimonial-avatars] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
