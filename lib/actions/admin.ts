'use server';

import { and, eq, sql } from 'drizzle-orm';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { auth } from '@/auth';
import { db } from '@/lib/db/client';
import { articles, contentRevisions, siteContent } from '@/lib/db/schema';
import type { Article } from '@/lib/data/articles';
import type { SiteContentData } from '@/lib/data/site-content';
import { TIPTAP_EXTENSIONS } from '@/lib/tiptap-extensions';
import { slugify } from '@/lib/slugify';

async function requireEditor() {
  const session = await auth();
  if (!session || session.user.role !== 'editor') {
    throw new Error('Unauthorized');
  }
  return session;
}

// Backs the conflict modal's "reload latest" button — a fresh read, not
// lib/data/site-content.ts's getSiteContent() (React's cache() there only
// dedupes within a single request; a distinct Server Action invocation is
// already a fresh request, so this reads current data either way, but
// calling the admin's own action keeps the version alongside the data).
export async function reloadSiteContent(): Promise<{ data: SiteContentData; version: number }> {
  await requireEditor();
  const [row] = await db.select().from(siteContent).where(eq(siteContent.id, 1)).limit(1);
  if (!row) throw new Error('site_content sin fila (id=1)');
  return { data: row.data as SiteContentData, version: row.version };
}

export async function reloadArticle(id: string): Promise<Article | null> {
  await requireEditor();
  const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return row ?? null;
}

function renderBodyHtml(bodyJson: Record<string, unknown> | null | undefined) {
  if (!bodyJson) return null;
  return generateHTML(bodyJson as JSONContent, TIPTAP_EXTENSIONS);
}

// ---------------------------------------------------------------- site_content

export type SaveSiteContentResult =
  | { conflict: true }
  | { conflict: false; version: number; updatedAt: Date };

export async function saveSiteContent(
  data: SiteContentData,
  expectedVersion: number,
): Promise<SaveSiteContentResult> {
  const session = await requireEditor();

  // Single conditional UPDATE instead of legacy's read-then-write: atomic,
  // no separate SELECT, no window for a second writer to sneak in between
  // the check and the write. An empty result means someone else's version
  // won the race since this editor last loaded the data.
  const [updated] = await db
    .update(siteContent)
    .set({ data, version: expectedVersion + 1, updatedAt: new Date(), updatedBy: session.user.id })
    .where(and(eq(siteContent.id, 1), eq(siteContent.version, expectedVersion)))
    .returning();

  if (!updated) {
    return { conflict: true };
  }

  await db.insert(contentRevisions).values({
    siteContentVersion: updated.version,
    editorId: session.user.id,
    snapshot: data,
  });

  return { conflict: false, version: updated.version, updatedAt: updated.updatedAt };
}

// ---------------------------------------------------------------- articles

export type ArticleInput = {
  title: string;
  excerpt: string;
  teaser: string;
  wallTeaser: string;
  bodyJson: Record<string, unknown> | null;
  author: string;
  date: string;
  dateFormatted: string;
  publication: string;
  source: string;
  tagsScope: string[];
  tagsSport: string[];
  tagsVertical: string[];
  priority: number;
  featured: boolean;
  mostrarAutor: boolean;
  readingTime: number;
  substackUrl: string;
  imageUrl: string;
};

export type SaveArticleResult = { conflict: true } | { conflict: false; article: Article };

// expectedUpdatedAt is the ISO string of the row's updatedAt as last loaded
// by this editor. Compared via date_trunc('milliseconds', ...) on both
// sides rather than plain equality: rows written by scripts/migrate-json-to-db.ts's
// initial insert (or anything else that lets `updatedAt`'s schema-level
// defaultNow() fire) get a Postgres-computed `now()` with real microsecond
// precision, while a JS Date (what every value flowing through this action
// is built from) can only ever hold millisecond precision — a plain
// `eq(articles.updatedAt, ...)` would then never match for those rows,
// reporting a false conflict on the very first save after migration.
// Verified against this repo's actual local data, not assumed: every
// migrated row's `updated_at` came back with a non-zero microseconds
// component when checked directly with psql.
function sameMillisecond(column: typeof articles.updatedAt, expected: string) {
  return sql`date_trunc('milliseconds', ${column}) = date_trunc('milliseconds', ${expected}::timestamptz)`;
}

