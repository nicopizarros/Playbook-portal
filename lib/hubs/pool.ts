// SERVER ONLY. Kept out of lib/hubs/index.ts on purpose: the header is a
// client component and imports the hub CONFIG from there. When the pool
// lived in the same module, importing `HUBS` dragged lib/data/articles →
// lib/db/client → `pg` into the client bundle and the whole site 500'd on
// `Can't resolve 'fs'`. Config is client-safe; data access is not. Keep
// the two apart.
import type { Article } from '../data/articles';
import { getAllArticles } from '../data/articles';
import { rankArticles } from '../rank';
import type { Hub } from './types';

// ---------------------------------------------------------- The pool
// A hub GATHERS by tag; it does not own a `source`. The `property`
// taxonomy tier (lib/taxonomy.ts) is where a hub tag lives.
//
// PRE-MIGRATION SAFETY. The `tags_property` column does not exist in
// production yet (drizzle/0001_hub_property_tier.sql is generated but
// deliberately unapplied — see docs/TODO.md). Until it lands, no row can
// carry the tag and this returns []. Reading it defensively rather than
// through the typed column means:
//   • nothing selects a column that isn't there (the failure mode that
//     TODO #2's source-key migration is still sitting on), and
//   • the day the migration runs, this file needs ZERO changes.
// Same "correct against BOTH database states" posture as normalizeSource()
// in lib/constants.ts.
function propertyTags(article: Article): string[] {
  const value = (article as Article & { tagsProperty?: string[] | null }).tagsProperty;
  return Array.isArray(value) ? value : [];
}

export function articleIsInHub(article: Article, hub: Hub): boolean {
  return propertyTags(article).includes(hub.tag);
}

/**
 * The hub's coverage stream. Ordered by the shared ranking rather than
 * reverse-chronologically: a hub is a NEWS destination for a live property
 * (unlike /la-lana, where numbered editions must stay in publication
 * order), so the most important recent thing leads.
 *
 * SEAM FOR THE 0-100 REDESIGN: ordering goes through rankArticles() and
 * nowhere else. When the normalised 0-100 score lands (the rank.ts
 * redesign that docs/ranking-data-audit.md was gathered for), this call is
 * the single line that changes. No hub-local scoring was invented in the
 * meantime.
 */
export async function hubArticles(hub: Hub): Promise<Article[]> {
  const all = await getAllArticles();
  return rankArticles(all.filter(a => articleIsInHub(a, hub)));
}

