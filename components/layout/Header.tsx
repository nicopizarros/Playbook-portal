import { auth } from '@/auth';
import { getSiteContent } from '@/lib/data/site-content';
import { getPublicArticles } from '@/lib/data/articles';
import { BrandLink } from './BrandLink';
import { HeaderNav } from './HeaderNav';
import { Ticker } from './Ticker';

export async function Header() {
  const [content, articles, session] = await Promise.all([getSiteContent(), getPublicArticles(), auth()]);
  const { nav } = content;
  const readerEmail = session?.user?.role === 'reader' ? session.user.email : null;

  return (
    <header className="topbar">
      <div className="container nav">
        <BrandLink />
        <HeaderNav
          links={nav.links}
          ctaLabel={nav.ctaLabel}
          ctaUrl={nav.ctaUrl}
          readerEmail={readerEmail ?? null}
          /* The "Alcance" column of the Nosotros panel. Same three figures
             the homepage's StatsSection shows, from the same CMS row —
             one source, two surfaces. */
          reach={content.statsSection.stats}
        />
      </div>
      <Ticker articles={articles} />
    </header>
  );
}