export async function saveArticle(
  id: string,
  input: ArticleInput,
  expectedUpdatedAt: string,
): Promise<SaveArticleResult> {
  const session = await requireEditor();
  const bodyHtml = renderBodyHtml(input.bodyJson);

  const [updated] = await db
    .update(articles)
    .set({
      title: input.title,
      excerpt: input.excerpt,
      teaser: input.teaser,
      wallTeaser: input.wallTeaser || null,
      bodyJson: input.bodyJson,
      bodyHtml,
      author: input.author,
      date: input.date,
      dateFormatted: input.dateFormatted,
      publication: input.publication,
      source: input.source,
      tagsScope: input.tagsScope,
      tagsSport: input.tagsSport,
      tagsVertical: input.tagsVertical,
      priority: input.priority,
      featured: input.featured,
      mostrarAutor: input.mostrarAutor,
      readingTime: input.readingTime,
      substackUrl: input.substackUrl,
      imageUrl: input.imageUrl,
      updatedAt: new Date(),
      updatedBy: session.user.id,
    })
    .where(and(eq(articles.id, id), sameMillisecond(articles.updatedAt, expectedUpdatedAt)))
    .returning();

  if (!updated) {
    return { conflict: true };
  }

  await db.insert(contentRevisions).values({
    articleId: updated.id,
    editorId: session.user.id,
    snapshot: updated,
  });

  return { conflict: false, article: updated };
}

export async function archiveArticle(id: string): Promise<{ ok: true }> {
  const session = await requireEditor();
  await db
    .update(articles)
    .set({ status: 'draft', updatedAt: new Date(), updatedBy: session.user.id })
    .where(eq(articles.id, id));
  return { ok: true };
}

export async function createArticle(input: ArticleInput & { id?: string }): Promise<{ article: Article }> {
  const session = await requireEditor();
  const bodyHtml = renderBodyHtml(input.bodyJson);
  const baseId = (input.id && input.id.trim()) || slugify(input.title) || `articulo-${Date.now().toString(36)}`;

  let id = baseId;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const [inserted] = await db
        .insert(articles)
        .values({
          id,
          title: input.title,
          excerpt: input.excerpt,
          teaser: input.teaser,
          wallTeaser: input.wallTeaser || null,
          bodyJson: input.bodyJson,
          bodyHtml,
          author: input.author,
          date: input.date,
          dateFormatted: input.dateFormatted,
          publication: input.publication,
          source: input.source,
          tagsScope: input.tagsScope,
          tagsSport: input.tagsSport,
          tagsVertical: input.tagsVertical,
          priority: input.priority,
          featured: input.featured,
          mostrarAutor: input.mostrarAutor,
          readingTime: input.readingTime,
          substackUrl: input.substackUrl,
          imageUrl: input.imageUrl,
          status: 'published',
          updatedAt: new Date(),
          updatedBy: session.user.id,
        })
        .returning();

      await db.insert(contentRevisions).values({
        articleId: inserted.id,
        editorId: session.user.id,
        snapshot: inserted,
      });

      return { article: inserted };
    } catch (err: unknown) {
      // Same id-collision fallback as app/api/update-articles/route.ts: a
      // Postgres unique_violation on the primary key gets one retry with a
      // short suffix, matching legacy's slug-collision fallback.
      if ((err as { code?: string })?.code === '23505' && attempt === 0) {
        id = `${baseId}-${Date.now().toString(36)}`;
        continue;
      }
      throw err;
    }
  }
  throw new Error('createArticle: unreachable');
}
