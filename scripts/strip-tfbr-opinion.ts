// One-off: The Futbol Business Review pieces are authored analysis carrying
// a partner's own closing section ("La visión de Interticket"). Editorial
// decided the house shouldn't append its own take on top of them, so this
// removes the `**Opinión de Playbook:**` paragraph from every TFBR article
// and re-renders the body the same way the editor does.
//
// Usage: npx tsx scripts/strip-tfbr-opinion.ts [--dry-run]

import { neon } from '@neondatabase/serverless';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { TIPTAP_EXTENSIONS } from '../lib/tiptap-extensions';

const sql = neon(process.env.POSTGRES_URL!);
const dryRun = process.argv.includes('--dry-run');

// Text of a TipTap node tree, so we can spot the opinion paragraph by its
// lead-in regardless of how the bold/plain marks were split.
function nodeText(node: JSONContent): string {
  if (node.type === 'text') return node.text || '';
  return (node.content || []).map(nodeText).join('');
}

async function main() {
  const rows = (await sql`
    select id, body_json from articles where source = 'futbol-business-review'
  `) as { id: string; body_json: JSONContent | null }[];

  let changed = 0;
  for (const row of rows) {
    const doc = row.body_json;
    if (!doc?.content) {
      console.log(`[skip] ${row.id}: no body_json`);
      continue;
    }
    const kept = doc.content.filter(
      node => !/^\s*Opinión de Playbook\s*:/i.test(nodeText(node)),
    );
    if (kept.length === doc.content.length) {
      console.log(`[skip] ${row.id}: no opinion paragraph found`);
      continue;
    }
    const nextDoc = { ...doc, content: kept };
    const html = generateHTML(nextDoc as JSONContent, TIPTAP_EXTENSIONS);
    if (!dryRun) {
      await sql`
        update articles
        set body_json = ${nextDoc as unknown as string}, body_html = ${html}, updated_at = now()
        where id = ${row.id}
      `;
    }
    changed++;
    console.log(`[${dryRun ? 'dry' : 'ok'}] ${row.id}: removed 1 paragraph (${doc.content.length} -> ${kept.length})`);
  }
  console.log(`done: ${changed} of ${rows.length} articles updated${dryRun ? ' (dry run)' : ''}`);
}

main();
