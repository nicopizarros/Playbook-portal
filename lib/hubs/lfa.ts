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

// The league's own brand kit, in Playbook's possession — an authoritative
// primary source for the franchise list, the localities and the correct way
// to name each team.
const KIT = {
  label: 'Brand Kit LFA 2026 (documento oficial de la liga)',
  note: 'Documento en poder de Playbook como media partner; sin URL pública.',
};

const BOLETIN = {
  label: 'Comunicado LFA · Black Clover',
  note: 'Boletín de prensa en poder de Playbook; sin URL pública al momento de escribir.',
};

export const LFA_HUB: Hub = {
  slug: 'lfa',
  name: 'LFA',
  // Unlisted again (publisher directive, 2026-08-19): the joint LFA x
  // Playbook announcement hasn't gone out yet, and the masthead's
  // `partnership` line below already states the relationship as fact.
  // Pulling this back to `false` drops it from the nav and the sitemap
  // (see Hub.listed) and — via this hub's own generateMetadata — sets
  // robots noindex, which matters here because the page was briefly
  // listed and Google already indexed it; noindex is what gets it
  // dropped on the next crawl. Flip back to `true` only alongside the
  // real announcement.
  listed: false,
  // The graphic supplied with the Black Clover press kit reads "LFA
  // FINSUS" throughout — the league wears its title sponsor in its own
  // commercial name. That is itself a Playbook-relevant fact (naming
  // rights), so the masthead carries the full commercial name rather than
  // the bare initials.
  fullName: 'Liga de Fútbol Americano Profesional',
  tagline: 'El negocio del futbol americano en México',
  // Real, confirmed by the publisher 2026-08-18.
  partnership: 'Media partner exclusivo de negocio deportivo',
  thesis:
    'Una liga mexicana que acaba de tomar capital institucional extranjero, en el mercado más valioso del futbol americano fuera de Estados Unidos, mientras crece su número de franquicias a la mitad.',
  description:
    'Cobertura de negocio de la LFA: capital, expansión de franquicias, plazas comerciales, patrocinios y derechos. La liga profesional de futbol americano en México, leída como industria.',

  identity: {
    tokens: 'lfa',
    // ALWAYS rendered. The logo below is decoration layered over this, not
    // a replacement for it — see HubIdentity's legal note.
    wordmark: 'LFA',
    // Nominative reference: the league's own shield, used to identify the
    // property this coverage is about. Publisher's call, 2026-08-18.
    // Swappable and optional — `wordmark` above renders either way, so
    // removing this line degrades the masthead to type, never to a hole.
    // Official horizontal lockup, white version, straight from the kit's
    // LOGO LFA folder — not a re-drawn or re-coloured mark. The kit
    // prohibits altering colours, removing the white envelope, outlining,
    // rotating, or applying gradients/textures/3D to it.
    logo: {
      src: '/hubs/lfa/lfa_finsus_hrz_blanco.png',
      alt: 'LFA México · finsus',
      width: 1200,
      height: 400,
    },
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
    // The seven franchises of the 2026 season, exactly as the LFA's own
    // brand kit names them ("Esta es la manera correcta de mencionarlos").
    // Corrects the earlier list, which came from the brief and carried
    // eight plazas including Puebla — not a 2026 franchise.
    { city: 'Chihuahua', region: 'Chihuahua', state: 'Chihuahua',
      team: 'Caudillos de Chihuahua', status: 'establecida', source: { ...KIT } },
    { city: 'Saltillo', region: 'Coahuila', state: 'Coahuila de Zaragoza',
      team: 'Dinos de Saltillo', status: 'establecida', source: { ...KIT } },
    { city: 'Monterrey', region: 'Nuevo León', state: 'Nuevo León',
      team: 'Osos de Monterrey', status: 'establecida', source: { ...KIT } },
    { city: 'Querétaro', region: 'Querétaro', state: 'Querétaro',
      team: 'Gallos Negros de Querétaro', status: 'establecida', source: { ...KIT } },
    { city: 'Jalisco', region: 'Jalisco', state: 'Jalisco',
      team: 'Reyes de Jalisco', status: 'establecida', source: { ...KIT } },
    { city: 'Ciudad de México', region: 'CDMX', state: 'Distrito Federal',
      team: 'Mexicas de la Ciudad de México', status: 'establecida', source: { ...KIT } },
    { city: 'Valle de México', region: 'Estado de México', state: 'México',
      team: 'Raptors del Valle de México', status: 'establecida', source: { ...KIT } },
    // Announced expansion markets. No team names yet — none have been
    // named, and inventing one would be inventing a franchise.
    { city: 'Mérida', region: 'Yucatán', state: 'Yucatán', status: 'anunciada', source: { ...BRIEF } },
    { city: 'Cancún', region: 'Quintana Roo', state: 'Quintana Roo', status: 'anunciada', source: { ...BRIEF } },
    { city: 'Tijuana', region: 'Baja California', state: 'Baja California', status: 'anunciada', source: { ...BRIEF } },
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

  emptyState: {
    heading: 'La cobertura empieza aquí',
    body:
      'Todavía no publicamos una pieza etiquetada como LFA. Esta página ya está lista para recibirlas: en cuanto salga la primera, aparece acá y en el archivo general.',
  },
};
