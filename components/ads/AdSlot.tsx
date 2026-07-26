'use client';

import { useEffect, useState } from 'react';
import { readConsent, CONSENT_EVENT } from '@/lib/consent';
import {
  type AdSlotName,
  FORMAT_LABEL,
  ADSENSE_FORMAT,
  ADSENSE_CLIENT,
  ADSENSE_SLOT_ID,
  INLINE_FEED_LAYOUT_KEY,
} from '@/lib/ad-slots';

export type { AdSlotName };

// AdSense is wired: once a reader has granted advertising consent and the
// slot's env vars are set (see .env.local.example / the manual setup
// guide), this renders the real <ins class="adsbygoogle"> unit instead of
// the placeholder below. Until then — locally, in preview deploys, or for
// vertical-sponsor-infinitas which never gets an AdSense entry (see
// lib/ad-slots.ts) — it falls back to the dashed/striped placeholder the
// design prototypes used, so the reserved space is always visible even
// with no network connected. Dimensions per slot live in styles/ads.css,
// keyed off the data-ad-slot attribute; .ad-slot:empty{display:none} there
// takes care of any slot that renders neither an ad nor a placeholder.
export function AdSlot({ slot }: { slot: AdSlotName }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const update = () => setConsented(readConsent()?.advertising === true);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  const format = ADSENSE_FORMAT[slot];
  const slotId = ADSENSE_SLOT_ID[slot];
  const adReady = Boolean(
    consented &&
      ADSENSE_CLIENT &&
      format &&
      slotId &&
      (format !== 'in-feed' || INLINE_FEED_LAYOUT_KEY)
  );

  // One push per <ins> tag, once it's in the DOM — the standard AdSense
  // pattern. `adsbygoogle` is created here rather than assumed to already
  // exist because the loader script (AdSenseLoader.tsx) is async and may
  // not have run yet; queuing on a plain array is safe either way.
  useEffect(() => {
    if (!adReady) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Script blocked (extension, network) or malformed unit — the slot
      // just keeps its reserved dimensions, no crash.
    }
  }, [adReady]);

  if (adReady) {
    return (
      <div className={`ad-slot ad-slot--${slot}`} data-ad-slot={slot} data-ad-consent="granted">
        {format === 'in-feed' ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-format="fluid"
            data-ad-layout-key={INLINE_FEED_LAYOUT_KEY}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slotId}
          />
        ) : format === 'in-article' ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', textAlign: 'center' }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slotId}
          />
        ) : (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-format="auto"
            data-full-width-responsive="true"
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slotId}
          />
        )}
      </div>
    );
  }

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
