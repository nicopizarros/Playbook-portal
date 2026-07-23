import type { Article } from '@/lib/data/articles';

// Square-ish card for two of the five rating tiers the archive's
// "Cuadrícula" river uses (see archivo/page.tsx's tierFor/groupRiver) —
// 'sm' for ★3, 'md' for ★4. ★1/★2 render as ArchiveLineRow (plain text),
// ★5 reuses ArchiveFeatureRow (full-width, photo + excerpt + tag pills).
// Deliberately never shows pills or an excerpt — those are reserved for
// the ★5 tier so the hierarchy reads through richness, not just size.
// Same imageless treatment as LeadStory/ArchiveFeatureRow — a muted
// grid-pattern surface with the headline set large in Anton — square (1/1)
// here since sm/md tiles both flow together in one row and need to share
// an aspect ratio to line up.
export function ArchiveGridCard({
  article,
  size = 'md',
  priority = false,
}: {
  article: Article;
  size?: 'sm' | 'md';
  priority?: boolean;
}) {
  const href = `/articulo?id=${encodeURIComponent(article.id)}`;

  return (
    <a className={`archive-grid-card tier-${size} reveal`} data-source={article.source} href={href}>
      {article.imageUrl ? (
        <div className="archive-grid-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt={article.title}
            width={600}
            height={600}
            loading={priority ? undefined : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
          />
        </div>
      ) : (
        <div className="archive-grid-photo archive-grid-visual visual-grid">
          <h3 className="visual-label">{article.title}</h3>
        </div>
      )}
      <span className={`tag-mini ${article.source}`}>{article.publication}</span>
      {article.imageUrl && <h3>{article.title}</h3>}
      <div className="byline">
        {article.dateFormatted} · {article.readingTime || 1} min
      </div>
    </a>
  );
}
