// Updates fields on an ALREADY-PUBLISHED article, the counterpart to
// scripts/publish-newsletter.ts's insert path. Both publish skills need this
// for outcome B of the overlap check ("same event, the source adds facts ->
// upgrade the existing article") and for any post-publish correction; until
// now the only worked example was scripts/update-matador-report.ts, a
// one-off shaped around a single article's PDF link, which meant every
// correction since has been hand-written SQL.
//
// The one rule that makes this safe: when `bodyMarkdown` is given, the body
// is rebuilt through the SAME markdownToTipTap -> generateHTML pipeline the
// insert path uses, so body_json and body_html can never drift apart and
// stored HTML can never accumulate hand-edited markup. That drift is exactly
// what left a dead `<div class="opinion-box">` baked into a live article on
// 2026-08-07 (see docs/la-lana-article-spec.md, "How the 2026-08-07 break
// happened"): a publish-time HTML post-processor wrote a wrapper into
// body_html that body_json never knew about, and reverting the code left the
// wrapper stranded in the row. Regenerating from the markdown is what makes
// a revert actually revert.
//
// Usage: npx tsx --env-file=.env.local scripts/update-article.ts <path-to-json> [--dry-run]
// Input: a JSON array of entries. Each entry identifies one row by `id` OR
// `sourceUrl`, plus any subset of the updatable fields below. Fields left out
// are not touched — this is a patch, never a full overwrite.
//
//   [{ "id": "la-fabrica-de-talento-no-tiene-una-sola-receta",
//      "excerpt": "…",
//      "bodyMarkdown": "…" }]

import { readFile } from 'node:fs/promises';
import { eq, sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { articles } from '../lib/db/schema';
import { TIPTAP_EXTENSIONS } from '../lib/tiptap-extensions';
import { markdownToTipTap } from './publish-newsletter';

// Same HTTP-driver rationale as scripts/publish-newsletter.ts: this runs from
// environments whose egress only permits HTTPS, not the raw TCP the app's pg
// Pool uses.
const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });
const dryRun = process.argv.includes('--dry-run');

type Entry = {
  id?: string;
  sourceUrl?: string;
  title?: string;
  excerpt?: string;
  teaser?: string;
  bodyMarkdown?: string;
  author?: string;
  mostrarAutor?: boolean;
  priority?: number;
  featured?: boolean;
  readingTime?: number;
  imageUrl?: string;
  imageCredit?: string;
  // Added 2026-09-01: six publish-sourced-article rows shipped with `source`
  // set to the credited news outlet ("Reuters", "Chelsea FC", ...) instead
  // of the Playbook product key (`fields-and-taxonomy.md`'s
  // publication/source table -- "noticias" for the Noticias product). That
  // silently zeroed out `hubForSource()` in the article page
  // (`lib/product-hubs.ts`), which gates the ENTIRE `applyBodyDevices()`
  // call: no hub match means every declared device (Cronología, Alineación,
  // Cifra clave, ...) renders as inert plain text, not just the malformed
  // ones. Both fields are plain text columns with no derived state to
  // recompute, unlike `boleta`/score (see the 2026-08-31 log entry on why
  // those still aren't here), so adding them is a safe, direct patch path
  // rather than a one-off script.
  source?: string;
  publication?: string;
};

// `date` is deliberately absent: the archive's chronology is a record, not a
// field to refresh on an update (publish-newsletter Step 0, outcome B).
const COLUMNS = {
  title: articles.title,
  excerpt: articles.excerpt,
  teaser: articles.teaser,
  author: articles.author,
  mostrarAutor: articles.mostrarAutor,
  priority: articles.priority,
  featured: articles.featured,
  readingTime: articles.readingTime,
  imageUrl: articles.imageUrl,
  imageCredit: articles.imageCredit,
  source: articles.source,
  publication: articles.publication,
} as const;

async function resolveId(entry: Entry): Promise<string | null> {
  const where = entry.id
    ? eq(articles.id, entry.id)
    : entry.sourceUrl
      ? eq(articles.sourceUrl, entry.sourceUrl)
      : null;
  if (!where) return null;
  const found = await db.select({ id: articles.id }).from(articles).where(where).limit(1);
  return found[0]?.id ?? null;
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('usage: update-article.ts <path-to-json> [--dry-run]');
  const entries = JSON.parse(await readFile(path, 'utf8')) as Entry[];

  for (const entry of entries) {
    const id = await resolveId(entry);
    if (!id) {
      console.log(`[miss] no article matching ${entry.id ?? entry.sourceUrl ?? '(no id/sourceUrl)'}`);
      continue;
    }

    // Drizzle builds the partial SET clause, so only the fields the entry
    // actually carries are written and every value stays bound.
    const patch: Record<string, unknown> = {};
    const touched: string[] = [];

    for (const field of Object.keys(COLUMNS) as (keyof typeof COLUMNS)[]) {
      const value = entry[field];
      if (value === undefined) continue;
      patch[field] = value;
      touched.push(field);
    }

    if (entry.bodyMarkdown !== undefined) {
      const doc = markdownToTipTap(entry.bodyMarkdown);
      const html = generateHTML(doc as JSONContent, TIPTAP_EXTENSIONS);
      patch.bodyJson = doc;
      patch.bodyHtml = html;
      touched.push(`body (${html.length} chars, ${(html.match(/<a /g) || []).length} link(s))`);
    }

    if (!touched.length) {
      console.log(`[skip] ${id}: nothing to update`);
      continue;
    }

    if (!dryRun) {
      await db
        .update(articles)
        .set({ ...patch, updatedAt: sql`now()` })
        .where(eq(articles.id, id));
    }
    console.log(`[${dryRun ? 'dry' : 'ok'}] ${id}: ${touched.join(', ')}`);
  }
}

main();
