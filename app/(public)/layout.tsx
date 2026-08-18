import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { HeaderScrollEffect } from '@/components/layout/HeaderScrollEffect';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { CookieNotice } from '@/components/CookieNotice';
import { AdSenseProvider } from '@/components/ads/AdSenseProvider';
import { getAdSenseConfig } from '@/lib/adsense';
import { jsonLdScript } from '@/lib/json-ld';
import { SITE_URL } from '@/lib/site-url';

// Site-wide entities, once per public page (2026-08-14 SEO block, crawl-
// only): the Organization crawlers attach every NewsArticle's publisher
// reference to, and the WebSite that names the publication and its
// language. sameAs points at the newsletter — the publication's other
// living surface. Static objects, so they serialize once at module load.
const SITE_JSON_LD = jsonLdScript([
  {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': `${SITE_URL}#organization`,
    name: 'Playbook',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/img/playbook-logo.webp` },
    sameAs: ['https://playbookmedia.substack.com'],
    knowsLanguage: 'es-MX',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    name: 'Playbook — El negocio del deporte',
    url: SITE_URL,
    inLanguage: 'es-MX',
    publisher: { '@id': `${SITE_URL}#organization` },
  },
]);

// Every public page reads live Postgres data (articles, site_content) that
// changes outside of a deploy — the Make.com webhook and (Phase 4) the
// admin CMS both write to it in real time. Without this, `next build`
// would try to statically prerender these pages once at build time (and
// fail if the DB isn't reachable during the build, or worse, silently
// freeze content until the next deploy). Forcing dynamic rendering on this
// segment covers every route nested under app/(public)/.
export const dynamic = 'force-dynamic';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // Same "public routes only, never /admin" scoping legacy/js/analytics.js
  // had — editors aren't the audience being measured. GA4_MEASUREMENT_ID
  // is a public client-side ID, not a secret, but it's still only read
  // here (server-side, this layout has no 'use client') and passed down,
  // rather than referenced as NEXT_PUBLIC_* in client code — one fewer env
  // var naming scheme to keep in sync with what's already set in Vercel.
  const gaMeasurementId = process.env.GA4_MEASUREMENT_ID;
  const adSenseConfig = getAdSenseConfig();

  return (
    <AdSenseProvider config={adSenseConfig}>
      {gaMeasurementId && <GoogleAnalytics measurementId={gaMeasurementId} />}
      {/* Was previously declared per-page, after <Header/> in the render
          tree — meaning every nav link, the search box, and the theme
          toggle all sat *before* it in tab order, so a keyboard user had to
          tab through the entire header before ever reaching the one link
          whose whole purpose is to let them skip it. Declared once here,
          before <Header/>, it's now genuinely the first focusable element
          on every public page, same as every other page-level skip-link
          before it was moved out. */}
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <Header />
      <div id="main-content">{children}</div>
      <Footer />
      <ScrollReveal />
      <HeaderScrollEffect />
      <CookieNotice />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
    </AdSenseProvider>
  );
}
