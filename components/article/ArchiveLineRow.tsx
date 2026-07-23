import type { Article } from '@/lib/data/articles';

// The bottom of the archive's 5-tier rating hierarchy (★1 and ★2, see
// archivo/page.tsx's tierFor/groupRiver) — a single-line, text-only row.
// No photo at any tier here (deliberate: this is the tier that DOESN'T earn
// a picture, which is also what keeps the grid above it from being a wall
// of muted imageless placeholders — most low-priority articles read as a
// line, not a blank square). `tier` only changes size/weight, never the
// shape: ★1 is compact and truncates hard to one line; ★2 gets a touch more
// room and wraps to two.
export function ArchiveLineRow({ article, tier }: { article: Article; tier: 1 | 2 }) {
  return (
    <a
      className={`archive-line-row tier-${tier} reveal`}
      data-source={article.source}
      href={`/articulo?id=${encodeURIComponent(article.id)}`}
    >
      <span className={`tag-mini ${article.source}`}>{article.publication}</span>
      <span className="archive-line-title">{article.title}</span>
      <span className="archive-line-byline">
        {article.dateFormatted} · {article.readingTime || 1} min
      </span>
    </a>
  );
}
