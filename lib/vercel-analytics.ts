// Near-literal port of legacy/lib/vercel-analytics.js — same REST API, same
// env vars, same graceful-degradation contract (throws on a real failure,
// caller decides how to degrade). Powers the admin analytics dashboard
// (app/admin/(protected)/analytics/page.tsx) via lib/analytics-data.ts —
// since 2026-07-31, only as the fallback there when GA4 isn't configured or
// a specific report call fails, see lib/ga4-analytics.ts and
// lib/analytics-data.ts's withGa4Fallback(). Separate credential/module from
// lib/ga4.ts, which powers the homepage "Más leídas" module.

const API_BASE = 'https://api.vercel.com/v1/query/web-analytics';

type QueryParams = Record<string, string | number | undefined | null>;

function projectParams(): QueryParams {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) {
    throw new Error('VERCEL_PROJECT_ID no está disponible (revisa "System Environment Variables" en Project Settings de Vercel)');
  }
  const teamId = process.env.VERCEL_TEAM_ID;
  const teamSlug = process.env.VERCEL_TEAM_SLUG;
  return { projectId, ...(teamId ? { teamId } : teamSlug ? { slug: teamSlug } : {}) };
}

async function callApi(path: string, params: QueryParams) {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) {
    throw new Error('VERCEL_ANALYTICS_TOKEN no está configurado');
  }
  const url = new URL(API_BASE + path);
  const merged = { ...projectParams(), ...params };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Vercel Analytics API respondió ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

export async function count(params: { since?: string; until?: string; filter?: string }) {
  const json = await callApi('/visits/count', params);
  return (json.data || { pageviews: 0, visitors: 0 }) as { pageviews: number; visitors: number };
}

export async function aggregateVisits(params: {
  by: string;
  since?: string;
  until?: string;
  filter?: string;
  limit?: number;
}) {
  const json = await callApi('/visits/aggregate', params);
  return (Array.isArray(json.data) ? json.data : []) as Record<string, unknown>[];
}

// requestPath strips query strings (confirmed in Vercel's own docs), which
// is why grouping by it could not distinguish individual articles while they
// all lived at /articulo?id=... — the id was in the part being stripped.
//
// Since 2026-09-02 articles live at /articulo/<slug> (lib/article-url.ts), so
// the id is now IN the path and this limitation may no longer apply. Verify
// against the real API before relying on it: Vercel may still report the
// route pattern (/articulo/[id]) rather than the resolved path, which would
// collapse the articles exactly as before. Until that is checked, treat the
// custom-event path below as the supported one.
// Real per-article counts need a custom event fired with
// the article id (see components/article — not yet instrumented; see the
// "gap" note in this checkpoint's HANDOFF.md entry). Custom events also
// require the "Custom Events" permission (Vercel Pro/Enterprise) — a plan
// without it makes this throw like any other failed call, and the caller
// is expected to degrade only the top-articles panel, not the whole page.
export async function aggregateEvents(params: {
  by: string;
  since?: string;
  until?: string;
  filter?: string;
  limit?: number;
}) {
  const json = await callApi('/events/aggregate', params);
  return (Array.isArray(json.data) ? json.data : []) as Record<string, unknown>[];
}
