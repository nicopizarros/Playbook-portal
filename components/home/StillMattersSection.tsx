import Link from 'next/link';
import type { Article } from '@/lib/data/articles';
import { rankArticles, selectHero, daysSince, baseScore, bridgeScore } from '@/lib/rank';
import { LIST_COUNT } from '@/lib/constants';

// Homepage module "Lo que sigue importando" (design brief, 2026-08-05).
// The main rotation ranks by recency, so a story that's still important
// but no longer brand new falls out of view even though nothing displaced
// its relevance. This module is that story's second window:
//
//   - Separate selection from the "Último en Playbook" package: important
//     (score ≥ MIN_SCORE, the 0-99 boleta — see below) or featured
//     articles inside a rolling window.
//   - Excludes whatever the top rotation is currently showing in its
//     default view (hero + 5-row list), so there are never duplicates on
//     first paint. The client-side source filters can reshuffle the 1+5
//     after hydration, but the default "Todo" view is what both first
//     paint and this module agree on — same reference getArchiveArticles
//     already uses for "what is on the homepage".
//   - 4 items, kicker "Sigue siendo noticia" per item — editorial
//     judgment, not a generic "featured" label or a second archive.
//
// Window: brief proposes 10–14 days; 12 until editorial confirms.
const WINDOW_DAYS = 12;
const ITEM_COUNT = 4;
// 2026-08-20: this used to gate on the legacy `priority` field directly
// (≥4 stars), which the 0-99 boleta rewrite (lib/rank.ts) superseded.
// baseScore() already does the right thing for both graded and
// not-yet-graded rows (falling back to bridgeScore(priority) for the
// latter), so bridging the old 4-star cutoff through the same function
// keeps this module's editorial bar unchanged while pointing it at the
// real score once an article has one.
const MIN_SCORE = bridgeScore(4);

export function StillMattersSection({ articles }: { articles: Article[] }) {
  const now = new Date();

  // Same pool derivation as NewsGrid's default view (opinion stays out
  // unless deliberately featured) — keep the two in sync or the "no
  // duplicates" guarantee silently breaks.
  const news = articles.filter(a => a.source !== 'opinion' || a.featured);
  const ranked = rankArticles(news, now);
  const hero = selectHero(ranked, now);
  const list = ranked.filter(a => a !== hero).slice(0, LIST_COUNT);
  const shown = new Set([hero, ...list].filter(Boolean).map(a => (a as Article).id));

  const items = articles
    .filter(a => !shown.has(a.id) && (a.featured || baseScore(a) >= MIN_SCORE) && daysSince(a.date, now) <= WINDOW_DAYS)
    // Importance first, recency as the tiebreak: this module exists
    // precisely because recency alone already has a whole band above it.
    .sort((a, b) => baseScore(b) - baseScore(a) || (b.date || '').localeCompare(a.date || ''))
    .slice(0, ITEM_COUNT);

  // Quiet weeks (nothing starred inside the window that isn't already on
  // the homepage) collapse the module entirely — an empty "still matters"
  // band would say the opposite of what it means.
  if (!items.length) return null;

  return (
    <section className="still-matters" aria-label="Lo que sigue importando">
      <div className="still-matters-head">
        <h2>Lo que sigue importando</h2>
        <p className="sub">Historias que no son nuevas, pero siguen moviendo al negocio.</p>
      </div>
      <div className="still-matters-grid">
        {items.map(article => (
          <Link
            className="still-matters-card reveal"
            data-source={article.source}
            href={`/articulo?id=${encodeURIComponent(article.id)}`}
            key={article.id}
          >
            <span className="still-matters-kicker">Sigue siendo noticia</span>
            <h3>{article.title}</h3>
            <div className="byline">
              {article.dateFormatted} · {article.readingTime || 1} min
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
