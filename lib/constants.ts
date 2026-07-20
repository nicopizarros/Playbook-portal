// Homepage layout counts, ported verbatim from legacy/js/articles.js /
// legacy/admin/dashboard.js — kept in one place so the DB-backed pages and
// (in Phase 4) the admin preview agree on what "on the homepage" means.
export const LEAD_COUNT = 1;
export const LIST_COUNT = 5;
export const TICKER_COUNT = 6;
export const RELATED_COUNT = 3;

export const KNOWN_SOURCES = ['industry-shots', 'la-lana', 'infinitas', 'playbook'] as const;
export type Source = (typeof KNOWN_SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  'industry-shots': 'Noticias',
  'la-lana': 'La Lana del Mundial',
  infinitas: 'Infinitas',
  playbook: 'Playbook',
};
