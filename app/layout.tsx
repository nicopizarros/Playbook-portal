import type { Metadata } from 'next';
import { Anton, Inter } from 'next/font/google';
import Script from 'next/script';
import { SITE_URL } from '@/lib/site-url';

import '../styles/reset.css';
import '../styles/tokens.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/header.css';
import '../styles/hero.css';
import '../styles/sections.css';
import '../styles/article.css';
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
        {children}
      </body>
    </html>
  );
}
