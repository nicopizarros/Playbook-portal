// Fixed, three-tier tag taxonomy. Single source of truth, ported verbatim
// from legacy/js/taxonomy.js — used by both the admin CMS (Phase 4) and the
// public site (filter pills, /tema validation) so they can't drift apart.

export const SCOPE_OPTIONS = ['Nacional', 'Internacional'] as const;

export const SPORT_OPTIONS = [
  'Fútbol', 'Liga MX', 'NFL', 'NBA', 'Béisbol', 'Tenis', 'Golf', 'F1', 'Olímpico', 'Multi-deporte / Otros',
] as const;

export const VERTICAL_OPTIONS = [
  'Gobernanza y Regulación', 'Derechos de TV y Streaming', 'Fusiones y Adquisiciones',
  'Patrocinios', 'Infraestructura y Venues', 'Sedes y Eventos', 'Finanzas y Negocio',
  'Private Equity e Inversiones', 'Mercadotecnia Deportiva', 'Gestión de Talento',
  'Audiencias y Consumo', 'Fan Experience', 'Naming Rights',
] as const;

export type TaxonomyTier = 'scope' | 'sport' | 'vertical';

export const TAXONOMY: Record<TaxonomyTier, readonly string[]> = {
  scope: SCOPE_OPTIONS,
  sport: SPORT_OPTIONS,
  vertical: VERTICAL_OPTIONS,
};

// ---------------------------------------------------------------- Per-section topics
// The tag row at the foot of an article used to be identical everywhere:
// scope, then sport, then vertical, under the same generic heading, whether
// the reader had just finished a Liga MX transfer story or a women's-sport
// feature. Requested change (2026-07-24): make it specific to the section.
//
// What actually differs per section is which tier carries the meaning, so
// that's what this table encodes — a tier ORDER (the first entry leads the
// row) and the section's own wording for the disclosure. Tiers are only
// reordered, never dropped: every tag an editor sets stays visible and
// every /tema link stays crawlable, which is the whole reason the chips
// live in the DOM rather than behind a fetch.
//
// Keyed by `source`, the same field SOURCE_LABELS, the homepage 1+5 filter
// and the archive's "Sección" filter already key on, so a piece's section
// is set in exactly one place. Anything not listed here (or an article
// whose source is a value we don't recognise) falls back to DEFAULT_TOPICS,
// which is the historical scope → sport → vertical order.
export type SectionTopics = {
  /** Tier order, first leads the row. */
  order: readonly TaxonomyTier[];
  /** Disclosure label, e.g. "Temas de esta noticia". */
  label: string;
};

export const DEFAULT_TOPICS: SectionTopics = {
  order: ['scope', 'sport', 'vertical'],
  label: 'Temas del artículo',
};

export const SECTION_TOPICS: Record<string, SectionTopics> = {
  // Industry Shots is the daily business-news feed: the business vertical
  // (derechos de TV, patrocinios, M&A…) is the reason a reader clicks
  // through, the sport is context.
  'industry-shots': { order: ['vertical', 'sport', 'scope'], label: 'Temas de esta noticia' },
  // La Lana del Deporte is a single-tournament newsletter — every piece is
  // football, so leading with the sport would say nothing. Scope
  // (Nacional/Internacional) is what separates one piece from the next.
  'la-lana': { order: ['scope', 'vertical', 'sport'], label: 'Temas de La Lana del Deporte' },
  // Infinitas covers women's sport across disciplines: which sport it is
  // carries the most information here.
  infinitas: { order: ['sport', 'vertical', 'scope'], label: 'Temas de Infinitas' },
  // Opinión is argument-led; the business vertical is the axis an opinion
  // piece actually takes a position on.
  opinion: { order: ['vertical', 'scope', 'sport'], label: 'Temas de esta opinión' },
};

export function topicsForSection(source: string): SectionTopics {
  return SECTION_TOPICS[source] ?? DEFAULT_TOPICS;
}
