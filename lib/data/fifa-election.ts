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
//   sin-definir           declined to take a position, OR signalled doubt
//                         publicly without declaring either way
//
// A federation's OWN declaration always wins over its confederation's,
// which is what puts Mexico (Concacaf asked for a review, the FMF backed
// Infantino) and New Zealand (the OFC backed him, NZF withdrew) on the
// opposite side from their own bloc. Only 34 of the 210 have spoken for
// themselves; the rest are inheriting a position, which is the single
// most useful thing this board shows.
//
// UPDATED 2026-08-24. The board had stood at its 14 ago state for ten days
// while the story kept moving: fourteen more federations had declared, and
// the two loudest of them are FIFA Council members, not small associations.
// The headline split barely moved (82 / 127 / 1 -> 82 / 125 / 3) BECAUSE
// almost every new declaration came from inside a bloc already counted on
// that side. That is the point the board exists to make: the fight is not
// currently moving votes between camps, it is converting inherited
// positions into declared ones, and a board that only showed the two-way
// split would have reported "nothing happened" through the most active
// fortnight of the campaign.
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
  /** Nominations close. 23:59 CET, and a candidacy needs five member
   *  associations to endorse it. */
  candidaciesClose: '2026-11-18',
  /** The 77th FIFA Congress votes. */
  vote: '2027-03-18',
  /** Where it votes. Worth naming: Morocco is one of the six Arab
   *  federations that signed the joint letter backing Infantino, so the
   *  ballot is being held in a house that has already declared. */
  venue: 'Rabat, Marruecos',
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
    // The single softest number on this board, and it is the second
    // biggest. CAF's official line is unanimity; a source inside the 7 ago
    // meeting told The Guardian that only 4 of its 21 exco members
    // declared publicly and the rest stayed silent, and Motsepe himself
    // said on 13 ago that Infantino's fate "must go to an election" —
    // procedural, not an endorsement. Left as `respalda` because that IS
    // the confederation's stated position and this column records stated
    // positions; the qualifier belongs in the note, not in a fudged stance.
    note: 'Su comité ejecutivo reconfirmó por unanimidad el apoyo a la reelección para 2027-2031, según la propia CAF. En esa reunión solo 4 de sus 21 miembros lo declararon en público.',
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
// Bhutan, the Philippines, Grenada, St Kitts and Nevis, Saudi Arabia); for
// the 2026-08-24 additions, each association's own statement where it
// published one (Gibraltar), otherwise a wire report corroborated by a
// second independent tracker.
//
// EVERY ENTRY NEEDS A DATE, and that is what keeps some names off this
// list rather than editorial caution. The Netherlands and several African
// and Asian associations appear on published trackers with a position and
// no date attached; Denmark's only dated statement is its 2022 OneLove
// non-endorsement, which is a position on a different fight. They are
// listed in docs/TODO.md §6 as a dated-source backlog, not silently
// dropped. `since` is load-bearing: it drives lastMovement(), which is the
// module's own honesty check against going stale.
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
  { code: 'DJI', name: 'Yibuti', confederation: 'caf', stance: 'respalda', since: '2026-08-02', note: 'Respaldó la reelección cinco días antes de que la CAF fijara postura como bloque.' },
  { code: 'ARG', name: 'Argentina', confederation: 'conmebol', stance: 'respalda', since: '2026-08-07', note: 'Respaldó a Infantino el mismo día que México, dentro de una Conmebol que ya lo apoyaba.' },

  // —— En contra. Todas dentro de la UEFA, salvo Nueva Zelanda.
  { code: 'FIN', name: 'Finlandia', confederation: 'uefa', stance: 'en-contra', since: '2026-07-30', note: 'De las primeras en quitarle el apoyo.' },
  { code: 'WAL', name: 'Gales', confederation: 'uefa', stance: 'en-contra', since: '2026-08-02', note: 'La primera federación en anunciar públicamente que le retiraba el apoyo.' },
  { code: 'SRB', name: 'Serbia', confederation: 'uefa', stance: 'en-contra', since: '2026-08-03', note: 'Retiró el apoyo que había firmado el 25 de mayo.' },
  { code: 'ENG', name: 'Inglaterra', confederation: 'uefa', stance: 'en-contra', since: '2026-08-03', note: 'La FA retiró formalmente su apoyo a la reelección.' },
  { code: 'SWE', name: 'Suecia', confederation: 'uefa', stance: 'en-contra', since: '2026-08-03', note: 'Su junta acordó en sesión extraordinaria oponerse a la candidatura.' },
  { code: 'IRL', name: 'Irlanda', confederation: 'uefa', stance: 'en-contra', since: '2026-08-13', note: 'La FAI retiró la carta de apoyo que había entregado este año.' },
  { code: 'NZL', name: 'Nueva Zelanda', confederation: 'ofc', stance: 'en-contra', since: '2026-08-14', note: 'Retiró su apoyo y pidió una revisión independiente, dos días después de que su confederación apoyara a Infantino.' },
  // —— Added 2026-08-24. Nine of these eleven are UEFA, so they move from
  // `bloque-en-contra` to `declarada-en-contra` and the two-way split does
  // not budge. What changes is the weight of the declaration: Hungary and
  // Montenegro are FIFA COUNCIL members, and Jordan sits inside an AFC that
  // signed the letter but had not produced a named federation until now.
  { code: 'DEU', name: 'Alemania', confederation: 'uefa', stance: 'en-contra', since: '2026-07-15', note: 'Declinó respaldar la reelección dos semanas antes de que se filtrara el plan de venta, es decir, por razones anteriores a la crisis.' },
  { code: 'GRC', name: 'Grecia', confederation: 'uefa', stance: 'en-contra', since: '2026-08-04', note: 'Retiró su apoyo en la primera semana de la ola europea.' },
  { code: 'JOR', name: 'Jordania', confederation: 'afc', stance: 'en-contra', since: '2026-08-04', note: 'El príncipe Ali bin Al Hussein acusó a la FIFA de presionar federaciones y rechazó la candidatura. Primera federación de la AFC en pronunciarse por su cuenta.' },
  { code: 'NOR', name: 'Noruega', confederation: 'uefa', stance: 'en-contra', since: '2026-08-07', note: 'No retiró el apoyo: pidió la renuncia. Lise Klaveness dijo que la federación perdió la confianza y que no hay vuelta atrás.' },
  { code: 'HRV', name: 'Croacia', confederation: 'uefa', stance: 'en-contra', since: '2026-08-07', note: 'Retiró su apoyo.' },
  { code: 'ALB', name: 'Albania', confederation: 'uefa', stance: 'en-contra', since: '2026-08-07', note: 'Retiró su apoyo.' },
  { code: 'HUN', name: 'Hungría', confederation: 'uefa', stance: 'en-contra', since: '2026-08-19', note: 'Sándor Csányi, presidente de la federación y vicepresidente de la FIFA, le retiró el apoyo por carta. Señaló la salida de Kevin Lamour como la gota que derramó el vaso.' },
  { code: 'MNE', name: 'Montenegro', confederation: 'uefa', stance: 'en-contra', since: '2026-08-20', note: 'Dejan Savićević, presidente de la federación y miembro del Consejo de la FIFA desde 2017, citó una falta grave de comunicación y transparencia.' },
  { code: 'ISR', name: 'Israel', confederation: 'uefa', stance: 'en-contra', since: '2026-08-20', note: 'Retiró su apoyo el mismo día que Montenegro.' },
  { code: 'GIB', name: 'Gibraltar', confederation: 'uefa', stance: 'en-contra', since: '2026-08-24', note: 'Retiró el respaldo a la candidatura por falta de transparencia y consulta en el plan, y por las circunstancias de la salida de Kevin Lamour.' },

  // —— Sin definir. No es silencio: es haber declinado tomar postura.
  // Estados Unidos y Canadá NO están aquí (decisión editorial, 2026-08-15):
  // firmaron el reclamo de gobernanza de la Concacaf, así que cuentan con
  // su confederación como el resto del bloque. La distinción que hace la
  // BBC entre respaldar ese texto y pronunciarse sobre Infantino es real,
  // pero es materia de una línea de prosa, no de una casilla del mapa.
  { code: 'SAU', name: 'Arabia Saudita', confederation: 'afc', stance: 'sin-definir', since: '2026-08-11', note: 'Sede del Mundial 2034 y todavía sin postura pública. Renueva su propia dirigencia en agosto.' },
  // These two are the reason the bucket's definition was widened above.
  // Both signalled publicly that they may not back him without formally
  // declaring, which is not silence and is not a position either. Leaving
  // them inside UEFA's 55 would have counted a federation that has said out
  // loud it is wavering as if it were still marching with its bloc, and
  // that overstatement is exactly what this board exists to prevent. It is
  // the only change in this pass that moves the headline: 127 -> 125.
  { code: 'ROU', name: 'Rumania', confederation: 'uefa', stance: 'sin-definir', since: '2026-08-12', note: 'Indicó que podría no respaldar la reelección, sin declararse formalmente en contra.' },
  { code: 'CZE', name: 'República Checa', confederation: 'uefa', stance: 'sin-definir', since: '2026-08-12', note: 'Indicó que podría no respaldar la reelección, sin declararse formalmente en contra.' },
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
