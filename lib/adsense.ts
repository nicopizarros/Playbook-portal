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

// How each unit must be MARKED UP, which is not a styling choice -- it is
// dictated by the unit type chosen in the AdSense dashboard, and getting it
// wrong renders a blank box rather than an error:
//
//   'display'    the ordinary responsive display unit
//                -> data-ad-format="auto" + data-full-width-responsive
//   'in-article' AdSense's native in-article unit
//                -> data-ad-format="fluid" + data-ad-layout="in-article"
//
// inline-article was created as a genuine in-article unit (2026-08-19), so
// it needs the fluid pair; feeding it the display attributes silently
// produces nothing. The rest are display units.
export type AdSlotFormat = 'display' | 'in-article';

export const SLOT_FORMATS: Record<AdSlotName, AdSlotFormat> = {
  'leaderboard-home': 'display',
  'inline-feed': 'display',
  'rail-home': 'display',
  'inline-mid-editorial': 'display',
  'inline-article': 'in-article',
  'vertical-sponsor-infinitas': 'display',
};

// Real ad unit IDs, created in the AdSense dashboard 2026-08-19. Defaults
// for the same reason DEFAULT_CLIENT_ID is one: they are not secret (every
// one is visible in the rendered HTML of any page showing that unit), and
// keeping them here means the units go live on deploy rather than waiting on
// six Vercel env vars being set correctly across three environments.
//
// The ADSENSE_SLOT_* env vars still override per slot, so pulling a single
// unit or pointing it at a replacement stays a config change.
//
// Two slots are deliberately absent -- rail-home and
// vertical-sponsor-infinitas have no unit created yet. They stay collapsed
// and render nothing, which is the designed behaviour for an unconfigured
// slot, not a bug.
const DEFAULT_SLOT_IDS: Partial<Record<AdSlotName, string>> = {
  'leaderboard-home': '6390337427',
  'inline-feed': '9159970997',
  'inline-article': '5488319292',
  'inline-mid-editorial': '7406392857',
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
      ...DEFAULT_SLOT_IDS,
      // Env wins where set; `|| undefined` so an empty string (a var that
      // exists in Vercel but was left blank) falls through to the default
      // instead of blanking the slot.
      'leaderboard-home': process.env.ADSENSE_SLOT_LEADERBOARD_HOME || DEFAULT_SLOT_IDS['leaderboard-home'],
      'inline-feed': process.env.ADSENSE_SLOT_INLINE_FEED || DEFAULT_SLOT_IDS['inline-feed'],
      'rail-home': process.env.ADSENSE_SLOT_RAIL_HOME || DEFAULT_SLOT_IDS['rail-home'],
      'inline-mid-editorial': process.env.ADSENSE_SLOT_INLINE_MID_EDITORIAL || DEFAULT_SLOT_IDS['inline-mid-editorial'],
      'inline-article': process.env.ADSENSE_SLOT_INLINE_ARTICLE || DEFAULT_SLOT_IDS['inline-article'],
      'vertical-sponsor-infinitas': process.env.ADSENSE_SLOT_VERTICAL_SPONSOR_INFINITAS || DEFAULT_SLOT_IDS['vertical-sponsor-infinitas'],
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
