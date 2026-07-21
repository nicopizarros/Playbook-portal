import { topArticleIds } from './ga4';
import { getAllArticles, type Article } from './data/articles';

// Backs components/home/MostReadSection.tsx. Returns null when GA4 isn't
// configured (the section renders nothing at all, not even a heading —
// same as legacy/js/most-read.js's section.hidden toggle, just decided
// server-side instead of via client-side DOM manipulation), or an array
// (possibly empty) once GA4 is configured. Resolves ids against
// getAllArticles() — a direct DB read, simpler than legacy/api/top-articles.js's
// self-`fetch(articles.json)` workaround, which only existed because that
// serverless function had no direct database access (same simplification
// already made for the admin dashboard's top-articles panel, see
// lib/analytics-data.ts).
export async function getMostReadArticles(): Promise<Article[] | null> {
  const ranked = await topArticleIds({ days: 7, limit: 10 });
  if (!ranked) return null;
  if (!ranked.length) return [];

  const pool = await getAllArticles();
  const byId = new Map(pool.map(a => [a.id, a]));
  return ranked
    .map(r => byId.get(r.id))
    .filter((a): a is Article => !!a)
    .slice(0, 5);
}
