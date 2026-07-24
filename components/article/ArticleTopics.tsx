import type { Article } from '@/lib/data/articles';
import { topicsForSection, type TaxonomyTier } from '@/lib/taxonomy';

const TIER_COLUMN: Record<TaxonomyTier, 'tagsScope' | 'tagsSport' | 'tagsVertical'> = {
  scope: 'tagsScope',
  sport: 'tagsSport',
  vertical: 'tagsVertical',
};

// Full topic index at the foot of an article — collapsed by default behind
// a native <details> disclosure (user feedback, 2026-07-23: readers should
// never be greeted by taxonomy; it's an index you opt into, like a filter).
// <details>/<summary> on purpose: works with JS disabled, keyboard
// accessible for free, and the chips stay in the DOM so /tema links remain
// crawlable. Square chips = metadata (same family as the .tag publication
// chip), round = action (.btn/.filter-btn) — the shape distinction is part
// of the system.
//
// ——— 2026-07-24: the row is per-section now, not one generic order for
// every article on the site. Which tier leads, and how the disclosure is
// worded, comes from lib/taxonomy.ts's SECTION_TOPICS keyed on the
// article's `source`; see that table for the reasoning behind each
// section's order. Ordering only — no tier is hidden, so nothing an editor
// tagged stops being reachable, and `data-tier` still drives the visual
// weighting in CSS.
export function ArticleTopics({
  article,
}: {
  article: Pick<Article, 'source' | 'tagsScope' | 'tagsSport' | 'tagsVertical'>;
}) {
  const { order, label } = topicsForSection(article.source);
  const entries = order.flatMap(tier =>
    article[TIER_COLUMN[tier]].map(value => ({ tier, value })),
  );
  if (!entries.length) return null;

  return (
    <details className="article-topics" data-source={article.source}>
      <summary className="article-topics-summary">
        <span className="article-topics-label">
          {label} <span className="article-topics-count">({entries.length})</span>
        </span>
        <svg className="article-topics-chevron" viewBox="0 0 12 8" width="11" height="7" aria-hidden="true">
          <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="article-topics-list">
        {entries.map(({ tier, value }) => (
          <a
            key={`${tier}-${value}`}
            className="topic-chip"
            data-tier={tier}
            href={`/tema?${tier}=${encodeURIComponent(value)}`}
          >
            {value}
          </a>
        ))}
      </div>
    </details>
  );
}
