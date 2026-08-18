import type { Hub } from './types';

// ------------------------------------------------------------- LFA FINSUS
// Hub #1. The commercial thesis: a domestic league that just took foreign
// institutional capital, in the most valuable non-US market for the sport
// on earth, while expanding its franchise count by half. Every one of
// those is a Playbook story — none of them is a score.
//
// PROVENANCE DISCIPLINE (section 5). Every figure below carries a source.
// Facts that came from the publisher's brief rather than from a published
// citation say so IN THE SOURCE LABEL and render with a visible
// "sin cita pública" marker — they are not laundered into the page as if
// they were reported. The citation backlog is therefore visible ON the
// page, which is the point: this is a business-intelligence outlet, and an
// uncited number is a liability, not a decoration.
//
// DELIBERATELY NOT ENCODED: franchise team names, venues and attendance.
// The brief supplied eight plaza LOCATIONS but no team names, and guessing
// crests or venues would be inventing facts to make a module look full —
// the exact padding section 5 forbids. `team`/`venue` stay empty until
// someone supplies them with a source.
const BRIEF: { label: string; note: string } = {
  label: 'Brief editorial Playbook (2026-08-18)',
  note: 'Dato del brief interno; pendiente de cita pública antes de publicar.',
};

const BOLETIN = {
  label: 'Comunicado LFA · Black Clover',
  note: 'Boletín de prensa en poder de Playbook; sin URL pública al momento de escribir.',
};

export const LFA_HUB: Hub = {
  slug: 'lfa',
  name: 'LFA',
  // Live in the nav (publisher directive, 2026-08-18, same day as launch).
  listed: true,
  // The graphic supplied with the Black Clover press kit reads "LFA
  // FINSUS" throughout — the league wears its title sponsor in its own
  // commercial name. That is itself a Playbook-relevant fact (naming
  // rights), so the masthead carries the full commercial name rather than
  // the bare initials.
  fullName: 'Liga de Fútbol Americano Profesional',
  thesis:
    'Una liga mexicana que acaba de tomar capital institucional extranjero, en el mercado más valioso del futbol americano fuera de Estados Unidos, mientras crece su número de franquicias a la mitad.',
  description:
    'Cobertura de negocio de la LFA: capital, expansión de franquicias, plazas comerciales, patrocinios y derechos. La liga profesional de futbol americano en México, leída como industria.',

  identity: {
    tokens: 'lfa',
    // ALWAYS rendered. The logo below is decoration layered over this, not
    // a replacement for it — see HubIdentity's legal note.
    wordmark: 'LFA',
    // Intentionally absent until rights are confirmed. The slot exists and
    // is a one-line config change away from being filled; until then the
    // masthead is pure Playbook type, which is the legally safe default
    // and, per the design plan, the better-looking one.
    // logo: { src: '/hubs/lfa/lockup.svg', alt: 'LFA', width: 96, height: 96 },
  },

  tag: 'LFA',
  relatedSources: ['noticias', 'la-lana'],
  // Deliberately wide: league name in both spellings, the tentpole, the
  // investor, the adjacent properties that generate the near misses the
  // boundary rule exists to reject, and the sport itself.
  backfillTerms: [
    'LFA', 'Liga de Fútbol Americano', 'Liga de Futbol Americano', 'FINSUS',
    'Tazón México', 'Tazon Mexico', 'fútbol americano', 'futbol americano',
    'emparrillado', 'Global Sports Capital', 'ONEFA', 'flag football',
  ],

  // ------------------------------------------------------------ La Cadena
  // 8 → 12 franchises. The only fact on this page with both a current
  // position and a stated line to gain, which is exactly the condition the
  // device requires. If either side lost its source, the module would
  // vanish rather than render half a measurement.
  chain: {
    title: 'Expansión de franquicias',
    unit: ['franquicia', 'franquicias'],
    current: {
      value: '8',
      label: 'Franquicias hoy',
      source: { ...BRIEF },
    },
    target: {
      value: '12',
      label: 'Meta declarada',
      source: { ...BRIEF },
    },
    horizon: '2027',
  },

  // --------------------------------------------- El estado comercial
  commercialState: [
    {
      value: 'US$100M',
      label: 'Compromiso de capital de Global Sports Capital Partners',
      source: { ...BRIEF },
    },
    {
      value: '7 años',
      label: 'Horizonte del compromiso',
      source: { ...BRIEF },
    },
    {
      value: '1 año',
      label: 'Vigencia inicial del acuerdo con Black Clover, renovable automáticamente',
      source: { ...BOLETIN },
    },
    {
      value: '2 modelos',
      label: 'Gorras por equipo contempladas en la licencia de Black Clover',
      source: { ...BOLETIN },
    },
  ],

  // ----------------------------------------------------------- Plazas
  // Framed as commercial markets. `marketNote` answers "what is a sponsor
  // buying here", which is the only reason this module exists instead of a
  // map. Left empty where nobody has supplied a sourced answer.
  plazas: [
    { city: 'Chihuahua', region: 'Chihuahua', status: 'establecida', source: { ...BRIEF } },
    { city: 'Saltillo', region: 'Coahuila', status: 'establecida', source: { ...BRIEF } },
    { city: 'Monterrey', region: 'Nuevo León', status: 'establecida', source: { ...BRIEF } },
    { city: 'Querétaro', region: 'Querétaro', status: 'establecida', source: { ...BRIEF } },
    // The brief lists "Jalisco" — a state — among franchise locations.
    // Recorded as the state, NOT resolved to Guadalajara: the league may
    // play anywhere in it and inventing a city is inventing a fact.
    { city: 'Jalisco', status: 'establecida', source: { ...BRIEF } },
    { city: 'Ciudad de México', status: 'establecida', source: { ...BRIEF } },
    { city: 'Estado de México', status: 'establecida', source: { ...BRIEF } },
    { city: 'Puebla', region: 'Puebla', status: 'establecida', source: { ...BRIEF } },
    // Announced expansion markets. NOTE: the brief also names Monterrey
    // among these, but Monterrey already carries an established franchise
    // above — either a second franchise in the plaza or an error in the
    // brief. Not encoded twice; flagged as an open question instead.
    { city: 'Mérida', region: 'Yucatán', status: 'anunciada', source: { ...BRIEF } },
    { city: 'Cancún', region: 'Quintana Roo', status: 'anunciada', source: { ...BRIEF } },
    { city: 'Tijuana', region: 'Baja California', status: 'anunciada', source: { ...BRIEF } },
  ],

  // --------------------------------------------------------- Temporada
  // Section 4: "only if the content supports it". Today it supports
  // exactly one anchor with a source, so the spine carries one beat rather
  // than a padded calendar. The module hides itself below two beats — see
  // HubSeason.
  season: [
    {
      label: 'Tazón México',
      when: 'Por confirmar',
      note: 'El evento tentpole de la propiedad.',
      source: { ...BRIEF },
    },
  ],

  sponsor: {
    kicker: 'Presentado por',
    pitch:
      'Este espacio acompaña toda la cobertura de negocio de la LFA en Playbook: capital, expansión y patrocinios, frente a una audiencia de industria.',
    contactUrl: '/#contacto',
  },

  emptyState: {
    heading: 'La cobertura empieza aquí',
    body:
      'Todavía no publicamos una pieza etiquetada como LFA. Esta página ya está lista para recibirlas: en cuanto salga la primera, aparece acá y en el archivo general.',
  },
};
