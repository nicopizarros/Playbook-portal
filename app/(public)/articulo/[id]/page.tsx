import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllArticles, getArticleById, getArticleMetaById, getArticlesBySource, type Article } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { relatedArticles, shouldShowAuthor } from '@/lib/related-articles';
import { resolveEntitlement } from '@/lib/metering';
import { ArticleTopics } from '@/components/article/ArticleTopics';
import { ArticleHeadline } from '@/components/article/ArticleHeadline';
import { ArticleEndMark } from '@/components/article/ArticleEndMark';
import { ArticleMotion } from '@/components/article/ArticleMotion';
import { RelatedCard } from '@/components/article/RelatedCard';
import { ShareRow } from '@/components/article/ShareRow';
// NewsRow is gone from this page (La Lectura, 2026-08-05): "Sigue leyendo"
// renders RelatedCard — product-identity preview cards — instead of the
// homepage's plain list rows.
import { EmailWall } from '@/components/article/EmailWall';
import { ArticleAnalyticsBeacon } from '@/components/article/ArticleAnalyticsBeacon';
import { ArticleEngagement } from '@/components/article/ArticleEngagement';
import { EmailWallBeacon } from '@/components/article/EmailWallBeacon';
import { productForSource } from '@/lib/analytics-events';
import { ArticleSources } from '@/components/article/ArticleSources';
import { AdSlot } from '@/components/ads/AdSlot';
import { splitAfterParagraph } from '@/lib/split-after-paragraph';
import { hubForArticle, hubPath } from '@/lib/hubs';
import {
  hubForSource,
  extractMoneyTrailFromHtml,
  extractMoneyTrailFromParagraphs,
  markOpinionCallout,
  markLeadIns,
  caseNumber,
  caseStatus,
  shotLabel,
  weekdayFor,
  OPINION_TEXT_PREFIX,
} from '@/lib/product-hubs';
import { applyBodyDevices, deviceFromParagraph, createDeviceLedger } from '@/lib/article-devices';
import { extractSourcesFromHtml, extractSourcesFromParagraphs } from '@/lib/article-sources';
import { MoneyTrail } from '@/components/products/MoneyTrail';
import { ShotProgress } from '@/components/products/ShotProgress';
import { jsonLdScript } from '@/lib/json-ld';
import { DEFAULT_OG_IMAGE, OG_DEFAULTS } from '@/lib/og-image';
import { SITE_URL } from '@/lib/site-url';
import { articlePath, articleUrl } from '@/lib/article-url';
import { authorDisplayName } from '@/lib/author-name';

// The slug arrives as a path segment now, not as `?id=`. Next has already
// percent-decoded it by the time it reaches us, so ids with accents or
// slashes round-trip correctly without a decodeURIComponent here.
type Props = { params: Promise<{ id: string }> };

function canonicalUrlFor(id: string) {
  return articleUrl(SITE_URL, id);
}

// Same article, as a site-relative path. Used for anything that has to
// work against the origin the reader is actually on rather than the
// canonical one — see EmailWall's redirectTo below.
function pathFor(id: string) {
  return articlePath(id);
}

// A JSON-LD reference to the site-wide Playbook entity. The full node —
// NewsMediaOrganization with sameAs, masthead, publishingPrinciples — is
// emitted once per page by app/(public)/layout.tsx:63-73, so every article
// on the site resolves to that single organization rather than minting an
// anonymous look-alike of its own.
const PLAYBOOK_ORG_REF = { '@id': `${SITE_URL}#organization` };

