import type { Hub, HubPlaza } from './types';

// ------------------------------------------------------------- LFA FINSUS
// Hub #1. The commercial thesis: a domestic league that just took foreign
// institutional capital, in the most valuable non-US market for the sport
// on earth, while moving from seven franchises to a declared twelve. Every
// one of those is a Playbook story — none of them is a score.
//
// PROVENANCE DISCIPLINE (section 5). Every figure below carries a source.
// Facts that came from the publisher's brief rather than from a published
// citation say so IN THE SOURCE LABEL and render with a visible
// "sin cita pública" marker — they are not laundered into the page as if
// they were reported. The citation backlog is therefore visible ON the
// page, which is the point: this is a business-intelligence outlet, and an
// uncited number is a liability, not a decoration.
//
// DELIBERATELY NOT ENCODED: venues and attendance. The brief supplied eight
// plaza LOCATIONS and no team names; the league's own brand kit later
// superseded it with the correct seven, WITH names — which is why the plaza
// list carries teams and cites the KIT. Venues remain unencoded: guessing
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

// ----------------------------------------------------------- Plazas
  // Framed as commercial markets. `marketNote` answers "what is a sponsor
  // buying here", which is the only reason this module exists instead of a
  // map. Left empty where nobody has supplied a sourced answer.
const PLAZAS: HubPlaza[] = [
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
];

// The current franchise count is DERIVED from the plaza list above, never
// typed twice. It was typed twice until 2026-08-25, and the two copies
// disagreed: the plaza list had already been corrected to the brand kit's
// seven 2026 franchises, while La Cadena still carried the brief's original
// eight — so the page simultaneously listed seven teams and announced it
// had eight. Counting the list makes that class of drift unrepresentable,
// which matters because this number is expected to move again.
//
// `establecida` and `anunciada` are deliberately NOT summed: an announced
// market is a market, not a franchise, and the whole point of La Cadena is
// the distance between what exists and what has been promised.
const FRANQUICIAS_ESTABLECIDAS = PLAZAS.filter((p) => p.status === 'establecida').length;

// The league's fan-base study, supplied to Playbook by the LFA. A LICENSED
// third-party dataset: Global Sponsorship Group owns it, and crediting them
// is a condition of using the numbers. That is why the band renders its
// `credit` unconditionally instead of routing it through HubSource, which
// hides itself when there is no public URL — see HubAudience's note. The
// per-figure sources below still exist and still satisfy HubFigure's
// invariant; they are simply not the thing carrying the licence.
const GLOBAL_INTELLIGENCE = {
  label: 'Global Intelligence – Fan Base © Global Sponsorship Group, 2026',
  note: 'Estudio de la LFA en poder de Playbook; sin URL pública.',
};

