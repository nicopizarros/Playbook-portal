import type { Article } from '@/lib/data/articles';
import { TagPillRow } from './TagPillRow';

// Square card for the archive's "Cuadrícula" view. Same imageless treatment
// as LeadStory — a muted grid-pattern surface with the headline set large in
// Anton — but square (1/1) instead of 16/10 for the regular (non-featured)
// case, since every ordinary tile in the grid must share one shape.
//
// `featured` (page decides which articles qualify, see archivo/page.tsx's
// pickFeaturedIds — a periodic rhythm gated by editorial rating, not just
// position) switches this into a bigger 2×2 tile that borrows LeadStory's
// own visual grammar at a smaller scale: 16:10 photo, serif headline,
// excerpt, and — uniquely among grid tiles — TagPillRow. That means a
// featured tile is no longer a plain top-level <a> (TagPillRow renders its
// own <a>s, and an <a> can't nest inside another <a> — see NewsRow's own
// comment on this exact constraint), so the root element branches shape.
export function ArchiveGridCard({
  article,
  featured = false,
  priority = false,
}: {
  article: Article;
  featured?: boolean;
  priority?: boolean;
}) {
  const href = `/articulo?id=${encodeURIComponent(article.id)}`;

  const body = (
    <>
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
      {featured && <p className="desc">{article.excerpt}</p>}
      <div className="byline">
        {article.dateFormatted} · {article.readingTime || 1} min
      </div>
    </>
  );

  if (!featured) {
    return (
      <a className="archive-grid-card reveal" data-source={article.source} href={href}>
        {body}
      </a>
    );
  }

  return (
    <div className="archive-grid-card is-featured reveal" data-source={article.source}>
      <a className="card-link" href={href}>
        {body}
      </a>
      <TagPillRow article={article} />
    </div>
  );
}
