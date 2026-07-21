// Shared ranking logic used by the homepage, archive, tema, and the admin
// CMS, so "what counts as important" is defined in exactly one place.
// Originally ported verbatim from legacy/js/rank.js (pure priority-first,
// date only as a tiebreaker) -- changed 2026-07-21: that meant a
// priority-5 article from two weeks ago always outranked a priority-1
// article from today, with zero decay. Real user complaint, not a nit:
// the homepage's top slots could get stuck on an old "important" story
// well past its relevance. This blends both into one score, so recency
// dominates but a several-days-old, more important story can still
// surface above a very fresh but minor one -- which is what the admin
// UI's own field copy already promised ("más estrellas y más reciente
// aparece primero", components/admin/tabs/ArticlesTab.tsx) without the
// old implementation actually honoring it.

export type Rankable = {
  priority: number;
  date: string;
  featured: boolean;
};

// Each star of priority (1-5) is worth this many days of "freshness" in
// the score below -- tuned so a several-days-old top-priority story can
// still beat a same-day low-priority one, but a two-week-old story can't
// beat *any* same-day story regardless of priority: the max possible
// boost is 5 * 1.5 = 7.5 days, well under 14.
const PRIORITY_DAY_WEIGHT = 1.5;

function daysSince(dateStr: string, now: Date): number {
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return 0;
  return (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
}

function rankScore(article: Rankable, now: Date): number {
  const priority = typeof article.priority === 'number' ? article.priority : 0;
  return priority * PRIORITY_DAY_WEIGHT - daysSince(article.date, now);
}

// `now` is a parameter (defaulting to the real clock) purely so this stays
// a pure, easily testable function -- every real call site already omits
// it and gets live behavior, same as before.
export function rankArticles<T extends Rankable>(articles: T[], now: Date = new Date()): T[] {
  return (articles || []).slice().sort((a, b) => {
    const diff = rankScore(b, now) - rankScore(a, now);
    if (diff !== 0) return diff;
    return (b.date || '').localeCompare(a.date || '');
  });
}

export function selectHero<T extends Rankable>(articles: T[], now: Date = new Date()): T | null {
  const ranked = rankArticles(articles, now);
  const candidates = ranked.filter(a => a.featured === true || Number(a.priority) === 5);
  if (candidates.length) return candidates[0];
  return (articles || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] || null;
}
