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
// explicitly (e.g. once a custom domain is connected).
const FALLBACK_SITE_URL = 'https://playbook-portal-phi.vercel.app';

function computeSiteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return FALLBACK_SITE_URL;
}

export const SITE_URL = computeSiteUrl();
