import type { Article } from '@/lib/data/articles';

// Ported from legacy/js/templates.js's tagPillsRowTemplate(). Each tag is a
// real link to /tema so a reader can jump from "this piece is tagged
// Fútbol" to everything else tagged Fútbol.
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
        <a key={`${tier}-${value}`} className="tag-mini" href={`/tema?${tier}=${encodeURIComponent(value)}`}>
          {value}
        </a>
      ))}
    </div>
  );
}
