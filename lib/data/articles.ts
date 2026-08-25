import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '../db/client';
import { articles } from '../db/schema';
import { rankArticles, selectHero } from '../rank';
import { LEAD_COUNT, LIST_COUNT, normalizeSource } from '../constants';
import type { TaxonomyTier } from '../taxonomy';

export type Article = typeof articles.$inferSelect;

export const ARTICLES_CACHE_TAG = 'articles';

// Every column except bodyJson/bodyHtml (the two heavy ones — full TipTap
// document + rendered HTML per article). Nothing that reads getAllArticles()
// ever needs the body: Header/sitemap/feed/most-read/related-articles all
// just need metadata to list, link, or rank. Fetching the body on every one
// of those call sites is what blew through Neon's monthly network-transfer
// allowance in 5 days (see postmortem) despite a ~30-row table — the fix is
// this query, not more caching alone. getArticleById below still selects
// everything, since the article page needs the real body for the one
// article it's rendering.
const LIST_COLUMNS = {
  id: articles.id,
  title: articles.title,
  excerpt: articles.excerpt,
  teaser: articles.teaser,
  wallTeaser: articles.wallTeaser,
  author: articles.author,
  date: articles.date,
  dateFormatted: articles.dateFormatted,
  publication: articles.publication,
  source: articles.source,
  tagsScope: articles.tagsScope,
  tagsSport: articles.tagsSport,
  tagsVertical: articles.tagsVertical,
      tagsProperty: articles.tagsProperty,
  priority: articles.priority,
  score: articles.score,
  confirmed: articles.confirmed,
  featured: articles.featured,
  mostrarAutor: articles.mostrarAutor,
  readingTime: articles.readingTime,
  substackUrl: articles.substackUrl,
  sourceUrl: articles.sourceUrl,
  imageUrl: articles.imageUrl,
  imageCredit: articles.imageCredit,
  status: articles.status,
  createdAt: articles.createdAt,
  updatedAt: articles.updatedAt,
  updatedBy: articles.updatedBy,
} as const;

// Also caches the query result itself for 60s across requests (tagged so an
// editor's publish/save/archive invalidates it immediately via
// revalidateTag) — every (public) route is force-dynamic (see that layout's
// comment for why), so without this every page view, sitemap crawl, and RSS
// fetch re-ran this query from scratch, with nothing shared between them.
const queryPublishedArticles = unstable_cache(
  async () => {
    const rows = await db.select(LIST_COLUMNS).from(articles).where(eq(articles.status, 'published'));
    // normalizeSource here — the single data boundary every public reader
    // goes through — so rows still carrying the legacy 'industry-shots'
    // key (until scripts/migrate-source-noticias.ts runs) file under
    // 'noticias' everywhere downstream: hubs, filters, CSS data-source
    // hooks, taxonomy. All source filtering happens in memory on this
    // result, so no SQL query needs to know the legacy key exists.
    // scoreBoleta joins bodyJson/bodyHtml as a deliberate omission from
    // LIST_COLUMNS (see above): the audit payload is only ever opened for one
    // article at a time in the CMS, so shipping it on every list query would
    // reintroduce exactly the per-row weight this query exists to remove.
    return rows.map(row => ({ ...row, source: normalizeSource(row.source), bodyJson: null, bodyHtml: null, scoreBoleta: null }));
  },
  ['articles-published-list'],
  { revalidate: 60, tags: [ARTICLES_CACHE_TAG] },
);

// Mirrors the legacy architecture on purpose: legacy/js/articles.js fetched
// the entire articles.json into memory and did all ranking/filtering
// client-side. At this corpus size (capped at 500 by the legacy webhook,
// 30 today) a single query + in-memory filtering is simpler and exactly as
// correct as hand-rolled SQL per filter combination — this is the one place
// all the page-level query helpers below read from, cached per request via
// React's cache() so multiple components (ticker, hero, list) don't each
// issue their own query.
export const getAllArticles = cache(async (): Promise<Article[]> => {
  const rows = await queryPublishedArticles();
  return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
});

// cache()-wrapped so a request that reads the full article (body included)
// after already resolving it another way within the same render doesn't
// issue the same by-id lookup twice.
export const getArticleById = cache(async (id: string): Promise<Article | null> => {
  const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return row ? { ...row, source: normalizeSource(row.source) } : null;
});

