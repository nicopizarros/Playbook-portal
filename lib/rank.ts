// Shared ranking logic used by the homepage, archive, tema, and (in Phase 4)
// the admin CMS, so "what counts as important" is defined in exactly one
// place. Ported verbatim from legacy/js/rank.js.

export type Rankable = {
  priority: number;
  date: string;
  featured: boolean;
};

export function rankArticles<T extends Rankable>(articles: T[]): T[] {
  return (articles || []).slice().sort((a, b) => {
    const pa = typeof a.priority === 'number' ? a.priority : 0;
    const pb = typeof b.priority === 'number' ? b.priority : 0;
    if (pb !== pa) return pb - pa;
    return (b.date || '').localeCompare(a.date || '');
  });
}

export function selectHero<T extends Rankable>(articles: T[]): T | null {
  const ranked = rankArticles(articles);
  const candidates = ranked.filter(a => a.featured === true || Number(a.priority) === 5);
  if (candidates.length) return candidates[0];
  return (articles || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] || null;
}
