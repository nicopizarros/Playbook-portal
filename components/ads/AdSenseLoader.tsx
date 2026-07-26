'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { readConsent, CONSENT_EVENT } from '@/lib/consent';
import { ADSENSE_CLIENT } from '@/lib/ad-slots';

// Boots the adsbygoogle.js library exactly once, mirroring
// components/analytics/GoogleAnalytics.tsx: same consent gate (advertising
// category, lib/consent.ts), same "nothing loads until the reader opts
// in" default. AdSlot.tsx renders the actual <ins> units and pushes to
// window.adsbygoogle independently of when/whether this script has
// finished loading.
export function AdSenseLoader() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const update = () => setConsented(readConsent()?.advertising === true);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  if (!consented || !ADSENSE_CLIENT) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
