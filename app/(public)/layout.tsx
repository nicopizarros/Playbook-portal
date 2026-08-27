import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { HeaderScrollEffect } from '@/components/layout/HeaderScrollEffect';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { SiteEvents } from '@/components/analytics/SiteEvents';
import { CookieNotice } from '@/components/CookieNotice';
import { AdSenseProvider } from '@/components/ads/AdSenseProvider';
import { getAdSenseConfig } from '@/lib/adsense';
import { getSiteContent } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { jsonLdScript } from '@/lib/json-ld';
import { SITE_URL } from '@/lib/site-url';

// Site-wide entities, once per public page (2026-08-14 SEO block, crawl-
// only): the Organization crawlers attach every NewsArticle's publisher
// reference to, and the WebSite that names the publication and its
// language.
//
// Widened in round 1 (2026-08-27). The block used to declare only name,
// url, logo, ONE sameAs and knowsLanguage; it now also carries the
// descriptor, every social profile, and the two links Google actually
// looks for on a news publisher — `masthead` (who runs it) and
// `publishingPrinciples` (the rules it publishes by). This is where search
// engines want the description, which is why the round-1 recommendation to
// delete the homepage's visible "Acerca de" block was REVERTED but this
// half was kept: the JSON-LD now SUPPLEMENTS that block instead of
// replacing it.
//
// `sameAs` is built from the CMS's own footer social links rather than a
// hardcoded list, so a profile added in the admin panel lands in the
// structured data without a deploy — and so the two can never disagree.
// The newsletter is unioned in because it is the publication's other
// living surface and does not live in that list.
//
// NOT declared: `foundingDate`. The founding year is one of the eleven
// open [BRACKET] gaps (docs/TODO.md); an invented year in structured data
// is worse than an absent field.
const NEWSLETTER_URL = 'https://playbookmedia.substack.com';

const ORG_DESCRIPTION =
  'Playbook es la casa editorial que cubre el negocio del deporte en México y Latinoamérica: ' +
  'el capital, los derechos, las marcas, los datos y la relación con el aficionado.';

// Dedupe on a NORMALISED key, not on the raw string: the CMS stores the
// newsletter as "…substack.com/" and the constant below has no trailing
// slash, so a plain Set emitted the same profile twice. Output keeps each
// URL's original form — only the comparison is normalised.
function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter(url => {
    const key = url.toLowerCase().replace(/\/+$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function siteJsonLd(socialUrls: string[]) {
  return jsonLdScript([
    {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      '@id': `${SITE_URL}#organization`,
      name: 'Playbook',
      url: SITE_URL,
      description: ORG_DESCRIPTION,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/img/playbook-logo.webp` },
      sameAs: dedupeUrls([...socialUrls, NEWSLETTER_URL]),
      masthead: `${SITE_URL}/equipo`,
      publishingPrinciples: `${SITE_URL}/estandares`,
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
}

// Every public page reads live Postgres data (articles, site_content) that
// changes outside of a deploy — the Make.com webhook and (Phase 4) the
// admin CMS both write to it in real time. Without this, `next build`
// would try to statically prerender these pages once at build time (and
// fail if the DB isn't reachable during the build, or worse, silently
// freeze content until the next deploy). Forcing dynamic rendering on this
// segment covers every route nested under app/(public)/.
export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Same "public routes only, never /admin" scoping legacy/js/analytics.js
  // had — editors aren't the audience being measured. GA4_MEASUREMENT_ID
  // is a public client-side ID, not a secret, but it's still only read
  // here (server-side, this layout has no 'use client') and passed down,
  // rather than referenced as NEXT_PUBLIC_* in client code — one fewer env
  // var naming scheme to keep in sync with what's already set in Vercel.
  const gaMeasurementId = process.env.GA4_MEASUREMENT_ID;
  const adSenseConfig = getAdSenseConfig();

  // safeUrl drops anything that isn't a real http(s) URL, so a half-typed
  // entry in the CMS can never emit a broken sameAs.
  const content = await getSiteContent();
  const socialUrls = content.footer.socialLinks
    .map(link => safeUrl(link.url))
    .filter(url => /^https?:\/\//i.test(url));
  const siteLd = siteJsonLd(socialUrls);

  return (
    <AdSenseProvider config={adSenseConfig}>
      {gaMeasurementId && <GoogleAnalytics measurementId={gaMeasurementId} />}
      {/* Delegated outbound-link and taxonomy-chip tracking for every
          public page. Mounted unconditionally, not behind gaMeasurementId:
          it also feeds Vercel Web Analytics, and trackEvent() is a silent
          no-op when gtag isn't present (lib/analytics-events.ts). */}
      <SiteEvents />
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteLd }} />
    </AdSenseProvider>
  );
}
