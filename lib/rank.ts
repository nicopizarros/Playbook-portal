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
export const PRIORITY_DAY_WEIGHT = 1.5;

export function daysSince(dateStr: string, now: Date): number {
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return 0;
  return (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
}

// `dayWeight` defaults to PRIORITY_DAY_WEIGHT (the homepage-ordering
// cadence, tuned for same-day competition) but is overridable — the
// archive page's tier-sizing (archivo/page.tsx) uses a much larger weight
// here, because "days per star" for a fast-moving homepage top slot and
// "days per star" for how quickly an already-older archive item should
// visually fade are genuinely different cadences, not the same number
// reused for two different jobs.
export function rankScore(article: Rankable, now: Date, dayWeight: number = PRIORITY_DAY_WEIGHT): number {
  const priority = typeof article.priority === 'number' ? article.priority : 0;
  return priority * dayWeight - daysSince(article.date, now);
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

// Changed 2026-07-30: this used to gate candidates to `featured===true ||
// priority===5` before picking the best-scoring one -- which meant a
// single stale 5-star article was the ONLY thing eligible to be hero for
// as long as no other 5-star/featured story existed, locking out every
// fresher lower-priority story regardless of how much rankScore already
// favored them. That's the exact "old important story stuck" bug the
// header comment above describes for rankScore itself, just reintroduced
// one level up.

// Changed 2026-07-31: `featured` then became an UNCONDITIONAL override --
// `find()` returned the first featured article in ranked order no matter
// its own score, so a several-days-old featured story (an editor's
// deliberate call from a prior day, simply never unchecked) permanently
// blocked a brand-new, higher-priority, better-scoring story from ever
// becoming hero. Real bug: a same-day priority-5 story with the single
// highest rankScore in the DB sat in the list while a 1-day-old featured
// story with a strictly lower score kept the hero slot.
//
// `featured` is now a boost, not a gate: full strength for about a day (so
// a deliberate "this is today's story" call reliably wins), then it decays
// to zero over FEATURED_BOOST_DAYS so a forgotten checkbox can't lock out
// newer content indefinitely -- and even while boosted, it only wins if it
// actually beats the naturally top-ranked article's own score, so a
// stronger new story can already supersede a fading featured one before
// the boost fully expires.
export const FEATURED_BOOST = 10;
export const FEATURED_BOOST_DAYS = 1;

export function featuredBoost(article: Rankable, now: Date): number {
  if (!article.featured) return 0;
  const age = daysSince(article.date, now);
  return Math.max(0, FEATURED_BOOST * (1 - age / FEATURED_BOOST_DAYS));
}

export function selectHero<T extends Rankable>(articles: T[], now: Date = new Date()): T | null {
  const ranked = rankArticles(articles, now);
  if (!ranked.length) return null;
  const top = ranked[0];
  let bestFeatured: T | null = null;
  let bestFeaturedScore = -Infinity;
  for (const a of ranked) {
    if (!a.featured) continue;
    const boosted = rankScore(a, now) + featuredBoost(a, now);
    if (boosted > bestFeaturedScore) {
      bestFeaturedScore = boosted;
      bestFeatured = a;
    }
  }
  if (bestFeatured && bestFeaturedScore > rankScore(top, now)) return bestFeatured;
  return top;
}
