import type { Article } from '@/lib/data/articles';
import { TagPillRow } from './TagPillRow';

type Heading = 'h3' | 'h4';

// Ported from legacy/js/articles.js's rowTemplate() (used by the homepage
// list, related articles, author/tema pages, most-read — none of those
// show tag pills, so a plain <a> is safe there) and
// legacy/js/archive-page.js's rowTemplate() (the archive page DOES show tag
// pills per row, so it needs the same div + stretched .card-link pattern as
// LeadStory to avoid nesting an <a> inside an <a> — see that component's
// comment). `withTagPills` switches between the two shapes.
export function NewsRow({
  article,
  heading = 'h3',
  withTagPills = false,
}: {
  article: Article;
  heading?: Heading;
  withTagPills?: boolean;
}) {
  const Heading = heading;
  const href = `/articulo?id=${encodeURIComponent(article.id)}`;
  const inner = (
    <>
      <span className={`tag-mini ${article.source}`}>{article.publication}</span>
      <Heading>{article.title}</Heading>
      <div className="byline">
        {article.dateFormatted} · {article.readingTime || 1} min
      </div>
    </>
  );

  if (!withTagPills) {
    return (
      <a className="news-row reveal" data-source={article.source} href={href}>
        {inner}
      </a>
    );
  }

  return (
    <div className="news-row reveal" data-source={article.source}>
      <a className="card-link" href={href}>
        {inner}
      </a>
      <TagPillRow article={article} />
    </div>
  );
}
