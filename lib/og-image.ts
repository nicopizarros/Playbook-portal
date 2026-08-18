// Site-wide social preview card, shared by app/layout.tsx (the default for
// every route) and app/(public)/page.tsx.
//
// It lives in its own module because Next.js does NOT deep-merge the
// `openGraph` metadata object across segments: a page that declares
// `openGraph` at all replaces the parent's entire object, so any page
// setting just `openGraph.url` silently drops the inherited image, siteName
// and locale. Verified in a real response, not assumed — the homepage
// shipped `og:url` with no `og:image` the moment it declared one. Anything
// that needs to set an openGraph field therefore has to restate the shared
// bits, and they need to come from one place to stay in sync.
export const DEFAULT_OG_IMAGE = {
  url: '/assets/img/og-default.png',
  width: 1200,
  height: 630,
  alt: 'Playbook — el negocio del deporte',
};

// The fields every page's card should carry regardless of route. Spread
// into a page's own `openGraph` before its route-specific fields.
export const OG_DEFAULTS = {
  siteName: 'Playbook',
  locale: 'es_MX',
} as const;
