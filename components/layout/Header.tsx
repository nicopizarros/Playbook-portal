import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/auth';
import { getSiteContent } from '@/lib/data/site-content';
import { getAllArticles } from '@/lib/data/articles';
import { HeaderNav } from './HeaderNav';
import { Ticker } from './Ticker';

export async function Header() {
  const [content, articles, session] = await Promise.all([getSiteContent(), getAllArticles(), auth()]);
  const { nav } = content;
  const readerEmail = session?.user?.role === 'reader' ? session.user.email : null;

  const searchArticles = articles.map(a => ({
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    publication: a.publication,
    source: a.source,
  }));

  return (
    <header className="topbar">
      <div className="container nav">
        <Link href="/" className="brand" aria-label="Playbook — inicio">
          <Image
            className="logo-light"
            src="/assets/img/playbook-logo.webp"
            width={640}
            height={158}
            alt="Playbook"
            priority
          />
          <Image
            className="logo-dark"
            src="/assets/img/playbook-logo-dark.png"
            width={640}
            height={158}
            alt="Playbook"
            priority
          />
          {/* Green bracket accent — same clip-path shape as the
              end-of-article mark (styles/article.css). Hidden at rest;
              components/layout/HeaderScrollEffect.tsx fades it in once the
              wordmark has narrowed down to just the "P" on scroll. */}
          <span className="brand-mark-accent" aria-hidden="true"></span>
        </Link>
        <HeaderNav
          links={nav.links}
          ctaLabel={nav.ctaLabel}
          ctaUrl={nav.ctaUrl}
          searchArticles={searchArticles}
          readerEmail={readerEmail ?? null}
        />
      </div>
      <Ticker articles={articles} />
    </header>
  );
}
