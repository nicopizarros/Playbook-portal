import type { Article } from '@/lib/data/articles';
import { topicsForSection, type TaxonomyTier } from '@/lib/taxonomy';

const TIER_COLUMN: Record<TaxonomyTier, 'tagsScope' | 'tagsSport' | 'tagsVertical' | 'tagsProperty'> = {
  scope: 'tagsScope',
  sport: 'tagsSport',
  vertical: 'tagsVertical',
  property: 'tagsProperty',
};

// Taxonomy links for cards/rows (hero, archive rows). Each tag is a real
// link to /tema so a reader can jump from "this piece is tagged Fútbol" to
// everything else tagged Fútbol.
//
// Presentation note (UI/UX audit, 2026-07-23): these deliberately do NOT
// use .tag-mini — the dot-badge language is reserved for source/publication
// badges. Taxonomy renders as quiet interpunct-separated text links whose
// tier is exposed via data-tier so CSS can weight the hierarchy (scope and
// sport in ink, business verticals in gray) instead of showing three tiers
// as identical pills.
//
// Order is per-section (2026-07-24), from the same SECTION_TOPICS table
// that drives the article foot's <ArticleTopics> — a card's pills and that
// article's own topic index should lead with the same tier, or the reader
// meets two different "most important tag" answers for one story. See
// lib/taxonomy.ts for each section's order and why.
export function TagPillRow({
  article,
}: {
  article: Pick<Article, 'source' | 'tagsScope' | 'tagsSport' | 'tagsVertical'> &
    Partial<Pick<Article, 'tagsProperty'>>;
}) {
  const { order } = topicsForSection(article.source);
  const entries = order.flatMap(tier =>
    (article[TIER_COLUMN[tier]] ?? []).map(value => ({ tier, value })),
  );
  if (!entries.length) return null;

  return (
    <div className="tag-pill-row">
      {entries.map(({ tier, value }) => (
        <a
          key={`${tier}-${value}`}
          className="tag-topic"
          data-tier={tier}
          href={`/tema?${tier}=${encodeURIComponent(value)}`}
        >
          {value}
        </a>
      ))}
    </div>
  );
}
