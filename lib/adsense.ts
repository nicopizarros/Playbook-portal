import type { AdSlotName } from '@/components/ads/AdSlot';

// AdSense config, read once server-side (app/(public)/layout.tsx) and handed
// down to every AdSlot via AdSenseProvider (components/ads/AdSenseProvider.tsx)
// -- same reasoning as GA4_MEASUREMENT_ID in that same layout: these IDs
// aren't secret (they're visible in any live page's rendered HTML) but stay
// out of NEXT_PUBLIC_* so there's one fewer env var naming scheme to keep in
// sync with what's actually set in Vercel.
//
// Each ad unit gets its own slot ID once created in the AdSense dashboard --
// there's no single ID that covers all six placements. A slot with no ID
// configured here stays collapsed (AdSlot.tsx) even once ADSENSE_CLIENT_ID
// is set, so units can go live one at a time as they're created in AdSense,
// with an env var change, never a code change.
export type AdSenseConfig = {
  clientId: string | null;
  slots: Partial<Record<AdSlotName, string>>;
};

// The account's publisher ID, confirmed by the publisher 2026-08-19. Kept as
// a DEFAULT rather than requiring the env var, because three separate things
// need it before any ad unit exists -- the loader script in app/layout.tsx,
// /ads.txt (app/ads.txt/route.ts), and Google's Funding Choices CMP -- and
// all three are prerequisites for AdSense to APPROVE the site in the first
// place. Gating them behind an env var meant approval could not even be
// requested until someone set it in Vercel.
//
// Not a secret: it is visible in the rendered HTML of any live page and in
// /ads.txt by design. ADSENSE_CLIENT_ID still overrides it, so a different
// account (or a deliberate blackout) stays an env-var change.
//
// This does NOT make ads appear: each placement additionally needs its own
// ADSENSE_SLOT_* id, and AdSlot renders nothing without one.
const DEFAULT_CLIENT_ID = 'ca-pub-1241756908490278';

export function getAdSenseConfig(): AdSenseConfig {
  return {
    clientId: process.env.ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID,
    slots: {
      'leaderboard-home': process.env.ADSENSE_SLOT_LEADERBOARD_HOME,
      'inline-feed': process.env.ADSENSE_SLOT_INLINE_FEED,
      'rail-home': process.env.ADSENSE_SLOT_RAIL_HOME,
      'inline-mid-editorial': process.env.ADSENSE_SLOT_INLINE_MID_EDITORIAL,
      'inline-article': process.env.ADSENSE_SLOT_INLINE_ARTICLE,
      'vertical-sponsor-infinitas': process.env.ADSENSE_SLOT_VERTICAL_SPONSOR_INFINITAS,
    },
  };
}

// Google's "Privacy & messaging" (Funding Choices) consent tag is identified
// by the publisher ID with its "ca-" prefix stripped (ca-pub-XXXX -> pub-XXXX)
// -- see https://support.google.com/adsense/answer/9942617. Same AdSense
// account, no separate credential: once ADSENSE_CLIENT_ID is set, this is
// derived automatically rather than needing its own env var.
export function getFundingChoicesPublisherId(): string | null {
  const clientId = getAdSenseConfig().clientId;
  return clientId ? clientId.replace(/^ca-/, '') : null;
}
