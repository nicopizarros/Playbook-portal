import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { articles } from '../db/schema';
import { rankArticles, selectHero } from '../rank';
import { LEAD_COUNT, LIST_COUNT } from '../constants';
import type { TaxonomyTier } from '../taxonomy';

export type Article = typeof articles.$inferSelect;

// Mirrors the legacy architecture on purpose: legacy/js/articles.js fetched
// the entire articles.json into memory and did all ranking/filtering
// client-side. At this corpus size (capped at 500 by the legacy webhook,
// 30 today) a single query + in-memory filtering is simpler and exactly as
// correct as hand-rolled SQL per filter combination — this is the one place
// all the page-level query helpers below read from, cached per request via
// React's cache() so multiple components (ticker, hero, list) don't each
// issue their own query.
export const getAllArticles = cache(async (): Promise<Article[]> => {
  const rows = await db.select().from(articles).where(eq(articles.status, 'published'));
  return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
});

export async function getArticleById(id: string): Promise<Article | null> {
  const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return row ?? null;
}

export type ArticleMeta = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  dateFormatted: string;
  date: string;
  readingTime: number;
  publication: string;
  source: string;
  author: string;
  mostrarAutor: boolean;
  tagsScope: string[];
  tagsSport: string[];
  tagsVertical: string[];
  substackUrl: string;
};

// Selects only the columns safe to expose to a reader who hasn't been
// granted full access yet — explicitly NOT teaser/bodyJson/bodyHtml. This
// is what makes "article body must not be present in any response sent to
// an unentitled reader" (see the brief) literally true: the walled render
// path in app/(public)/articulo/page.tsx calls only this function, so the
// body is never fetched into that request at all, not just fetched-and-
// hidden. generateMetadata also uses this exclusively (og:description etc.
// only ever need excerpt, never body, same as legacy behavior).
export async function getArticleMetaById(id: string): Promise<ArticleMeta | null> {
  const [row] = await db
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      imageUrl: articles.imageUrl,
      dateFormatted: articles.dateFormatted,
      date: articles.date,
      readingTime: articles.readingTime,
      publication: articles.publication,
      source: articles.source,
      author: articles.author,
      mostrarAutor: articles.mostrarAutor,
      tagsScope: articles.tagsScope,
      tagsSport: articles.tagsSport,
      tagsVertical: articles.tagsVertical,
      substackUrl: articles.substackUrl,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return row ?? null;
}

export async function getArticlesByAuthor(name: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all
    .filter(a => a.author === name)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

const TAG_COLUMN: Record<TaxonomyTier, keyof Article> = {
  scope: 'tagsScope',
  sport: 'tagsSport',
  vertical: 'tagsVertical',
};

export async function getArticlesByTag(tier: TaxonomyTier, value: string): Promise<Article[]> {
  const all = await getAllArticles();
  const column = TAG_COLUMN[tier];
  const ranked = rankArticles(all.filter(a => (a[column] as string[]).includes(value)));
  return ranked;
}

export type ArchiveFilters = {
  source?: string;
  scope?: string;
  sport?: string;
  vertical?: string;
};

// Same definition as legacy/js/archive-page.js's overflowArticles(): the
// ranked pool minus whatever the homepage currently shows (hero + list),
// always computed against the FULL unfiltered pool so "what's in the
// archive" matches reality regardless of which filters are active — then
// filters are applied on top of that overflow set.
export async function getArchiveArticles(filters: ArchiveFilters): Promise<Article[]> {
  const all = await getAllArticles();
  const ranked = rankArticles(all);
  const hero = selectHero(ranked);
  const list = ranked.filter(a => a !== hero).slice(0, LIST_COUNT);
  const shownIds = new Set([hero, ...list].filter(Boolean).map(a => (a as Article).id));
  const overflow = ranked.filter(a => !shownIds.has(a.id));

  return overflow.filter(a => {
    if (filters.source && filters.source !== 'all' && a.source !== filters.source) return false;
    if (filters.scope && filters.scope !== 'all' && !a.tagsScope.includes(filters.scope)) return false;
    if (filters.sport && filters.sport !== 'all' && !a.tagsSport.includes(filters.sport)) return false;
    if (filters.vertical && filters.vertical !== 'all' && !a.tagsVertical.includes(filters.vertical)) return false;
    return true;
  });
}

export { rankArticles, selectHero };
export { LEAD_COUNT };
