// One place that knows how a Playbook event is named, what it carries, and
// which backends it reaches. Added 2026-08-19: until now the site fired
// GA4's automatic page_view and exactly one Vercel custom event
// (components/article/ArticleAnalyticsBeacon.tsx's `pageview_article`) --
// zero custom gtag() calls existed anywhere in app/, components/ or lib/.
//
// TWO BACKENDS, DELIBERATELY ASYMMETRIC:
//
//   • GA4 gets every event. It's already loaded on every public page
//     (components/analytics/GoogleAnalytics.tsx) and costs nothing per
//     event.
//   • Vercel Web Analytics gets only VERCEL_MIRRORED below. Vercel bills
//     per custom event, so mirroring a 4-fires-per-article scroll event
//     there would be the most expensive and least useful thing we could
//     duplicate. Only low-volume, high-value conversions cross over.
//
// NO MEASUREMENT ID APPEARS IN THIS FILE, on purpose. gtag('event', ...)
// dispatches to whatever property gtag('config') already established, which
// is GA4_MEASUREMENT_ID read server-side in app/(public)/layout.tsx.
// Repointing the site at a different GA4 property is therefore an env-var
// change in Vercel, never a code change here.

import { track } from '@vercel/analytics';
import { normalizeSource } from './constants';

// ---------------------------------------------------------------- Products
// The reporting dimension every event carries, so "how did La Lana perform
// this month" is one GA4 filter rather than a path-pattern guess.
//
// Keyed on the articles table's `source`, the same field SOURCE_LABELS, the
// homepage filter and the archive's "Sección" filter already key on -- with
// two deliberate differences from lib/constants.ts's KNOWN_SOURCES:
//
//   • 'futbol-business-review' IS included. 14 published rows carry it and
//     it's one of the five products we report on, but it is still missing
//     from KNOWN_SOURCES/SOURCE_LABELS (see docs/TODO.md §0). Waiting for
//     that constant to be fixed would mean TFBR silently reporting as
//     'unknown' in the meantime.
//   • Hubs get their own `hub:<slug>` namespace. A hub is not a fifth
//     editorial product -- it GATHERS by tag across products (lib/hubs/
//     types.ts) -- so folding it into the same value space as `source`
//     would make "an LFA article published in Noticias" unattributable to
//     either. Prefixed, both facts survive on the same event.
export type ProductKey =
  | 'noticias'
  | 'la-lana'
  | 'infinitas'
  | 'futbol-business-review'
  | 'opinion'
  | 'unknown'
  | `hub:${string}`;

const KNOWN_PRODUCTS = new Set<string>([
  'noticias',
  'la-lana',
  'infinitas',
  'futbol-business-review',
  'opinion',
]);

/**
 * The product dimension for an article `source`. Runs normalizeSource()
 * first, so the 97 rows still carrying the legacy 'industry-shots' key
 * (docs/TODO.md §2) report as 'noticias' exactly like the site already
 * renders them -- otherwise the same product would split across two values
 * in GA4 until that migration runs, and the split would be invisible.
 */
export function productForSource(source: string | null | undefined): ProductKey {
  if (!source) return 'unknown';
  const normalized = normalizeSource(source);
  return KNOWN_PRODUCTS.has(normalized) ? (normalized as ProductKey) : 'unknown';
}

/** The product dimension for a coverage hub (/coberturas/<slug>). */
export function productForHub(slug: string): ProductKey {
  return `hub:${slug}`;
}

// ------------------------------------------------------------------ Events
// GA4 caps event names at 40 chars and parameter names at 40, and reserves
// several names outright. Two of ours sit deliberately close to reserved
// ones and must NOT be renamed to match them: GA4's Enhanced Measurement
// already auto-collects `scroll` (a single 90% fire) and `click` (with
// outbound: true). Ours are `scroll_depth` (four thresholds) and
// `outbound_click`, so the finer-grained custom data lands beside the
// automatic data instead of colliding with it or double-counting it.
export type PlaybookEvent =
  | 'scroll_depth'
  | 'article_read_complete'
  | 'outbound_click'
  | 'newsletter_signup'
  | 'tag_nav_click'
  | 'hub_visit'
  | 'product_hub_visit'
  | 'email_wall_view'
  | 'email_wall_cta';

