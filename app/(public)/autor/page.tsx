import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesByAuthor } from '@/lib/data/articles';
import { NewsRow } from '@/components/article/NewsRow';
import { SITE_URL } from '@/lib/site-url';
import { authorDisplayName, isIndexableAuthorName } from '@/lib/author-name';
import { jsonLdScript } from '@/lib/json-ld';

type Props = { searchParams: Promise<{ nombre?: string }> };

// `nombre` arrives from the URL and lands in the title, the H1 and the
// canonical, so it is cleaned before any of that. The raw column can carry
// markdown links (guest bylines) — and on 2026-09-02 exactly that string was
// live in the sitemap and rendering as an indexable page whose <title> was
// unrendered markdown. See lib/author-name.ts.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { nombre } = await searchParams;
  const name = authorDisplayName(nombre);
  const articles = name ? await getArticlesByAuthor(name) : [];
  // Canonical always points at the CLEAN form, so an old raw-markdown URL
  // still resolves (getArticlesByAuthor matches on display name) but
  // consolidates onto the tidy one instead of competing with it.
  const canonicalUrl = `${SITE_URL}/autor${name ? `?nombre=${encodeURIComponent(name)}` : ''}`;

  if (name && articles.length && isIndexableAuthorName(name)) {
    return {
      title: name,
      description: `Artículos publicados por ${name} en Playbook.`,
      alternates: { canonical: canonicalUrl },
      robots: { index: true, follow: true },
    };
  }
  // Reachable, but never indexed: either there is no such author, or the
  // stored value is not a name we would want as a title.
  return {
    title: name || 'Autor',
    alternates: { canonical: canonicalUrl },
    robots: { index: false, follow: true },
  };
}

export default async function AutorPage({ searchParams }: Props) {
  const { nombre } = await searchParams;
  const name = authorDisplayName(nombre);
  const articles = name ? await getArticlesByAuthor(name) : [];

  // ProfilePage, so the promise the article schema makes is kept: every
  // bylined NewsArticle sets author.url to exactly this URL, and Google's
  // Article guidance says an internal author URL should resolve to profile-
  // page structured data. Emitted only when the page is also indexable, so
  // the markup and the robots directive never disagree.
  const profileLd = name && articles.length && isIndexableAuthorName(name)
    ? [{
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}/autor?nombre=${encodeURIComponent(name)}#profile`,
        url: `${SITE_URL}/autor?nombre=${encodeURIComponent(name)}`,
        mainEntity: {
          '@type': 'Person',
          name,
          url: `${SITE_URL}/autor?nombre=${encodeURIComponent(name)}`,
          worksFor: { '@id': `${SITE_URL}#organization` },
        },
      }]
    : null;

  return (
    <>
      {profileLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(profileLd) }} />
      )}
      <main className="container news-section archive-page" id="autor-main">
        <div className="section-head page-head">
          <div>
            {name && <span className="eyebrow">Autor</span>}
            <h1>{name || 'Autor'}</h1>
            <p className="sub">Todo lo publicado por este autor en Playbook.</p>
          </div>
          <Link className="section-link" href="/">← Volver a Noticias</Link>
        </div>

        <div>
          {name && articles.length ? (
            <div className="news-list">
              {articles.map(a => <NewsRow key={a.id} article={a} heading="h3" />)}
            </div>
          ) : name ? (
            <p className="empty-state">Todavía no hay artículos de este autor.</p>
          ) : (
            <div className="empty-state error-state">
              <p>No encontramos a este autor.</p>
              <p><Link href="/">Volver a Playbook</Link></p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
