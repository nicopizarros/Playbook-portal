import type { NextConfig } from 'next';

// Legacy *.html URLs were live, indexed by Google, and already shared on
// WhatsApp/X before this migration (see HANDOFF.md's SEO history) — these
// redirects keep every existing inbound link and search ranking working
// after the extensionless App Router routes replace them.
const legacyHtmlRedirects = [
  { source: '/index.html', destination: '/' },
  { source: '/articulo.html', destination: '/articulo' },
  { source: '/archivo.html', destination: '/archivo' },
  { source: '/autor.html', destination: '/autor' },
  { source: '/tema.html', destination: '/tema' },
  { source: '/404.html', destination: '/404' },
  // The news hub launched briefly as /industry-shots (2026-08-05, same
  // day) before being renamed to the reader-facing name; keep the short-
  // lived URL working.
  { source: '/industry-shots', destination: '/noticias' },
];

// -------------------------------------------------- Consolidación de La Lana
// El 301 de /archivo?source=la-lana al hub NO vive acá, vive en
// middleware.ts. No es preferencia: los redirects de next.config reenvían
// SIEMPRE el query string al destino, así que /archivo?source=la-lana
// aterrizaba en /la-lana?source=la-lana — verificado en dev contra las dos
// formas de `destination` ('/la-lana' y '/la-lana?'), idéntico resultado.
// El middleware es el único punto del pipeline donde la URL de destino es
// nuestra. Ver la nota completa allá.

// Real external origins this site actually loads, verified against source
// (not guessed) before writing the CSP below:
//  - img-src is deliberately `https: data: blob:`, not a fixed allowlist —
//    grepped articles.json/content.json and found editorial photos hotlinked
//    from images.unsplash.com, assets.goal.com, www.espn.com, abcnoticias.mx,
//    i.ytimg.com, plus Vercel Blob for uploads — this is an editorial site
//    that ingests images from whatever outlet a story cites (including via
//    the Make.com webhook and the publish-newsletter pipeline), so the set
//    of source domains grows with every new article and can't be enumerated.
//  - script-src/frame-src for Instagram (components/sections/InstagramReels.tsx)
//    and YouTube (components/sections/VideoSection.tsx) embeds.
//  - script-src for GA4 (googletagmanager.com, lib analytics still pending
//    port — see HANDOFF.md); connect-src for GA4's own beacon domains.
//  - script-src/connect-src for AdSense's ad-request script
//    (pagead2.googlesyndication.com, components/ads/AdSlot.tsx) and Google's
//    Funding Choices certified-CMP tag (fundingchoicesmessages.google.com,
//    components/consent/GoogleFundingChoices.tsx); frame-src for the ad
//    creative/consent-message iframes those load
//    (googleads.g.doubleclick.net, tpc.googlesyndication.com). Both stay
//    inert (no requests, nothing to block) until ADSENSE_CLIENT_ID is set.
//  - Vercel Web Analytics (@vercel/analytics) is same-origin in production
//    (script served from /_vercel/insights/script.js, confirmed reading
//    node_modules/@vercel/analytics/dist source) — no external script-src
//    entry needed there, only in dev (va.vercel-scripts.com debug script).
//  - connect-src for Vercel Blob (confirmed in node_modules/@vercel/blob:
//    uploads target blob.vercel-storage.com) — TipTap's client-side image
//    upload needs this even though it's an editor-only, authenticated flow.
const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "frame-src 'self' https://www.youtube.com https://www.instagram.com https://fundingchoicesmessages.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://ep2.adtrafficquality.google https://www.google.com",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https:",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' https://va.vercel-scripts.com" : ''} https://www.instagram.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://fundingchoicesmessages.google.com https://analytics.ahrefs.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // GA4's collector fans out across FOUR hosts, and a wildcard entry does
  // NOT cover the bare domain it wildcards -- `*.analytics.google.com` never
  // matches `analytics.google.com` (CSP host-source matching requires at
  // least one label in place of the `*`). That gap silently blocked every
  // GA4 hit, page_view included, until 2026-08-19: the only allowed
  // collector was www.google-analytics.com, so anything gtag routed to the
  // other three was refused. Confirmed in a real browser against the live
  // site, which reported /g/collect blocked on analytics.google.com,
  // www.google.com AND stats.g.doubleclick.net.
  //
  // Keep every entry. They are not redundant:
  //   www.google-analytics.com   the classic collector
  //   *.google-analytics.com     regional endpoints (region1, region2, …)
  //   analytics.google.com       bare host, NOT covered by the wildcard above
  //   *.analytics.google.com     regional variants of that host
  //   www.google.com             /g/collect when Google Signals is on
  //   stats.g.doubleclick.net    the Signals/ads-integration collector
  //
  // AdSense's invalid-traffic pipeline ("sodar") needs its own entries, added
  // 2026-08-19 after ep1.adtrafficquality.google/getconfig/sodar was seen
  // blocked on the live site. Only ep1 was observable, because the block hit
  // the FIRST call in the chain -- getconfig -- so everything sodar would
  // have contacted afterwards never ran. Fixing only the host you can see
  // just moves the failure one step down, which is exactly what happened
  // with the GA4 collectors above. The rest of the pipeline is listed here
  // deliberately, not speculatively: all of it is already trusted in
  // frame-src for ad rendering, so allowing the matching XHRs grants no new
  // origin any capability it did not already have.
  //   ep1/ep2.adtrafficquality.google  sodar config + its beacons
  //
  // sodar spans THREE directives, not one. Unblocking connect-src let
  // getconfig/sodar succeed (200), and that success is what finally revealed
  // the next step: ep2 serves sodar2.js, which is a SCRIPT load and was
  // refused by script-src. Each fix in this chain is what exposes the
  // following link, so "no violations in the console" only means the
  // pipeline got as far as the current block -- not that it completed.
  //   googleads.g.doubleclick.net      ad requests (was frame-src only)
  //   tpc.googlesyndication.com        sodar frame host (was frame-src only)
  //
  // Ahrefs Web Analytics (added 2026-09-02) needs BOTH directives for the
  // same reason every entry above needed more than one: script-src to load
  // analytics.js, connect-src for the beacon it then posts back. Allowing
  // only the script would have produced the exact failure mode this comment
  // block already documents twice — a tag that loads, reports no console
  // error worth noticing, and silently sends nothing.
  //   analytics.ahrefs.com             analytics.js + its beacon
  "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com https://stats.g.doubleclick.net https://blob.vercel-storage.com https://*.public.blob.vercel-storage.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://fundingchoicesmessages.google.com https://analytics.ahrefs.com",
]
  .join('; ')
  .replace(/\s+/g, ' ')
  .trim();

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // No effect over plain HTTP (browsers ignore it there per spec) so it's
  // safe to send unconditionally, including in local `next dev`.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig: NextConfig = {
  async redirects() {
    return legacyHtmlRedirects.map(r => ({ ...r, permanent: true }));
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;
