// Homepage layout counts, ported verbatim from legacy/js/articles.js /
// legacy/admin/dashboard.js — kept in one place so the DB-backed pages and
// (in Phase 4) the admin preview agree on what "on the homepage" means.
export const LEAD_COUNT = 1;
export const LIST_COUNT = 5;
// Story cards in the homepage feed grid below the lead package (Fase 7 UX
// two-column layout, components/home/NewsGrid.tsx). Not part of the
// archive-overflow math on purpose: /archivo keeps its original "everything
// beyond hero+list" definition so its URL-filter behavior doesn't shift.
export const FEED_COUNT = 9;
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
