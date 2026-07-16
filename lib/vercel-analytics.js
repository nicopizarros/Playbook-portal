// Thin REST client for the Vercel Web Analytics API, used by
// api/analytics-data.js to power /admin/analytics.html. Raw fetch, no SDK
// — consistent with the rest of this repo (see lib/github.js, lib/ga4.js).
// Reference: https://vercel.com/docs/analytics/web-analytics-api
//
// Auth: VERCEL_ANALYTICS_TOKEN (a Vercel access token with read access to
// this project's analytics) is expected to already be set as a Vercel env
// var, per the team.
//
// projectId comes from VERCEL_PROJECT_ID, a Vercel System Environment
// Variable auto-injected into every deployment IF "Enable access to System
// Environment Variables" is turned on for this project (Project Settings →
// Environment Variables) — that's Vercel's own recommended default, but
// it's a real toggle, not guaranteed on. If this project is owned by a
// Vercel team (not a personal account), the Web Analytics API also needs a
// team identifier, which Vercel does NOT auto-inject as a system var —
// set VERCEL_TEAM_ID (or VERCEL_TEAM_SLUG) manually if analytics-data.js
// comes back empty and this project lives under a team, not a personal
// account.

const API_BASE = 'https://api.vercel.com/v1/query/web-analytics';

function projectParams() {
  const params = { projectId: process.env.VERCEL_PROJECT_ID || '' };
  if (process.env.VERCEL_TEAM_ID) params.teamId = process.env.VERCEL_TEAM_ID;
  else if (process.env.VERCEL_TEAM_SLUG) params.slug = process.env.VERCEL_TEAM_SLUG;
  return params;
}

async function callApi(path, params) {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) throw new Error('VERCEL_ANALYTICS_TOKEN no está configurado');
  if (!process.env.VERCEL_PROJECT_ID) {
    throw new Error('VERCEL_PROJECT_ID no está disponible (revisa "System Environment Variables" en Project Settings de Vercel)');
  }

  const url = new URL(`${API_BASE}${path}`);
  Object.entries({ ...projectParams(), ...params }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Vercel Analytics API respondió ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

// { pageviews, visitors } totals for the given window (production only).
export async function count({ since, until, filter }) {
  const json = await callApi('/visits/count', { since, until, filter });
  return json.data || { pageviews: 0, visitors: 0 };
}

// Rows carrying the requested dimension plus pageviews/visitors, from the
// automatic pageview dataset. NOTE: the "requestPath" dimension excludes
// query strings (Vercel's own docs: "Pages: the page url, without query
// parameters") — every article on this site shares the path /articulo.html,
// so grouping Visits by requestPath cannot tell articles apart. Use
// aggregateEvents() below for anything that needs per-article counts.
export async function aggregateVisits({ by, since, until, filter, limit }) {
  const json = await callApi('/visits/aggregate', { by, since, until, filter, limit });
  return Array.isArray(json.data) ? json.data : [];
}

// Same shape, over the Events dataset (va('event', ...) calls made from
// js/article-page.js) — this is how a per-article breakdown becomes
// possible despite the requestPath limitation above. Custom events require
// the "Custom Events" permission on Vercel (Pro/Enterprise); on a plan
// without it this throws like any other failed call — api/analytics-data.js
// catches that specifically and degrades just the top-articles panel,
// without breaking the rest of the dashboard.
export async function aggregateEvents({ by, since, until, filter, limit }) {
  const json = await callApi('/events/aggregate', { by, since, until, filter, limit });
  return Array.isArray(json.data) ? json.data : [];
}