// Mirrored into Vercel Web Analytics as well as GA4. Conversions and
// destination visits only -- see the asymmetry note at the top.
const VERCEL_MIRRORED: ReadonlySet<PlaybookEvent> = new Set<PlaybookEvent>([
  'newsletter_signup',
  'email_wall_cta',
  'hub_visit',
]);

export type EventParams = Record<string, string | number | boolean | undefined>;

type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;

function gtag(): GtagFn | null {
  if (typeof window === 'undefined') return null;
  const fn = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof fn === 'function' ? fn : null;
}

/**
 * Fire one event at every backend that should receive it.
 *
 * Silent no-op when gtag isn't there -- which is the normal case in local
 * dev (GA4_MEASUREMENT_ID is empty in .env.local, so GoogleAnalytics
 * renders nothing) and whenever a reader blocks googletagmanager.com. That
 * must never surface as a broken interaction: every call site here sits on
 * a real user action (a click, a scroll), so this function throwing would
 * take the interaction down with it.
 */
export function trackEvent(name: PlaybookEvent, params: EventParams = {}): void {
  // undefined values are dropped rather than sent: GA4 records them as the
  // literal string "undefined", which is worse than an absent parameter.
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) clean[key] = value;
  }

  try {
    gtag()?.('event', name, clean);
  } catch {
    // Analytics must never break the interaction that triggered it.
  }

  if (!VERCEL_MIRRORED.has(name)) return;
  try {
    // track() itself is a no-op until Vercel's Custom Events permission is
    // enabled on the project (Pro/Enterprise). Building these now means
    // turning that on starts collecting with no redeploy.
    track(name, clean);
  } catch {
    // Same contract as above.
  }
}

// ------------------------------------------------- Which product am I on?
// The delegated listeners in components/analytics/SiteEvents.tsx fire from
// a single site-wide handler, so unlike a beacon rendered by a page they
// have no props telling them what the reader is looking at. Two resolvers
// cover it between them.

const PATH_PRODUCTS: ReadonlyArray<readonly [string, ProductKey]> = [
  ['/noticias', 'noticias'],
  ['/la-lana', 'la-lana'],
  ['/infinitas', 'infinitas'],
  ['/futbol-business-review', 'futbol-business-review'],
];

/**
 * Product for the routes whose path alone identifies them -- the four
 * product hubs and any /coberturas/<slug>. Returns null for everything
 * else (the homepage, /archivo, /tema, and /articulo, whose product
 * depends on the article rather than the URL: an /articulo/<slug> path
 * names the article, not its product).
 */
export function productForPath(pathname: string): ProductKey | null {
  const hub = /^\/coberturas\/([^/?#]+)/.exec(pathname);
  if (hub) return productForHub(hub[1]);
  for (const [prefix, product] of PATH_PRODUCTS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return product;
  }
  return null;
}

// Set by the page-level beacon that DOES know its product (currently
// components/article/ArticleEngagement.tsx, since /articulo's product comes
// from the row, not the URL). Cleared on unmount so a stale value can never
// outlive its route -- without that reset, clicking from an Infinitas
// article to the homepage would keep attributing homepage clicks to
// Infinitas for the rest of the session.
let registeredProduct: ProductKey | null = null;

export function registerPageProduct(product: ProductKey | null): void {
  registeredProduct = product;
}

/** Best available product for the page in view, preferring the explicit registration. */
export function resolvePageProduct(pathname: string): ProductKey {
  return registeredProduct ?? productForPath(pathname) ?? 'unknown';
}
