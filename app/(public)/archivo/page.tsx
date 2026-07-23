import type { Metadata } from 'next';
import Link from 'next/link';
import { getArchiveArticles, type Article } from '@/lib/data/articles';
import { rankScore } from '@/lib/rank';
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

// ——— Shared: a recency-aware tier, used by BOTH views. User feedback:
// "in a news portal what matters most is recency" — the original tierFor
// used raw editorial `priority` alone, so a 5★ story from three weeks ago
// got the exact same giant treatment as one from this morning. That's
// wrong for a news site: importance should decay as a story ages, and a
// merely-fresh story should be able to outrank a stale "important" one in
// the visual hierarchy — same principle `rankScore` (lib/rank) already
// encodes for the homepage's article ORDERING (priority × recency).
//
// Deliberately NOT reusing rankScore's default (PRIORITY_DAY_WEIGHT=1.5,
// i.e. "1 star ≈ 1.5 days"): that's tuned for the homepage's cadence of
// same-day competition among freshly-published stories. The archive is
// the opposite context by definition — everything in it is already older
// than whatever's on the homepage (see getArchiveArticles), typically by
// 1-5+ weeks with this site's actual publishing cadence — so that decay
// rate collapsed literally every archive article to the bottom tier
// (verified directly: all 24 landed in tier 1, zero elsewhere). Swept
// weight values against the real archive data (see HANDOFF.md) and
// landed on 30 ("1 star ≈ 1 month"): produces a genuine spread across all
// 5 tiers and, importantly, still lets recency differentiate WITHIN a
// priority level — e.g. two ★3 articles at 16 days actually decay below
// same-★3 articles at 9-14 days, landing a tier lower.
//
// Tier boundaries are the midpoints between each priority level's own
// "brand new" score (priority × ARCHIVE_TIER_DAY_WEIGHT at day 0), so a
// tier step costs roughly one star OR about a week and a half of aging,
// whichever the story has less of.
const ARCHIVE_TIER_DAY_WEIGHT = 30;
const TIER_THRESHOLDS: [number, 1 | 2 | 3 | 4 | 5][] = [
  [ARCHIVE_TIER_DAY_WEIGHT * 4.5, 5],
  [ARCHIVE_TIER_DAY_WEIGHT * 3.5, 4],
  [ARCHIVE_TIER_DAY_WEIGHT * 2.5, 3],
  [ARCHIVE_TIER_DAY_WEIGHT * 1.5, 2],
];

function tierFor(article: Article, now: Date): 1 | 2 | 3 | 4 | 5 {
  const score = rankScore(article, now, ARCHIVE_TIER_DAY_WEIGHT);
  for (const [minScore, tier] of TIER_THRESHOLDS) {
    if (score >= minScore) return tier;
  }
  return 1;
}

// ——— Lista: periodic featured row (unchanged rhythm from the prior
// pass — see HANDOFF.md's 2026-07-23 "ritmo tipo revista" entry). A band
// only gets a featured row if its opener's recency-decayed tier is the
// top one (5) — previously this checked raw priority ≥4, now it reuses
// the same tierFor everything else uses, so a stale high-priority article
// no longer forces the rich featured-row treatment just because an editor
// rated it well once. Only a FULL band of FEATURE_INTERVAL is ever
// eligible (a featured pick needs FOUR regular siblings after it in its
// band to avoid a stray gap in the equivalent grid math this pattern was
// originally built for).
const FEATURE_INTERVAL = 5;

function pickFeaturedIds(articles: Article[], now: Date): Set<string> {
  const ids = new Set<string>();
  for (let start = 0; start + FEATURE_INTERVAL <= articles.length; start += FEATURE_INTERVAL) {
    const candidate = articles[start];
    if (tierFor(candidate, now) === 5) ids.add(candidate.id);
  }
  return ids;
}

// ——— Cuadrícula: a direct tier→size "river" (user feedback: give every
// article's own tier a size, not just a periodic few — 1★-tier reads as a
// line of text, 2 a slightly bigger line, 3 a small square, 4 a bigger
// square, 5 the full-width feature treatment).
//
// Consecutive articles of the SAME exact tier (tier-3 with tier-3, tier-4
// with tier-4 — never mixed) are grouped into "clusters" that flow
// together in one wrapped flex row. Originally this grouped any 3/4 run
// together, but real screenshots (user feedback) showed why that's wrong:
// a 200px card sitting next to 280px ones in the same row reads as
// broken/inconsistent even though each individual size was correct —
// every row needs to be internally uniform for the hierarchy to look
// intentional, with the size STEP happening between rows, not within one.
// A same-tier cluster is also inherently the same height (no
// row-height-sync gap risk — see the HANDOFF.md entry on the line-clamp
// fix from an earlier pass for that failure mode). Tier 1/2 (text, no
// photo) and tier 5 (full-width feature, reuses ArchiveFeatureRow) always
// break the flow onto their own line.
type RiverBlock = { type: 'cluster'; items: Article[] } | { type: 'solo'; item: Article; tier: 1 | 2 | 5 };

function groupRiver(articles: Article[], now: Date): RiverBlock[] {
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
    const tier = tierFor(article, now);
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
  // Captured once so every tierFor()/pickFeaturedIds()/groupRiver() call
  // this request agrees on the exact same "now" — recency decay should be
  // stable within a single render, not drift by milliseconds between calls.
  const now = new Date();
  const featuredIds = pickFeaturedIds(articles, now);
  const river = groupRiver(articles, now);
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
                          size={tierFor(a, now) === 4 ? 'md' : 'sm'}
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
