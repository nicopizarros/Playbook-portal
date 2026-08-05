import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllArticles, getArticleById, getArticleMetaById } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { relatedArticles, shouldShowAuthor } from '@/lib/related-articles';
import { resolveEntitlement } from '@/lib/metering';
import { ArticleTopics } from '@/components/article/ArticleTopics';
import { ArticleHeadline } from '@/components/article/ArticleHeadline';
import { ArticleEndMark } from '@/components/article/ArticleEndMark';
import { NewsRow } from '@/components/article/NewsRow';
import { ShareRow } from '@/components/article/ShareRow';
import { EmailWall } from '@/components/article/EmailWall';
import { ArticleAnalyticsBeacon } from '@/components/article/ArticleAnalyticsBeacon';
import { AdSlot } from '@/components/ads/AdSlot';
import { splitAfterParagraph } from '@/lib/split-after-paragraph';
import {
  hubForSource,
  extractMoneyTrailFromHtml,
  extractMoneyTrailFromParagraphs,
  markOpinionCallout,
  OPINION_TEXT_PREFIX,
} from '@/lib/product-hubs';
import { MoneyTrail } from '@/components/products/MoneyTrail';
import { ShotProgress } from '@/components/products/ShotProgress';
import { jsonLdScript } from '@/lib/json-ld';
import { DEFAULT_OG_IMAGE, OG_DEFAULTS } from '@/lib/og-image';
import { SITE_URL } from '@/lib/site-url';

type Props = { searchParams: Promise<{ id?: string }> };

function canonicalUrlFor(id: string) {
  return `${SITE_URL}${pathFor(id)}`;
}

