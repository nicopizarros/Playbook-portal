import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllArticles, getArticleById, getArticleMetaById } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { relatedArticles, shouldShowAuthor } from '@/lib/related-articles';
import { resolveEntitlement } from '@/lib/metering';
import { ArticleTopics } from '@/components/article/ArticleTopics';
import { NewsRow } from '@/components/article/NewsRow';
import { ShareRow } from '@/components/article/ShareRow';
import { EmailWall } from '@/components/article/EmailWall';
import { ArticleAnalyticsBeacon } from '@/components/article/ArticleAnalyticsBeacon';
import { AdSlot } from '@/components/ads/AdSlot';
import { splitAfterParagraph } from '@/lib/split-after-paragraph';
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

  // Header order (UI/UX audit 2026-07-23): publication chip → headline →
  // byline → photo. Deliberately NO taxonomy anywhere in the header (user
  // feedback: readers should never be greeted by tags) — the full
  // three-tier index lives in a collapsed <ArticleTopics> disclosure at
  // the article foot. The chip is brand/source identity, not a tag.
  const header = (
    <>
      <div className="article-kicker">
        <span className="tag">{meta.publication}</span>
      </div>
      <h1>{meta.title}</h1>
      <div className="byline article-byline">
        {showAuthor && meta.author && (
          <>
            <span className="byline-author">
              Por <Link href={`/autor?nombre=${encodeURIComponent(meta.author)}`}>{meta.author}</Link>
            </span>
            {' '}·{' '}
          </>
        )}
        {meta.dateFormatted} · {meta.readingTime || 1} min de lectura
      </div>
      {meta.imageUrl && (
        <figure className="article-photo-wrap">
          <div className="lead-photo article-photo">
            {/* Editor-supplied URL, arbitrary host -- see
                components/sections/AboutSection.tsx's comment. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={meta.imageUrl}
              alt={meta.title}
              width={1200}
              height={750}
              fetchPriority="high"
              decoding="async"
            />
          </div>
          {meta.imageCredit && <figcaption className="photo-credit">{meta.imageCredit}</figcaption>}
        </figure>
      )}
    </>
  );

  if (entitlement.kind === 'walled') {
    return (
      <>
        <main className="container article-page" id="articulo">
          <Link className="section-link back-link" href="/">← Volver a Playbook</Link>
          <article className="article-detail">
            {header}
            <EmailWall articleUrl={canonicalUrl} teaser={meta.wallTeaser} />
          </article>
        </main>
        <script
          type="application/ld+json"
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

  // Fase 4's TipTap editor starts populating bodyJson/bodyHtml for
  // newly-authored articles (see lib/actions/admin.ts's saveArticle/
  // createArticle) — this is the first article in the migration with a
  // real bodyHtml, so it takes priority over the teaser fallback below,
  // which stays correct for every legacy/migrated article (bodyJson still
  // null for all of them).
  const hasNativeBody = !!article.bodyHtml;
  const bodySource = article.teaser || article.excerpt || '';
  const bodyIsHtml = !hasNativeBody && looksLikeHtml(bodySource);
  const paragraphs = hasNativeBody || bodyIsHtml ? [] : paragraphsFrom(bodySource);
  const related = relatedArticles(article, pool);

  // Fase 7: inline-article ad slot after the third paragraph, for both
  // body shapes. HTML bodies split at a safe top-level boundary (or not at
  // all — see lib/split-after-paragraph.ts); plain-text bodies just slice
  // the paragraph array. Either way the ad never trails the final
  // paragraph, and the walled branch above never reaches this code.
  const htmlBody = hasNativeBody ? (article.bodyHtml as string) : bodyIsHtml ? bodySource : null;
  const splitHtml = htmlBody ? splitAfterParagraph(htmlBody, 3) : null;
  const splitPlain = paragraphs.length > 3 ? [paragraphs.slice(0, 3), paragraphs.slice(3)] : null;

  return (
    <>
      <ArticleAnalyticsBeacon articleId={article.id} />

      <main className="container article-page" id="articulo">
        <Link className="section-link back-link" href="/">← Volver a Playbook</Link>

        <article className="article-detail">
          {header}
          <div className="article-body">
            {htmlBody ? (
              splitHtml ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: splitHtml[0] }} />
                  <AdSlot slot="inline-article" />
                  <div dangerouslySetInnerHTML={{ __html: splitHtml[1] }} />
                </>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: htmlBody }} />
              )
            ) : paragraphs.length ? (
              splitPlain ? (
                <>
                  {splitPlain[0].map((p, i) => (
                    <p key={`a-${i}`}>{p}</p>
                  ))}
                  <AdSlot slot="inline-article" />
                  {splitPlain[1].map((p, i) => (
                    <p key={`b-${i}`}>{p}</p>
                  ))}
                </>
              ) : (
                paragraphs.map((p, i) => <p key={i}>{p}</p>)
              )
            ) : (
              <p>{article.excerpt}</p>
            )}
          </div>
          <ShareRow url={canonicalUrl} title={article.title} />
          <ArticleTopics article={article} />
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLdBase, articleBody: article.teaser || article.excerpt || '' }) }}
      />
    </>
  );
}
