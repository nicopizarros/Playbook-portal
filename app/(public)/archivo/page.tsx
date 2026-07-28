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
import { SITE_URL } from '@/lib/site-url';

// Unlike /tema and /autor (each a single filter dimension, so their own
// canonical per value is real, bounded content), /archivo has 4 independent
// simultaneous filter tiers (source × scope × sport × vertical) plus view —
// every combination is the same underlying article list sliced a different
// way, not a distinct page worth indexing on its own. Canonicalizing every
// combination back to the bare URL (paired with robots.ts's /archivo?*
// disallow) stops that permutation space from being treated as thousands of
// separate pages — see robots.ts's comment for the crawl-volume half of this.
export const metadata: Metadata = {
  title: 'Archivo',
  description:
    'Todo lo publicado en Playbook: noticias, análisis y video sobre el negocio del deporte en México y LATAM, filtrable por fuente y por tema.',
  alternates: { canonical: `${SITE_URL}/archivo` },
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

// ——— Lista: featured row (the "ritmo tipo revista" of HANDOFF.md's
// 2026-07-23 entry). An article gets the rich photo treatment when its
// recency-decayed tier is the top one (5) — previously this checked raw
// editorial priority ≥4, now it reuses the same tierFor everything else
// uses, so a stale high-priority article no longer forces the featured
// treatment just because an editor rated it well once.
//
// ——— 2026-07-24: the position gate is gone. Requiring a tier-5 article to
// ALSO land on an exact multiple of FEATURE_INTERVAL means the two views
// disagree about the same article: Cuadrícula gives every tier-5 story the
// full ArchiveFeatureRow treatment (it's a `solo` block in groupRiver),
// while Lista only did so if that story happened to sit at index 0, 5, 10…
// Against the real archive the two conditions never coincided — measured
// with Playwright at all four breakpoints, Lista rendered 24 plain rows and
// exactly 0 featured rows, so the "ritmo tipo revista" this function exists
// to produce never actually fired, and a story shown as a photo feature in
// one view silently became a text line in the other.
// Tier 5 is already a scarce, recency-decayed signal (see TIER_THRESHOLDS —
// it takes a top rating AND freshness), which is the rationing the interval
// was standing in for. Using it directly makes the hierarchy identical in
// both views, which is what a reader toggling between them expects.
function pickFeaturedIds(articles: Article[], now: Date): Set<string> {
  const ids = new Set<string>();
  for (const article of articles) {
    if (tierFor(article, now) === 5) ids.add(article.id);
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
//
// ——— 2026-07-24: "hay varios cuadros solos con una fila vacía" (user
// feedback from an iPad session). Splitting on every tier CHANGE, as this
// originally did, means a single ★3 article sitting between two ★4s
// becomes a cluster of exactly one — which renders as a lone 200px card
// marooned in a 1180px flex row, with the rest of the row empty. Verified
// against the real archive data: the runs came out [3, 2, 1, 4], and that
// third run of one is precisely what the report describes.
//
// The fix is to merge singleton runs into a neighbour rather than to let
// them stand alone. Which neighbour matters: merging into the PREVIOUS run
// keeps reading order intact and inherits that run's size, so the row
// stays internally uniform — the property the tier-cluster design exists
// to guarantee (see the note above about a 200px card next to 280px ones
// reading as broken). A singleton with no previous run (the river opens
// with one) merges forward into the next instead. A singleton that is the
// only cluster in the whole river has nowhere to go and keeps its own
// size, which is correct: one card and nothing else isn't a ragged row,
// it's just a short archive.
//
// Size is therefore a property of the CLUSTER, not of each card's own
// tier, so it's resolved here and carried on the block instead of being
// recomputed per card at render time.
// Cards per full row. The river's grid is 4 columns at >=900px and 2 below
// it (styles/article.css) — never 3, never 5 — so a group of exactly 4
// tiles perfectly at both: one full row of 4, or two full rows of 2. That
// is the whole reason the number is 4 and not "however many fit".
//
// This replaced a flex-wrap layout whose rows were sized by each tier's
// flex-basis. That arrangement could not avoid orphans: a run of 4 cards in
// a container with room for 3 wrapped to 3 + 1, and the trailing 1 sat
// alone at 40% of the row width — measured at 1194px and 1440px alike, and
// exactly the "cuadro solo con una fila vacía" in the report. No amount of
// merging runs fixes that, because the orphan is produced by WRAPPING, not
// by the run being short.
const CARDS_PER_ROW = 4;

type RiverBlock =
  | { type: 'cluster'; items: Article[]; size: 'sm' | 'md' }
  | { type: 'solo'; item: Article; tier: 1 | 2 | 5 };

function groupRiver(articles: Article[], now: Date): RiverBlock[] {
  const blocks: RiverBlock[] = [];
  let cluster: Article[] = [];
  let clusterTier: 3 | 4 | null = null;
  const flushCluster = () => {
    if (cluster.length) {
      blocks.push({ type: 'cluster', items: cluster, size: clusterTier === 4 ? 'md' : 'sm' });
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

  // Second pass: pull short runs into an adjacent run so the tiling below
  // has enough cards to build full rows out of.
  //
  // Without this the tiling starves: the real tier sequence is noisy, not
  // banded (measured runs against a production-sized archive:
  // [2,2,3,2,4,4,2,2]), so cutting straight to rows of 4 produced ONE card
  // row for the whole page and demoted 13 articles to text lines. Merging
  // first turns those runs into [5,4,4] and yields three full rows.
  // Only genuinely adjacent runs merge — a run separated from the next by
  // a full-width line row stays where it is, because closing that gap
  // would move an article past another and reorder the archive.
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (block.type !== 'cluster' || block.items.length >= CARDS_PER_ROW) continue;
    const prev = blocks[i - 1];
    const next = blocks[i + 1];
    if (prev?.type === 'cluster') {
      prev.items.push(...block.items);
      blocks.splice(i, 1);
    } else if (next?.type === 'cluster') {
      next.items.unshift(...block.items);
      blocks.splice(i, 1);
    }
  }

  // Third pass: cut every run into rows of exactly CARDS_PER_ROW, and
  // demote whatever is left over.
  //
  // A run of 9 becomes two full card rows plus one leftover; the leftover
  // does NOT become a short third row, it becomes line rows. That is the
  // trade this makes deliberately: an article that can't complete a band
  // with its own tier-mates gets the compact one-line treatment rather
  // than a half-empty row of its own. Every card row the reader sees is
  // therefore full at every viewport width, and every non-card row is
  // full-width text — there is no shape left that can leave a gap.
  //
  // Merging leftovers into a neighbouring run was the obvious alternative
  // and is wrong here: runs are separated by full-width line rows, so
  // merging across one would move an article past another and reorder the
  // archive. Reading order is the one thing this list must not shuffle.
  const tiled: RiverBlock[] = [];
  for (const block of blocks) {
    if (block.type !== 'cluster') {
      tiled.push(block);
      continue;
    }
    const full = Math.floor(block.items.length / CARDS_PER_ROW) * CARDS_PER_ROW;
    for (let i = 0; i < full; i += CARDS_PER_ROW) {
      tiled.push({ type: 'cluster', items: block.items.slice(i, i + CARDS_PER_ROW), size: block.size });
    }
    // A river consisting of nothing but one short run has no full rows to
    // look ragged against, so it keeps its cards rather than degrading to
    // a couple of text lines.
    if (full === 0 && blocks.length === 1) {
      tiled.push(block);
      continue;
    }
    block.items.slice(full).forEach(item => tiled.push({ type: 'solo', item, tier: 2 }));
  }
  return tiled;
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
                          size={block.size}
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
