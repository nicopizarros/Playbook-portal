import type { MetadataRoute } from 'next';
import { getAllArticles } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { shouldShowAuthor } from '@/lib/related-articles';
import { TAXONOMY, type TaxonomyTier } from '@/lib/taxonomy';
import { PRODUCT_HUBS } from '@/lib/product-hubs';
import { HUBS } from '@/lib/hubs';
import { SITE_URL } from '@/lib/site-url';

// Originally set to `revalidate = 3600` (ISR) to match legacy/api/sitemap.js's
// Cache-Control: public, max-age=3600 without a DB round-trip on every
// crawl. Reverted: ISR/static routes are executed by Next.js AT BUILD TIME
// to produce their initial cached payload, unlike force-dynamic routes
// (see app/(public)/layout.tsx, app/feed.xml/route.ts), which Next only
// registers without executing during the build. That build-time execution
// requires a live POSTGRES_URL, which isn't set until a production
// Postgres is actually connected on Vercel — so this broke `next build`
// entirely before that's done. force-dynamic is the same trade-off Phase 2
// already made for every other DB-reading route: a sitemap crawl now hits
// Postgres directly instead of a cached response, immaterial at this
// traffic pattern and corpus size.
export const dynamic = 'force-dynamic';

// Same priority/changefreq tiers as legacy/api/sitemap.js, ported verbatim:
// homepage everything funnels through, article is the actual content,
// archive/tema aggregate multiple articles, autor is the thinnest.
const TIERS = {
  home: { priority: 1.0, changeFrequency: 'daily' as const },
  archive: { priority: 0.6, changeFrequency: 'daily' as const },
  article: { priority: 0.8, changeFrequency: 'weekly' as const },
  topic: { priority: 0.5, changeFrequency: 'weekly' as const },
  author: { priority: 0.4, changeFrequency: 'monthly' as const },
};

function isValidDate(str: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(str) && !isNaN(new Date(str).getTime());
}

function mostRecentDate(dates: string[]): Date | undefined {
  const valid = dates.filter(isValidDate).sort();
  return valid.length ? new Date(valid[valid.length - 1]) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, content] = await Promise.all([getAllArticles(), getSiteContent()]);
  const entries: MetadataRoute.Sitemap = [];

  const latestArticleDate = mostRecentDate(articles.map(a => a.date));

  entries.push({ url: `${SITE_URL}/`, lastModified: latestArticleDate, ...TIERS.home });
  entries.push({ url: `${SITE_URL}/archivo`, lastModified: latestArticleDate, ...TIERS.archive });

  // Product hubs (2026-08-05): each product's own front page. Same tier as
  // the archive — they aggregate articles — with lastModified from that
  // product's own latest piece (or the site's latest for a hub whose
  // source has no articles yet, i.e. TFBR).
  PRODUCT_HUBS.forEach(hub => {
    const hubDate = mostRecentDate(articles.filter(a => a.source === hub.source).map(a => a.date));
    entries.push({
      url: `${SITE_URL}${hub.path}`,
      lastModified: hubDate ?? latestArticleDate,
      ...TIERS.archive,
    });
  });

  // Coverage hubs (2026-08-18): /coberturas/<slug>. Same archive tier —
  // they aggregate too — but lastModified comes from the hub's own tagged
  // pool, falling back to the site's latest for a hub whose pool is still
  // empty (which is every hub on the day it launches).
  // Unlisted hubs are deliberately absent: nothing links to them and
  // nothing should crawl them until they are announced.
  HUBS.filter(h => h.listed).forEach(hub => {
    const pool = articles.filter(a => (a.tagsProperty ?? []).includes(hub.tag));
    entries.push({
      url: `${SITE_URL}/coberturas/${hub.slug}`,
      lastModified: mostRecentDate(pool.map(a => a.date)) ?? latestArticleDate,
      ...TIERS.archive,
    });
  });

  articles.forEach(a => {
    entries.push({
      url: `${SITE_URL}/articulo?id=${encodeURIComponent(a.id)}`,
      lastModified: isValidDate(a.date) ? new Date(a.date) : undefined,
      ...TIERS.article,
    });
  });

  // Author pages: only for an author with at least one article actually
  // showing that byline right now (mostrarAutor on the article, or the
  // site-wide switch) — an author page for someone never actually
  // bylined publicly would be unreachable from anywhere on the site.
  const authorDates = new Map<string, string[]>();
  articles.forEach(a => {
    if (!a.author || !shouldShowAuthor(a, content.siteSettings.mostrarAutorGlobal)) return;
    authorDates.set(a.author, [...(authorDates.get(a.author) || []), a.date]);
  });
  authorDates.forEach((dates, name) => {
    entries.push({
      url: `${SITE_URL}/autor?nombre=${encodeURIComponent(name)}`,
      lastModified: mostRecentDate(dates),
      ...TIERS.author,
    });
  });

  // Topic pages: one per scope/sport/vertical value at least one current
  // article carries, guarded against stale values no longer in the closed
  // taxonomy (an old article can still reference a removed tag string).
  const tagDates = new Map<string, string[]>();
  articles.forEach(a => {
    (Object.keys(TAXONOMY) as TaxonomyTier[]).forEach(tier => {
      // `property` is deliberately excluded: a hub tag's canonical
      // destination is /coberturas/<slug>, not a /tema page, and emitting
      // both would put two Playbook URLs in front of the same query.
      // (It also has to be excluded explicitly — the ternary below falls
      // through to tagsVertical for any unlisted tier, so leaving it in
      // would have read the WRONG column rather than failing loudly.)
      if (tier === 'property') return;
      const column = tier === 'scope' ? a.tagsScope : tier === 'sport' ? a.tagsSport : a.tagsVertical;
      column.forEach(value => {
        if (!TAXONOMY[tier].includes(value)) return;
        const key = `${tier}:${value}`;
        tagDates.set(key, [...(tagDates.get(key) || []), a.date]);
      });
    });
  });
  tagDates.forEach((dates, key) => {
    const [tier, value] = key.split(':');
    entries.push({
      url: `${SITE_URL}/tema?${tier}=${encodeURIComponent(value)}`,
      lastModified: mostRecentDate(dates),
      ...TIERS.topic,
    });
  });

  return entries;
}
