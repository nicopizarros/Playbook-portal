// Server-only orchestration for the admin analytics dashboard — port of
// legacy/api/analytics-data.js's handler body (the auth/HTTP layer is gone;
// this is called directly from a Server Component already gated by
// app/admin/(protected)/layout.tsx's guard). One simplification over
// legacy: the top-articles panel maps event ids to titles via
// getAllArticlesForAdmin() (direct DB read) instead of legacy's
// `fetch(${siteUrl}/articles.json)` self-HTTP-call, which only existed
// because that serverless function had no direct database access.
import { count, aggregateVisits, aggregateEvents } from './vercel-analytics';
import { getAllArticlesForAdmin } from './data/articles';

const ARTICLE_EVENT_NAME = 'pageview_article';
const DAY_MS = 24 * 60 * 60 * 1000;

function isoNow() {
  return new Date().toISOString();
}
function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}
function isoStartOfDayUTC(daysBack: number) {
  const d = new Date(Date.now() - daysBack * DAY_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function pctDelta(current: number | null, prior: number | null): number | null {
  if (typeof current !== 'number' || typeof prior !== 'number') return null;
  if (prior === 0) return current === 0 ? 0 : null;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

export type PeriodKpi = {
  pageviews: number | null;
  visitors: number | null;
  deltaPageviews: number | null;
  deltaVisitors: number | null;
};

async function safeCount(range: { since: string; until: string }) {
  try {
    return await count(range);
  } catch (err) {
    console.error('[Playbook] analytics-data count error:', (err as Error).message);
    return null;
  }
}

async function periodKpis(sinceCurrent: string, untilCurrent: string, sincePrior: string, untilPrior: string): Promise<PeriodKpi> {
  const [current, prior] = await Promise.all([
    safeCount({ since: sinceCurrent, until: untilCurrent }),
    safeCount({ since: sincePrior, until: untilPrior }),
  ]);
  return {
    pageviews: current ? current.pageviews : null,
    visitors: current ? current.visitors : null,
    deltaPageviews: current ? pctDelta(current.pageviews, prior ? prior.pageviews : null) : null,
    deltaVisitors: current ? pctDelta(current.visitors, prior ? prior.visitors : null) : null,
  };
}

export type TopArticleItem = { id: string; title: string; url: string; publication: string | null; count: number };
export type TopArticlesPanel = { available: boolean; items: TopArticleItem[]; error: string | null };

async function topArticlesPanel(): Promise<TopArticlesPanel> {
  let rows: Record<string, unknown>[];
  try {
    rows = await aggregateEvents({
      by: 'eventData/article_id',
      since: isoDaysAgo(30),
      until: isoNow(),
      limit: 10,
      filter: `eventName eq '${ARTICLE_EVENT_NAME}'`,
    });
  } catch (err) {
    console.error('[Playbook] analytics-data topArticles error:', (err as Error).message);
    return { available: false, items: [], error: (err as Error).message };
  }
  if (!rows.length) return { available: true, items: [], error: null };

  const pool = await getAllArticlesForAdmin().catch(() => []);
  const byId = new Map(pool.map(a => [a.id, a]));

  const items = rows
    .map(row => {
      const id = String(row.eventData ?? '');
      const article = byId.get(id);
      return {
        id,
        title: article ? article.title : id || 'Desconocido',
        url: `/articulo?id=${encodeURIComponent(id)}`,
        publication: article ? article.publication : null,
        count: Number(row.count) || 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  return { available: true, items, error: null };
}

export type PanelItem = { label: string; pageviews: number; visitors: number };
export type Panel = { available: boolean; items: PanelItem[]; error: string | null };

async function breakdownPanel(dimension: string): Promise<Panel> {
  try {
    const rows = await aggregateVisits({ by: dimension, since: isoDaysAgo(30), until: isoNow(), limit: 5 });
    const items = rows
      .map(row => ({
        label: String(row[dimension] ?? 'Desconocido') || 'Desconocido',
        pageviews: Number(row.pageviews) || 0,
        visitors: Number(row.visitors) || 0,
      }))
      .sort((a, b) => b.pageviews - a.pageviews);
    return { available: true, items, error: null };
  } catch (err) {
    console.error(`[Playbook] analytics-data breakdown(${dimension}) error:`, (err as Error).message);
    return { available: false, items: [], error: (err as Error).message };
  }
}

export type AnalyticsSnapshot = {
  updatedAt: string;
  kpis: { today: PeriodKpi; last7: PeriodKpi; last30: PeriodKpi };
  topArticles: TopArticlesPanel;
  referrers: Panel;
  countries: Panel;
  devices: Panel;
  error: string | null;
};

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const emptyKpi: PeriodKpi = { pageviews: null, visitors: null, deltaPageviews: null, deltaVisitors: null };
  const empty: AnalyticsSnapshot = {
    updatedAt: isoNow(),
    kpis: { today: emptyKpi, last7: emptyKpi, last30: emptyKpi },
    topArticles: { available: false, items: [], error: null },
    referrers: { available: false, items: [], error: null },
    countries: { available: false, items: [], error: null },
    devices: { available: false, items: [], error: null },
    error: null,
  };

  try {
    const [today, last7, last30, topArticles, referrers, countries, devices] = await Promise.all([
      periodKpis(isoStartOfDayUTC(0), isoNow(), isoStartOfDayUTC(1), isoStartOfDayUTC(0)),
      periodKpis(isoDaysAgo(7), isoNow(), isoDaysAgo(14), isoDaysAgo(7)),
      periodKpis(isoDaysAgo(30), isoNow(), isoDaysAgo(60), isoDaysAgo(30)),
      topArticlesPanel(),
      breakdownPanel('referrerHostname'),
      breakdownPanel('country'),
      breakdownPanel('deviceType'),
    ]);

    return {
      updatedAt: isoNow(),
      kpis: { today, last7, last30 },
      topArticles,
      referrers,
      countries,
      devices,
      error: null,
    };
  } catch (err) {
    console.error('[Playbook] analytics-data fatal error:', (err as Error).message);
    return { ...empty, error: 'No se pudo cargar la analítica en este momento.' };
  }
}
