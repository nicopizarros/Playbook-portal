import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllArticles, getArticleById } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { relatedArticles, shouldShowAuthor } from '@/lib/related-articles';
import { TagPillRow } from '@/components/article/TagPillRow';
import { NewsRow } from '@/components/article/NewsRow';
import { ShareRow } from '@/components/article/ShareRow';
import { SITE_URL } from '@/lib/site-url';

type Props = { searchParams: Promise<{ id?: string }> };

function canonicalUrlFor(id: string) {
  return `${SITE_URL}/articulo?id=${encodeURIComponent(id)}`;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams;
  const article = id ? await getArticleById(id) : null;

  if (!article) {
    return { title: 'Artículo no encontrado', robots: { index: false, follow: true } };
  }

  const canonicalUrl = canonicalUrlFor(article.id);
  const image = article.imageUrl || `${SITE_URL}/assets/img/playbook-logo.webp`;
  const description = article.excerpt || '';

  return {
    title: article.title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url: canonicalUrl,
      images: [image],
      publishedTime: article.date || undefined,
      section: article.publication || undefined,
    },
    twitter: {
      card: article.imageUrl ? 'summary_large_image' : 'summary',
      title: article.title,
      description,
      images: [image],
    },
  };
}

// The body renders from `teaser` for every article today — every migrated
// row has bodyJson = null (see lib/db/schema.ts's comment on articles).
// Phase 4's TipTap editor is what starts populating bodyJson/bodyHtml for
// newly-authored articles; this fallback stays correct for legacy articles
// forever, same as the brief requires.
function paragraphsFrom(text: string) {
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
}

export default async function ArticuloPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const article = id ? await getArticleById(id) : null;

  // Legacy served a soft 404 here (200 status, noindex, inline "no
  // encontramos este artículo" message) because it had no server-side
  // routing to hook into. A real 404 status for a genuinely nonexistent id
  // is the more correct, more crawler-friendly behavior — soft 404s are a
  // known SEO antipattern — and Next's notFound() reuses the same branded
  // not-found page this migration needs anyway (see app/not-found.tsx).
  if (!article) notFound();

  const [pool, content] = await Promise.all([getAllArticles(), getSiteContent()]);
  const canonicalUrl = canonicalUrlFor(article.id);
  const paragraphs = paragraphsFrom(article.teaser || article.excerpt || '');
  const showAuthor = shouldShowAuthor(article, content.siteSettings.mostrarAutorGlobal);
  const related = relatedArticles(article, pool);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    articleBody: article.teaser || article.excerpt || '',
    image: [article.imageUrl || `${SITE_URL}/assets/img/playbook-logo.webp`],
    datePublished: article.date || undefined,
    dateModified: article.date || undefined,
    articleSection: article.publication || undefined,
    inLanguage: 'es-MX',
    author: { '@type': 'Organization', name: article.publication || 'Playbook' },
    publisher: {
      '@type': 'Organization',
      name: 'Playbook',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/img/playbook-logo.webp` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  };

  return (
    <>
      <a className="skip-link" href="#articulo">Saltar al contenido</a>

      <main className="container article-page" id="articulo">
        <Link className="section-link back-link" href="/">← Volver a Playbook</Link>

        <article className="article-detail">
          <span className="tag">{article.publication}</span>
          {article.imageUrl && (
            <div className="lead-photo article-photo">
              <img src={article.imageUrl} alt={article.title} fetchPriority="high" decoding="async" />
            </div>
          )}
          <h1>{article.title}</h1>
          <div className="byline">
            {article.dateFormatted} · {article.readingTime || 1} min
            {showAuthor && article.author && (
              <>
                {' '}· Por <Link href={`/autor?nombre=${encodeURIComponent(article.author)}`}>{article.author}</Link>
              </>
            )}
          </div>
          <TagPillRow article={article} />
          <div className="article-body">
            {paragraphs.length
              ? paragraphs.map((p, i) => <p key={i}>{p}</p>)
              : <p>{article.excerpt}</p>}
          </div>
          <ShareRow url={canonicalUrl} title={article.title} />
          {article.substackUrl && (
            <a className="btn light article-cta" href={article.substackUrl} target="_blank" rel="noopener noreferrer">
              Ver en Substack
            </a>
          )}
        </article>

        {related.length > 0 && (
          <section className="article-related">
            <h2>Sigue leyendo</h2>
            <div className="news-list">
              {related.map(a => (
                <NewsRow key={a.id} article={a} heading="h3" />
              ))}
            </div>
          </section>
        )}
      </main>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
