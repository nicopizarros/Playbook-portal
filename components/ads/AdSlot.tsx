'use client';

import { useEffect, useRef, useState } from 'react';
import { readConsent, CONSENT_EVENT } from '@/lib/consent';
import { useAdSenseConfig } from './AdSenseProvider';
import { ADS_PAUSED, SLOT_FORMATS } from '@/lib/adsense';

// PAUSED 2026-08-24 — ADS_PAUSED in lib/adsense.ts is `true`, so every slot
// on the site renders null regardless of consent or configuration. This is a
// temporary publisher hold, not a removal: the call sites and unit IDs are
// all still in place and one line brings them back. Everything below
// describes the behaviour that resumes when it does.
//
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

  // ADS_PAUSED is first, and is checked here rather than at the call sites
  // so the pause is impossible to apply to five slots and forget the sixth.
  // See lib/adsense.ts for what the hold does and does not cover.
  const canServe = !ADS_PAUSED && consented && !!clientId && !!adUnitId;

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

  // The <ins> attributes are dictated by the unit type created in AdSense,
  // not by taste -- an in-article unit given the display attributes renders
  // an empty box with no error anywhere. See SLOT_FORMATS in lib/adsense.ts.
  //
  // The style objects match Google's own snippets exactly. The previous
  // `width:100%; height:100%` was ours, not Google's, and forcing a height
  // on a unit whose whole job is to size itself is the documented way to get
  // a collapsed or mis-measured ad.
  const format = SLOT_FORMATS[slot];

  return (
    <div className={`ad-slot ad-slot--${slot}`} data-ad-slot={slot} data-ad-consent="granted">
      {format === 'in-article' ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client={clientId}
          data-ad-slot={adUnitId}
        />
      ) : (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={clientId}
          data-ad-slot={adUnitId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