export const LFA_HUB: Hub = {
  slug: 'lfa',
  name: 'LFA',
  // Unlisted, and as of 2026-08-25 this is the SETTLED state rather than a
  // hold. Publisher, asked directly during the pre-handover QA: the hub "is
  // not accessible via the home page, but if you know the address you can
  // access it." That is exactly what this flag buys — it drops the hub from
  // the nav and the sitemap (see Hub.listed) and, via this hub's own
  // generateMetadata, sets robots noindex, while the URL itself keeps
  // serving 200. Undiscoverable, not unreachable (see commit a61b4f3).
  //
  // Originally set false on 2026-08-19 because the page had been briefly
  // listed and Google had already indexed it; noindex is what gets it
  // dropped on the next crawl. That reason has now been superseded by a
  // preference, which is a stronger reason.
  //
  // DO NOT flip this to `true` to satisfy a QA checklist item that says the
  // hub should be reachable from the three-zone header. That item was
  // written before the ruling and is the thing that is wrong; it has been
  // struck in docs/TODO.md. The announcement gating below is a SEPARATE
  // question and still stands on its own.
  listed: false,
  // The graphic supplied with the Black Clover press kit reads "LFA
  // FINSUS" throughout — the league wears its title sponsor in its own
  // commercial name. That is itself a Playbook-relevant fact (naming
  // rights), so the masthead carries the full commercial name rather than
  // the bare initials.
  fullName: 'Liga de Fútbol Americano Profesional',
  // Only a fallback here: `partnership` below is set, so it builds the
  // eyebrow instead and this string never renders on the LFA hub. Kept
  // because it is the right eyebrow the day the partnership line comes off.
  tagline: 'El negocio del futbol americano en México',
  // Real, confirmed by the publisher 2026-08-18. Shortened 2026-08-24 to
  // the mockup's own wording: the masthead now reads
  // "Medio oficial de negocios · Playbook × LFA FINSUS", where the trailing
  // pair is composed from the lockup rather than typed into this string.
  //
  // NOTE FOR GO-LIVE: the mockup's internal notes said to show "medio
  // oficial de negocios" only AFTER the joint announcement. This used to be
  // described as the same condition `listed` was waiting on — it no longer
  // is. `listed: false` is now a standing preference (see above), so the two
  // have come apart: this line is still gated on the announcement, and
  // nothing about discoverability releases it.
  partnership: 'Medio oficial de negocios',
  // The mockup's dek, adopted verbatim 2026-08-24 (publisher's call). The
  // previous line led with the capital raise and the franchise expansion;
  // both facts still carry, with sources, in La Cadena and El tablero
  // below, so nothing was lost by making the masthead broader.
  thesis:
    'El negocio detrás de la Liga. Patrocinios, franquicias, audiencias, medios, talento y los proyectos que están moviendo al futbol americano profesional en México.',
  description:
    'Cobertura de negocio de la LFA: capital, expansión de franquicias, plazas comerciales, patrocinios y derechos. La liga profesional de futbol americano en México, leída como industria.',

  identity: {
    tokens: 'lfa',
    // ALWAYS rendered, and since 2026-08-24 this IS the h1. The logo below
    // is decoration layered over it, not a replacement — see HubIdentity's
    // legal note.
    //
    // Split across two fields because the league's commercial name carries
    // its title sponsor and the league colours that half: the kit's own
    // lockup sets "LFA" white and "FINSUS" in the bright green. Naming
    // rights are themselves a Playbook-relevant fact, which is why the
    // masthead says the commercial name rather than the bare initials.
    wordmark: 'LFA',
    wordmarkAccent: 'FINSUS',
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
    // The league's own 2026 campaign key art, supplied to Playbook with the
    // press kit. It replaces the hand-built Mexican-flag gradient the
    // masthead used to wear — which was an APPROXIMATION of this image, made
    // before the real one was in hand. Using the actual artwork is both more
    // honest and better: the flag wash, the diagonal hatch and the roster
    // montage are the league's composition, not Playbook's guess at it.
    //
    // Composed for exactly this crop: the montage sits hard right and the
    // left two-thirds are near-empty gradient, which is where the headline
    // goes. Do not re-centre it.
    //
    // Same nominative-reference posture as the shield above, and the same
    // degradation: delete this line and the masthead falls back to the
    // token wash with nothing else changed. Note this is the league's own
    // composed campaign image, NOT team crests lifted into Playbook's
    // design language — the identity-design legal guardrail forbids the
    // latter and this is not that.
    heroArt: {
      src: '/hubs/lfa/key-art-2026.jpg',
      alt: '',
      credit: 'Arte: LFA',
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
  // 7 → 12 franchises. The only fact on this page with both a current
  // position and a stated line to gain, which is exactly the condition the
  // device requires. If either side lost its source, the module would
  // vanish rather than render half a measurement.
  //
  // The geometry is fully derived in HubChain from these two numbers: the
  // marker sits at current/target, the tick count IS target, and each tick
  // reads gained/open from its own index. Nothing here or in hub.css encodes
  // a proportion, so correcting the count moves the marker, the dotted run
  // and the axis together. Verified at 7/12 on 2026-08-25.
  chain: {
    title: 'Expansión de franquicias',
    unit: ['franquicia', 'franquicias'],
    current: {
      // Derived, not typed — see FRANQUICIAS_ESTABLECIDAS above.
      value: String(FRANQUICIAS_ESTABLECIDAS),
      label: 'Franquicias hoy',
      // The KIT, not the BRIEF: this number is now a count of the brand
      // kit's own franchise list, so it inherits the brand kit's provenance.
      // Sourcing it to the brief was the other half of the drift: the
      // figure cited a document that had already been superseded.
      source: { ...KIT },
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

  // ------------------------------------------------------------ La afición
  // The demand side of the board, sharing the light plane with the capital
  // figures above: what has been committed TO the property, then what the
  // property has to sell. Three figures exactly as the league supplied
  // them — NOT rounded, NOT converted, and NOT joined into a derived ratio.
  // "3.8 millones" is not restated as "3,800,000", and no engagement rate
  // is computed from plays ÷ followers: the study reports three quantities
  // and manufacturing a fourth from them would be the fabrication the
  // provenance rule forbids, dressed up as arithmetic.
  //
  // Ordered as an argument rather than by magnitude: the market that could
  // be reached, the audience the league already owns, and the evidence it
  // behaves like a media property. More figures are expected — add them to
  // this array and the band lays them out. The grid is auto-fit, so growing
  // the dataset never touches layout.
  audience: {
    kicker: 'La afición',
    heading: 'El tamaño de la afición',
    sub: 'Qué compra un patrocinador cuando compra a la LFA.',
    figures: [
      {
        value: '3.8 millones',
        label: 'Afición potencial a la LFA (cifra estimada)',
        source: { ...GLOBAL_INTELLIGENCE },
      },
      {
        value: '+600 mil',
        label: 'Seguidores en redes sociales de la Liga',
        source: { ...GLOBAL_INTELLIGENCE },
      },
      {
        value: '22 millones',
        label: 'Reproducciones de video',
        source: { ...GLOBAL_INTELLIGENCE },
      },
    ],
    credit: 'Fuente: Global Intelligence – Fan Base © Global Sponsorship Group, 2026',
  },

  // ----------------------------------------------------------- Plazas
  // Lifted to module scope so La Cadena can count it — see PLAZAS above.
  plazas: PLAZAS,

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

  // -------------------------------------------------------- Temas que seguimos
  // Playbook's own coverage commitment, not a claim about the league — no
  // HubSource needed (see HubPillar's own comment). Content and wording
  // straight from the 2026-08-19 mockup's "radar editorial" module.
  pillars: [
    { title: 'Capital + ownership', description: 'Quién invierte, cómo se estructura el capital y qué cambia para la Liga y sus franquicias.' },
    { title: 'Expansión', description: 'Nuevas plazas, propietarios, estadios, demanda local y el modelo para crecer sin diluir el producto.' },
    { title: 'Marcas + commerce', description: 'Patrocinios, naming, licencias, merch y las categorías que todavía tienen espacio para entrar.' },
    { title: 'Media + audiencias', description: 'TV, streaming, distribución, consumo y cómo convertir atención en hábito y valor comercial.' },
    { title: 'Producto + talento', description: 'Profesionalización, desarrollo de jugadores, rutas internacionales y flag football como extensión del ecosistema.' },
  ],

  // ------------------------------------------------------------ Momentos clave
  // The league's own annual shape -- generic to any pro American-football
  // circuit (offseason/draft/kickoff/season/playoffs/championship), which is
  // why this needs no per-item citation. Tazón México doubles as the hub's
  // one dated beat in `season` above once a real date lands; this module is
  // the evergreen framework, that one is the specific instance.
  momentsClave: [
    { label: 'Offseason', description: 'Capital, sponsors, expansión, front office.' },
    { label: 'Draft', description: 'Talento, scouting, roster, estrategia.' },
    { label: 'Kickoff', description: 'Producto, campañas, partners, media.', highlight: true },
    { label: 'Temporada', description: 'Audiencias, plazas, activaciones, consumo.' },
    { label: 'Playoffs', description: 'Demanda, inventario, storytelling comercial.' },
    { label: 'Tazón México', description: 'Evento, sede, sponsors, hospitality, distribución.', highlight: true },
  ],

  // -------------------------------------------------------------- Desde adentro
  // Only the access PROMISE (evergreen positioning), not a specific claimed
  // interview or video -- the mockup's "demo" video card stays out until a
  // real one exists; see the module's own comment in HubModules.tsx.
  access: [
    { title: 'Voceros', description: 'Liga, franquicias, socios e inversionistas.' },
    { title: 'Datos', description: 'Audiencia, asistencia, consumo, patrocinios y crecimiento cuando estén disponibles.' },
    { title: 'Backstage', description: 'Cómo se construyen los eventos, acuerdos y decisiones relevantes.' },
    { title: 'Contexto', description: 'No republicar comunicados: explicar qué significa cada movimiento.' },
  ],

  // NO accessPhoto (2026-09-02, resolves the bug docs/TODO.md flagged as
  // "still open" on 2026-08-25). `/assets/img/lfa-reyes-accion-mayo-2026.jpg`
  // was set here AND is a published article's own cover — the same
  // photograph rendered twice on one page, which reads as a bug, not a
  // motif. `public/hubs/lfa/` holds no second real photograph: `board.jpg`
  // is a texture, not a photo, and stock is forbidden here (module-inventory.md)
  // — so duplicating the lead was the only option left in the repo, and the
  // TODO's own resolution was to drop the field rather than keep
  // duplicating it. HubAccess degrades to type-only without it — see its
  // `data-art={Boolean(photo)}` branch in HubModules.tsx — so "Desde
  // adentro" still renders, just without the poster. Set accessPhoto again
  // the day a real, credited, distinct LFA photograph exists for this slot.
};
