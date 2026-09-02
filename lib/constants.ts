// Homepage layout counts, ported verbatim from legacy/js/articles.js /
// legacy/admin/dashboard.js — kept in one place so the DB-backed pages and
// (in Phase 4) the admin preview agree on what "on the homepage" means.
// The homepage shows exactly hero + 5 list rows (1+5). That count is a
// negotiated compromise with the sales side — a short text block before
// the commercial sections — so don't grow it (a 9-card feed grid was
// added and reverted in the Fase 7 session for exactly this reason).
export const LEAD_COUNT = 1;
export const LIST_COUNT = 5;
export const TICKER_COUNT = 6;
export const RELATED_COUNT = 3;

// 'playbook' was a real, separate source/tag until the Roadmap Agosto
// 2026 Fase 1 session (2026-08-01): folded into the news source at the
// user's request ("borrar el tag Playbook, traspasar sus artículos a
// Noticias") since it never had a distinct editorial identity from
// Noticias. See scripts/reassign-playbook-tag.ts for the data-side move.
//
// 'noticias' (TODO #2, 2026-08-14) replaces the launch-era machine key
// 'industry-shots' so the identifier finally matches the product name.
// The DB may still hold rows under the old key until
// scripts/migrate-source-noticias.ts runs (post-deploy, see HANDOFF):
// normalizeSource() below is the single mapping that keeps those rows
// filed correctly in the meantime, applied once at the data boundary
// (lib/data/articles.ts), so every component past that boundary only ever
// sees canonical keys.
export const KNOWN_SOURCES = ['noticias', 'la-lana', 'infinitas', 'opinion'] as const;
export type Source = (typeof KNOWN_SOURCES)[number];

export const LEGACY_SOURCE_ALIASES: Record<string, Source> = {
  'industry-shots': 'noticias',
};

export function normalizeSource(source: string): string {
  return LEGACY_SOURCE_ALIASES[source] ?? source;
}

export const SOURCE_LABELS: Record<Source, string> = {
  noticias: 'Noticias',
  'la-lana': 'La Lana del Deporte',
  infinitas: 'Infinitas',
  opinion: 'Opinión',
};

// Free full-article reads per calendar month for an anonymous (unauthenticated,
// non-bot) visitor before the email wall (see lib/metering.ts). Decided with
// the user during planning.
export const FREE_ARTICLES_PER_MONTH = 3;

// Master switch for the email wall above. OFF as of 2026-09-02: the SEO
// review's position is that metering a publisher with Playbook's current
// authority costs more traffic than the email captures are worth, so the
// wall is sidelined rather than tuned.
//
// Deliberately env-driven and default-off, not deleted. Everything the wall
// needs — the quota logic in lib/metering.ts, the anon cookie minted in
// middleware.ts, the article_reads table, the EmailWall component — stays in
// place and keeps working. Turning it back on is `METERING_ENABLED=true` in
// the Vercel project, no deploy of code required.
//
// NOTE: this switch is load-bearing for structured data, not just for the
// reader. The article page declares Google's flexible-sampling markup
// (isAccessibleForFree: false + hasPart) to explain why crawlers see more
// than metered readers do. With the wall off, nobody is restricted, and
// declaring content paywalled when it is free is a false statement in
// schema — so app/(public)/articulo/[id]/page.tsx reads this flag too and
// flips that markup. Do not change one without the other.
export const METERING_ENABLED = process.env.METERING_ENABLED === 'true';
