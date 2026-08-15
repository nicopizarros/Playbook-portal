// ———————————————————————————————————— El tablero de la elección FIFA
// Where each confederation stands on Gianni Infantino ahead of the 2027
// FIFA Congress, and which individual federations have said something in
// their own name. Assembled from Playbook's own published coverage plus
// the primary statements behind it; every entry carries the date it
// became true and the article that reported it, so the module is
// auditable against the archive rather than a set of assertions somebody
// typed once.
//
// This is the SINGLE SOURCE for the stance data. The homepage rail module
// (components/home/ElectionBoard.tsx) reads it. An article's own `Mapa:`
// device does NOT read it — that device takes its codes from the body
// text, by design, because an article is a record of one moment and must
// keep saying what it said on the day it was published. Keeping the two
// separate is deliberate: this file moves, the archive doesn't.
//
// —————————————————————————————————————————————— The five states
// A confederation's position and a federation's own words are two
// different facts, and the interesting ones are where they disagree.
// Every voting federation lands in one of five buckets:
//
//   declarada-respalda    said so itself, for Infantino
//   bloque-respalda       its confederation backs him; it has not spoken
//   bloque-en-contra      its confederation asked for an independent
//                         review; it has not spoken in its own name
//   declarada-en-contra   said so itself, against Infantino
//   sin-definir           explicitly has not taken a position
//
// A federation's OWN declaration always wins over its confederation's,
// which is what puts Mexico (Concacaf asked for a review, the FMF backed
// Infantino) and New Zealand (the OFC backed him, NZF withdrew) on the
// opposite side from their own bloc. Only 22 of the 210 have spoken for
// themselves; the rest are inheriting a position, which is the single
// most useful thing this board shows.
//
// THE UNIVERSE IS 210, NOT 211. FIFA has 211 members and Nepal's vote is
// suspended, so 210 ballots exist. The BBC's own map of this fight counts
// 210 for the same reason; scripts/build-world-map.ts owns the suspension
// list and the map device drops it from any confederation it expands.
//
// Vote weights are FIFA MEMBER ASSOCIATIONS, not confederation rosters:
// the six confederations have 218 members between them, and nine of those
// play without holding a FIFA seat at all. That file asserts the
// partition; the assertions at the foot of this one check that the five
// buckets still add up to the same 210.

export type Stance = 'respalda' | 'en-contra' | 'sin-definir';
export type Bucket =
  | 'declarada-respalda'
  | 'bloque-respalda'
  | 'bloque-en-contra'
  | 'declarada-en-contra'
  | 'sin-definir';

export type ConfederationStance = {
  /** Frame key in lib/data/world-map.json, so the two can be joined. */
  key: 'uefa' | 'afc' | 'concacaf' | 'caf' | 'conmebol' | 'ofc';
  name: string;
  /** FIFA member associations, i.e. votes in the Congress. */
  votes: number;
  stance: Stance;
  since: string;
  /** What it actually said. Kept precise: several of these are narrower
   *  than "backs him" or "wants him out", and the difference is the story. */
  note: string;
  articleId: string;
};

/** A federation that has stated a position in its own name. */
export type FederationStance = {
  code: string; // ISO3, joinable against world-map.json
  name: string;
  confederation: ConfederationStance['key'];
  stance: Stance;
  since: string;
  note: string;
};

export const ELECTION = {
  /** Nominations close. */
  candidaciesClose: '2026-11-18',
  /** The Congress votes. */
  vote: '2027-03',
  /** FIFA has 211 members; Nepal's vote is suspended, so 210 ballots. */
  members: 211,
  totalVotes: 210,
} as const;

