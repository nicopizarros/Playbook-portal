import type { Metadata } from 'next';
import { Anton, Inter } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
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
    icon: '/assets/img/playbook-logo.webp',
    apple: '/assets/img/playbook-logo.webp',
  },
  openGraph: {
    type: 'website',
    siteName: 'Playbook',
    locale: 'es_MX',
  },
  twitter: {
    card: 'summary_large_image',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the theme-init script below sets
    // data-theme on this element before React hydrates (that's the whole
    // point — it must run before first paint to avoid a flash of the
    // wrong theme). React can't know that ahead of time during SSR, so it
    // would otherwise flag this exact, intentional mismatch as an error —
    // this is Next.js's own documented pattern for this case.
    <html lang="es" className={`${anton.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Script id="va-init" strategy="beforeInteractive">
          {VA_INIT_SCRIPT}
        </Script>
        {/* Official @vercel/analytics package, site-wide (reader and admin
            routes both) — replaces legacy's manual window.va shim + hand-
            written /_vercel/insights/script.js <script> tag. The shim above
            is still needed alongside it; see VA_INIT_SCRIPT's comment. */}
        <Analytics />
        {children}
      </body>
    </html>
  );
}
