'use strict';

// Shared ranking logic used by the homepage, the archive page, and the admin CMS
// so "what counts as important" is defined in exactly one place.
export function rankArticles(articles) {
  return (articles || []).slice().sort((a, b) => {
    const pa = typeof a.priority === 'number' ? a.priority : 0;
    const pb = typeof b.priority === 'number' ? b.priority : 0;
    if (pb !== pa) return pb - pa;
    return (b.date || '').localeCompare(a.date || '');
  });
}

export function selectHero(articles) {
  const ranked = rankArticles(articles);
  const candidates = ranked.filter(a => a.featured === true || Number(a.priority) === 5);
  if (candidates.length) return candidates[0];
  return (articles || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] || null;
}