// The byline's default behavior wraps the whole author string in one
// internal `/autor?nombre=` link (a house-staff author archive page).
// Guest collaborations (2026-08-08, e.g. "Rodrigo Dosal, fundador de DOME
// Sport") instead need per-name external links (the author's own
// Instagram, their org's site), which a single internal link can't
// express. Reuses the same `[text](url)` syntax scripts/publish-
// newsletter.ts's parseInlineMarks already applies to bodyMarkdown, so an
// editor can drop markdown links straight into the `author` field. Falls
// back to the original single internal link whenever the field has no
// markdown links, so every normal in-house byline renders exactly as
// before.
function renderAuthorByline(author: string) {
  const linkPattern = /\[(.+?)\]\((\S+?)\)/g;
  if (!linkPattern.test(author)) {
    // The clean name in the URL, the raw string as the visible text — they
    // are identical for a plain byline, and for anything else the URL must
    // match what /autor canonicalises to and what the sitemap publishes.
    return <Link href={`/autor?nombre=${encodeURIComponent(authorDisplayName(author))}`}>{author}</Link>;
  }
  linkPattern.lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = linkPattern.exec(author))) {
    if (match.index > lastIndex) nodes.push(author.slice(lastIndex, match.index));
    nodes.push(
      <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer">
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < author.length) nodes.push(author.slice(lastIndex));
  return nodes;
}

