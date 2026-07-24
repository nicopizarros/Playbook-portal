import Link from 'next/link';
import type { OpinionCard, SiteContentData } from '@/lib/data/site-content';
import type { Article } from '@/lib/data/articles';
import { safeUrl } from '@/lib/safe-url';

// Fase 7 UX: restyled to the v24 prototype's analysis-grid/analysis-card
// pattern (docs/playbook-portal-v24-medio-consulta(1).html) — cards share
// one ink border-top with no gaps between them, the first card carries a
// dark ink background with the eyebrow in brand green. Deliberately a
// different visual weight from the news feed: analysis reads as a block,
// not as more headlines. The old 'banner' variant (TFBR, image strip)
// folds into the same typographic card — its wordmark becomes the
// heading, keeping the grid strictly editorial.
//
// ——— 2026-07-24: the cards are now DERIVED FROM PUBLISHED ARTICLES, not
// from a hand-maintained list.
//
// Until now this section rendered content.opinionSection.cards verbatim —
// three rows an editor typed into the CMS's Opinión tab, each with its own
// title/excerpt/URL pointing at Substack. Nothing connected them to the
// articles actually tagged as opinion, so publishing a new opinion piece
// changed nothing here until somebody remembered to also copy it into the
// tab by hand, and a stale card kept pointing at an old post forever. The
// requirement is that this section always shows the complete current set,
// automatically.
//
// `source` is the right field to key on: it is the same taxonomy the
// homepage's 1+5 filter, the archive's "Sección" filter and SOURCE_LABELS
// already use ('opinion' is a first-class member of KNOWN_SOURCES), so
// "what counts as an opinion piece" has exactly one definition sitewide
// and an editor marks a piece as opinion in the one place they already
// set its section.
//
// The CMS cards are kept as a fallback for the case where no article
// carries source='opinion' yet — true in the database as it stands today,
// and blanking a whole homepage section the moment this ships would be a
// worse outcome than briefly showing what it showed yesterday. Once the
// first opinion article is published the live list takes over on its own,
// permanently, with no CMS edit required. The Opinión tab's fields are
// untouched and still edit the heading and the archive link, which have
// no article-derived equivalent.
const MAX_CARDS = 6;

function AnalysisCard({
  masthead,
  title,
  excerpt,
  href,
  external,
  featured,
}: {
  masthead: string;
  title: string;
  excerpt: string;
  href: string;
  external: boolean;
  featured: boolean;
}) {
  const className = `analysis-card${featured ? ' featured' : ''} reveal`;
  const inner = (
    <>
      {masthead && <span className="eyebrow">{masthead}</span>}
      <h3>{title}</h3>
      <p>{excerpt}</p>
      <span className="read">Leer el análisis →</span>
    </>
  );

  // Internal article pages go through <Link> so they get the App Router's
  // client-side navigation like every other on-site card; only the CMS
  // fallback's Substack URLs are true external links.
  return external ? (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <Link className={className} href={href}>
      {inner}
    </Link>
  );
}

export function OpinionSection({
  data,
  articles,
}: {
  data: SiteContentData['opinionSection'];
  articles: Article[];
}) {
  const live = articles.filter(a => a.source === 'opinion').slice(0, MAX_CARDS);
  const fallback: OpinionCard[] = live.length ? [] : data.cards;

  return (
    <section className="analysis-section" id="analisis">
      <div className="container">
        <div className="section-head reveal">
          <div>
            <h2>{data.heading}</h2>
          </div>
          {/* Once the section is article-driven, "ver todo" belongs on the
              site's own filtered archive rather than on Substack — it lands
              on the same source filter this section is built from. The CMS
              link is still used while the fallback is in play, so the
              editor-configured destination isn't silently overridden for
              content that only exists on Substack. */}
          {live.length ? (
            <Link className="section-link" href="/archivo?source=opinion">
              {data.archiveLinkLabel}
            </Link>
          ) : (
            <a
              className="section-link"
              href={safeUrl(data.archiveLinkUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {data.archiveLinkLabel}
            </a>
          )}
        </div>
        <div className="analysis-grid">
          {live.map((article, i) => (
            <AnalysisCard
              key={article.id}
              masthead={article.publication}
              title={article.title}
              excerpt={article.excerpt}
              href={`/articulo?id=${encodeURIComponent(article.id)}`}
              external={false}
              featured={i === 0}
            />
          ))}
          {fallback.map((card, i) => (
            <AnalysisCard
              key={`cms-${i}`}
              masthead={card.masthead}
              title={card.title}
              excerpt={card.excerpt}
              href={safeUrl(card.url)}
              external
              featured={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
