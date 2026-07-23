import type { Metadata } from 'next';
import Link from 'next/link';
import { getArchiveArticles, type Article } from '@/lib/data/articles';
import { KNOWN_SOURCES, SOURCE_LABELS, type Source } from '@/lib/constants';
import { SCOPE_OPTIONS, SPORT_OPTIONS, VERTICAL_OPTIONS } from '@/lib/taxonomy';
import { NewsRow } from '@/components/article/NewsRow';
import { ArchiveGridCard } from '@/components/article/ArchiveGridCard';
import { ArchiveFeatureRow } from '@/components/article/ArchiveFeatureRow';
import { ArchiveLineRow } from '@/components/article/ArchiveLineRow';

export const metadata: Metadata = {
  title: 'Archivo',
  description:
    'Todo lo publicado en Playbook: noticias, análisis y video sobre el negocio del deporte en México y LATAM, filtrable por fuente y por tema.',
};

type Filters = { source?: string; scope?: string; sport?: string; vertical?: string; view?: string };
type FilterKey = 'source' | 'scope' | 'sport' | 'vertical';
type Props = { searchParams: Promise<Filters> };

const FILTER_TIERS: { key: FilterKey; label: string; options: readonly string[]; optionLabel?: (o: string) => string }[] = [
  { key: 'source', label: 'Sección', options: KNOWN_SOURCES, optionLabel: o => SOURCE_LABELS[o as Source] },
  { key: 'scope', label: 'Alcance', options: SCOPE_OPTIONS },
  { key: 'sport', label: 'Deporte', options: SPORT_OPTIONS },
  { key: 'vertical', label: 'Vertical de negocio', options: VERTICAL_OPTIONS },
];

// Every filter is a real link — clicking one is a normal navigation (works
// with JS disabled), keeping the other active filters intact via the
// current searchParams. See Phase 2 plan: progressive enhancement over a
// client-side re-filter is deliberate here, matching the "core reading
// experience works without JS" requirement.
function filterHref(current: Filters, key: keyof Filters, value: string) {
  const next = { ...current, [key]: value === 'all' ? undefined : value };
  const params = new URLSearchParams();
  (Object.keys(next) as (keyof Filters)[]).forEach(k => {
    if (next[k]) params.set(k, next[k] as string);
  });
  const query = params.toString();
  return query ? `/archivo?${query}` : '/archivo';
}

// ——— Lista: periodic featured row, gated by rating (unchanged from the
// prior pass — see HANDOFF.md's 2026-07-23 "ritmo tipo revista" entry).
// `articles` is already sorted by importance (getArchiveArticles ->
// rankArticles), so a band's first member is automatically its
// highest-ranked one. A band only gets a featured row if its opener is
// ★4+; only a FULL band of FEATURE_INTERVAL is ever eligible (a featured
// pick needs FOUR regular siblings after it in its band to avoid a stray
// gap in the equivalent grid math this pattern was originally built for).
// This system is Lista-only now — Cuadrícula switched to a direct
// per-article tier below.
const FEATURE_INTERVAL = 5;
const FEATURE_MIN_PRIORITY = 4;

function pickFeaturedIds(articles: Article[]): Set<string> {
  const ids = new Set<string>();
  for (let start = 0; start + FEATURE_INTERVAL <= articles.length; start += FEATURE_INTERVAL) {
    const candidate = articles[start];
    if (candidate.priority >= FEATURE_MIN_PRIORITY) ids.add(candidate.id);
  }
  return ids;
}

// ——— Cuadrícula: a direct rating→size "river" (user feedback: give every
// article's own star rating a size, not just a periodic few — 1★ reads as
// a line of text, 2★ a slightly bigger line, 3★ a small square, 4★ a
// bigger square, 5★ the full-width feature treatment). `priority` (1-5,
// same field the homepage hero and Lista's featured gate use) maps 1:1 to
// tier — no ranking/positional math needed, unlike Lista's band rhythm.
//
// Consecutive articles of the SAME exact tier (★3 with ★3, ★4 with ★4 —
// never mixed) are grouped into "clusters" that flow together in one
// wrapped flex row. Originally this grouped any ★3/★4 run together, but
// real screenshots (user feedback) showed why that's wrong: a 200px card
// sitting next to 280px ones in the same row reads as broken/inconsistent
// even though each individual size was correct — every row needs to be
// internally uniform for the hierarchy to look intentional, with the size
// STEP happening between rows, not within one. A same-tier cluster is
// also inherently the same height (no row-height-sync gap risk — see the
// HANDOFF.md entry on the line-clamp fix from an earlier pass for that
// failure mode). ★1/★2 (text, no photo) and ★5 (full-width feature,
// reuses ArchiveFeatureRow) always break the flow onto their own line.
type RiverBlock = { type: 'cluster'; items: Article[] } | { type: 'solo'; item: Article; tier: 1 | 2 | 5 };

function tierFor(article: Article): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.max(1, article.priority)) as 1 | 2 | 3 | 4 | 5;
}

