// Server-only orchestration for the admin analytics dashboard — port of
// legacy/api/analytics-data.js's handler body (the auth/HTTP layer is gone;
// this is called directly from a Server Component already gated by
// app/admin/(protected)/layout.tsx's guard). One simplification over
// legacy: the top-articles panel maps event ids to titles via
// getAllArticlesForAdmin() (direct DB read) instead of legacy's
// `fetch(${siteUrl}/articles.json)` self-HTTP-call, which only existed
// because that serverless function had no direct database access.
import * as vercelAnalytics from './vercel-analytics';
import * as ga4Analytics from './ga4-analytics';
import * as firstParty from './first-party-analytics';
import { getAllArticlesForAdmin } from './data/articles';
import { articlePath } from '@/lib/article-url';

// Which source actually answered — the UI words its numbers differently
// for the metering log ("lecturas"/"lectores", see AnalyticsView) than
// for real pageviews, so the label must travel with the data.
export type MetricsSource = 'ga4' | 'vercel' | 'first-party';

// Added 2026-07-31: try Google Analytics first for every panel below, fall
// back to Vercel Analytics only when GA4 isn't configured yet or a specific
// report call fails -- see lib/ga4-analytics.ts for why GA4 can cover all
// five panels here, leaving Vercel as the safety net rather than a source
// for anything exclusive to it.
async function withGa4Fallback<T>(label: string, ga4Call: () => Promise<T>, vercelCall: () => Promise<T>): Promise<T> {
  if (ga4Analytics.isConfigured()) {
    try {
      return await ga4Call();
    } catch (err) {
      console.error(`[Playbook] analytics-data ${label} (GA4) error, falling back to Vercel Analytics:`, (err as Error).message);
    }
  }
  return vercelCall();
}

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

// GA4 → Vercel → the site's own metering log. The first two need
// credentials in Vercel that may not exist yet; the last one is a direct
// DB read that works from day one (same ladder lib/most-read.ts climbs).
// `kpiSource` records the lowest rung any KPI call had to reach so the
// UI can label the numbers for what they are.
let kpiSource: MetricsSource = 'ga4';

async function safeCount(range: { since: string; until: string }) {
  try {
    return await withGa4Fallback('count', () => ga4Analytics.count(range), () => vercelAnalytics.count(range));
  } catch (err) {
    console.error('[Playbook] analytics-data count error, falling back to first-party reads:', (err as Error).message);
  }
  try {
    kpiSource = 'first-party';
    return await firstParty.count({ since: range.since, until: range.until });
  } catch (err) {
    console.error('[Playbook] analytics-data first-party count error:', (err as Error).message);
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
  const params = {
    by: 'eventData/article_id',
    since: isoDaysAgo(30),
    until: isoNow(),
    limit: 10,
    filter: `eventName eq '${ARTICLE_EVENT_NAME}'`,
  };
  let rows: Record<string, unknown>[];
  try {
    rows = await withGa4Fallback(
      'topArticles',
      () => ga4Analytics.aggregateEvents(params),
      () => vercelAnalytics.aggregateEvents(params)
    );
  } catch (err) {
    // Same last rung as the KPIs: the metering log always has an answer.
    console.error('[Playbook] analytics-data topArticles error, falling back to first-party reads:', (err as Error).message);
    try {
      const reads = await firstParty.topArticles({ since: params.since, until: params.until, limit: params.limit });
      rows = reads.map(r => ({ eventData: r.id, count: r.count }));
    } catch (fpErr) {
      console.error('[Playbook] analytics-data first-party topArticles error:', (fpErr as Error).message);
      return { available: false, items: [], error: (err as Error).message };
    }
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
        url: articlePath(id),
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
  const params = { by: dimension, since: isoDaysAgo(30), until: isoNow(), limit: 5 };
  try {
    const rows = await withGa4Fallback(
      `breakdown(${dimension})`,
      () => ga4Analytics.aggregateVisits(params),
      () => vercelAnalytics.aggregateVisits(params)
    );
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
  /** Which ladder rung answered the KPI/top-article numbers this time. */
  source: MetricsSource;
  kpis: { today: PeriodKpi; last7: PeriodKpi; last30: PeriodKpi };
  topArticles: TopArticlesPanel;
  referrers: Panel;
  countries: Panel;
  devices: Panel;
  error: string | null;
};

/**
 * Just the 30-day reach KPI — for the public /equipo page's stat strip.
 * Deliberately NOT getAnalyticsSnapshot(): that does 7 parallel panels
 * (top articles, referrers, countries, devices) built for the admin
 * dashboard's one authenticated caller. Calling the full snapshot from a
 * public, unauthenticated route would run all of that on every page view
 * for one number nobody reads from it.
 */
export async function getReachLast30Days(): Promise<PeriodKpi> {
  kpiSource = ga4Analytics.isConfigured() ? 'ga4' : 'vercel';
  try {
    return await periodKpis(isoDaysAgo(30), isoNow(), isoDaysAgo(60), isoDaysAgo(30));
  } catch (err) {
    console.error('[Playbook] analytics-data getReachLast30Days error:', (err as Error).message);
    return { pageviews: null, visitors: null, deltaPageviews: null, deltaVisitors: null };
  }
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  // Reset the source ladder per snapshot: 'ga4' when its creds exist,
  // 'vercel' when only Vercel's could answer, and safeCount overwrites to
  // 'first-party' the moment any KPI call has to reach the metering log.
  kpiSource = ga4Analytics.isConfigured() ? 'ga4' : 'vercel';
  const emptyKpi: PeriodKpi = { pageviews: null, visitors: null, deltaPageviews: null, deltaVisitors: null };
  const empty: AnalyticsSnapshot = {
    updatedAt: isoNow(),
    source: kpiSource,
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
      source: kpiSource,
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
