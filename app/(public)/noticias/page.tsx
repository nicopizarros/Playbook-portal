import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesBySource, type Article } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { productHubsContent } from '@/lib/product-hubs-content';
import { shotsFor, shotLabel, weekdayFor, extractPullFigure, MINUTES_PER_SHOT } from '@/lib/product-hubs';
import { SITE_URL } from '@/lib/site-url';
import { SiteMotion } from '@/components/SiteMotion';

// Noticias — the news product's own front page (design brief 2026-08-05;
// renamed + re-accented same day; river treatment added on the next round
// of user feedback: "rn it is a boring list"). The page still rewards
// scanning, but it now reads as a RIVER with three alternating forms
// driven by each story's data, not a uniform list:
//   - tier lg (priority 5): full-width feature band — photo when the
//     story has one, its biggest figure pulled out as a green chip.
//   - tier md (priority 4): two-up cards, thumbnail when available.
//   - tier sm (rest): tight "shots rápidos" clusters — the dense scan
//     rows, grouped under a green tick so density reads as a deliberate
//     rhythm instead of the whole page's only register.
// Masthead copy is CMS-editable (Hubs tab) via productHubsContent().

export const metadata: Metadata = {
  title: 'Noticias',
  description:
    'Lo que debes saber de sports business en menos de 5 minutos. Todas las noticias de Playbook, martes y jueves.',
  alternates: { canonical: `${SITE_URL}/noticias` },
};

function tierFor(priority: number | null): 'lg' | 'md' | 'sm' {
  if ((priority ?? 0) >= 5) return 'lg';
  if ((priority ?? 0) >= 4) return 'md';
  return 'sm';
}

type NewsBlock =
  | { kind: 'feature'; article: Article }
  | { kind: 'cards'; articles: Article[] }
  | { kind: 'quick'; articles: Article[] };

// Consecutive same-tier stories cluster together (same principle as the
// archive river: the size STEP happens between rows, never within one).
// Publication order is never reshuffled.
function groupRiver(articles: Article[]): NewsBlock[] {
  const blocks: NewsBlock[] = [];
  for (const article of articles) {
    const tier = tierFor(article.priority);
    const prev = blocks[blocks.length - 1];
    if (tier === 'lg') {
      blocks.push({ kind: 'feature', article });
    } else if (tier === 'md') {
      if (prev?.kind === 'cards') prev.articles.push(article);
      else blocks.push({ kind: 'cards', articles: [article] });
    } else {
      if (prev?.kind === 'quick') prev.articles.push(article);
      else blocks.push({ kind: 'quick', articles: [article] });
    }
  }
  return blocks;
}

function ShotGlyph() {
  return (
    <svg viewBox="0 0 36 48" width="11" height="15" aria-hidden="true" focusable="false">
      <path d="M7 12 L29 12 L25.5 42 L10.5 42 Z" className="shots-glyph-fill" />
      <path d="M5 8 L31 8 L26.5 45 L9.5 45 Z" fill="none" className="shots-glyph-outline" />
    </svg>
  );
}

function When({ article }: { article: Article }) {
  return (
    <span className="shots-row-when">
      <span className="shots-badge">{weekdayFor(article.date)}</span>
      <span className="shots-row-date">{article.dateFormatted}</span>
    </span>
  );
}

function Measure({ article, glyphs = 1 }: { article: Article; glyphs?: number }) {
  return (
    <span className="shots-row-measure">
      {Array.from({ length: Math.min(glyphs, 3) }, (_, i) => (
        <ShotGlyph key={i} />
      ))}
      {shotLabel(article.readingTime)}
    </span>
  );
}

function articleHref(article: Article) {
  return `/articulo?id=${encodeURIComponent(article.id)}`;
}