// Uses getArticleMetaById exclusively — metadata (og:description etc.)
// only ever needs excerpt/image, never the body, for every entitlement
// branch alike, same as legacy behavior.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = id ? await getArticleMetaById(id) : null;

  if (!article) {
    return { title: 'Artículo no encontrado', robots: { index: false, follow: true } };
  }

  const canonicalUrl = canonicalUrlFor(article.id);
  // Fallback is the 1200×630 site card, not the logo file this used to point
  // at: playbook-logo.webp is a 640×158 wordmark (measured, not guessed — an
  // earlier version of this comment said "~180×44", which is its CSS display
  // size in the header, not the asset). At 4:1 every social network either
  // letterboxes it into a mostly-empty box or rejects it. An article with no
  // cover photo is common here (most Noticias rows have imageUrl empty —
  // checked against the real table), so this is the *usual* card, not an
  // edge case.
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
// top-level paragraph boundaries. The trail now carries its own label
// (La Lectura, 2026-08-05): inside a dossier-skinned article it reads as a
// chapter divider, and a labeled divider explains itself.
function ProductHtml({ html, source }: { html: string; source: string }) {
  if (source === 'la-lana') {
    const trail = extractMoneyTrailFromHtml(html);
    if (trail) {
      return (
        <>
          {trail.before.trim() !== '' && <div dangerouslySetInnerHTML={{ __html: trail.before }} />}
          <MoneyTrail stops={trail.stops} scrub label="Ruta del dinero" />
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
  | { kind: 'leadin'; label: string; text: string }
  | { kind: 'opinion'; text: string }
  | { kind: 'device'; html: string }
  | { kind: 'trail'; stops: string[] };

// The "**Label:** rest" house style in a plain-text body — mirror of
// markLeadIns for this body shape.
const PLAIN_LEADIN_RE = /^\*\*([^*]{2,42}?):\*\*\s*([\s\S]*)$/;

function plainBlocksFor(
  paragraphs: string[],
  source: string,
  readingTime: number | null,
  priority: number | null,
  articleDate?: string,
): PlainBlock[] {
  // Every product source gets the full device set — the four-paragraph
  // "Opinión de Playbook" standard spans Noticias, La Lana and Infinitas
  // alike (see lib/product-hubs.ts's regex comment). ALL designed devices
  // (Cifra clave, Jugada, the round-3 collection) go through
  // deviceFromParagraph — the same builders as the HTML path, so the
  // markup can't drift between body shapes — under the same per-article
  // budget applyBodyDevices enforces there: document order, no repeated
  // type, excess declarations stay readable text. The Opinión callout and
  // the money trail are exempt (see deviceBudgetFor's comment).
  const isProduct = hubForSource(source) !== null;
  // One ledger, shared with the HTML path's implementation (createDeviceLedger
  // in lib/article-devices.ts) rather than a second copy of the budget rules
  // here — it owns the count, the no-repeated-type rule AND the mutually
  // exclusive pairs (Venta/Jugada, Cadena/Cronología), which a duplicated
  // counter here could not have known about.
  const ledger = createDeviceLedger(readingTime, priority);
  const blocks: PlainBlock[] = paragraphs.map((p): PlainBlock => {
    if (isProduct && OPINION_TEXT_PREFIX.test(p)) {
      return { kind: 'opinion', text: p.replace(OPINION_TEXT_PREFIX, '') };
    }
    if (isProduct) {
      const device = deviceFromParagraph(p, { articleDate });
      if (device && ledger.take(device.name)) {
        return { kind: 'device', html: device.markup };
      }
      if (device) return { kind: 'text', text: p };
    }
    if (isProduct) {
      const leadin = p.match(PLAIN_LEADIN_RE);
      if (leadin && !/^[\d\s.,%€$]+$/.test(leadin[1])) {
        return { kind: 'leadin', label: leadin[1], text: leadin[2] };
      }
    }
    return { kind: 'text', text: p };
  });
  if (source === 'la-lana') {
    const trail = extractMoneyTrailFromParagraphs(paragraphs);
    if (trail) blocks.splice(trail.index, 1, { kind: 'trail', stops: trail.stops });
  }
  return blocks;
}

function PlainBlockView({ block }: { block: PlainBlock }) {
  if (block.kind === 'trail') return <MoneyTrail stops={block.stops} scrub label="Ruta del dinero" />;
  if (block.kind === 'opinion') {
    return (
      <aside className="shot-opinion">
        <span className="shot-opinion-kicker">Opinión de Playbook</span>
        <p>{block.text}</p>
      </aside>
    );
  }
  if (block.kind === 'device') {
    // Markup assembled by lib/article-devices.ts's builders from the
    // editor's own plain text, with every interpolation entity-escaped
    // there — same trust boundary as the HTML-body dangerouslySetInnerHTML
    // call sites above.
    return <div dangerouslySetInnerHTML={{ __html: block.html }} />;
  }
  if (block.kind === 'leadin') {
    return (
      <p>
        <strong className="lect-leadin">{block.label}:</strong> {block.text}
      </p>
    );
  }
  return <p>{block.text}</p>;
}

export default async function ArticuloPage({ params }: Props) {
  const { id } = await params;
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
  // SEO block (2026-08-14 upgrade, all of it invisible): keywords from the
  // taxonomy the article is already filed under, a real Person author when
  // the byline is actually shown, the canonical url on the entity itself,
  // and — the important one — PAYWALL markup. The site meters articles
  // (3 free reads/month, lib/metering.ts) while serving crawlers the full
  // body (bots are metering-exempt), which is precisely the situation
  // Google's flexible-sampling guidance says to declare with
  // isAccessibleForFree + hasPart, or risk it being read as cloaking. The
  // cssSelector names the element the wall hides (.article-body).
  const keywords = [...meta.tagsVertical, ...meta.tagsSport, ...meta.tagsScope];
  const jsonLdBase = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: meta.title,
    description: meta.excerpt,
    // Deliberately excerpt only, never the full body/teaser — this script
    // tag is part of the page's response like everything else, so it's
    // subject to the same "no body to an unentitled reader" rule.
    articleBody: meta.excerpt,
    // The 1200x630 site card, never the wordmark: Google's Article guidance
    // is explicit that the image should be relevant to the article rather
    // than a logo, and an article with no cover photo is common here.
    image: [meta.imageUrl || `${SITE_URL}${DEFAULT_OG_IMAGE.url}`],
    datePublished: meta.date || undefined,
    dateModified: meta.date || undefined,
    articleSection: meta.publication || undefined,
    inLanguage: 'es-MX',
    url: canonicalUrl,
    ...(keywords.length ? { keywords: keywords.join(', ') } : {}),
    isAccessibleForFree: false,
    hasPart: {
      '@type': 'WebPageElement',
      isAccessibleForFree: false,
      cssSelector: '.article-body',
    },
    // Both of these point at the ONE Playbook entity — the
    // NewsMediaOrganization defined in app/(public)/layout.tsx:63-73, which
    // carries sameAs, masthead and publishingPrinciples. Before 2026-09-02
    // each article inlined its own anonymous `{'@type':'Organization',
    // name:'Playbook'}` for publisher and worksFor, so a page emitted three
    // disconnected Playbook nodes and Google had no reason to treat any of
    // them as the same publisher it saw on the next article. Referencing by
    // @id consolidates ~211 articles onto one entity.
    author:
      showAuthor && meta.author
        ? {
            '@type': 'Person',
            name: authorDisplayName(meta.author),
            // The author's own archive page. It exists, it is indexable
            // when the author has articles, and /equipo already builds this
            // exact URL for its Person nodes — the article was the one
            // surface that named an author without ever linking to them.
            url: `${SITE_URL}/autor?nombre=${encodeURIComponent(authorDisplayName(meta.author))}`,
            worksFor: PLAYBOOK_ORG_REF,
          }
        // No byline shown: Playbook itself is the author. This used to emit
        // `{Organization, name: meta.publication}` — i.e. the *section*
        // name, so every unbylined story was authored by "Noticias" or "La
        // Lana del Deporte", entities that do not exist and accrue nothing.
        //
        // Restated inline for the same reason as publisher below: a bare
        // {'@id'} only resolves if the parser merges this script tag with the
        // layout's, and Google's Article guidance wants author.name populated.
        : { ...PLAYBOOK_ORG_REF, '@type': 'Organization', name: 'Playbook' },
    publisher: {
      ...PLAYBOOK_ORG_REF,
      // Restated alongside the @id rather than left to the reference alone:
      // Google's Article guidance asks for publisher name + logo directly,
      // and a parser that does not resolve @id references still gets a
      // complete publisher instead of a bare pointer.
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
  // A piece that is hub coverage is badged by its DESTINATION, not by the
  // product that published it: the reader is being offered LFA coverage,
  // and /coberturas/lfa is where more of it lives. Null for almost every
  // article, which falls through to the product badge below.
  const coverageHub = hubForArticle(meta.tagsProperty);

  // BreadcrumbList mirrors the navigation the page already renders (the
  // kicker chip links to the hub): Portada → hub → article. Non-hub
  // sources (opinion) skip the middle crumb. Part of the invisible SEO
  // block above — crawl-only, nothing visual.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Playbook', item: SITE_URL },
      ...(hub ? [{ '@type': 'ListItem', position: 2, name: hub.name, item: `${SITE_URL}${hub.path}` }] : []),
      { '@type': 'ListItem', position: hub ? 3 : 2, name: meta.title, item: canonicalUrl },
    ],
  };
  const articleClass = `article-detail${hub ? ` article-product-${hub.source}` : ''}`;

  // ——— Per-product article shells (La Lectura, 2026-08-05): each product's
  // article opens inside its hub's world, on one shared skeleton. The shell
  // data comes from the same cheap list queries the hubs use (LIST_COLUMNS
  // only, no body) so it's safe to compute for the walled branch too — the
  // metering rule is about the BODY, and the shell is identity metadata.
  //
  // La Lana opens like a case file: folder tab with the computed expediente
  // number, "fecha del caso", and the open/archived stamp — plus the
  // "siguiente expediente" handoff at the foot (the next OLDER case, the
  // direction a dossier reads; the newest one when the reader is already at
  // the oldest).
  let lanaShell: {
    number: string;
    status: 'abierto' | 'archivado';
    next: { article: Article; number: string } | null;
  } | null = null;
  if (meta.source === 'la-lana') {
    const cases = await getArticlesBySource('la-lana');
    const self = cases.find(a => a.id === meta.id);
    if (self) {
      const idx = cases.indexOf(self);
      const nextCase = cases[idx + 1] ?? cases[idx - 1] ?? null;
      lanaShell = {
        number: caseNumber(self, cases),
        status: caseStatus(self),
        next: nextCase ? { article: nextCase, number: caseNumber(nextCase, cases) } : null,
      };
    }
  }

  // Noticias opens like a shot being poured: real weekday + the shot
  // measure ("2 shots ≈ 6 min") — the same units the hub list uses.
  const shotStrip = meta.source === 'noticias' && (
    <div className="lect-shot-meta">
      <span className="lect-day-badge">{weekdayFor(meta.date)}</span>
      <span className="lect-shot-measure">{shotLabel(meta.readingTime)}</span>
    </div>
  );

  // TFBR is born boardroom: the Interticket co-brand strip travels onto the
  // article itself (static here, not sticky — the site header already owns
  // the sticky top edge on article pages).
  const partnerStrip = meta.source === 'futbol-business-review' && (
    <div className="tfbr-partner-strip lect-partner-strip">
      <span className="tfbr-partner-brand">The Futbol Business Review</span>
      <span className="tfbr-partner-note">Engineered by Interticket × Powered by Playbook</span>
    </div>
  );

  // Header order (UI/UX audit 2026-07-23): publication chip → headline →
  // byline → photo. Deliberately NO taxonomy anywhere in the header (user
  // feedback: readers should never be greeted by tags) — the full
  // three-tier index lives in a collapsed <ArticleTopics> disclosure at
  // the article foot. The chip is brand/source identity, not a tag — and
  // for a product source it now links to that product's hub, which is the
  // brand-level navigation the chip always implied.
  const header = (
    <>
      {/* La Lana's case-file tab sits ABOVE the audited kicker→headline→
          byline→photo sequence — the four keep their order; the shell adds
          product identity around them, which is the redesign's whole point. */}
      {lanaShell && (
        <div className="lect-case-tab">
          <span className="lect-case-number">Expediente {lanaShell.number}</span>
          <span className="lect-case-date">Fecha del caso: {meta.dateFormatted}</span>
          <span className={`lana-stamp lana-stamp-${lanaShell.status}`}>
            {lanaShell.status === 'abierto' ? 'Caso abierto' : 'Archivado'}
          </span>
        </div>
      )}
      <div className="article-kicker">
        {coverageHub ? (
          <Link className="tag tag-hub-link" href={hubPath(coverageHub)}>
            {coverageHub.name}
          </Link>
        ) : hub ? (
          <Link className="tag tag-hub-link" href={hub.path}>{meta.publication}</Link>
        ) : (
          <span className="tag">{meta.publication}</span>
        )}
      </div>
      {shotStrip}
      <ArticleHeadline title={meta.title} />
      <div className="byline article-byline">
        {showAuthor && meta.author && (
          <>
            <span className="byline-author">Por {renderAuthorByline(meta.author)}</span>
            {' '}·{' '}
          </>
        )}
        {meta.dateFormatted} · {meta.readingTime || 1} min de lectura
      </div>
      {meta.imageUrl && (
        <figure className={`article-photo-wrap${lanaShell ? ' lect-exhibit' : ''}`}>
          {/* Infinitas covers wear the hub's violet duotone (CSS-only, same
              recipe as .infhub-duotone) so the photo reads as El Marcador's
              even inside the themed article page. */}
          <div className={`lead-photo article-photo${meta.source === 'infinitas' ? ' lect-duotone' : ''}`}>
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
          {(meta.imageCredit || lanaShell) && (
            <figcaption className="photo-credit">
              {/* Evidence-styled figure: a La Lana cover is an exhibit, and
                  an exhibit is labeled. */}
              {lanaShell && (
                <span className="lect-exhibit-label">Anexo fotográfico · Exp. {lanaShell.number}</span>
              )}
              {meta.imageCredit}
            </figcaption>
          )}
        </figure>
      )}
    </>
  );

  if (entitlement.kind === 'walled') {
    return (
      <>
        {partnerStrip}
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
            {/* The wall's own funnel: how often readers hit it, per product,
                and how often they act on it. Denominator for email_wall_cta. */}
            <EmailWallBeacon articleId={meta.id} product={productForSource(meta.source)} />
          </article>
          {/* Shell-only devices (kicker scramble, cover parallax) — the
              walled branch has no body, so the body-level devices simply
              find nothing to animate. */}
          <ArticleMotion />
        </main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript([jsonLdBase, breadcrumbJsonLd]) }}
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
  const bodyHtmlSource = hasNativeBody ? (article.bodyHtml as string) : bodyIsHtml ? bodySource : null;

  // Fuentes (2026-08-10): the source credit is lifted out of the body
  // BEFORE anything else touches it — ahead of the device chain, because
  // markLeadIns would otherwise claim "Fuentes:" as a scan mark, and ahead
  // of the ad split, because the credit belongs at the foot rather than
  // inside either half. Both body shapes are handled; when neither carries
  // a Fuentes paragraph this is simply null and the body is untouched.
  const htmlSources = bodyHtmlSource ? extractSourcesFromHtml(bodyHtmlSource) : null;
  const plainSources = paragraphs.length ? extractSourcesFromParagraphs(paragraphs) : null;
  const sources = htmlSources?.sources ?? plainSources?.sources ?? [];
  const bodyParagraphs = plainSources
    ? paragraphs.filter((_, i) => i !== plainSources.index)
    : paragraphs;

  const rawHtmlBody = htmlSources ? `${htmlSources.before}${htmlSources.after}` : bodyHtmlSource;
  // Device transform chain (all string transforms on the same trust
  // boundary, all before the ad split, which only counts top-level </p>
  // and therefore never cuts any of them open). Order matters only for
  // markLeadIns: it must run LAST, after the cifra/jugada/opinion
  // paragraphs have been consumed by their own devices, so a device
  // label can never double as a scan mark.
  const htmlBody =
    rawHtmlBody && hub
      ? markLeadIns(markOpinionCallout(applyBodyDevices(rawHtmlBody, meta.readingTime, article.priority, { articleDate: meta.date })))
      : rawHtmlBody;
  const splitHtml = htmlBody ? splitAfterParagraph(htmlBody, 3) : null;
  const blocks = plainBlocksFor(bodyParagraphs, article.source, meta.readingTime, article.priority, meta.date);
  const splitPlain = blocks.length > 3 ? [blocks.slice(0, 3), blocks.slice(3)] : null;

  // The "siguiente expediente" handoff already shows the next case — keep
  // it out of "Sigue leyendo" so the foot never repeats a link.
  const relatedShown = related.filter(a => a.id !== lanaShell?.next?.article.id);

  return (
    <>
      <ArticleAnalyticsBeacon articleId={article.id} />
      {/* Depth/completion, and the page-product registration the site-wide
          delegated listeners read (components/analytics/SiteEvents.tsx) --
          /articulo's product comes from the row, not the URL. Full-access
          branch only: the walled branch has no body to measure. */}
      <ArticleEngagement articleId={article.id} product={productForSource(article.source)} />

      {partnerStrip}
      <main className="container article-page" id="articulo">
        <Link className="section-link back-link" href="/">← Volver a Playbook</Link>

        {/* Reading progress: the product's own mark fills as the reader
            advances through .article-body — only where there's a body to
            advance through (the walled branch never renders it). Was
            Noticias-only while the mark was a shot glass; now that each
            product has its own it belongs on all four, so `hub` is the
            condition rather than the source. */}
        {hub && <ShotProgress source={article.source} />}

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
          {/* Source credit, outside .article-body so the end mark stays on
              the last real paragraph (see components/article/ArticleSources). */}
          <ArticleSources sources={sources} />
          {/* Scroll-drawn divider between the reading column and the foot
              apparatus; the topics disclosure drops its own hairline when
              this rule precedes it (styles/lectura.css). */}
          <div className="lect-rule lect-rule-foot" aria-hidden="true" />
          <ArticleTopics article={article} />
          <ShareRow url={canonicalUrl} title={article.title} />
          {article.substackUrl && (
            <a className="btn light article-cta" href={article.substackUrl} target="_blank" rel="noopener noreferrer">
              Ver en Substack
            </a>
          )}
        </article>

        {/* La Lana closes like a dossier: the next expediente handed to the
            reader as a folder, before the general related row. */}
        {article.source === 'la-lana' && lanaShell?.next && (
          <section className="lect-next-case" aria-label="Siguiente expediente">
            <Link
              className="lect-next-link reveal"
              href={articlePath(lanaShell.next.article.id)}
            >
              <span className="lect-next-tab">
                <span className="lect-next-kicker">Siguiente expediente</span>
                <span className="lect-next-number">Exp. {lanaShell.next.number}</span>
              </span>
              <span className="lect-next-body">
                <span className="lect-next-title">{lanaShell.next.article.title}</span>
                <span className="lect-next-open" aria-hidden="true">Abrir →</span>
              </span>
            </Link>
          </section>
        )}

        {relatedShown.length > 0 && (
          <section className="article-related lect-related">
            <h2>Sigue leyendo</h2>
            <div className="lect-related-grid">
              {relatedShown.map(a => (
                <RelatedCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}

        <ArticleMotion />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            { ...jsonLdBase, articleBody: article.teaser || article.excerpt || '' },
            breadcrumbJsonLd,
          ]),
        }}
      />
    </>
  );
}
