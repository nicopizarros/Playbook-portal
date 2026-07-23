import type { Article } from '@/lib/data/articles';

const TIER_ORDER = [
  { key: 'tagsScope', tier: 'scope' },
  { key: 'tagsSport', tier: 'sport' },
  { key: 'tagsVertical', tier: 'vertical' },
] as const;

// Full topic index at the foot of an article — the classic editorial
// pattern (the headline area carries only the primary scope·sport kicker;
// the complete taxonomy lives here, after the reader is done, where it
// works as navigation instead of noise). Square chips on purpose: square =
// metadata (same family as the .tag publication chip), round = action
// (.btn/.filter-btn) — the shape distinction is part of the system.
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
    <nav className="article-topics" aria-label="Temas del artículo">
      <span className="article-topics-label">Temas</span>
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
    </nav>
  );
}
