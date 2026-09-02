// Editable copy for the four product front pages (/noticias, /la-lana,
// /futbol-business-review, /infinitas — CMS panel added 2026-08-05 on user
// request). Lives in its own module, NOT in lib/data/site-content.ts, on
// purpose: the admin dashboard (a client component) needs the defaults and
// the merge helper at runtime, and site-content.ts imports the server-only
// db client — pulling that into a client bundle is a build error waiting
// to happen. This file must stay free of runtime imports.
//
// Stored as an OPTIONAL site_content section: rows saved before this
// existed simply don't have it, so every reader goes through
// productHubsContent() below, which merges stored values over these code
// defaults — never read content.productHubs directly.

export type HubMetric = {
  /** Number as the editor types it, e.g. "2.35" or "91,553" — the page
      parses it and derives decimals for the count-up animation. */
  value: string;
  prefix: string;
  suffix: string;
  label: string;
  source: string;
};

// One row of La Lana's masthead departures board (2026-08-05, third round
// of user feedback on this graphic: a labeled route line still read as
// abstract — the board is the card art's own motif, and its rows are the
// CONNECTIONS the investigations uncovered, set as flights). CMS-curated
// rows live here; the page prepends auto rows derived from recent
// expedientes that declare a "Ruta del dinero" in their body.
export type LanaBoardRow = {
  /** Short date/time cell, e.g. "5 AGO". Free text, can be empty. */
  fecha: string;
  /** The connection itself, e.g. "Infantino ↔ Trump". */
  conexion: string;
  /** Flight-number cell, e.g. "EXP. 004". Free text, can be empty. */
  expediente: string;
  /** Status cell, e.g. "Abierto" / "En curso" / "Archivado" — anything
      containing "abierto"/"curso" blinks like a boarding call. */
  estado: string;
  /** Optional link (an /articulo/… URL) — the row becomes clickable. */
  url: string;
};

export type ProductHubsContent = {
  lana: {
    eyebrow: string;
    sub: string;
    /** Board caption, e.g. "Conexiones en los expedientes". */
    boardLabel: string;
    boardNote: string;
    boardRows: LanaBoardRow[];
  };
  noticias: { sub: string; cadenceNote: string };
  // headlinerId: the edition that opens the hub as its cover report. Kept
  // separate from the site-wide `featured` flag on purpose — headlining the
  // Interticket space shouldn't bump whatever is featured on the homepage.
  // Empty (or an id that no longer resolves) falls back to the most recent.
  tfbr: {
    taglineEm: string;
    taglineRest: string;
    sub: string;
    substackUrl: string;
    headlinerId: string;
  };
  // leadId: same contract as tfbr.headlinerId above — the story that leads
  // the hub, pinned by editorial instead of just taking the newest one.
  infinitas: { sub: string; marcadorSub: string; metrics: HubMetric[]; leadId: string };
};

export const PRODUCT_HUBS_DEFAULTS: ProductHubsContent = {
  lana: {
    eyebrow: 'Una investigación de Playbook',
    sub: 'El dinero, el poder y las decisiones que mueven al deporte fuera de la cancha. Un expediente a la vez.',
    boardLabel: 'Tablero de conexiones',
    boardNote: 'Las conexiones que los expedientes han destapado, en salidas.',
    // Seeded from connections the user named from the real published
    // catalog (2026-08-05); editorial curates the live list in the Hubs
    // tab — replace these freely.
    boardRows: [
      { fecha: '', conexion: 'Infantino ↔ Trump', expediente: '', estado: 'Abierto', url: '' },
      { fecha: '', conexion: 'AR Monex ↔ Europa', expediente: '', estado: 'Abierto', url: '' },
      { fecha: '', conexion: 'Isaac del Toro ↔ UAE', expediente: '', estado: 'Abierto', url: '' },
    ],
  },
  noticias: {
    sub: 'Lo que debes saber de sports business para tomar mejores decisiones, en menos de 5 minutos.',
    cadenceNote: 'Nuevas ediciones martes y jueves',
  },
  tfbr: {
    taglineEm: 'The insights',
    taglineRest: 'behind the game.',
    sub: 'El fútbol en el mercado hispano de US es un gigante en aceleración. Acá lo leemos como negocio, junto con Interticket.',
    substackUrl: 'https://playbookmedia.substack.com/',
    headlinerId: 'el-matador-inc-como-se-construye-una-leyenda-con-valor-comercial-vigente',
  },
  infinitas: {
    leadId: 'que-esta-construyendo-la-liga-femenil-bbva-rumbo-al-apertura-2026',
    sub: 'La nueva era del deporte, leída como industria.',
    marcadorSub: 'El deporte femenil como fuerza de negocio, en cifras que no dejan de subir.',
    metrics: [
      { value: '2.35', prefix: 'US$', suffix: 'B', label: 'Ingresos globales del deporte femenil de élite proyectados para 2025', source: 'Deloitte' },
      { value: '91,553', prefix: '', suffix: '', label: 'Récord mundial de asistencia a un partido de fútbol femenil (Camp Nou, 2022)', source: 'FC Barcelona' },
      { value: '1.98', prefix: '', suffix: 'M', label: 'Asistentes al Mundial Femenil 2023, récord histórico del torneo', source: 'FIFA' },
    ],
  },
};

// Per-hub shallow merge: a stored section that predates a newly-added
// field still gets that field's default instead of undefined.
export function productHubsContent(stored: ProductHubsContent | undefined): ProductHubsContent {
  return {
    lana: { ...PRODUCT_HUBS_DEFAULTS.lana, ...stored?.lana },
    noticias: { ...PRODUCT_HUBS_DEFAULTS.noticias, ...stored?.noticias },
    tfbr: { ...PRODUCT_HUBS_DEFAULTS.tfbr, ...stored?.tfbr },
    infinitas: { ...PRODUCT_HUBS_DEFAULTS.infinitas, ...stored?.infinitas },
  };
}