export type ArticleMeta = {
  /** Coverage tier, so the kicker can badge by hub destination. */
  tagsProperty: string[];
  id: string;
  title: string;
  excerpt: string;
  wallTeaser: string | null;
  imageUrl: string;
  imageCredit: string | null;
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
//
// cache()-wrapped: generateMetadata and the page component both call this
// with the same id during the same request (Next runs both per navigation)
// — without this, every article view ran the identical lookup twice.
export const getArticleMetaById = cache(async (id: string): Promise<ArticleMeta | null> => {
  const [row] = await db
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      wallTeaser: articles.wallTeaser,
      imageUrl: articles.imageUrl,
      imageCredit: articles.imageCredit,
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
      tagsProperty: articles.tagsProperty,
      substackUrl: articles.substackUrl,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return row ? { ...row, source: normalizeSource(row.source) } : null;
});

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
  property: 'tagsProperty',
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
  // Mirrors NewsGrid's own pool exactly: the homepage news band excludes
  // source='opinion' (those have their own live section further down the
  // page), so the "what is already on the homepage" subtraction has to
  // exclude them too. Computing the hero/list from a pool the homepage
  // doesn't actually use would let an opinion piece occupy one of the six
  // shown slots here and get subtracted out of the archive while never
  // appearing on the homepage at all — i.e. reachable from neither page.
  const newsRanked = rankArticles(all.filter(a => a.source !== 'opinion'));
  const hero = selectHero(newsRanked);
  const list = newsRanked.filter(a => a !== hero).slice(0, LIST_COUNT);
  const shownIds = new Set([hero, ...list].filter(Boolean).map(a => (a as Article).id));
  // Subtract from the FULL ranked pool, not from the news-only one: opinion
  // pieces are never on the homepage news band, so they belong in the
  // archive from the moment they're published — including behind
  // /archivo?source=opinion, which is where the homepage's Opinión section
  // sends readers.
  const overflow = rankArticles(all).filter(a => !shownIds.has(a.id));

  return overflow.filter(a => {
    if (filters.source && filters.source !== 'all' && a.source !== filters.source) return false;
    if (filters.scope && filters.scope !== 'all' && !a.tagsScope.includes(filters.scope)) return false;
    if (filters.sport && filters.sport !== 'all' && !a.tagsSport.includes(filters.sport)) return false;
    if (filters.vertical && filters.vertical !== 'all' && !a.tagsVertical.includes(filters.vertical)) return false;
    return true;
  });
}

// Product hubs (Roadmap Agosto 2026, Fase 1 — carpetas internas por
// producto): a hub is the product's OWN archive, so unlike
// getArchiveArticles it does NOT subtract what the homepage currently
// shows — a reader on /la-lana should see every Expediente, including one
// that happens to be today's homepage hero. Plain reverse-chronological
// order on purpose: these are editions/cases of a publication, not a
// ranked news feed, and e.g. El Expediente's case numbering depends on
// publication order staying stable.
export async function getArticlesBySource(source: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all.filter(a => a.source === source);
}

/**
 * A product hub's pool, keyed on its `property` tag rather than on `source`.
 *
 * Deliberately NOT `getArticlesByTag('property', …)`: that one re-ranks, and
 * this exists to be an exact swap for `getArticlesBySource` on a hub page —
 * same rows, same order, one field over. `source` also decides the ranking
 * track (`lib/rank.ts`'s `trackFor`), so a hub reading it was one string
 * carrying two unrelated decisions; the tag separates them
 * (`lib/taxonomy.ts` REQUIRED_PROPERTY_BY_SOURCE).
 */
export async function getArticlesByProperty(tag: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all.filter(a => (a.tagsProperty || []).includes(tag));
}

// Admin-only: includes drafts (archived articles), unlike getAllArticles()
// above which the public site uses and which filters to status='published'.
// Not cache()-wrapped — the admin dashboard is the only caller, once per
// page load, so there's nothing to dedupe.
export async function getAllArticlesForAdmin(): Promise<Article[]> {
  const rows = await db.select().from(articles);
  return rows
    .map(row => ({ ...row, source: normalizeSource(row.source) }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export { rankArticles, selectHero };
export { LEAD_COUNT };
