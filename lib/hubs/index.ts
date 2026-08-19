import type { Hub } from './types';
import { LFA_HUB } from './lfa';

export * from './types';

// The registry. ADDING A HUB IS ADDING A LINE HERE plus one config file
// and one token file — no new component, no new route, no new page. That
// is the abstraction claim, and scripts/scaffold-hub.ts proves it.
export const HUBS: Hub[] = [LFA_HUB];

export function hubBySlug(slug: string): Hub | null {
  return HUBS.find(h => h.slug === slug) ?? null;
}

// ------------------------------------------------------- What's coming
// The hubs nav zone must not read as empty or provisional while only one
// destination exists (brief §2). These are declared, not linked: naming
// what is being built is a stronger signal than a lonely single item, and
// an un-linked entry cannot 404. Delete an entry here the moment its real
// hub lands in HUBS above.
// Empty on purpose (2026-08-18). This existed so the zone would not read as
// an empty shelf while nothing was live; with a real destination in it, naming
// hubs that do not exist yet is a promise with nothing behind it. Add an entry
// here only when a hub is genuinely being built — the rendering path is kept
// so that costs one line, and declared entries are never links, so they cannot
// 404.
export const UPCOMING_HUBS: { name: string; note: string }[] = [];

/**
 * The coverage hub an article belongs to, from its `property` tags.
 *
 * Client-safe: config only, no data-layer imports (see lib/hubs/pool.ts for
 * why that separation exists).
 *
 * Used to badge a piece by its DESTINATION rather than by the product that
 * happened to publish it. An LFA story is filed under Noticias, but what the
 * reader is being offered is LFA coverage — so the chip says LFA and links to
 * /coberturas/lfa. Falls back to null for the overwhelming majority of
 * articles, which carry no property tag at all.
 */
export function hubForArticle(tagsProperty?: string[] | null): Hub | null {
  if (!tagsProperty?.length) return null;
  return HUBS.find(h => tagsProperty.includes(h.tag)) ?? null;
}

export function hubPath(hub: Hub): string {
  return `/coberturas/${hub.slug}`;
}
