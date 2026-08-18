// Backfill sweep for a hub's coverage tier (lib/taxonomy.ts PROPERTY_OPTIONS).
//
// REPORT-ONLY BY DEFAULT. The sweep PROPOSES candidates by string match; the
// boundary rule in .claude/playbook-editorial/fields-and-taxonomy.md DECIDES.
// Those are deliberately two different jobs: a regex cannot run the subject
// test ("is the property the grammatical subject of the core claim, or is it
// mentioned inside someone else's story?"), and a sweep that auto-applied
// would put mentions on a destination page — the exact failure the tier
// exists to prevent.
//
//   npx tsx scripts/backfill-hub-tags.ts lfa            # report candidates
//   npx tsx scripts/backfill-hub-tags.ts lfa --apply id1 id2 …
//
// --apply takes EXPLICIT ids, never "all candidates": whoever ran the
// boundary rule names what passed it, and the run is auditable afterwards.
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';
import { articles } from '../lib/db/schema';
import { HUBS, hubBySlug } from '../lib/hubs';

if (!process.env.POSTGRES_URL) {
  const local = '.env.local';
  if (fs.existsSync(local)) {
    const m = fs.readFileSync(local, 'utf8').match(/^POSTGRES_URL=(.+)$/m);
    if (m) process.env.POSTGRES_URL = m[1].trim().replace(/^["']|["']$/g, '');
  }
}
if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL no está definido (ver .env.local.example).');

// Neon's HTTP endpoint, not the pg Pool: the sandboxes this runs in are
// HTTPS-only. Same rationale as scripts/audit-taxonomy.ts.
const db = drizzle(neon(process.env.POSTGRES_URL), { schema: { articles } });

const slug = process.argv[2];
const hub = slug ? hubBySlug(slug) : null;
if (!hub) {
  console.error(`Uso: npx tsx scripts/backfill-hub-tags.ts <slug> [--apply <id>…]`);
  console.error(`Hubs registrados: ${HUBS.map(h => h.slug).join(', ')}`);
  process.exit(1);
}

const applyIdx = process.argv.indexOf('--apply');
const applyIds = applyIdx === -1 ? [] : process.argv.slice(applyIdx + 1).filter(a => !a.startsWith('--'));

function contextAround(haystack: string, term: string): string {
  const text = haystack.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  if (at === -1) return '';
  return `…${text.slice(Math.max(0, at - 90), at + 130).trim()}…`;
}

async function main() {
  const rows = await db.select().from(articles);
  console.log(`\nHub: ${hub!.name} (tag "${hub!.tag}")  ·  corpus: ${rows.length} artículos\n`);

  if (applyIds.length) {
    for (const id of applyIds) {
      const row = rows.find(r => r.id === id);
      if (!row) { console.error(`  ✗ ${id} — no existe`); continue; }
      const current = row.tagsProperty ?? [];
      if (current.includes(hub!.tag)) { console.log(`  = ${id} — ya tenía la etiqueta`); continue; }
      await db.update(articles)
        .set({ tagsProperty: [...current, hub!.tag], updatedAt: new Date() })
        .where(eq(articles.id, id));
      console.log(`  ✓ ${id} — etiquetado`);
    }
    return;
  }

  const already = rows.filter(r => (r.tagsProperty ?? []).includes(hub!.tag));
  const candidates: { id: string; title: string; date: string; source: string; hits: string[]; ctx: string }[] = [];

  for (const row of rows) {
    if ((row.tagsProperty ?? []).includes(hub!.tag)) continue;
    const haystack = [row.title, row.excerpt, row.teaser, row.bodyHtml ?? ''].join(' ');
    const hits = hub!.backfillTerms.filter(t => haystack.toLowerCase().includes(t.toLowerCase()));
    if (hits.length) candidates.push({
      id: row.id, title: row.title, date: row.date, source: row.source,
      hits, ctx: contextAround(haystack, hits[0]),
    });
  }

  console.log(`Ya etiquetados: ${already.length}`);
  console.log(`Candidatos por coincidencia de texto: ${candidates.length}\n`);
  for (const c of candidates.sort((a, b) => b.date.localeCompare(a.date))) {
    console.log(`  [${c.date}] ${c.source}  ${c.id}`);
    console.log(`    ${c.title}`);
    console.log(`    términos: ${c.hits.join(', ')}`);
    if (c.ctx) console.log(`    ${c.ctx}`);
    console.log('');
  }
  console.log(
    candidates.length
      ? `Aplica la REGLA DE FRONTERA a cada uno (references/fields-and-taxonomy.md).\n` +
        `Los que la pasen:  npx tsx scripts/backfill-hub-tags.ts ${hub!.slug} --apply <id>…\n`
      : `Sin candidatos. El pool de este hub está vacío — no hay nada que retroetiquetar.\n`,
  );
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
