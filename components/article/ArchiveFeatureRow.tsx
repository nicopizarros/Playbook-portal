import type { Article } from '@/lib/data/articles';
import { TagPillRow } from './TagPillRow';

// The Lista view's periodic "featured" row — a smaller LeadStory laid into
// the list rhythm, giving it photography and size hierarchy it otherwise
// completely lacks (plain NewsRow rows are 100% text). Same div +
// .card-link + stretched-link + TagPillRow shape as LeadStory/NewsRow's
// tag-pill branch, for the same nested-<a> reason (TagPillRow renders its
// own <a>s). Which articles get this treatment is decided by the page
// (archivo/page.tsx's pickFeaturedIds) — a periodic rhythm gated by
// editorial rating, not just position.
export function ArchiveFeatureRow({
  article,
  priority = false,
}: {
  article: Article;
  priority?: boolean;
}) {
  return (
    <div className="archive-feature-row reveal" data-source={article.source}>
      <a className="card-link" href={`/articulo?id=${encodeURIComponent(article.id)}`}>
        {article.imageUrl ? (
          <div className="archive-feature-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt={article.title}
              width={480}
              height={300}
              loading={priority ? undefined : 'lazy'}
              fetchPriority={priority ? 'high' : undefined}
              decoding="async"
            />
          </div>
        ) : (
          <div className="archive-feature-photo archive-feature-visual visual-grid">
            <h3 className="visual-label">{article.title}</h3>
          </div>
        )}
        <div className="archive-feature-body">
          <span className={`tag-mini ${article.source}`}>{article.publication}</span>
          {article.imageUrl && <h3>{article.title}</h3>}
          <p className="desc">{article.excerpt}</p>
          <div className="byline">
            {article.dateFormatted} · {article.readingTime || 1} min
          </div>
        </div>
      </a>
      <TagPillRow article={article} />
    </div>
  );
}
