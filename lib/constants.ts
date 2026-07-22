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

export const KNOWN_SOURCES = ['industry-shots', 'la-lana', 'infinitas', 'playbook', 'opinion'] as const;
export type Source = (typeof KNOWN_SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  'industry-shots': 'Noticias',
  'la-lana': 'La Lana del Mundial',
  infinitas: 'Infinitas',
  playbook: 'Playbook',
  opinion: 'Opinión',
};

// Free full-article reads per calendar month for an anonymous (unauthenticated,
// non-bot) visitor before the email wall (see lib/metering.ts). Decided with
// the user during planning.
export const FREE_ARTICLES_PER_MONTH = 3;
