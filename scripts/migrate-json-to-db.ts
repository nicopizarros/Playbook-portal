// One-time, idempotent migration: articles.json + content.json (the old
// git-backed "database") -> Postgres. Safe to re-run — every write is an
// upsert keyed on the same id the legacy file used, so running this twice
// converges instead of duplicating rows.
//
// Usage: npm run migrate:json   (requires POSTGRES_URL)

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { db } from '../lib/db/client';
import { articles, siteContent } from '../lib/db/schema';

type LegacyArticle = {
  id: string;
  title: string;
  excerpt?: string;
  teaser?: string;
  author?: string;
  date?: string;
  dateFormatted?: string;
  publication?: string;
  source?: string;
  tags?: { scope?: string[]; sport?: string[]; vertical?: string[] };
  priority?: number;
  featured?: boolean;
  mostrar_autor?: boolean;
  reading_time?: number;
  substack_url?: string;
  imageUrl?: string;
};

async function readJson<T>(relativePath: string): Promise<T> {
  const full = path.join(process.cwd(), relativePath);
  const raw = await readFile(full, 'utf-8');
  return JSON.parse(raw) as T;
}

async function migrateArticles() {
  const data = await readJson<{ articles: LegacyArticle[] }>('articles.json');
  const list = Array.isArray(data.articles) ? data.articles : [];

  let count = 0;
  for (const a of list) {
    if (!a.id || !a.title) {
      console.warn(`[migrate] skipping article with missing id/title: ${JSON.stringify(a).slice(0, 120)}`);
      continue;
    }
    await db
      .insert(articles)
      .values({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt || '',
        teaser: a.teaser || a.excerpt || '',
        // bodyJson/bodyHtml intentionally omitted: every migrated article
        // starts as "legacy, no native body yet" -> falls back to teaser +
        // Substack link, exactly matching current site behavior.
        author: a.author || '',
        date: a.date || '',
        dateFormatted: a.dateFormatted || '',
        publication: a.publication || 'Playbook',
        source: a.source || 'playbook',
        tagsScope: a.tags?.scope || [],
        tagsSport: a.tags?.sport || [],
        tagsVertical: a.tags?.vertical || [],
        priority: a.priority ?? 3,
        featured: a.featured === true,
        mostrarAutor: a.mostrar_autor === true,
        readingTime: a.reading_time ?? 1,
        substackUrl: a.substack_url || '',
        imageUrl: a.imageUrl || '',
        status: 'published',
      })
      .onConflictDoUpdate({
        target: articles.id,
        set: {
          title: a.title,
          excerpt: a.excerpt || '',
          teaser: a.teaser || a.excerpt || '',
          author: a.author || '',
          date: a.date || '',
          dateFormatted: a.dateFormatted || '',
          publication: a.publication || 'Playbook',
          source: a.source || 'playbook',
          tagsScope: a.tags?.scope || [],
          tagsSport: a.tags?.sport || [],
          tagsVertical: a.tags?.vertical || [],
          priority: a.priority ?? 3,
          featured: a.featured === true,
          mostrarAutor: a.mostrar_autor === true,
          readingTime: a.reading_time ?? 1,
          substackUrl: a.substack_url || '',
          imageUrl: a.imageUrl || '',
          updatedAt: new Date(),
        },
      });
    count++;
  }
  return { total: list.length, migrated: count };
}

async function migrateSiteContent() {
  const data = await readJson<Record<string, unknown>>('content.json');
  await db
    .insert(siteContent)
    .values({ id: 1, data, version: 1 })
    .onConflictDoUpdate({
      target: siteContent.id,
      set: { data, updatedAt: new Date() },
    });
}

async function main() {
  console.log('[migrate] starting articles.json + content.json -> Postgres');

  const { total, migrated } = await migrateArticles();
  console.log(`[migrate] articles: ${migrated}/${total} upserted`);

  await migrateSiteContent();
  console.log('[migrate] site_content: upserted (id=1)');

  const [{ count: rowCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles);
  console.log(`[migrate] verification: ${rowCount} rows now in articles table`);

  if (rowCount !== total) {
    console.error(`[migrate] MISMATCH: expected ${total} articles, found ${rowCount}`);
    process.exitCode = 1;
    return;
  }

  console.log('[migrate] done.');
}

main()
  .catch(err => {
    console.error('[migrate] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