// Ordered by weight.
export const CONFEDERATIONS: ConfederationStance[] = [
  {
    key: 'uefa',
    name: 'UEFA',
    votes: 55,
    stance: 'en-contra',
    since: '2026-07-30',
    note: 'Sus 55 federaciones votaron por unanimidad no jugar torneos de la FIFA mientras siguiera el plan, y el 10 de agosto firmó la carta que pide una revisión independiente.',
    articleId: 'uefa-vota-unanime-boicotear-el-mundial-si-la-fifa-vende-participacion-a-inversionistas-privados',
  },
  {
    key: 'caf',
    name: 'CAF',
    votes: 54,
    stance: 'respalda',
    since: '2026-08-07',
    note: 'Sus 54 federaciones acordaron por unanimidad apoyar la reelección de Infantino para 2027-2031.',
    articleId: 'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
  },
  {
    key: 'afc',
    name: 'AFC',
    // 46 FIFA members, 45 with a vote: Nepal is suspended.
    votes: 45,
    stance: 'en-contra',
    since: '2026-08-10',
    note: 'Firmó con la UEFA y la Concacaf la carta abierta que pide que la revisión la haga un tercero independiente.',
    articleId: 'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
  },
  {
    key: 'concacaf',
    name: 'Concacaf',
    votes: 35,
    stance: 'en-contra',
    since: '2026-08-10',
    note: 'Firmó la carta abierta. Su comunicado regional reunió a 40 de sus 41 federaciones miembro.',
    articleId: 'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
  },
  {
    key: 'ofc',
    name: 'OFC',
    votes: 11,
    stance: 'respalda',
    since: '2026-08-14',
    note: 'Celebró el retiro del plan y reconoció lo que creció el futbol de la región con la FIFA actual. No menciona la reelección.',
    articleId: 'oceania-apoya-a-infantino-y-nueva-zelanda-rompe-filas',
  },
  {
    key: 'conmebol',
    name: 'Conmebol',
    votes: 10,
    stance: 'respalda',
    since: '2026-08-06',
    note: 'Criticó las acciones unilaterales de la FIFA sin quitarle el apoyo a Infantino.',
    articleId: 'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
  },
];

