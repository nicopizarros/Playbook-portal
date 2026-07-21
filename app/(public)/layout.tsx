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
      <Header />
      {children}
      <Footer />
      <ScrollReveal />
      <CookieNotice />
    </>
  );
}
