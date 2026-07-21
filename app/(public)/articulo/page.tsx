import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllArticles, getArticleById, getArticleMetaById } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { relatedArticles, shouldShowAuthor } from '@/lib/related-articles';
import { resolveEntitlement } from '@/lib/metering';
import { TagPillRow } from '@/components/article/TagPillRow';
import { NewsRow } from '@/components/article/NewsRow';
import { ShareRow } from '@/components/article/ShareRow';
import { EmailWall } from '@/components/article/EmailWall';
import { SITE_URL } from '@/lib/site-url';

type Props = { searchParams: Promise<{ id?: string }> };

function canonicalUrlFor(id: string) {
  return `${SITE_URL}/articulo?id=${encodeURIComponent(id)}`;
}

// Uses getArticleMetaById exclusively — metadata (og:description etc.)
// only ever needs excerpt/image, never the body, for every entitlement
// branch alike, same as legacy behavior.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams;
  const article = id ? await getArticleMetaById(id) : null;

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
//
// `teaser` is NOT consistently plain text in the migrated data: 13 of the
// 30 source articles (traced to legacy's "carga 13 artículos nuevos"
// commit) already contain real HTML markup (<p>, <strong>) rather than
// double-newline-separated paragraphs. Splitting on \n{2,} and rendering
// as escaped text — what legacy's own js/article-page.js did — makes
// those 13 show literal "<p>" tags to readers instead of formatted
// paragraphs. Detecting and rendering real markup as markup fixes a
// genuine, currently-live content bug rather than faithfully porting it;
// dangerouslySetInnerHTML is safe here because teaser only ever comes from
// migrated legacy data or the small internal editorial team (never
// end-user input), same trust boundary already documented for content.json
// fields elsewhere in this codebase (see lib/safe-url.ts).
function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

function paragraphsFrom(text: string) {
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
}

export default async function ArticuloPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const meta = id ? await getArticleMetaById(id) : null;

  // Legacy served a soft 404 here (200 status, noindex, inline "no
  // encontramos este artículo" message) because it had no server-side
  // routing to hook into. A real 404 status for a genuinely nonexistent id
  // is the more correct, more crawler-friendly behavior — soft 404s are a
  // known SEO antipattern — and Next's notFound() reuses the same branded
  // not-found page this migration needs anyway (see app/not-found.tsx).
  if (!meta) notFound();

  // Fetched unconditionally (cheap, single-row, React-cached) rather than
  // only in the full-access branch below: the site-wide "show author"
  // toggle needs to be consistent whether or not this particular reader is
  // entitled to the body, and site_content carries no per-reader
  // entitlement concern of its own.
  const content = await getSiteContent();
  const canonicalUrl = canonicalUrlFor(meta.id);
  const showAuthor = shouldShowAuthor(meta, content.siteSettings.mostrarAutorGlobal);
  const jsonLdBase = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: meta.title,
    description: meta.excerpt,
    // Deliberately excerpt only, never the full body/teaser — this script
    // tag is part of the page's response like everything else, so it's
    // subject to the same "no body to an unentitled reader" rule.
    articleBody: meta.excerpt,
    image: [meta.imageUrl || `${SITE_URL}/assets/img/playbook-logo.webp`],
    datePublished: meta.date || undefined,
    dateModified: meta.date || undefined,
    articleSection: meta.publication || undefined,
    inLanguage: 'es-MX',
    author: { '@type': 'Organization', name: meta.publication || 'Playbook' },
    publisher: {
      '@type': 'Organization',
      name: 'Playbook',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/img/playbook-logo.webp` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  };

  const entitlement = await resolveEntitlement(meta.id);

  const header = (
    <>
      <span className="tag">{meta.publication}</span>
      {meta.imageUrl && (
        <div className="lead-photo article-photo">
          <img src={meta.imageUrl} alt={meta.title} fetchPriority="high" decoding="async" />
        </div>
      )}
      <h1>{meta.title}</h1>
      <div className="byline">
        {meta.dateFormatted} · {meta.readingTime || 1} min
        {showAuthor && meta.author && (
          <>
            {' '}· Por <Link href={`/autor?nombre=${encodeURIComponent(meta.author)}`}>{meta.author}</Link>
          </>
        )}
      </div>
      <TagPillRow article={meta} />
    </>
  );

  if (entitlement.kind === 'walled') {
    return (
      <>
        <a className="skip-link" href="#articulo">Saltar al contenido</a>
        <main className="container article-page" id="articulo">
          <Link className="section-link back-link" href="/">← Volver a Playbook</Link>
          <article className="article-detail">
            {header}
            <EmailWall articleUrl={canonicalUrl} />
          </article>
        </main>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBase) }}
        />
      </>
    );
  }

  // Full access: fetch the real body + everything the related-articles
  // logic needs. Only reached once resolveEntitlement has already
  // confirmed this reader is allowed to see it. Reuses `header`/`showAuthor`
  // computed above from `meta` — `article` is a superset of the same row,
  // so there's nothing to recompute for those fields.
  const [article, pool] = await Promise.all([getArticleById(meta.id), getAllArticles()]);
  if (!article) notFound();

  const bodySource = article.teaser || article.excerpt || '';
  const bodyIsHtml = looksLikeHtml(bodySource);
  const paragraphs = bodyIsHtml ? [] : paragraphsFrom(bodySource);
  const related = relatedArticles(article, pool);

  return (
    <>
      <a className="skip-link" href="#articulo">Saltar al contenido</a>

      <main className="container article-page" id="articulo">
        <Link className="section-link back-link" href="/">← Volver a Playbook</Link>

        <article className="article-detail">
          {header}
          <div className="article-body">
            {bodyIsHtml ? (
              // eslint-disable-next-line react/no-danger
              <div dangerouslySetInnerHTML={{ __html: bodySource }} />
            ) : paragraphs.length ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p>{article.excerpt}</p>
            )}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLdBase, articleBody: article.teaser || article.excerpt || '' }) }}
      />
    </>
  );
}