export default async function NoticiasHubPage() {
  const [articles, content] = await Promise.all([
    getArticlesBySource('industry-shots'),
    getSiteContent(),
  ]);
  const hubs = productHubsContent(content.productHubs);
  const [lead, ...rest] = articles;
  const river = groupRiver(rest);

  return (
    <main className="hub hub-shots" id="noticias-hub">
      <div className="container">
        <Link className="section-link back-link hub-back" href="/">← Volver a Playbook</Link>

        <header className="hub-shots-masthead">
          <p className="hub-shots-eyebrow">By Playbook</p>
          <h1 className="hub-shots-title">Noticias</h1>
          <p className="hub-shots-sub">{hubs.noticias.sub}</p>
          <p className="hub-shots-cadence">
            {hubs.noticias.cadenceNote}
            <span className="hub-shots-measure">· 1 shot ≈ {MINUTES_PER_SHOT} min</span>
          </p>
        </header>

        {lead ? (
          <section className="shots-lead reveal" aria-label="Última edición">
            <Link className="shots-lead-link" href={articleHref(lead)}>
              <span className="shots-lead-when">
                <span className="shots-badge">{weekdayFor(lead.date)}</span>
                <span className="shots-row-date">{lead.dateFormatted}</span>
              </span>
              <h2 className="shots-lead-title">{lead.title}</h2>
              {lead.excerpt && <p className="shots-lead-excerpt">{lead.excerpt}</p>}
              <Measure article={lead} />
            </Link>
          </section>
        ) : (
          <p className="empty-state hub-empty">Todavía no hay ediciones publicadas.</p>
        )}

        {river.length > 0 && (
          <section className="shots-river" aria-label="Ediciones anteriores">
            {river.map(block => {
              if (block.kind === 'feature') {
                const a = block.article;
                const figure = extractPullFigure(a.title, a.excerpt);
                return (
                  <Link className="shots-feature reveal" href={articleHref(a)} key={a.id}>
                    <span className="shots-feature-copy">
                      <When article={a} />
                      {figure && <span className="shots-figure-chip">{figure}</span>}
                      <h3>{a.title}</h3>
                      {a.excerpt && <p>{a.excerpt}</p>}
                      <Measure article={a} glyphs={shotsFor(a.readingTime)} />
                    </span>
                    {a.imageUrl && (
                      <span className="shots-feature-photo">
                        {/* Editor-supplied URL, arbitrary host — see
                            components/sections/AboutSection.tsx's comment. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.imageUrl} alt="" width={640} height={400} loading="lazy" decoding="async" />
                      </span>
                    )}
                  </Link>
                );
              }
              if (block.kind === 'cards') {
                return (
                  <div className="shots-cards" key={`cards-${block.articles[0].id}`}>
                    {block.articles.map(a => (
                      <Link className="shots-card reveal" href={articleHref(a)} key={a.id}>
                        {a.imageUrl && (
                          <span className="shots-card-photo">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.imageUrl} alt="" width={480} height={280} loading="lazy" decoding="async" />
                          </span>
                        )}
                        <span className="shots-card-copy">
                          <When article={a} />
                          <h3>{a.title}</h3>
                          <Measure article={a} />
                        </span>
                      </Link>
                    ))}
                  </div>
                );
              }
              return (
                <div className="shots-quick" key={`quick-${block.articles[0].id}`}>
                  <span className="shots-quick-tick" aria-hidden="true">
                    Shots rápidos
                  </span>
                  {block.articles.map(a => (
                    <Link className="shots-row" href={articleHref(a)} key={a.id}>
                      <When article={a} />
                      <h3 className="shots-row-title">{a.title}</h3>
                      <Measure article={a} />
                    </Link>
                  ))}
                </div>
              );
            })}
          </section>
        )}

        <div className="hub-foot">
          <Link className="section-link hub-foot-link" href="/archivo?source=industry-shots">
            Ver Noticias en el archivo general →
          </Link>
        </div>
      </div>
      {/* The Lectura motion vocabulary (count-ups, lead-photo parallax,
          staggered groups, the masthead sweep) — shared with the article
          page through lib/motion-kit.ts. */}
      <SiteMotion />
    </main>
  );
}
