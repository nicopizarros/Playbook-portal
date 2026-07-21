import type { Article } from '@/lib/data/articles';
import { TagPillRow } from './TagPillRow';

// Ported from legacy/js/articles.js's leadTemplate(). `.lead-story` is a
// <div>, NOT an <a> — `.card-link` wraps just the navigable content and is
// stretched via CSS (::after{inset:0}) to cover the whole card, while
// TagPillRow's own <a> tags sit outside it as independently clickable
// siblings. This avoids nesting an <a> inside another <a>, which is invalid
// HTML and previously broke click targets on this exact component (see
// .claude/skills/verify/SKILL.md's nested-<a> check) — preserve this shape
// exactly when touching this file.
export function LeadStory({ article }: { article: Article }) {
  return (
    <div className="lead-story reveal" data-source={article.source}>
      <a className="card-link" href={`/articulo?id=${encodeURIComponent(article.id)}`}>
        {article.imageUrl && (
          <div className="lead-photo">
            {/* Editor-supplied URL, arbitrary host -- see
                components/sections/AboutSection.tsx's comment. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt={article.title}
              width={1200}
              height={750}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        )}
        <span className="tag">{article.publication}</span>
        <h1>{article.title}</h1>
        <p className="desc">{article.excerpt}</p>
        <div className="byline">
          {article.dateFormatted} · {article.readingTime || 1} min
        </div>
      </a>
      <TagPillRow article={article} />
    </div>
  );
}
