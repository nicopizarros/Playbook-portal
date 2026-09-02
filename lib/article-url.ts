// Every public URL for an article, built in exactly one place.
//
// Before 2026-09-02 there was no shared helper: `pathFor()` lived inside
// app/(public)/articulo/page.tsx and 28 other call sites each hand-built
// `/articulo?id=${encodeURIComponent(a.id)}` from scratch (sitemap, feed,
// six pages, thirteen components, the analytics dashboard, three scripts).
// One of them — app/(public)/cuenta/page.tsx — had quietly dropped the
// encodeURIComponent. That duplication is exactly why the query-string form
// survived as long as it did: there was no single edit that could change it.
//
// The URL shape moved from `/articulo?id=<slug>` to `/articulo/<slug>`
// because Google was treating the query-string form as a parameter on one
// page rather than as ~211 distinct articles. `articles.id` (lib/db/
// schema.ts:56) is already a human-readable kebab-case slug minted by
// lib/slugify.ts, so the move needed no schema change and no data
// migration — only routing.
//
// The legacy form still resolves: middleware.ts 301s `/articulo?id=X` to
// `/articulo/X` and must keep doing so permanently. Every inbound link that
// exists in the world today — backlinks, Substack sends, 55 in-body
// cross-links still stored in Postgres — points at the old shape.

const ARTICLE_BASE = '/articulo';

// Site-relative. Use this for anything rendered into the page, so links
// work against whatever origin the reader actually reached us on (a
// preview deployment, the .vercel.app alias) rather than hardcoding the
// canonical host into every href.
export function articlePath(id: string): string {
  return `${ARTICLE_BASE}/${encodeURIComponent(id)}`;
}

// Absolute, on the canonical origin. Use this only where an absolute URL is
// required by the format: <link rel="canonical">, og:url, JSON-LD `url` and
// `@id`, sitemap <loc>, RSS <link>/<guid>.
export function articleUrl(siteUrl: string, id: string): string {
  return `${siteUrl}${articlePath(id)}`;
}

// The pre-migration form. Kept as a named export rather than inlined so the
// redirect in middleware.ts and any backfill script agree on one definition
// of "the old URL" — and so grepping for it finds every remaining use.
export function legacyArticlePath(id: string): string {
  return `${ARTICLE_BASE}?id=${encodeURIComponent(id)}`;
}
