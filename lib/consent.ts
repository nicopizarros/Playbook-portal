// Client-side consent state for advertising (Fase 7, narrowed 2026-07-31).
// One shape, one storage key: components/CookieNotice.tsx writes it,
// components/ads/AdSlot.tsx gates on it. Framework of reference: LFPDPPP
// (México) — essential cookies and aggregate analytics (GA4, Vercel Web
// Analytics) always on; advertising strictly opt-in.
//
// Analytics used to share this same "advertising" flag (both opt-in
// together) until 2026-07-31 -- see that day's HANDOFF.md entry: gating
// aggregate, non-advertising analytics behind the same consent step as ad
// personalization meant almost no real visitor (who mostly never interact
// with the banner) was ever measured. components/analytics/GoogleAnalytics.tsx
// no longer reads this module at all; it fires unconditionally, same as
// pre-Fase-7 and same as Google's own gtag.js snippet.
//
// This module is imported from client components only ('use client' files).
// Every function is defensive about localStorage being unavailable
// (private browsing, storage disabled) — same fail-open criterion the old
// notice-only banner already used: a reader whose storage is blocked keeps
// browsing normally, they just never persist a choice (and therefore never
// get ads, which is the safe default).

export type ConsentState = {
  essential: true;
  advertising: boolean;
  timestamp: number;
};

export const CONSENT_KEY = 'playbook_consent_v1';

// The pre-Fase-7 notice-only banner's dismissal flag. Anyone who dismissed
// that banner was shown "al seguir navegando aceptás su uso" while GA4
// fired unconditionally — so their recorded state maps to advertising:true
// in the new format (they were informed and kept browsing). Migrated once
// on first read, then the old key is removed.
const LEGACY_DISMISS_KEY = 'playbook_cookie_notice_dismissed';

// Fired on window whenever writeConsent() persists a new choice, so
// already-mounted consumers (AdSlot, GoogleAnalytics) react immediately
// instead of waiting for the next full page load.
export const CONSENT_EVENT = 'playbook:consent-change';

function parse(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (
      value &&
      typeof value === 'object' &&
      value.essential === true &&
      typeof value.advertising === 'boolean' &&
      typeof value.timestamp === 'number'
    ) {
      return value as ConsentState;
    }
  } catch {
    // Corrupt/foreign value: treat as no consent recorded.
  }
  return null;
}

export function readConsent(): ConsentState | null {
  try {
    const stored = parse(localStorage.getItem(CONSENT_KEY));
    if (stored) return stored;

    if (localStorage.getItem(LEGACY_DISMISS_KEY)) {
      const migrated: ConsentState = { essential: true, advertising: true, timestamp: Date.now() };
      localStorage.setItem(CONSENT_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_DISMISS_KEY);
      return migrated;
    }
  } catch {
    // Storage unavailable — no consent recorded, nothing loads.
  }
  return null;
}

export function writeConsent(advertising: boolean): ConsentState {
  const state: ConsentState = { essential: true, advertising, timestamp: Date.now() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    localStorage.removeItem(LEGACY_DISMISS_KEY);
  } catch {
    // Choice won't persist across loads, but still applies to this one.
  }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  } catch {
    // CustomEvent unavailable: consumers pick the value up on next load.
  }
  return state;
}
