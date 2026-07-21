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
