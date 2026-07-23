import type { Article } from '@/lib/data/articles';

const TIER_ORDER = [
  { key: 'tagsScope', tier: 'scope' },
  { key: 'tagsSport', tier: 'sport' },
  { key: 'tagsVertical', tier: 'vertical' },
] as const;

// Full topic index at the foot of an article — collapsed by default behind
// a native <details> disclosure (user feedback, 2026-07-23: readers should
// never be greeted by taxonomy; it's an index you opt into, like a filter).
// <details>/<summary> on purpose: works with JS disabled, keyboard
// accessible for free, and the chips stay in the DOM so /tema links remain
// crawlable. Square chips = metadata (same family as the .tag publication
// chip), round = action (.btn/.filter-btn) — the shape distinction is part
// of the system.
export function ArticleTopics({
  article,
}: {
  article: Pick<Article, 'tagsScope' | 'tagsSport' | 'tagsVertical'>;
}) {
  const entries = TIER_ORDER.flatMap(({ key, tier }) =>
    article[key].map(value => ({ tier, value })),
  );
  if (!entries.length) return null;

  return (
    <details className="article-topics">
      <summary className="article-topics-summary">
        <span className="article-topics-label">
          Temas del artículo <span className="article-topics-count">({entries.length})</span>
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
            href={`/tema?${tier}=${encodeURIComponent(value)}`}
          >
            {value}
          </a>
        ))}
      </div>
    </details>
  );
}
