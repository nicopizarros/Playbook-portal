import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { CookieNotice } from '@/components/CookieNotice';

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

  return (
    <>
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
      <CookieNotice />
    </>
  );
}