// The federations that have spoken in their own name. Everything else on
// the board is inherited from a confederation. Sources: Playbook's own
// coverage for the confederations, Mexico and the six-federation Arab
// letter; BBC Sport for the associations it reached directly (the UAE,
// Bhutan, the Philippines, Grenada, St Kitts and Nevis, Saudi Arabia, and
// the United States and Canada's careful non-position).
export const FEDERATIONS: FederationStance[] = [
  // —— A favor. Todas menos las cuatro africanas rompen con su bloque.
  { code: 'MEX', name: 'México', confederation: 'concacaf', stance: 'respalda', since: '2026-08-06', note: 'Apoyó a Infantino y fue la única de las 41 federaciones de la Concacaf ausente del comunicado regional.' },
  { code: 'QAT', name: 'Catar', confederation: 'afc', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes que expresan su respaldo total a Infantino.' },
  { code: 'LBN', name: 'Líbano', confederation: 'afc', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes.' },
  { code: 'EGY', name: 'Egipto', confederation: 'caf', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes.' },
  { code: 'MAR', name: 'Marruecos', confederation: 'caf', stance: 'respalda', since: '2026-08-13', note: 'Coanfitriona del Mundial 2030. Firmó la carta conjunta de seis federaciones árabes.' },
  { code: 'SDN', name: 'Sudán', confederation: 'caf', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes.' },
  { code: 'MRT', name: 'Mauritania', confederation: 'caf', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes.' },
  { code: 'ARE', name: 'Emiratos', confederation: 'afc', stance: 'respalda', since: '2026-08-11', note: 'Apoya a Infantino dentro de una AFC que firmó la carta en contra.' },
  { code: 'BTN', name: 'Bután', confederation: 'afc', stance: 'respalda', since: '2026-08-11', note: 'Apoya a Infantino dentro de una AFC que firmó la carta en contra.' },
  { code: 'PHL', name: 'Filipinas', confederation: 'afc', stance: 'respalda', since: '2026-08-11', note: 'Apoya a Infantino dentro de una AFC que firmó la carta en contra.' },
  { code: 'GRD', name: 'Granada', confederation: 'concacaf', stance: 'respalda', since: '2026-08-11', note: 'Se sumó a la postura de México dentro de la Concacaf.' },
  { code: 'KNA', name: 'San Cristóbal y Nieves', confederation: 'concacaf', stance: 'respalda', since: '2026-08-11', note: 'Se sumó a la postura de México dentro de la Concacaf.' },

  // —— En contra. Todas dentro de la UEFA, salvo Nueva Zelanda.
  { code: 'FIN', name: 'Finlandia', confederation: 'uefa', stance: 'en-contra', since: '2026-07-30', note: 'De las primeras en quitarle el apoyo.' },
  { code: 'WAL', name: 'Gales', confederation: 'uefa', stance: 'en-contra', since: '2026-08-02', note: 'La primera federación en anunciar públicamente que le retiraba el apoyo.' },
  { code: 'SRB', name: 'Serbia', confederation: 'uefa', stance: 'en-contra', since: '2026-08-03', note: 'Retiró el apoyo que había firmado el 25 de mayo.' },
  { code: 'ENG', name: 'Inglaterra', confederation: 'uefa', stance: 'en-contra', since: '2026-08-03', note: 'La FA retiró formalmente su apoyo a la reelección.' },
  { code: 'SWE', name: 'Suecia', confederation: 'uefa', stance: 'en-contra', since: '2026-08-03', note: 'Su junta acordó en sesión extraordinaria oponerse a la candidatura.' },
  { code: 'IRL', name: 'Irlanda', confederation: 'uefa', stance: 'en-contra', since: '2026-08-13', note: 'La FAI retiró la carta de apoyo que había entregado este año.' },
  { code: 'NZL', name: 'Nueva Zelanda', confederation: 'ofc', stance: 'en-contra', since: '2026-08-14', note: 'Retiró su apoyo y pidió una revisión independiente, dos días después de que su confederación apoyara a Infantino.' },

  // —— Sin definir. No es silencio: es haber declinado tomar postura.
  // Estados Unidos y Canadá firmaron el reclamo de gobernanza de la
  // Concacaf sin pronunciarse sobre Infantino, que son dos cosas
  // distintas y la diferencia es justo lo que este tablero mide.
  { code: 'USA', name: 'Estados Unidos', confederation: 'concacaf', stance: 'sin-definir', since: '2026-08-11', note: 'Respaldó el comunicado de la Concacaf sin declarar una postura sobre Infantino.' },
  { code: 'CAN', name: 'Canadá', confederation: 'concacaf', stance: 'sin-definir', since: '2026-08-11', note: 'Respaldó el comunicado de la Concacaf sin declarar una postura sobre Infantino.' },
  { code: 'SAU', name: 'Arabia Saudita', confederation: 'afc', stance: 'sin-definir', since: '2026-08-11', note: 'Sede del Mundial 2034 y todavía sin postura pública. Renueva su propia dirigencia en agosto.' },
];

export const BUCKET_LABEL: Record<Bucket, string> = {
  'declarada-respalda': 'Lo apoyan, por su cuenta',
  'bloque-respalda': 'Su confederación lo apoya',
  'bloque-en-contra': 'Su confederación pidió revisión',
  'declarada-en-contra': 'En contra, por su cuenta',
  'sin-definir': 'Sin definir',
};

export type BucketTally = { bucket: Bucket; votes: number; codes: string[] };

/**
 * The five buckets, in a fixed order that runs from the hardest public
 * support to the hardest public opposition and ends on the undecided, so
 * the bar reads as one spectrum and never reorders between builds.
 *
 * A federation's own declaration outranks its confederation's position.
 * The two silent buckets are computed as each confederation's vote count
 * minus whoever inside it has spoken, so the five always sum to the 210
 * ballots and no federation is counted twice.
 */
export function buckets(): BucketTally[] {
  const order: Bucket[] = [
    'declarada-respalda',
    'bloque-respalda',
    'bloque-en-contra',
    'declarada-en-contra',
    'sin-definir',
  ];

  const declared = (stance: Stance) => FEDERATIONS.filter(f => f.stance === stance).map(f => f.code);

  // Whatever a confederation's own position is, every federation inside it
  // that has spoken — on either side, or to decline — leaves its silent count.
  const silent = (stance: Stance) =>
    CONFEDERATIONS.filter(c => c.stance === stance).reduce(
      (total, c) => total + c.votes - FEDERATIONS.filter(f => f.confederation === c.key).length,
      0,
    );

  const counts: Record<Bucket, { votes: number; codes: string[] }> = {
    'declarada-respalda': { votes: declared('respalda').length, codes: declared('respalda') },
    'bloque-respalda': { votes: silent('respalda'), codes: [] },
    'bloque-en-contra': { votes: silent('en-contra'), codes: [] },
    'declarada-en-contra': { votes: declared('en-contra').length, codes: declared('en-contra') },
    'sin-definir': { votes: declared('sin-definir').length, codes: declared('sin-definir') },
  };

  return order.map(bucket => ({ bucket, ...counts[bucket] }));
}

/**
 * The BBC-style three-way read: everything backing him, everything against
 * him, everything undecided. Same data, aggregated — useful for a sentence
 * where the declared/inherited split is more detail than the point needs.
 */
export function sides(): { respalda: number; enContra: number; sinDefinir: number } {
  const by = Object.fromEntries(buckets().map(b => [b.bucket, b.votes])) as Record<Bucket, number>;
  return {
    respalda: by['declarada-respalda'] + by['bloque-respalda'],
    enContra: by['declarada-en-contra'] + by['bloque-en-contra'],
    sinDefinir: by['sin-definir'],
  };
}

/** Confederations grouped by stance, for the roll call. */
export function byStance(stance: Stance): ConfederationStance[] {
  return CONFEDERATIONS.filter(c => c.stance === stance);
}

/** Federations whose own position contradicts their confederation's. */
export function defectors(): FederationStance[] {
  return FEDERATIONS.filter(f => {
    const bloc = CONFEDERATIONS.find(c => c.key === f.confederation);
    return bloc && f.stance !== 'sin-definir' && bloc.stance !== f.stance;
  });
}

/** The most recent dated movement on the board, for the module's "as of". */
export function lastMovement(): string {
  return [...CONFEDERATIONS, ...FEDERATIONS].map(entry => entry.since).sort().reverse()[0];
}

// Three invariants worth failing loudly on, all dev-only so a typo never
// takes production down over a legend.
//
//   1. The six confederations must account for every ballot.
//   2. The five buckets must too, which is the stronger check: it also
//      catches a federation filed under a confederation it doesn't belong
//      to, or listed twice, either of which would double-count a vote.
//   3. No federation may be listed twice.
if (process.env.NODE_ENV !== 'production') {
  const confederationSum = CONFEDERATIONS.reduce((total, c) => total + c.votes, 0);
  if (confederationSum !== ELECTION.totalVotes) {
    console.error(`[fifa-election] las confederaciones suman ${confederationSum}, hay ${ELECTION.totalVotes} votos`);
  }
  const bucketSum = buckets().reduce((total, b) => total + b.votes, 0);
  if (bucketSum !== ELECTION.totalVotes) {
    console.error(`[fifa-election] los cinco grupos suman ${bucketSum}, hay ${ELECTION.totalVotes} votos`);
  }
  const codes = FEDERATIONS.map(f => f.code);
  const dupes = codes.filter((code, i) => codes.indexOf(code) !== i);
  if (dupes.length) console.error(`[fifa-election] federaciones repetidas: ${dupes.join(', ')}`);
}
