import Script from 'next/script';

// Port of legacy/js/analytics.js's loadGtag(), same measurement ID
// (confirmed real and in production use as of 2026-07-16, see HANDOFF.md).
// Fires unconditionally for every visitor to a public page, same as
// pre-Fase-7 and same as Google's own gtag.js install snippet -- aggregate
// analytics is treated separately from advertising in the site's consent
// model (see lib/consent.ts): only the advertising category
// (components/ads/AdSlot.tsx) is gated behind the cookie banner's opt-in.
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
