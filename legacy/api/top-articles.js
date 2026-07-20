// api/top-articles.js
// Powers the homepage "Más leídas" module with real GA4 pageview data — see
// lib/ga4.js for the credentials this needs and why they're separate from
// GA4_MEASUREMENT_ID. Always returns an empty list (never a fabricated or
// stubbed number) when GA4 isn't configured yet or the API call fails, so
// js/most-read.js just hides the module instead of showing something fake.

import { topArticleIds } from '../lib/ga4.js';
import { resolveSiteUrl } from '../lib/site-url.js';

export default async function handler(req, res) {
  const siteUrl = resolveSiteUrl(req);
  res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=300');

  let ranked;
  try {
    ranked = await topArticleIds({ days: 7, limit: 10 });
  } catch (err) {
    console.error('[Playbook] GA4 top-articles error:', err.message);
    return res.status(200).json({ articles: [], configured: true, error: 'ga4_unavailable' });
  }

  if (!ranked) {
    return res.status(200).json({ articles: [], configured: false });
  }
  if (!ranked.length) {
    return res.status(200).json({ articles: [], configured: true });
  }

  let pool = [];
  try {
    const r = await fetch(`${siteUrl}/articles.json`);
    if (r.ok) {
      const data = await r.json();
      pool = Array.isArray(data.articles) ? data.articles : [];
    }
  } catch {
    // articles.json unreachable: falls through to an empty pool below.
  }

  const byId = new Map(pool.map(a => [a.id, a]));
  const articles = ranked.map(r => byId.get(r.id)).filter(Boolean).slice(0, 5);

  return res.status(200).json({ articles, configured: true });
}
