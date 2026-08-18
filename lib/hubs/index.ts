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
export const UPCOMING_HUBS: { name: string; note: string }[] = [
  // LFA sits here rather than in the live list while its hub is UNLISTED
  // (see LFA_HUB.listed). The route exists and works; the nav simply does
  // not advertise it yet. Moving it is two lines: flip `listed` to true and
  // delete this entry.
  { name: 'LFA', note: 'En preparación' },
  { name: 'Mundial 2026', note: 'En preparación' },
  { name: 'NFL México', note: 'En preparación' },
];
