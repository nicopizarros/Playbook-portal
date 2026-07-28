// Resolves the canonical public origin used for metadataBase, canonical
// tags, OG/Twitter URLs, sitemap <loc>, and the RSS feed's self-link.
//
// The legacy site (legacy/lib/site-url.js) had to derive this per-request
// from incoming headers because a hardcoded domain the team didn't
// actually own broke every self-fetch in production (see HANDOFF.md's
// incident history). That workaround is unnecessary here: Vercel injects
// VERCEL_PROJECT_PRODUCTION_URL (the project's real production domain) as
// a system env var on every deployment, which is the correct source of
// truth and needs no request to resolve. SITE_URL can still override it
// explicitly.
//
// playbook.la is the site's one and only domain (2026-07-28) — the
// playbook-portal-phi.vercel.app Vercel subdomain this fallback used to
// point at is retired. This constant only matters when neither SITE_URL
// nor VERCEL_PROJECT_PRODUCTION_URL is set (e.g. a misconfigured
// environment), since Vercel's own env var already resolves to whatever
// domain is set as the project's production domain.
const FALLBACK_SITE_URL = 'https://playbook.la';

function computeSiteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return FALLBACK_SITE_URL;
}

export const SITE_URL = computeSiteUrl();
