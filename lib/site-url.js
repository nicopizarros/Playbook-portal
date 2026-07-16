// Resolves the origin serverless functions should use both for their own
// self-fetches (articles.json, content.json) and for the public-facing
// URLs they generate (sitemap <loc>, RSS <link>, OG/canonical tags).
//
// Deliberately NOT a hardcoded domain literal. This used to hardcode
// www.playbookmedia.mx — a domain the team has confirmed they don't
// actually own — so every self-fetch silently failed and each function
// degraded to near-empty output (confirmed live: sitemap.xml was serving
// only 2 bare <url> entries with no articles, exactly what api/sitemap.js
// does when articles.json can't be reached). The real, currently-live
// domain is playbook-portal-phi.vercel.app, used below only as the last-
// resort fallback for the rare case req.headers.host is missing —
// deriving the origin from the actual incoming request means this always
// points at whatever host is actually serving traffic, so if a real
// custom domain gets connected later, this needs no code change at all.
const FALLBACK_SITE_URL = 'https://playbook-portal-phi.vercel.app';

export function resolveSiteUrl(req) {
  const host = req && req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
  return host ? `https://${host}` : FALLBACK_SITE_URL;
}
