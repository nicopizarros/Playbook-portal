// The four leadership profiles behind /nosotros §Liderazgo (ronda 1).
//
// Hand-maintained config, and deliberately NOT derived from
// lib/data/team.ts's roster: that roster is every byline that has actually
// published, which is a different set. Two of the four people below do not
// write articles, and the roles here are LEADERSHIP roles ("quién dirige
// qué"), not bylines. Ordered, not alphabetical — the order is the answer
// to "who runs this".
//
// Same discipline as TEAM_PROFILES and lib/hubs/lfa.ts: real data where it
// exists, an explicit absence where it does not, NEVER an invented
// placeholder. The design (Handoff Spec.dc.html §7) ships eleven visible
// [BRACKET] gaps so the client fills them in one pass; a mock can show a
// bracket, a live page cannot. So each bio below keeps every sentence that
// is true today and drops the ones that were only a bracket. The dropped
// material is recorded verbatim in docs/TODO.md — it is missing copy, not
// missing code.
//
// Still open, all of it waiting on the client, none of it on this file:
//   · `credential` — the "[Antes: cargo, organización]" line, one per
//     person. `null` until supplied; the card renders without it.
//   · The prior-organisation + figure sentence in all four bios.
//   · `photo` — only Aldo has a portrait. The rest fall back to a
//     monogram, which is a DESIGNED state (Leadership Card's "hueco sin
//     retrato"), not a broken image.
//   · "Dirección editorial" as a standalone role: Guillermo currently
//     carries editorial direction AND business intelligence. If that is
//     permanent, /estandares has a signer; if not, it is a vacancy.

export type Leader = {
  name: string;
  role: string;
  bio: string;
  /** "Antes: cargo, organización" — the one line that makes them worth reading. */
  credential: string | null;
  /** Public URL of a 4:5 portrait. Null renders the monogram state. */
  photo: string | null;
  /** Monogram for the no-portrait state. */
  initials: string;
};

export const LEADERSHIP: Leader[] = [
  {
    name: 'Aldo Sales',
    role: 'Dirección general y fundación',
    bio: 'Aldo Sales fundó Playbook y dirige la casa editorial. Conduce la franquicia de video de la casa.',
    credential: null,
    photo: null,
    initials: 'AS',
  },
  {
    name: 'Guillermo Mejía',
    role: 'Dirección editorial e inteligencia de negocio',
    bio: 'Guillermo Mejía fija la agenda de cobertura y es dueño de los estándares editoriales. Mapea el ecosistema —propiedades, patrocinadores, derechos— y es la razón por la que el análisis se sostiene.',
    credential: null,
    photo: null,
    initials: 'GM',
  },
  {
    name: 'Evelyn Lozano',
    role: 'Alianzas y crecimiento',
    bio: 'Evelyn Lozano dirige alianzas y crecimiento en Playbook. Es la puerta comercial para marcas, propiedades y patrocinadores que quieren trabajar con la casa.',
    credential: null,
    photo: null,
    initials: 'EL',
  },
  {
    name: 'María José Archundia',
    role: 'Marca y diseño',
    bio: 'María José Archundia dirige marca y diseño en Playbook. Es responsable de que cada producto se lea como Playbook, del wordmark a la última tabla.',
    credential: null,
    photo: null,
    initials: 'MA',
  },
];

// The four rules the newsroom decides BEFORE a story, not after. Shared by
// /nosotros ("Cómo trabajamos") and /estandares, which is the same set read
// in full — one definition so the two surfaces can never drift.
export type EditorialPrinciple = { num: string; lead: string; body: string };

export const EDITORIAL_PRINCIPLES: EditorialPrinciple[] = [
  {
    num: '01',
    lead: 'Seguimos el dinero.',
    body: 'Cada historia responde quién paga, quién cobra y qué incentivo cambia.',
  },
  {
    num: '02',
    lead: 'Contexto antes que velocidad.',
    body: 'Publicamos cuando podemos explicar el mecanismo, no cuando aparece el rumor.',
  },
  {
    num: '03',
    lead: 'Etiquetamos lo comercial.',
    body: 'Todo contenido patrocinado se identifica como tal, siempre.',
  },
  {
    num: '04',
    lead: 'Cada cifra trae su fuente.',
    body: 'Ningún número se publica sin decir quién lo dijo y cuándo. Si no tiene cita pública, se marca como por verificar.',
  },
];

// Publishing cadence per product, for the "Los productos" grid. Lives here
// and not in lib/product-hubs.ts because cadence is an editorial promise
// about the calendar, not part of a hub's routing identity — and this is
// the only surface that states it.
export const PRODUCT_CADENCE: Record<string, string> = {
  noticias: 'Martes y jueves',
  'la-lana': 'Viernes',
  'futbol-business-review': 'Periódico',
  infinitas: 'Semanal',
};

// The institutional links in the "Nosotros" header panel and its mobile
// accordion. One list, two surfaces.
export const NOSOTROS_LINKS: { label: string; href: string }[] = [
  { label: 'Misión y visión', href: '/nosotros#mision' },
  { label: 'Liderazgo', href: '/nosotros#liderazgo' },
  { label: 'Equipo editorial', href: '/equipo' },
  { label: 'Estándares editoriales', href: '/estandares' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Trabaja con Playbook', href: '/contacto#alianzas' },
];
