// One-off backfill: brings pre-existing published articles up to the
// current editorial standard (every article gets a topic-matched image +
// credit; stub-length legacy articles get a real TipTap body instead of a
// one-sentence teaser standing in as the whole page). Companion to
// scripts/publish-newsletter.ts's insertOne, same conversion pipeline, but
// UPDATEs existing rows instead of inserting new ones.
//
// Usage: tsx scripts/backfill-article-standards.ts <path-to-json-file>
// Input: a JSON array of BackfillEntry (see type below).

import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { eq } from 'drizzle-orm';
import { articles } from '../lib/db/schema';
import { TIPTAP_EXTENSIONS } from '../lib/tiptap-extensions';
import { markdownToTipTap } from './publish-newsletter';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });

type BackfillEntry = {
  id: string;
  imageUrl: string;
  imageCredit?: string;
  bodyMarkdown?: string; // present only for stub articles getting an expanded body
};

// Agents sometimes hand back HTML-entity-escaped URLs (&amp; instead of &)
// picked up verbatim from a fetched page's markup.
function unescapeUrl(url: string): string {
  return url.replace(/&amp;/g, '&');
}

async function updateOne(entry: BackfillEntry) {
  const imageUrl = unescapeUrl(entry.imageUrl);
  const patch: Record<string, unknown> = {
    imageUrl,
    imageCredit: entry.imageCredit || null,
    updatedAt: new Date(),
  };

  if (entry.bodyMarkdown && entry.bodyMarkdown.trim()) {
    const bodyJson = markdownToTipTap(entry.bodyMarkdown);
    patch.bodyJson = bodyJson;
    patch.bodyHtml = generateHTML(bodyJson as JSONContent, TIPTAP_EXTENSIONS);
  }

  const [updated] = await db.update(articles).set(patch).where(eq(articles.id, entry.id)).returning();
  if (!updated) {
    return { status: 'not-found' as const, id: entry.id };
  }
  return { status: 'ok' as const, id: entry.id, title: updated.title };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: tsx scripts/backfill-article-standards.ts <path-to-json-file>');
    process.exitCode = 1;
    return;
  }

  const raw = await readFile(filePath, 'utf-8');
  const items = JSON.parse(raw) as BackfillEntry[];
  if (!Array.isArray(items) || !items.length) {
    console.error('Input file must contain a non-empty JSON array of entries.');
    process.exitCode = 1;
    return;
  }

  const results = [];
  for (const item of items) {
    const result = await updateOne(item);
    results.push(result);
    console.log(`[backfill] ${result.status}: ${item.id}`);
  }

  const okCount = results.filter(r => r.status === 'ok').length;
  const missCount = results.filter(r => r.status === 'not-found').length;
  console.log(`[backfill] done: ${okCount} updated, ${missCount} not found, ${results.length} total`);
}

main()
  .catch(err => {
    console.error('[backfill] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
