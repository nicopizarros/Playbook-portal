// GA4 Data API-backed drop-in equivalents of lib/vercel-analytics.ts's three
// exports (count/aggregateVisits/aggregateEvents) -- same call signatures,
// same "throw on failure, caller decides how to degrade" contract, so
// lib/analytics-data.ts can try this module first and fall back to Vercel
// Analytics unchanged. Added 2026-07-31: pull everything the admin panel
// needs from Google, keep Vercel Analytics only for whatever Google
// genuinely can't answer -- as it turns out, GA4's Data API can answer
// every one of this panel's five metrics (KPIs, top articles, referrers,
// countries, devices), so Vercel now only runs as the fallback: when GA4
// isn't configured yet, or when a specific report call fails.
//
// Caveat: GA4 'YYYY-MM-DD' date ranges are interpreted in the property's own
// reporting timezone (GA4 Admin -> Property Settings), not necessarily UTC,
// while the boundaries passed in here are computed in UTC
// (lib/analytics-data.ts's isoStartOfDayUTC/isoDaysAgo/isoNow) -- day
// boundaries can be off by a few hours right around midnight. Not worth a
// second Admin API round-trip just for a dashboard that already labels its
// own country/device numbers "aproximado" elsewhere (app/(public)/privacidad).
import { isConfigured, runReport } from './ga4';

export { isConfigured };

const ARTICLE_PATH_FRAGMENT = '/articulo';

function toGa4Date(iso: string): string {
  return iso.slice(0, 10);
}

export async function count({ since, until }: { since?: string; until?: string }) {
  const rows = await runReport({
    dateRanges: [{ startDate: toGa4Date(since || ''), endDate: toGa4Date(until || '') }],
    metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
  });
  return {
    pageviews: Number(rows[0]?.metricValues?.[0]?.value) || 0,
    visitors: Number(rows[0]?.metricValues?.[1]?.value) || 0,
  };
}

// Vercel's dimension names (Panel's `by` in lib/analytics-data.ts) mapped to
// their closest GA4 Data API dimension.
const BREAKDOWN_DIMENSIONS: Record<string, string> = {
  referrerHostname: 'sessionSource',
  country: 'country',
  deviceType: 'deviceCategory',
};

export async function aggregateVisits({
  by,
  since,
  until,
  limit,
}: {
  by: string;
  since?: string;
  until?: string;
  limit?: number;
}) {
  const dimension = BREAKDOWN_DIMENSIONS[by];
  if (!dimension) throw new Error(`ga4-analytics: sin dimensión de GA4 mapeada para "${by}"`);

  const rows = await runReport({
    dateRanges: [{ startDate: toGa4Date(since || ''), endDate: toGa4Date(until || '') }],
    dimensions: [{ name: dimension }],
    metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit,
  });

  // lib/analytics-data.ts's breakdownPanel() reads `row[dimension]` where
  // `dimension` is this same `by` string -- keep that exact key, not GA4's
  // own dimension name, so that caller needs zero changes.
  return rows.map(row => ({
    [by]: row.dimensionValues[0]?.value || '(not set)',
    pageviews: Number(row.metricValues[0]?.value) || 0,
    visitors: Number(row.metricValues[1]?.value) || 0,
  }));
}

// Vercel's aggregateEvents groups a real custom event ('pageview_article')
// by its eventData/article_id dimension -- the site never fires an
// equivalent GA4 custom event, so this reuses the same pagePath-based
// technique as lib/ga4.ts's topArticleIds() instead: filter pagePath to the
// article route, extract the ?id= query param, rank by screenPageViews.
// `by`/`filter` only exist to match Vercel's call signature; both are
// Vercel-specific and unused here.
export async function aggregateEvents({
  since,
  until,
  limit,
}: {
  by: string;
  since?: string;
  until?: string;
  filter?: string;
  limit?: number;
}) {
  const rows = await runReport({
    dateRanges: [{ startDate: toGa4Date(since || ''), endDate: toGa4Date(until || '') }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      filter: { fieldName: 'pagePath', stringFilter: { matchType: 'CONTAINS', value: ARTICLE_PATH_FRAGMENT } },
    },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit,
  });

  return rows
    .map(row => {
      const pagePath = row.dimensionValues[0]?.value || '';
      const match = pagePath.match(/[?&]id=([^&]+)/);
      return match
        ? { eventData: decodeURIComponent(match[1]), count: Number(row.metricValues[0]?.value) || 0 }
        : null;
    })
    .filter((r): r is { eventData: string; count: number } => !!r);
}
