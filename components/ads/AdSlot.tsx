'use client';

import { useEffect, useState } from 'react';
import { readConsent, CONSENT_EVENT } from '@/lib/consent';

// The one component that changes when an ad network gets connected (Fase
// 7). Today every slot is a silent, correctly-dimensioned reservation —
// no placeholder chrome, no "Publicidad" label, no dashed border (the
// prototypes used those for demonstration; production holds clean space).
// Dimensions per slot live in styles/ads.css, keyed off the data-ad-slot
// attribute, so connecting a network later means: mount the network's tag
// inside this component when `consented` is true, and nothing else moves.
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
    />
  );
}
