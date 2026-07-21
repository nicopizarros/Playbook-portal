// Ported verbatim from legacy/admin/dashboard.js's slugify() so an article
// created here lands on the same id a legacy editor would have gotten from
// the same title.
export function slugify(text: string) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
