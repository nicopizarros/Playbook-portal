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
];

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
  "frame-src 'self' https://www.youtube.com https://www.instagram.com",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https:",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' https://va.vercel-scripts.com" : ''} https://www.instagram.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://blob.vercel-storage.com https://*.public.blob.vercel-storage.com",
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
