'use client';

import { useEffect, useState } from 'react';
import { readConsent, CONSENT_EVENT } from '@/lib/consent';

// The one component that changes when an ad network gets connected (Fase
// 7). Until then every slot renders a visible PLACEHOLDER (user request,
// 2026-07-22: "while we connect it to the real ads place a placeholder
// so I can see it visually") — the dashed/striped vocabulary the design
// prototypes used for ad slots, muted to the site's tokens. Dimensions
// per slot live in styles/ads.css, keyed off the data-ad-slot attribute.
// Connecting a network later means: replace the placeholder <div> below
// with the network's tag when `consented` is true — nothing else moves
// (and .ad-slot:empty{display:none} in ads.css takes care of unfilled
// slots again once the placeholder is gone).
//
// Consent contract (see lib/consent.ts): advertising !== true means the
// slot keeps its dimensions but must never load third-party code — that's
// what data-ad-consent exposes for the future network integration, and
// why the read happens in an effect (localStorage doesn't exist during
// SSR; the server-rendered slot is always in the "denied" state and
// upgrades client-side, which also keeps hydration deterministic).

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
const FORMAT_LABEL: Record<AdSlotName, string> = {
  'leaderboard-home': 'Leaderboard · 970×90',
  'inline-feed': 'Formato nativo · in-feed',
  'rail-home': 'Rail · 300×250',
  'inline-mid-editorial': 'Mid editorial · 970×180',
  'inline-article': 'In-article · ancho del cuerpo',
  'vertical-sponsor-infinitas': 'Patrocinio de vertical',
};

export function AdSlot({ slot }: { slot: AdSlotName }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const update = () => setConsented(readConsent()?.advertising === true);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  return (
    <div
      className={`ad-slot ad-slot--${slot}`}
      data-ad-slot={slot}
      data-ad-consent={consented ? 'granted' : 'denied'}
      aria-hidden="true"
    >
      <div className="ad-slot-placeholder">
        <b>Publicidad</b>
        <span>{FORMAT_LABEL[slot]}</span>
      </div>
    </div>
  );
}
