import type { Article } from '@/lib/data/articles';

// Taxonomy links for cards/rows (hero, archive rows). Each tag is a real
// link to /tema so a reader can jump from "this piece is tagged Fútbol" to
// everything else tagged Fútbol.
//
// Presentation note (UI/UX audit, 2026-07-23): these deliberately do NOT
// use .tag-mini — the dot-badge language is reserved for source/publication
// badges. Taxonomy renders as quiet interpunct-separated text links whose
// tier is exposed via data-tier so CSS can weight the hierarchy (scope and
// sport in ink, business verticals in gray) instead of showing three tiers
// as identical pills. Order is fixed scope → sport → vertical.
export function TagPillRow({ article }: { article: Pick<Article, 'tagsScope' | 'tagsSport' | 'tagsVertical'> }) {
  const entries = [
    ...article.tagsScope.map(value => ({ tier: 'scope', value })),
    ...article.tagsSport.map(value => ({ tier: 'sport', value })),
    ...article.tagsVertical.map(value => ({ tier: 'vertical', value })),
  ];
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
