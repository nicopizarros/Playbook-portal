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
// ————————————————————————————————————————————— The four states
// A confederation's position and a federation's own words are two
// different facts, and the interesting ones are where they disagree.
// Every federation therefore lands in one of four buckets:
//
//   declarada-en-contra   said so itself, against Infantino
//   bloque-en-contra      its confederation asked for a review; it has
//                         not spoken in its own name
//   bloque-respalda       its confederation backs him; it has not spoken
//   declarada-respalda    said so itself, for Infantino
//
// A federation's OWN declaration always wins over its confederation's,
// which is what puts Mexico (Concacaf asked for a review, the FMF backed
// Infantino) and New Zealand (the OFC backed him, NZF withdrew) on the
// opposite side from their own bloc. Only 14 of the 211 have spoken for
// themselves; the other 197 are inheriting a position, which is the
// single most useful thing this board shows.
//
// Vote weights are FIFA MEMBER ASSOCIATIONS, not confederation rosters.
// The six confederations have 218 members between them and FIFA has 211;
// nine associations play in a confederation without holding a FIFA seat
// and therefore never vote. scripts/build-world-map.ts owns that list and
// asserts the partition; the assertions at the foot of this file check
// that the four buckets still add up to the same 211.

export type Stance = 'respalda' | 'en-contra' | 'sin-pronunciarse';
export type Bucket = 'declarada-en-contra' | 'bloque-en-contra' | 'bloque-respalda' | 'declarada-respalda';

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
  stance: Exclude<Stance, 'sin-pronunciarse'>;
  since: string;
  note: string;
};

