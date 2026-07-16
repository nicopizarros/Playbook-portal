// Auth + query helper for the Google Analytics Data API (GA4), used by
// api/top-articles.js to power the homepage "Más leídas" module with real
// pageview data — never hardcoded. Signs its own service-account JWT with
// Node's built-in crypto instead of pulling in the googleapis package,
// consistent with the rest of this repo (no npm dependencies, no build
// step, same approach as lib/auth.js's HMAC tokens).
//
// This is a SEPARATE credential from GA4_MEASUREMENT_ID in js/analytics.js.
// The Measurement ID lets the browser send events *into* GA4; reading
// aggregate data back *out* (what this file does) needs a Google Cloud
// service account with "Viewer" access on the GA4 property, plus that
// property's numeric ID — none of which exist yet. Required env vars,
// once the team creates them:
//   GA4_PROPERTY_ID               e.g. "123456789" (Admin → Property Settings)
//   GA4_SERVICE_ACCOUNT_EMAIL     the service account's client_email
//   GA4_SERVICE_ACCOUNT_PRIVATE_KEY  its private_key (from the downloaded
//                                     JSON key; paste with literal \n line
//                                     breaks into the Vercel env var value)
// The service account also needs to be added as a Viewer on the GA4
// property itself (Admin → Property Access Management), not just have the
// Analytics Data API enabled on its Google Cloud project.

import crypto from 'crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isConfigured() {
  return !!(process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_EMAIL && process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY);
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: process.env.GA4_SERVICE_ACCOUNT_EMAIL,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600
  }));
  const signingInput = `${header}.${claims}`;
  const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(privateKey);
  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`No se pudo obtener el token de GA4 (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.access_token;
}

// Returns [{ id, pageviews }] for the top articulo.html ids by pageviews
// over the last `days` days, or null when GA4 isn't configured yet — null
// is the "not set up" signal, distinct from an empty array (configured,
// genuinely no data), so callers can tell the two apart if they need to.
export async function topArticleIds({ days = 7, limit = 10 } = {}) {
  if (!isConfigured()) return null;

  const accessToken = await getAccessToken();
  const propertyId = process.env.GA4_PROPERTY_ID;

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: { fieldName: 'pagePath', stringFilter: { matchType: 'CONTAINS', value: '/articulo.html' } }
      },
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GA4 Data API respondió ${res.status}: ${body}`);
  }
  const data = await res.json();
  const rows = data.rows || [];

  return rows
    .map(row => {
      const pagePath = row.dimensionValues[0].value || '';
      const match = pagePath.match(/[?&]id=([^&]+)/);
      return {
        id: match ? decodeURIComponent(match[1]) : null,
        pageviews: Number(row.metricValues[0].value) || 0
      };
    })
    .filter(r => r.id);
}
