// One-off update: regenerates bodyJson/bodyHtml for the already-published
// "mexico-respalda-a-infantino..." article with an expanded Cronología and
// a Reparto device replacing the earlier Alineación, per human revision
// request (2026-08-07). Reuses publish-newsletter.ts's markdownToTipTap so
// the device paragraphs land in the exact same shape a fresh publish would
// produce -- device rendering itself happens at read time (applyBodyDevices
// in app/(public)/articulo/page.tsx), this script only needs to store the
// updated plain bodyJson/bodyHtml.
//
// Usage: npx tsx scripts/update-fmf-infantino-devices.ts

import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { generateHTML } from '@tiptap/html';
import { articles } from '../lib/db/schema';
import { markdownToTipTap } from './publish-newsletter';
import { TIPTAP_EXTENSIONS } from '../lib/tiptap-extensions';
import { readFileSync } from 'node:fs';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx tsx scripts/update-fmf-infantino-devices.ts <path-to-json-file>');
    process.exit(1);
  }
  const [input] = JSON.parse(readFileSync(filePath, 'utf-8'));
  const id = 'mexico-respalda-a-infantino-el-mismo-dia-en-que-la-uefa-reitera-que-no-confia-en-el';

  const bodyJson = markdownToTipTap(input.bodyMarkdown);
  const bodyHtml = generateHTML(bodyJson as any, TIPTAP_EXTENSIONS);

  const [updated] = await db
    .update(articles)
    .set({ bodyJson, bodyHtml })
    .where(eq(articles.id, id))
    .returning();

  if (!updated) {
    console.error(`No row found for id=${id}`);
    process.exit(1);
  }
  console.log(`[update] ok: ${updated.title} (id=${updated.id})`);
}

main();
