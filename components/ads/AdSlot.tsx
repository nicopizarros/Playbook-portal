'use client';

import { useEffect, useRef, useState } from 'react';
import { readConsent, CONSENT_EVENT } from '@/lib/consent';
import { useAdSenseConfig } from './AdSenseProvider';

// Changed 2026-07-30: this used to always render a visible dashed
// placeholder box (user request, 2026-07-22: "while we connect it to the
// real ads place a placeholder so I can see it visually"). Reversed on
// direct user request now that there's still no network connected and
// nothing to show for it -- a slot with nothing configured renders NOTHING
// (not even a reserved-space div), so the layout is clean until there's an
// actual ad to show.
//
// "Connecting the network" is no longer a code change: set ADSENSE_CLIENT_ID
// plus this slot's ADSENSE_SLOT_* env var (see lib/adsense.ts, .env.local.example)
// and this exact slot starts rendering a real <ins class="adsbygoogle">
// automatically, without redeploying this file -- units can go live one at a
// time as they're created in the AdSense dashboard.
//
// Consent contract (see lib/consent.ts) is unchanged: advertising !== true
// means the slot must never load third-party code, network configured or
// not -- that's why `consented` gates everything below, read client-side
// (localStorage doesn't exist during SSR, so the server-rendered slot is
// always "denied" and upgrades after mount, keeping hydration deterministic).

export type AdSlotName =
  | 'leaderboard-home'
  | 'inline-feed'
  | 'rail-home'
  | 'inline-mid-editorial'
  | 'inline-article'
  | 'vertical-sponsor-infinitas';

export function AdSlot({ slot }: { slot: AdSlotName }) {
  const [consented, setConsented] = useState(false);
  const pushed = useRef(false);
  const { clientId, slots } = useAdSenseConfig();
  const adUnitId = slots[slot];

  useEffect(() => {
    const update = () => setConsented(readConsent()?.advertising === true);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  const canServe = consented && !!clientId && !!adUnitId;

  useEffect(() => {
    if (!canServe || pushed.current) return;
    try {
      // @ts-expect-error -- adsbygoogle is injected by the script below, not typed
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Script not loaded yet or blocked -- nothing to reserve space for.
    }
  }, [canServe]);

  if (!canServe) return null;

  return (
    <div className={`ad-slot ad-slot--${slot}`} data-ad-slot={slot} data-ad-consent="granted">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={clientId}
        data-ad-slot={adUnitId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
