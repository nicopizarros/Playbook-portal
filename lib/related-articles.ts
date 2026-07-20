import { RELATED_COUNT } from './constants';
import type { Article } from './data/articles';

function sharedTagCount(a: Article, b: Article): number {
  const bAll = new Set([...b.tagsScope, ...b.tagsSport, ...b.tagsVertical]);
  return [...a.tagsScope, ...a.tagsSport, ...a.tagsVertical].filter(t => bAll.has(t)).length;
}

// Ported from legacy/js/article-page.js's relatedArticles(): ranks the rest
// of the pool by tag overlap (plus a same-source nudge), then tops up with
// the most recent remaining articles so a thinly-tagged piece still gets a
// full "sigue leyendo" row instead of one or two links.
export function relatedArticles(article: Article, pool: Article[]): Article[] {
  const others = pool.filter(a => a.id !== article.id);
  const scored = others
    .map(a => ({ a, score: sharedTagCount(article, a) + (a.source === article.source ? 1 : 0) }))
    .filter(x => x.score > 0)
    .sort((x, y) => y.score - x.score || (y.a.date || '').localeCompare(x.a.date || ''))
    .map(x => x.a);

  const picked = scored.slice(0, RELATED_COUNT);
  if (picked.length < RELATED_COUNT) {
    const usedIds = new Set([article.id, ...picked.map(a => a.id)]);
    const filler = others
      .filter(a => !usedIds.has(a.id))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    picked.push(...filler.slice(0, RELATED_COUNT - picked.length));
  }
  return picked;
}

// Same OR logic used by legacy/js/article-page.js, legacy/api/sitemap.js,
// and legacy/api/feed.js — a per-article opt-in or the site-wide switch is
// enough either way.
export function shouldShowAuthor(article: Pick<Article, 'mostrarAutor'>, mostrarAutorGlobal: boolean): boolean {
  return article.mostrarAutor === true || mostrarAutorGlobal === true;
}
