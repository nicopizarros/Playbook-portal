import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';

// Every public page reads live Postgres data (articles, site_content) that
// changes outside of a deploy — the Make.com webhook and (Phase 4) the
// admin CMS both write to it in real time. Without this, `next build`
// would try to statically prerender these pages once at build time (and
// fail if the DB isn't reachable during the build, or worse, silently
// freeze content until the next deploy). Forcing dynamic rendering on this
// segment covers every route nested under app/(public)/.
export const dynamic = 'force-dynamic';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <ScrollReveal />
    </>
  );
}