// Same article, as a site-relative path. Used for anything that has to
// work against the origin the reader is actually on rather than the
// canonical one — see EmailWall's redirectTo below.
function pathFor(id: string) {
  return `/articulo?id=${encodeURIComponent(id)}`;
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
  // Fallback is the 1200×630 site card, not the logo file this used to
  // point at: playbook-logo.webp is a ~180×44 wordmark, which every social
  // network either letterboxes into a mostly-empty box or rejects outright
  // for being under its minimum. An article with no cover photo is common
  // here (most industry-shots rows have imageUrl empty — checked against
  // the real table), so this is the *usual* card, not an edge case.
  const image = article.imageUrl || `${SITE_URL}${DEFAULT_OG_IMAGE.url}`;
  const description = article.excerpt || '';

  return {
    title: article.title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    // siteName/locale restated from OG_DEFAULTS on purpose: declaring
    // `openGraph` at all replaces the root layout's object wholesale rather
    // than merging into it, so without this an article card loses
    // og:site_name and og:locale (confirmed in the served HTML).
    openGraph: {
      ...OG_DEFAULTS,
      type: 'article',
      title: article.title,
      description,
      url: canonicalUrl,
      images: [image],
      publishedTime: article.date || undefined,
      section: article.publication || undefined,
    },
    twitter: {
      card: 'summary_large_image',
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

// ——— Product article templates (design brief, 2026-08-05). Each editorial
// product gets body-level devices on top of the shared article shell,
// driven by plain authoring conventions (see lib/product-hubs.ts) so they
// need no schema or editor changes:
//   - La Lana del Deporte: a "Ruta del dinero: A → B → C" paragraph
//     becomes the animated money-trail route, drawn as the reader scrolls.
//   - Industry Shots: a "La opinión de Playbook: …" paragraph becomes the
//     visually separated opinion callout (fact/opinion line made explicit),
//     and a shot-glass progress indicator tracks the read.
// Styling (torn-paper quotes, stamps, accents) rides on the
// .article-product-<source> class — see styles/product-hubs.css.

// HTML bodies: the money-trail paragraph is lifted out and replaced by the
// component. Runs on each ad-split half independently — the trail <p> is
// always intact inside exactly one half because the ad split only cuts at
// top-level paragraph boundaries.
function ProductHtml({ html, source }: { html: string; source: string }) {
  if (source === 'la-lana') {
    const trail = extractMoneyTrailFromHtml(html);
    if (trail) {
      return (
        <>
          {trail.before.trim() !== '' && <div dangerouslySetInnerHTML={{ __html: trail.before }} />}
          <MoneyTrail stops={trail.stops} scrub />
          {trail.after.trim() !== '' && <div dangerouslySetInnerHTML={{ __html: trail.after }} />}
        </>
      );
    }
  }
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// Plain-text bodies (legacy/migrated articles): same conventions, applied
// per paragraph instead of via string transforms.
type PlainBlock =
  | { kind: 'text'; text: string }
  | { kind: 'opinion'; text: string }
  | { kind: 'trail'; stops: string[] };

function plainBlocksFor(paragraphs: string[], source: string): PlainBlock[] {
  // Every product source gets the opinion callout — the four-paragraph
  // "Opinión de Playbook" standard spans Noticias, La Lana and Infinitas
  // alike (see lib/product-hubs.ts's regex comment).
  const isProduct = hubForSource(source) !== null;
  const blocks: PlainBlock[] = paragraphs.map(p =>
    isProduct && OPINION_TEXT_PREFIX.test(p)
      ? { kind: 'opinion', text: p.replace(OPINION_TEXT_PREFIX, '') }
      : { kind: 'text', text: p },
  );
  if (source === 'la-lana') {
    const trail = extractMoneyTrailFromParagraphs(paragraphs);
    if (trail) blocks.splice(trail.index, 1, { kind: 'trail', stops: trail.stops });
  }
  return blocks;
}

function PlainBlockView({ block }: { block: PlainBlock }) {
  if (block.kind === 'trail') return <MoneyTrail stops={block.stops} scrub />;
  if (block.kind === 'opinion') {
    return (
      <aside className="shot-opinion">
        <span className="shot-opinion-kicker">Opinión de Playbook</span>
        <p>{block.text}</p>
      </aside>
    );
  }
  return <p>{block.text}</p>;
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

  // Product hub for this article's source (null for non-product sources,
  // e.g. opinion): links the kicker chip to the product's own hub and
  // scopes the per-product template CSS on the <article>.
  const hub = hubForSource(meta.source);
  const articleClass = `article-detail${hub ? ` article-product-${hub.source}` : ''}`;

  // Header order (UI/UX audit 2026-07-23): publication chip → headline →
  // byline → photo. Deliberately NO taxonomy anywhere in the header (user
  // feedback: readers should never be greeted by tags) — the full
  // three-tier index lives in a collapsed <ArticleTopics> disclosure at
  // the article foot. The chip is brand/source identity, not a tag — and
  // for a product source it now links to that product's hub, which is the
  // brand-level navigation the chip always implied.
  const header = (
    <>
      <div className="article-kicker">
        {hub ? (
          <Link className="tag tag-hub-link" href={hub.path}>{meta.publication}</Link>
        ) : (
          <span className="tag">{meta.publication}</span>
        )}
      </div>
      <ArticleHeadline title={meta.title} />
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
          <article className={articleClass}>
            {header}
            {/* Relative path, not canonicalUrl: this value becomes Auth.js's
                `redirectTo`, and Auth.js drops any redirect target whose
                origin doesn't match the request's own — so an absolute
                canonical built from SITE_URL silently fell back to "/"
                whenever the reader was on any other host. Measured, not
                theorised: signing up from the wall landed on the homepage
                instead of the article. Production happens to match today,
                but every preview deployment, the project's own
                *.vercel.app URL (which serves the site and is reachable)
                and local dev do not. A relative path is resolved against
                whatever origin the reader is on, so it's correct on all of
                them — and getting a reader back to the article they were
                blocked on is the entire point of the sign-up. */}
            <EmailWall articleUrl={pathFor(meta.id)} teaser={meta.wallTeaser} />
          </article>
        </main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdBase) }}
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
  //
  // The opinion callout is applied BEFORE the ad split —
  // splitAfterParagraph tracks <aside> so it can't cut the callout open.
  // All product sources get it (see plainBlocksFor's comment).
  const rawHtmlBody = hasNativeBody ? (article.bodyHtml as string) : bodyIsHtml ? bodySource : null;
  const htmlBody = rawHtmlBody && hub ? markOpinionCallout(rawHtmlBody) : rawHtmlBody;
  const splitHtml = htmlBody ? splitAfterParagraph(htmlBody, 3) : null;
  const blocks = plainBlocksFor(paragraphs, article.source);
  const splitPlain = blocks.length > 3 ? [blocks.slice(0, 3), blocks.slice(3)] : null;

  return (
    <>
      <ArticleAnalyticsBeacon articleId={article.id} />

      <main className="container article-page" id="articulo">
        <Link className="section-link back-link" href="/">← Volver a Playbook</Link>

        {/* El Trago: the shot glass fills as the reader advances through
            .article-body — only where there's a body to advance through
            (the walled branch never renders it). */}
        {article.source === 'industry-shots' && <ShotProgress />}

        <article className={articleClass}>
          {header}
          <div className="article-body">
            {htmlBody ? (
              splitHtml ? (
                <>
                  <ProductHtml html={splitHtml[0]} source={article.source} />
                  <AdSlot slot="inline-article" />
                  <ProductHtml html={splitHtml[1]} source={article.source} />
                </>
              ) : (
                <ProductHtml html={htmlBody} source={article.source} />
              )
            ) : blocks.length ? (
              splitPlain ? (
                <>
                  {splitPlain[0].map((block, i) => (
                    <PlainBlockView key={`a-${i}`} block={block} />
                  ))}
                  <AdSlot slot="inline-article" />
                  {splitPlain[1].map((block, i) => (
                    <PlainBlockView key={`b-${i}`} block={block} />
                  ))}
                </>
              ) : (
                blocks.map((block, i) => <PlainBlockView key={i} block={block} />)
              )
            ) : (
              <p>{article.excerpt}</p>
            )}
          </div>
          <ArticleEndMark />
          <ArticleTopics article={article} />
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
        dangerouslySetInnerHTML={{ __html: jsonLdScript({ ...jsonLdBase, articleBody: article.teaser || article.excerpt || '' }) }}
      />
    </>
  );
}