export const ELECTION = {
  /** Nominations close. */
  candidaciesClose: '2026-11-18',
  /** The Congress votes. */
  vote: '2027-03',
  totalVotes: 211,
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
    votes: 46,
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

// The 14 federations that have spoken in their own name. Everything else
// on the board is inherited from a confederation.
export const FEDERATIONS: FederationStance[] = [
  // —— Contra, todas dentro de confederaciones que también piden revisión,
  //    salvo Nueva Zelanda.
  { code: 'FIN', name: 'Finlandia', confederation: 'uefa', stance: 'en-contra', since: '2026-07-30', note: 'De las primeras en quitarle el apoyo.' },
  { code: 'WAL', name: 'Gales', confederation: 'uefa', stance: 'en-contra', since: '2026-08-02', note: 'La primera federación en anunciar públicamente que le retiraba el apoyo.' },
  { code: 'SRB', name: 'Serbia', confederation: 'uefa', stance: 'en-contra', since: '2026-08-03', note: 'Retiró el apoyo que había firmado el 25 de mayo.' },
  { code: 'ENG', name: 'Inglaterra', confederation: 'uefa', stance: 'en-contra', since: '2026-08-03', note: 'La FA retiró formalmente su apoyo a la reelección.' },
  { code: 'SWE', name: 'Suecia', confederation: 'uefa', stance: 'en-contra', since: '2026-08-03', note: 'Su junta acordó en sesión extraordinaria oponerse a la candidatura.' },
  { code: 'IRL', name: 'Irlanda', confederation: 'uefa', stance: 'en-contra', since: '2026-08-13', note: 'La FAI retiró la carta de apoyo que había entregado este año.' },
  { code: 'NZL', name: 'Nueva Zelanda', confederation: 'ofc', stance: 'en-contra', since: '2026-08-14', note: 'Retiró su apoyo y pidió una revisión independiente, dos días después de que su confederación apoyara a Infantino.' },

  // —— A favor. Seis firmaron una carta conjunta el 13 de agosto; México
  //    se había pronunciado una semana antes.
  { code: 'MEX', name: 'México', confederation: 'concacaf', stance: 'respalda', since: '2026-08-06', note: 'Apoyó a Infantino y fue la única de las 41 federaciones de la Concacaf ausente del comunicado regional.' },
  { code: 'QAT', name: 'Catar', confederation: 'afc', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes que expresan su respaldo total a Infantino.' },
  { code: 'LBN', name: 'Líbano', confederation: 'afc', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes.' },
  { code: 'EGY', name: 'Egipto', confederation: 'caf', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes.' },
  { code: 'MAR', name: 'Marruecos', confederation: 'caf', stance: 'respalda', since: '2026-08-13', note: 'Coanfitriona del Mundial 2030. Firmó la carta conjunta de seis federaciones árabes.' },
  { code: 'SDN', name: 'Sudán', confederation: 'caf', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes.' },
  { code: 'MRT', name: 'Mauritania', confederation: 'caf', stance: 'respalda', since: '2026-08-13', note: 'Firmó la carta conjunta de seis federaciones árabes.' },
];

export const BUCKET_LABEL: Record<Bucket, string> = {
  'declarada-en-contra': 'Se pronunciaron en contra',
  'bloque-en-contra': 'Su confederación pidió revisión',
  'bloque-respalda': 'Su confederación lo apoya',
  'declarada-respalda': 'Se pronunciaron a favor',
};

/** Short form for the map legend, where the column is narrow. */
export const BUCKET_SHORT: Record<Bucket, string> = {
  'declarada-en-contra': 'En contra, por su cuenta',
  'bloque-en-contra': 'Su confederación pidió revisión',
  'bloque-respalda': 'Su confederación lo apoya',
  'declarada-respalda': 'A favor, por su cuenta',
};

export type BucketTally = { bucket: Bucket; votes: number; codes: string[] };

/**
 * The four buckets, in a fixed order that runs from the hardest public
 * opposition to the hardest public support, so the bar reads as one
 * spectrum and never reorders under the reader between builds.
 *
 * A federation's own declaration outranks its confederation's position.
 * The silent buckets are computed as the confederation's vote count minus
 * whoever inside it has spoken, so the four always sum to 211 and no
 * federation is counted twice.
 */
export function buckets(): BucketTally[] {
  const spoken = new Map(FEDERATIONS.map(f => [f.code, f]));
  const order: Bucket[] = ['declarada-en-contra', 'bloque-en-contra', 'bloque-respalda', 'declarada-respalda'];

  const declared = (stance: FederationStance['stance']) =>
    FEDERATIONS.filter(f => f.stance === stance).map(f => f.code);

  const silent = (stance: Stance) =>
    CONFEDERATIONS.filter(c => c.stance === stance).reduce(
      (total, c) => total + c.votes - FEDERATIONS.filter(f => f.confederation === c.key && spoken.has(f.code)).length,
      0,
    );

  const counts: Record<Bucket, { votes: number; codes: string[] }> = {
    'declarada-en-contra': { votes: declared('en-contra').length, codes: declared('en-contra') },
    'bloque-en-contra': { votes: silent('en-contra'), codes: [] },
    'bloque-respalda': { votes: silent('respalda'), codes: [] },
    'declarada-respalda': { votes: declared('respalda').length, codes: declared('respalda') },
  };

  return order.map(bucket => ({ bucket, ...counts[bucket] }));
}

/** Confederations grouped by stance, for the roll call. */
export function byStance(stance: Stance): ConfederationStance[] {
  return CONFEDERATIONS.filter(c => c.stance === stance);
}

/** Federations whose own position contradicts their confederation's. */
export function defectors(): FederationStance[] {
  return FEDERATIONS.filter(f => {
    const bloc = CONFEDERATIONS.find(c => c.key === f.confederation);
    return bloc && bloc.stance !== f.stance;
  });
}

/** The most recent dated movement on the board, for the module's "as of". */
export function lastMovement(): string {
  return [...CONFEDERATIONS, ...FEDERATIONS].map(entry => entry.since).sort().reverse()[0];
}

// Two invariants worth failing loudly on, both dev-only so a typo never
// takes production down over a legend.
//
//   1. The six confederations must account for FIFA's whole electorate.
//   2. The four buckets must too, which is the stronger check: it also
//      catches a federation filed under a confederation it doesn't belong
//      to, or listed twice, either of which would double-count a vote.
if (process.env.NODE_ENV !== 'production') {
  const confederationSum = CONFEDERATIONS.reduce((total, c) => total + c.votes, 0);
  if (confederationSum !== ELECTION.totalVotes) {
    console.error(`[fifa-election] las confederaciones suman ${confederationSum}, la FIFA tiene ${ELECTION.totalVotes}`);
  }
  const bucketSum = buckets().reduce((total, b) => total + b.votes, 0);
  if (bucketSum !== ELECTION.totalVotes) {
    console.error(`[fifa-election] los cuatro grupos suman ${bucketSum}, la FIFA tiene ${ELECTION.totalVotes}`);
  }
  const codes = FEDERATIONS.map(f => f.code);
  const dupes = codes.filter((code, i) => codes.indexOf(code) !== i);
  if (dupes.length) console.error(`[fifa-election] federaciones repetidas: ${dupes.join(', ')}`);
}
