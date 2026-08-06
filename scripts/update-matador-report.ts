// One-off: attaches the El Matador Inc. special edition to its article — the
// downloadable PDF as an inline link in the body, and the report's own cover
// (page 1, letterboxed to 16:10) as the article image. Rebuilds the body the
// same way scripts/publish-newsletter.ts does, so the TipTap document and the
// rendered HTML stay identical in shape to an inserted article.
//
// Usage: npx tsx scripts/update-matador-report.ts <path-to-json> [--dry-run]
// Input: the same JSON array publish-newsletter.ts takes; rows are matched on
// sourceUrl (the per-item dedupe key) and UPDATEd rather than inserted.

import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { TIPTAP_EXTENSIONS } from '../lib/tiptap-extensions';
import { markdownToTipTap } from './publish-newsletter';

const sql = neon(process.env.POSTGRES_URL!);
const dryRun = process.argv.includes('--dry-run');

type Input = {
  sourceUrl: string;
  bodyMarkdown: string;
  imageUrl: string;
  imageCredit?: string;
};

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('usage: update-matador-report.ts <path-to-json> [--dry-run]');
  const entries = JSON.parse(await readFile(path, 'utf8')) as Input[];

  for (const entry of entries) {
    const found = (await sql`
      select id from articles where source_url = ${entry.sourceUrl}
    `) as { id: string }[];
    if (!found.length) {
      console.log(`[miss] no article with sourceUrl ${entry.sourceUrl}`);
      continue;
    }
    const id = found[0].id;
    const doc = markdownToTipTap(entry.bodyMarkdown);
    const html = generateHTML(doc as JSONContent, TIPTAP_EXTENSIONS);
    const links = (html.match(/<a /g) || []).length;
    if (!dryRun) {
      await sql`
        update articles
        set body_json = ${doc as unknown as string},
            body_html = ${html},
            image_url = ${entry.imageUrl},
            image_credit = ${entry.imageCredit ?? null},
            updated_at = now()
        where id = ${id}
      `;
    }
    console.log(`[${dryRun ? 'dry' : 'ok'}] ${id}: ${links} link(s) in body, cover -> ${entry.imageUrl}`);
  }
}

main();
