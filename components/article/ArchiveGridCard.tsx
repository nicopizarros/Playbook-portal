import type { Article } from '@/lib/data/articles';

// Square card for the archive's "Cuadrícula" view (user feedback: a scannable
// grid of squares, not another line-list). Same imageless treatment as
// LeadStory — a muted grid-pattern surface with the headline set large in
// Anton — but square (1/1) instead of 16/10, since every card in the grid
// must be the same shape. No tag pills here, same reasoning as the compact
// list it replaced: this view is for scanning fast, not for browsing taxonomy.
export function ArchiveGridCard({ article }: { article: Article }) {
  return (
    <a
      className="archive-grid-card reveal"
      data-source={article.source}
      href={`/articulo?id=${encodeURIComponent(article.id)}`}
    >
      {article.imageUrl ? (
        <div className="archive-grid-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.imageUrl} alt={article.title} width={600} height={600} loading="lazy" decoding="async" />
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
