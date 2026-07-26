// AdSense wiring for the six ad slots built in Fase 7 (components/ads/AdSlot.tsx).
// Single source of truth for slot names, placeholder labels, and which
// slots actually go through AdSense — kept out of AdSlot.tsx itself only
// because AdSenseLoader.tsx (the <script> that boots adsbygoogle.js) needs
// the client ID too, and duplicating it there would drift.
//
// vertical-sponsor-infinitas is deliberately absent from every AdSense map
// below: it's a named, directly-sold vertical sponsorship (see HANDOFF.md
// Fase 7 — "patrocinio nombrado, no programático"), not an open
// marketplace placement. Wiring it to AdSense would let a random
// programmatic advertiser fill a spot promised to a specific sponsor, so
// it always falls through to the manual placeholder in AdSlot.tsx.
//
// Every ID below is public by nature (an AdSense publisher ID and ad unit
// IDs both end up in the page's rendered JS, visible to any visitor) —
// that's why NEXT_PUBLIC_* is correct here, unlike GA4_MEASUREMENT_ID
// elsewhere in this codebase, which is read server-side purely to match
// its secret sibling GA4_PROPERTY_ID's naming scheme.

export type AdSlotName =
  | 'leaderboard-home'
  | 'inline-feed'
  | 'rail-home'
  | 'inline-mid-editorial'
  | 'inline-article'
  | 'vertical-sponsor-infinitas';

// Format labels shown inside the placeholder — the sizes from the Fase 7
// plan (HANDOFF.md), so anyone looking at the page knows exactly what
// each position will hold.
export const FORMAT_LABEL: Record<AdSlotName, string> = {
  'leaderboard-home': 'Leaderboard · 970×90',
  'inline-feed': 'Formato nativo · in-feed',
  'rail-home': 'Rail · 300×250',
  'inline-mid-editorial': 'Mid editorial · 970×180',
  'inline-article': 'In-article · ancho del cuerpo',
  'vertical-sponsor-infinitas': 'Patrocinio de vertical',
};

export type AdSenseFormat = 'display' | 'in-feed' | 'in-article';

// Which AdSense ad format fits each position. leaderboard-home/rail-home
// are plain responsive display units; inline-feed sits inside a list of
// story rows (AdSense's "in-feed" native format, built for exactly that);
// inline-mid-editorial and inline-article sit between/within blocks of
// editorial content (AdSense's "in-article" native format).
export const ADSENSE_FORMAT: Partial<Record<AdSlotName, AdSenseFormat>> = {
  'leaderboard-home': 'display',
  'inline-feed': 'in-feed',
  'rail-home': 'display',
  'inline-mid-editorial': 'in-article',
  'inline-article': 'in-article',
};

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

// One ad unit per slot, created in the AdSense dashboard (see the manual
// setup guide) — each unit has its own data-ad-slot ID.
export const ADSENSE_SLOT_ID: Partial<Record<AdSlotName, string | undefined>> = {
  'leaderboard-home': process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD_HOME,
  'inline-feed': process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE_FEED,
  'rail-home': process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL_HOME,
  'inline-mid-editorial': process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE_MID_EDITORIAL,
  'inline-article': process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE_ARTICLE,
};

// In-feed native units carry a second identifier (data-ad-layout-key),
// distinct from the slot ID, that AdSense generates specifically for that
// layout when you create an in-feed ad unit.
export const INLINE_FEED_LAYOUT_KEY = process.env.NEXT_PUBLIC_ADSENSE_LAYOUT_KEY_INLINE_FEED;

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}
