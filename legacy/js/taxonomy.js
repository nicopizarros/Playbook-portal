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
