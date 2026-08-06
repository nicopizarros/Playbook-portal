import type { Metadata } from 'next';
import { Anton, Inter } from 'next/font/google';
import Script from 'next/script';
import { AnalyticsClient } from '@/components/analytics/AnalyticsClient';
import { getFundingChoicesPublisherId } from '@/lib/adsense';
import { DEFAULT_OG_IMAGE, OG_DEFAULTS } from '@/lib/og-image';
import { SITE_URL } from '@/lib/site-url';

import '../styles/reset.css';
import '../styles/tokens.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/header.css';
import '../styles/hero.css';
import '../styles/sections.css';
import '../styles/article.css';
import '../styles/cookie-notice.css';
import '../styles/ads.css';
import '../styles/legal.css';
import '../styles/product-hubs.css';
// The 2026-08-05 design upgrade, one file per surface (after
// product-hubs.css on purpose — these layer per-product skins over it):
import '../styles/lectura.css';
import '../styles/portada.css';
import '../styles/hemeroteca.css';
import '../styles/responsive.css';

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

// `twitter.card` below is summary_large_image, which without an image
// renders as a bare text link on X/WhatsApp/LinkedIn/Facebook — and every
// route except /articulo was shipping exactly that, including the
// homepage, i.e. the URL people actually paste when a site launches.
// Article pages override this with their own cover photo
// (app/(public)/articulo/page.tsx); everything else inherits this one.
// Static asset rather than a generated ImageResponse: nothing about it
// varies per request, so there's no reason to pay for og runtime on every
// crawl. See lib/og-image.ts for why it isn't inlined here.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Playbook — El negocio del deporte',
    template: '%s — Playbook',
  },
  description:
    'Playbook: noticias, análisis, newsletters y video para entender el negocio del deporte en México y LATAM.',
  robots: { index: true, follow: true },
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    ...OG_DEFAULTS,
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    images: [DEFAULT_OG_IMAGE.url],
  },
};

// Dark-mode FOUC prevention: reads localStorage synchronously and sets
// data-theme before first paint, exactly like legacy/index.html's inline
// <head> script. `beforeInteractive` is the Next.js-sanctioned way to run
// a script this early (before hydration) from the root layout.
const THEME_INIT_SCRIPT = `
(function(){
  try{
    var t=localStorage.getItem('playbook_theme');
    if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}
  }catch(e){}
})();
`;

// Same window.va queue shim legacy defined inline in <head> (legacy/index.html,
// legacy/articulo.html) — needed again here for a real reason, not copied out
// of caution: @vercel/analytics/next's <Analytics/> wraps its actual queue
// setup (initQueue(), called from a useEffect) in a <Suspense> boundary (it
// needs useSearchParams()/usePathname()), so that effect commits in a later
// pass than the rest of the tree regardless of where <Analytics/> sits in
// JSX — confirmed by tracing node_modules/@vercel/analytics/dist/next/index.mjs
// and reproducing the race with a debug build: a descendant client component
// calling track() (e.g. ArticleAnalyticsBeacon, several levels deep in a
// page) mounts and calls it before Analytics' own effect has run, and
// track()'s `window.va?.(...)` is a silent no-op when window.va isn't
// defined yet — no error, nothing queued, nothing sent, ever. Pre-defining
// the shim synchronously (before hydration, same as legacy) means any early
// track() call queues correctly into window.vaq; initQueue() itself no-ops
// once it sees window.va already exists, so this doesn't conflict with it.
const VA_INIT_SCRIPT = `
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
`;

// Google's official "Privacy & messaging" (Funding Choices) tag -- the
// Google-certified CMP that satisfies AdSense's requirement to obtain and
// signal IAB TCF v2 consent for EEA/UK/Swiss visitors (and, once configured
// in the AdSense dashboard, US state-privacy messages elsewhere). This is
// Google's documented snippet verbatim, not a custom implementation --
// https://support.google.com/adsense/answer/9942617 -- so it stays a
// Google-certified CMP rather than something we'd need to self-certify with
// the IAB. It only loads the message *loader*; which message shows (if
// any), to whom, and whether it blocks ad requests until consent is given,
// is all configured in AdSense's dashboard, not here. Independent of and
// additional to the site's own LFPDPPP consent banner
// (components/CookieNotice.tsx) -- that one governs our own advertising/
// analytics gating for the site's primary Mexico/LATAM audience; this one is
// what Google's ad-serving pipeline itself reads for EEA/UK/CH traffic.
// Must live here rather than in its own component: Next.js requires
// beforeInteractive scripts to be declared directly in the root layout
// (see next/script docs), and Google's own instructions call for the tag as
// high in <head> as possible on every page.
const FUNDING_CHOICES_PRESENT_SCRIPT = `
(function() {
  function signalGooglefcPresent() {
    if (!window.frames['googlefcPresent']) {
      if (document.body) {
        var iframe = document.createElement('iframe');
        iframe.style.cssText = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;';
        iframe.style.display = 'none';
        iframe.name = 'googlefcPresent';
        document.body.appendChild(iframe);
      } else {
        setTimeout(signalGooglefcPresent, 0);
      }
    }
  }
  signalGooglefcPresent();
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Not secret (same reasoning as GA4_MEASUREMENT_ID/ADSENSE_CLIENT_ID in
  // app/(public)/layout.tsx) -- read here, in the root layout, only because
  // Next.js requires beforeInteractive scripts to live there. Renders
  // nothing until ADSENSE_CLIENT_ID is set (no AdSense account exists yet).
  const fundingChoicesPublisherId = getFundingChoicesPublisherId();

  return (
    // suppressHydrationWarning: the theme-init script below sets
    // data-theme on this element before React hydrates (that's the whole
    // point — it must run before first paint to avoid a flash of the
    // wrong theme). React can't know that ahead of time during SSR, so it
    // would otherwise flag this exact, intentional mismatch as an error —
    // this is Next.js's own documented pattern for this case.
    <html lang="es" className={`${anton.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        {fundingChoicesPublisherId && (
          <>
            <Script
              id="google-funding-choices"
              src={`https://fundingchoicesmessages.google.com/i/${fundingChoicesPublisherId}?ers=1`}
              strategy="beforeInteractive"
            />
            <Script id="google-funding-choices-present" strategy="beforeInteractive">
              {FUNDING_CHOICES_PRESENT_SCRIPT}
            </Script>
          </>
        )}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Script id="va-init" strategy="beforeInteractive">
          {VA_INIT_SCRIPT}
        </Script>
        {/* Official @vercel/analytics package, site-wide — replaces legacy's
            manual window.va shim + hand-written /_vercel/insights/script.js
            <script> tag. The shim above is still needed alongside it; see
            VA_INIT_SCRIPT's comment. AnalyticsClient's beforeSend drops
            /admin and non-production-host page views before they're sent —
            see that file for why. */}
        <AnalyticsClient productionHost={new URL(SITE_URL).hostname} />
        {children}
      </body>
    </html>
  );
}
