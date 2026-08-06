// One-time backfill for the "Jugada:" authoring convention (La Lectura
// round 2, 2026-08-05). Mining the corpus showed the articles with no
// dynamic asset are almost all two-party deal/relationship stories whose
// connection is stated in their own title — this appends that connection
// as the convention paragraph so the whole back catalog gains the strip,
// exactly the way an editor would have typed it in TipTap.
//
// Input: a JSON file of [{ "articleId": "...", "jugada": "A ↔ B" }].
// Rules (mirrors update-lana-board.ts's temperament):
//   - The jugada must parse under the same lib/product-hubs.ts rules the
//     article page uses (arrow present, sides ≤32 chars) or it's skipped.
//   - An article that already carries a Jugada (or doesn't exist / isn't
//     published) is skipped with a warning — idempotent, never doubled.
//   - The paragraph is appended to the field the article actually renders
//     from (bodyHtml if native, else teaser), matching its shape: an HTML
//     body gets `<p>Jugada: …</p>`, a plain-text teaser gets a
//     blank-line-separated plain paragraph.
//
// Usage: POSTGRES_URL=<production> npx tsx scripts/seed-jugadas.ts <rows.json>
// Add --dry-run to print what would change without writing anything.

import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { articles } from '../lib/db/schema';
import { parseJugada } from '../lib/product-hubs';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });
const DRY_RUN = process.argv.includes('--dry-run');

type Incoming = { articleId: string; jugada: string };

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

async function main() {
  const file = process.argv.filter(a => !a.startsWith('-'))[2];
  if (!file) {
    console.error('Usage: npx tsx scripts/seed-jugadas.ts <rows.json> [--dry-run]');
    process.exit(1);
  }
  const incoming: Incoming[] = JSON.parse(readFileSync(file, 'utf-8'));

  for (const { articleId, jugada } of incoming) {
    const parsed = parseJugada(jugada);
    if (!parsed) {
      console.warn(`[skip] ${articleId}: "${jugada}" no parsea como jugada (flecha + lados ≤32).`);
      continue;
    }
    const [row] = await db
      .select({ id: articles.id, status: articles.status, teaser: articles.teaser, bodyHtml: articles.bodyHtml })
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);
    if (!row || row.status !== 'published') {
      console.warn(`[skip] ${articleId}: no existe o no está publicado.`);
      continue;
    }
    const canonical = `Jugada: ${parsed.left} ${parsed.arrow} ${parsed.right}`;
    const target = row.bodyHtml ? 'bodyHtml' : 'teaser';
    const current = (row.bodyHtml ?? row.teaser ?? '').trim();
    if (/Jugada:|lect-jugada/i.test(current)) {
      console.warn(`[skip] ${articleId}: ya tiene una jugada.`);
      continue;
    }
    const updated = looksLikeHtml(current)
      ? `${current}<p>${canonical}</p>`
      : `${current}\n\n${canonical}`;
    console.log(`[${DRY_RUN ? 'dry' : 'set'}] ${articleId} (${target}): + "${canonical}"`);
    if (!DRY_RUN) {
      await db
        .update(articles)
        .set(target === 'bodyHtml' ? { bodyHtml: updated } : { teaser: updated })
        .where(eq(articles.id, articleId));
    }
  }
  console.log(DRY_RUN ? '\nDry run — nada escrito.' : '\nListo.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
