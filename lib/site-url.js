// Resolves the origin serverless functions should use both for their own
// self-fetches (articles.json, content.json) and for the public-facing
// URLs they generate (sitemap <loc>, RSS <link>, OG/canonical tags).
//
// Deliberately NOT a hardcoded domain literal. The custom domain
// (www.playbookmedia.mx) is not guaranteed to be connected in Vercel at
// any given moment — it wasn't as of 16 jul 2026, which is what caused
// this: every function below used to hardcode that domain for its own
// self-fetch, that domain was unreachable, so the fetch silently failed
// and each function degraded to near-empty output (confirmed live —
// sitemap.xml was serving only 2 bare <url> entries with no articles,
// which is exactly what api/sitemap.js does when articles.json can't be
// reached). Deriving the origin from the actual incoming request means
// this always points at whatever host is actually serving traffic right
// now — the custom domain once it's live, or the *.vercel.app fallback
// until then — with no code change needed either way.
export function resolveSiteUrl(req) {
  const host = req && req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
  return host ? `https://${host}` : 'https://www.playbookmedia.mx';
}
