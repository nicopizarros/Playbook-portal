// Near-literal port of legacy/lib/vercel-analytics.js — same REST API, same
// env vars, same graceful-degradation contract (throws on a real failure,
// caller decides how to degrade). Powers only the admin analytics
// dashboard (app/admin/(protected)/analytics/page.tsx); NOT the same thing
// as lib/ga4.js, which legacy/api/top-articles.js uses for the homepage
// "Más leídas" module — that's a separate, still-deferred feature (see
// HANDOFF.md's Fase 2 log), not part of this checkpoint.

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

// requestPath strips query strings (confirmed in Vercel's own docs), so
// grouping by it can't distinguish individual articles — they all live at
// /articulo?id=... Real per-article counts need a custom event fired with
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
