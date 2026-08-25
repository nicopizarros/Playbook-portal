// One-off correction: the 08-21 UEFA/Concacaf piece reverted to 211 voters and
// derived a two-thirds threshold from it. The archive's own 08-15 piece
// establishes 210 eligible voters (Nepal suspended), which puts two-thirds at
// 140, not 141. Patched at the body_json level and re-rendered through
// generateHTML so the html cache cannot drift from the source of truth
// (docs/la-lana-article-spec.md §5).
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { articles } from '../lib/db/schema';
import { TIPTAP_EXTENSIONS } from '../lib/tiptap-extensions';

const ID = 'uefa-y-concacaf-negocian-una-nations-league-conjunta-contra-infantino-y-le-disputan-a-mexico-a-punta-de-calendario';
const REPLACEMENTS: [string, string][] = [
  [
    'la FIFA elige presidente con 211 votos, uno por federación, sin importar el tamaño del país. Ganar requiere mayoría simple, 106 votos, o dos tercios, 141, si hay tres o más candidatos en la primera vuelta. La Concacaf sola controla 41 de esos 211 votos',
    'la FIFA elige presidente con un voto por federación, sin importar el tamaño del país: 211 miembros, de los que 210 votan en marzo porque Nepal está suspendida. Ganar requiere mayoría simple, 106 votos, o dos tercios, 140, si hay tres o más candidatos en la primera vuelta. La Concacaf sola controla 41 de esos 210 votos',
  ],
];

const dryRun = process.argv.includes('--dry-run');
const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });

function patchText(node: JSONContent, applied: Set<string>): JSONContent {
  if (typeof node.text === 'string') {
    let text = node.text;
    for (const [from, to] of REPLACEMENTS) {
      if (text.includes(from)) {
        text = text.split(from).join(to);
        applied.add(from);
      }
    }
    if (text !== node.text) return { ...node, text };
  }
  if (Array.isArray(node.content)) {
    return { ...node, content: node.content.map(child => patchText(child, applied)) };
  }
  return node;
}

async function main() {
  const [row] = await db.select().from(articles).where(eq(articles.id, ID)).limit(1);
  if (!row) throw new Error(`no article ${ID}`);

  const applied = new Set<string>();
  const doc = patchText(row.bodyJson as JSONContent, applied);
  if (applied.size !== REPLACEMENTS.length) {
    throw new Error(
      `expected ${REPLACEMENTS.length} replacement(s), applied ${applied.size} — ` +
        'the stored text does not match; refusing to write a partial correction',
    );
  }

  const html = generateHTML(doc, TIPTAP_EXTENSIONS);
  // Guard the correction itself, not just the match: the stale figures must be
  // gone and the corrected ones present before anything is written.
  for (const bad of ['211 votos', 'dos tercios, 141', '41 de esos 211']) {
    if (html.includes(bad)) throw new Error(`stale figure survived: ${bad}`);
  }
  for (const good of ['210 votan en marzo', 'dos tercios, 140', '41 de esos 210']) {
    if (!html.includes(good)) throw new Error(`corrected figure missing: ${good}`);
  }

  // Round-trip guard: re-render the UNPATCHED json and compare against the
  // stored html. If those differ, regenerating would smuggle unrelated markup
  // changes in alongside the correction, and the correction is not isolated.
  const baseline = generateHTML(row.bodyJson as JSONContent, TIPTAP_EXTENSIONS);
  if (baseline !== row.bodyHtml) {
    throw new Error(
      'stored body_html does not match a re-render of body_json; ' +
        'regenerating would change more than the correction — investigate first',
    );
  }

  console.log(`[${dryRun ? 'dry-run' : 'write'}] ${ID}`);
  console.log(`  html ${(row.bodyHtml || '').length} -> ${html.length} chars`);
  const para = (h: string, needle: string) => {
    const i = h.indexOf(needle);
    if (i < 0) return '(not found)';
    const start = h.lastIndexOf('<p', i);
    const end = h.indexOf('</p>', i);
    return h.slice(start, end).replace(/<[^>]+>/g, '').slice(0, 340);
  };
  console.log('  before:', para(row.bodyHtml || '', '211 votos'));
  console.log('  after: ', para(html, '210 votan'));

  if (dryRun) return;
  await db.update(articles).set({ bodyJson: doc, bodyHtml: html, updatedAt: new Date() }).where(eq(articles.id, ID));
  console.log('  written');
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