function groupRiver(articles: Article[]): RiverBlock[] {
  const blocks: RiverBlock[] = [];
  let cluster: Article[] = [];
  let clusterTier: number | null = null;
  const flushCluster = () => {
    if (cluster.length) {
      blocks.push({ type: 'cluster', items: cluster });
      cluster = [];
      clusterTier = null;
    }
  };
  for (const article of articles) {
    const tier = tierFor(article);
    if (tier === 3 || tier === 4) {
      if (clusterTier !== null && clusterTier !== tier) flushCluster();
      cluster.push(article);
      clusterTier = tier;
    } else {
      flushCluster();
      blocks.push({ type: 'solo', item: article, tier });
    }
  }
  flushCluster();
  return blocks;
}

export default async function ArchivoPage({ searchParams }: Props) {
  const filters = await searchParams;
  const articles = await getArchiveArticles(filters);
  // Cuadrícula is the default (user feedback) — Lista is the opt-in via
  // ?view=list, not the other way around like the prior pass.
  const list = filters.view === 'list';
  const grid = !list;
  const featuredIds = pickFeaturedIds(articles);
  const river = groupRiver(articles);
  // The whole taxonomy lives behind a closed-by-default <details> (same
  // "never greet the reader with tags" feedback as the article page's
  // ArticleTopics disclosure). It re-opens on its own while any filter is
  // active so the state driving the list is never invisible.
  const activeFilters = FILTER_TIERS.filter(tier => filters[tier.key]);

  return (
    <>
      <main className="container news-section archive-page" id="archivo-main">
        <div className="section-head page-head">
          <div>
            <h2>Archivo</h2>
            <p className="sub">Todo lo publicado en Playbook que ya no está en la portada.</p>
          </div>
          <Link className="section-link" href="/">← Volver a Noticias</Link>
        </div>

        <div className="archive-toolbar">
          <details className="archive-filters" open={activeFilters.length > 0}>
            <summary className="archive-filters-summary">
              <svg viewBox="0 0 14 13" width="13" height="12" aria-hidden="true">
                <path d="M1 1.5h12M3.5 6.5h7M5.5 11.5h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Filtros
              {activeFilters.length > 0 && (
                <span className="archive-filters-count">({activeFilters.length})</span>
              )}
              <svg className="archive-filters-chevron" viewBox="0 0 12 8" width="11" height="7" aria-hidden="true">
                <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="archive-filters-panel">
              {FILTER_TIERS.map(tier => (
                <div className="tag-filter-group" role="group" aria-label={`Filtrar por ${tier.label}`} key={tier.key}>
                  <span className="tag-filter-label">{tier.label}</span>
                  <Link
                    className={`filter-btn${!filters[tier.key] ? ' active' : ''}`}
                    aria-pressed={!filters[tier.key]}
                    href={filterHref(filters, tier.key, 'all')}
                  >
                    Todo
                  </Link>
                  {tier.options.map(option => (
                    <Link
                      key={option}
                      className={`filter-btn${filters[tier.key] === option ? ' active' : ''}`}
                      aria-pressed={filters[tier.key] === option}
                      href={filterHref(filters, tier.key, option)}
                    >
                      {tier.optionLabel ? tier.optionLabel(option) : option}
                    </Link>
                  ))}
                </div>
              ))}
              {activeFilters.length > 0 && (
                <Link className="archive-filters-clear" href={list ? '/archivo?view=list' : '/archivo'}>
                  Limpiar filtros
                </Link>
              )}
            </div>
          </details>

          <div className="view-toggle" role="group" aria-label="Modo de vista">
            <Link
              className={`filter-btn${list ? ' active' : ''}`}
              aria-pressed={list}
              href={filterHref(filters, 'view', 'list')}
            >
              Lista
            </Link>
            <Link
              className={`filter-btn${grid ? ' active' : ''}`}
              aria-pressed={grid}
              href={filterHref(filters, 'view', 'all')}
            >
              Cuadrícula
            </Link>
          </div>
        </div>

        {grid ? (
          <div className="archive-river fade-swap">
            {river.length
              ? river.map((block, bi) =>
                  block.type === 'cluster' ? (
                    <div className="archive-river-cluster" key={`cluster-${block.items[0].id}`}>
                      {block.items.map((a, ii) => (
                        <ArchiveGridCard
                          key={a.id}
                          article={a}
                          size={tierFor(a) === 4 ? 'md' : 'sm'}
                          priority={bi === 0 && ii === 0}
                        />
                      ))}
                    </div>
                  ) : block.tier === 5 ? (
                    <ArchiveFeatureRow key={block.item.id} article={block.item} priority={bi === 0} />
                  ) : (
                    <ArchiveLineRow key={block.item.id} article={block.item} tier={block.tier} />
                  )
                )
              : <p className="empty-state">No hay más artículos con estos filtros.</p>}
          </div>
        ) : (
          <div className="news-list fade-swap">
            {articles.length
              ? articles.map((a, i) =>
                  featuredIds.has(a.id)
                    ? <ArchiveFeatureRow key={a.id} article={a} priority={i === 0} />
                    : <NewsRow key={a.id} article={a} heading="h3" withTagPills />
                )
              : <p className="empty-state">No hay más artículos con estos filtros.</p>}
          </div>
        )}
      </main>
    </>
  );
}
