import Script from 'next/script';

// Port of legacy/js/analytics.js's loadGtag(), same measurement ID
// (confirmed real and in production use as of 2026-07-16, see HANDOFF.md),
// same "fire immediately, no consent gate" behavior the site already had —
// the new cookie notice banner (components/CookieNotice.tsx) is
// notice-only, not blocking, by deliberate choice (see HANDOFF.md).
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
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
