// The /equipo page's data layer. Two halves, deliberately separate:
//
//   1. THE ROSTER is real and derived, never hand-typed: every name on this
//      page comes from `articles.author` on published, byline-shown rows.
//      Nobody appears here who hasn't actually written something.
//   2. THE PROFILE (photo, role, beat, bio) is NOT tracked anywhere in this
//      codebase — there is no author table, just a free-text name per
//      article. TEAM_PROFILES below is a hand-maintained config, same
//      pattern as lib/hubs/lfa.ts: real data where it exists, an explicit
//      absence where it doesn't, never an invented placeholder. A name with
//      no entry here still renders — with a "perfil pendiente" state — since
//      excluding a real contributor because nobody filled in their bio yet
//      would be worse than showing an honest gap.
import { getAllArticles } from './articles';
import { db } from '../db/client';
import { users } from '../db/schema';
import { sql } from 'drizzle-orm';
import { getReachLast30Days } from '../analytics-data';

export type TeamProfile = {
  role: string;
  beat: string;
  bio: string;
  /** Public URL. Square, ideally >=400px — same constraint next/image applies elsewhere. */
  photo?: string;
};

// Fill in as bios/photos arrive. Keyed by the EXACT string in `articles.author`
// (case-sensitive — that's the join key, there is no separate id).
export const TEAM_PROFILES: Record<string, TeamProfile> = {};

export type TeamMember = {
  name: string;
  slug: string;
  articleCount: number;
  mostRecentDate: string;
  profile: TeamProfile | null;
};

/** Every byline that has actually published, real counts, sorted alphabetically (no profile data to rank by yet). */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const articles = await getAllArticles();
  const byAuthor = new Map<string, { count: number; mostRecent: string }>();
  for (const a of articles) {
    const name = (a.author || '').trim();
    if (!name) continue;
    // Guards against one known-bad production row: `author` holding a raw
    // markdown citation ("[Rodrigo Dosal](url), fundador de [DOME
    // Sport](url)") instead of a name — a guest-contributor credit that
    // landed in the wrong field, not a Playbook byline. Narrow on purpose:
    // only markdown-link syntax is excluded, so a real name is never
    // dropped on a hunch. The underlying row still needs a manual fix
    // (flagged separately) — this only keeps it off the team roster.
    if (name.includes('](')) continue;
    const existing = byAuthor.get(name);
    if (existing) {
      existing.count += 1;
      if (a.date > existing.mostRecent) existing.mostRecent = a.date;
    } else {
      byAuthor.set(name, { count: 1, mostRecent: a.date });
    }
  }
  return Array.from(byAuthor.entries())
    .map(([name, stats]) => ({
      name,
      slug: encodeURIComponent(name),
      articleCount: stats.count,
      mostRecentDate: stats.mostRecent,
      profile: TEAM_PROFILES[name] ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export type TeamPageStats = {
  registeredReaders: number | null;
  monthlyPageviews: number | null;
  monthlyVisitors: number | null;
  /** Which of the two numbers above, if any, come from a live source vs. are unavailable. */
  reachAvailable: boolean;
};

/**
 * Traction numbers for the media-kit half of the page. Both real, both
 * pulled live — never a hardcoded figure, since a stale number in sales
 * collateral is worse than a smaller true one. No Substack subscriber count:
 * that lives on Substack's side, outside this database, so it's absent
 * rather than guessed.
 */
export async function getTeamPageStats(): Promise<TeamPageStats> {
  const [readerCount, last30] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)` })
      .from(users)
      .then(rows => Number(rows[0]?.c ?? 0))
      .catch(() => null),
    getReachLast30Days().catch(() => null),
  ]);
  return {
    registeredReaders: readerCount,
    monthlyPageviews: last30?.pageviews ?? null,
    monthlyVisitors: last30?.visitors ?? null,
    reachAvailable: Boolean(last30 && (last30.pageviews !== null || last30.visitors !== null)),
  };
}
