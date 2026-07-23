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
// Imageless articles get a quiet typographic treatment instead of no
// photo box at all: the v23 prototype's grid-pattern surface with the
// headline set large in Anton, filling the same 16/10 frame a photo
// would (see styles/hero.css). Deliberately ONE muted surface, not the
// prototype's green/yellow/ink poster palette — a first pass of this
// session shipped the colored version and it read startupy rather than
// senior (user feedback, 2026-07-22); the source identity already comes
// from the card's left border + tag colors. The <h1> moves INSIDE the
// visual in that case — one heading per card either way, just placed
// differently — so the title isn't rendered twice.
export function LeadStory({ article }: { article: Article }) {
  return (
    <div className="lead-story reveal" data-source={article.source}>
      <a className="card-link" href={`/articulo?id=${encodeURIComponent(article.id)}`}>
        {article.imageUrl ? (
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
        ) : (
          <div className="lead-photo lead-visual visual-grid">
            <h1 className="visual-label">{article.title}</h1>
          </div>
        )}
        <span className="tag">{article.publication}</span>
        {article.imageUrl && <h1>{article.title}</h1>}
        <p className="desc">{article.excerpt}</p>
        <div className="byline">
          {article.dateFormatted} · {article.readingTime || 1} min
        </div>
      </a>
      <TagPillRow article={article} />
    </div>
  );
}
