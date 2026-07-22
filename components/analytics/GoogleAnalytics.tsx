'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { readConsent, CONSENT_EVENT } from '@/lib/consent';

// Port of legacy/js/analytics.js's loadGtag(), same measurement ID
// (confirmed real and in production use as of 2026-07-16, see HANDOFF.md).
// Fase 7 change: gtag no longer fires unconditionally — it only loads once
// the reader has granted the advertising/analytics category through the
// consent banner (components/CookieNotice.tsx, stored shape in
// lib/consent.ts). Listening for CONSENT_EVENT means "Aceptar todo"
// activates measurement on the same page view, not the next one; there is
// deliberately no teardown path (revoking consent mid-session) because the
// banner never re-appears once a choice is stored — a revocation flow
// would need a preferences surface that doesn't exist yet.
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const update = () => setConsented(readConsent()?.advertising === true);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  if (!consented) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
