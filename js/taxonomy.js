'use strict';

// Fixed, three-tier tag taxonomy (Task 2). Single source of truth, imported
// by the admin CMS (checkbox options) and the public site (filter pills) so
// they can never drift out of sync with each other.
export const SCOPE_OPTIONS = ['Nacional', 'Internacional'];

export const SPORT_OPTIONS = [
  'Fútbol', 'Liga MX', 'NFL', 'NBA', 'Béisbol', 'Tenis', 'Golf', 'F1', 'Olímpico', 'Multi-deporte / Otros'
];

export const VERTICAL_OPTIONS = [
  'Gobernanza y Regulación', 'Derechos de TV y Streaming', 'Fusiones y Adquisiciones',
  'Patrocinios', 'Infraestructura y Venues', 'Sedes y Eventos', 'Finanzas y Negocio',
  'Private Equity e Inversiones', 'Mercadotecnia Deportiva', 'Gestión de Talento',
  'Audiencias y Consumo', 'Fan Experience', 'Naming Rights'
];

export const TAG_TIERS = [
  { key: 'scope', label: 'Alcance', options: SCOPE_OPTIONS },
  { key: 'sport', label: 'Deporte', options: SPORT_OPTIONS },
  { key: 'vertical', label: 'Vertical de negocio', options: VERTICAL_OPTIONS }
];

// First tier (scanned in TAG_TIERS order) whose option list contains the given
// tag value. Returns null if the value isn't a known taxonomy value.
export function tierForTag(tag) {
  const tier = TAG_TIERS.find(t => t.options.indexOf(tag) !== -1);
  return tier ? tier.key : null;
}

// Canonical URL for a tag value. Sport-tier tags canonicalize to /seccion.html
// (there is no separate "section" concept in the data — it's an alias over
// the sport tier) so /tema.html?tag=X&tier=sport and /seccion.html?seccion=X
// never compete as duplicate content.
export function tagHref(tier, value) {
  const v = encodeURIComponent(value);
  if (tier === 'sport') return `/seccion.html?seccion=${v}`;
  return `/tema.html?tag=${v}&tier=${encodeURIComponent(tier)}`;
}
