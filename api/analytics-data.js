// api/analytics-data.js
// Powers /admin/analytics.html. Requires the same admin session token as
// the rest of /api/admin-*.js — this is traffic data for the editorial
// team, not public.
//
// KPIs, referrers, countries, and devices all come from the Visits
// dataset, which is always available once Web Analytics is on. The "top
// articles" panel is the one exception: Vercel's Visits "requestPath"
// dimension strips query strings (confirmed in Vercel's own docs — Pages
// are tracked "without query parameters"), and every Playbook article
// lives at the same path, /articulo.html, differentiated only by ?id=.
// Grouping Visits by requestPath would show one lumped row for every
// article ever published combined — not useful as "top articles". Getting
// a real per-article count needs a custom Vercel Analytics event fired
// with the article id as event data (see js/article-page.js, event name
// pageview_article below) queried against the separate Events dataset.
// Custom events need the "Custom Events" permission (Pro/Enterprise on
// Vercel) — if that's not available on this plan, or no events have
// landed yet, this section alone degrades to an empty state instead of
// breaking the rest of the page.

import { verifyToken, getBearerToken } from '../lib/auth.js';
import { count, aggregateVisits, aggregateEvents } from '../lib/vercel-analytics.js';
import { resolveSiteUrl } from '../lib/site-url.js';

const ARTICLE_EVENT_NAME = 'pageview_article';
const DAY_MS = 24 * 60 * 60 * 1000;

function isoNow() {
  return new Date().toISOString();
}
function isoDaysAgo(days) {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}
function isoStartOfDayUTC(daysBack) {
  const d = new Date(Date.now() - daysBack * DAY_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function pctDelta(current, prior) {
  if (typeof current !== 'number' || typeof prior !== 'number') return null;
  if (prior === 0) return current === 0 ? 0 : null;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

async function safeCount(range) {
  try {
    return await count(range);
  } catch (err) {
    console.error('[Playbook] analytics-data count error:', err.message);
    return null;
  }
}

async function periodKpis(sinceCurrent, untilCurrent, sincePrior, untilPrior) {
  const [current, prior] = await Promise.all([
    safeCount({ since: sinceCurrent, until: untilCurrent }),
    safeCount({ since: sincePrior, until: untilPrior })
  ]);
  return {
    pageviews: current ? current.pageviews : null,
    visitors: current ? current.visitors : null,
    deltaPageviews: current ? pctDelta(current.pageviews, prior ? prior.pageviews : null) : null,
    deltaVisitors: current ? pctDelta(current.visitors, prior ? prior.visitors : null) : null
  };
}

async function topArticlesPanel(siteUrl) {
  let rows;
  try {
    rows = await aggregateEvents({
      by: 'eventData/article_id',
      since: isoDaysAgo(30),
      until: isoNow(),
      limit: 10,
      filter: `eventName eq '${ARTICLE_EVENT_NAME}'`
    });
  } catch (err) {
    console.error('[Playbook] analytics-data topArticles error:', err.message);
    return { available: false, items: [], error: err.message };
  }
  if (!rows.length) return { available: true, items: [], error: null };

  let pool = [];
  try {
    const r = await fetch(`${siteUrl}/articles.json`);
    if (r.ok) {
      const data = await r.json();
      pool = Array.isArray(data.articles) ? data.articles : [];
    }
  } catch {
    // articles.json unreachable: items below just fall back to the raw id as title.
  }
  const byId = new Map(pool.map(a => [a.id, a]));

  const items = rows
    .map(row => {
      const id = row.eventData;
      const article = byId.get(id);
      return {
        id,
        title: article ? article.title : (id || 'Desconocido'),
        url: `${siteUrl}/articulo.html?id=${encodeURIComponent(id || '')}`,
        publication: article ? article.publication : null,
        count: row.count || 0
      };
    })
    .sort((a, b) => b.count - a.count);

  return { available: true, items, error: null };
}

async function breakdownPanel(dimension) {
  try {
    const rows = await aggregateVisits({
      by: dimension,
      since: isoDaysAgo(30),
      until: isoNow(),
      limit: 5
    });
    const items = rows
      .map(row => ({
        label: row[dimension] || 'Desconocido',
        pageviews: row.pageviews || 0,
        visitors: row.visitors || 0
      }))
      .sort((a, b) => b.pageviews - a.pageviews);
    return { available: true, items, error: null };
  } catch (err) {
    console.error(`[Playbook] analytics-data breakdown(${dimension}) error:`, err.message);
    return { available: false, items: [], error: err.message };
  }
}

export default async function handler(req, res) {
  const claims = verifyToken(getBearerToken(req));
  if (!claims) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const siteUrl = resolveSiteUrl(req);

  const emptyResponse = {
    updatedAt: isoNow(),
    kpis: { today: null, last7: null, last30: null },
    topArticles: { available: false, items: [], error: null },
    referrers: { available: false, items: [], error: null },
    countries: { available: false, items: [], error: null },
    devices: { available: false, items: [], error: null },
    error: null
  };

  try {
    const [today, last7, last30, topArticles, referrers, countries, devices] = await Promise.all([
      periodKpis(isoStartOfDayUTC(0), isoNow(), isoStartOfDayUTC(1), isoStartOfDayUTC(0)),
      periodKpis(isoDaysAgo(7), isoNow(), isoDaysAgo(14), isoDaysAgo(7)),
      periodKpis(isoDaysAgo(30), isoNow(), isoDaysAgo(60), isoDaysAgo(30)),
      topArticlesPanel(siteUrl),
      breakdownPanel('referrerHostname'),
      breakdownPanel('country'),
      breakdownPanel('deviceType')
    ]);

    return res.status(200).json({
      updatedAt: isoNow(),
      kpis: { today, last7, last30 },
      topArticles,
      referrers,
      countries,
      devices,
      error: null
    });
  } catch (err) {
    console.error('[Playbook] analytics-data fatal error:', err.message);
    return res.status(200).json({
      ...emptyResponse,
      error: 'No se pudo cargar la analítica en este momento.'
    });
  }
}
