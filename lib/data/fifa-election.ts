// ———————————————————————————————————— El tablero de la elección FIFA
// Where each confederation stands on Gianni Infantino ahead of the 2027
// FIFA Congress, assembled from Playbook's own published coverage of the
// FIFA Forward Enterprise crisis (July–August 2026). Every entry carries
// the date it became true and the article that reported it, so the module
// is auditable against the archive rather than being a set of assertions
// somebody typed once.
//
// This is the SINGLE SOURCE for the stance data. The homepage rail module
// (components/home/ElectionBoard.tsx) reads it. An article's own `Mapa:`
// device does NOT read it — that device takes its codes from the body
// text, by design, because an article is a record of one moment and must
// keep saying what it said on the day it was published. Keeping the two
// separate is deliberate: this file moves, the archive doesn't.
//
// Vote weights are FIFA MEMBER ASSOCIATIONS, not confederation rosters.
// The six confederations have 218 members between them and FIFA has 211;
// nine associations play in a confederation without holding a FIFA seat
// and therefore never vote. scripts/build-world-map.ts owns that list and
// asserts the partition; the numbers here must agree with it, which the
// test below the data enforces at module load in development.

export type Stance = 'respalda' | 'en-contra' | 'sin-pronunciarse';

export type ConfederationStance = {
  /** Frame key in lib/data/world-map.json, so the two can be joined. */
  key: 'uefa' | 'afc' | 'concacaf' | 'caf' | 'conmebol' | 'ofc';
  name: string;
  /** FIFA member associations, i.e. votes in the Congress. */
  votes: number;
  stance: Stance;
  /** When the position became public (YYYY-MM-DD). */
  since: string;
  /** What it actually said. Kept precise: several of these are narrower
   *  than "backs him" or "wants him out", and the difference is the story. */
  note: string;
  /** The Playbook article that reported it. */
  articleId: string;
};

/** A federation whose own position contradicts its confederation's. */
export type Defector = {
  code: string; // ISO3, joinable against world-map.json
  name: string;
  confederation: ConfederationStance['key'];
  stance: Stance;
  since: string;
  note: string;
  articleId: string;
};

export const ELECTION = {
  /** Nominations close. */
  candidaciesClose: '2026-11-18',
  /** The Congress votes. */
  vote: '2027-03',
  totalVotes: 211,
} as const;

// Ordered by weight, which is also roughly the order they declared.
export const CONFEDERATIONS: ConfederationStance[] = [
  {
    key: 'uefa',
    name: 'UEFA',
    votes: 55,
    stance: 'en-contra',
    since: '2026-07-30',
    note: 'Votó por unanimidad no participar en torneos de la FIFA mientras siguiera el plan, y el 10 de agosto firmó la carta que exige una revisión independiente.',
    articleId: 'uefa-vota-unanime-boicotear-el-mundial-si-la-fifa-vende-participacion-a-inversionistas-privados',
  },
  {
    key: 'caf',
    name: 'CAF',
    votes: 54,
    stance: 'respalda',
    since: '2026-08-10',
    note: 'Sus 54 federaciones votaron por unanimidad a favor de la reelección.',
    articleId: 'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
  },
  {
    key: 'afc',
    name: 'AFC',
    votes: 46,
    stance: 'en-contra',
    since: '2026-08-10',
    note: 'Firmó con la UEFA y la Concacaf la carta abierta que pide que la revisión quede en manos de un tercero independiente.',
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
    note: 'Celebró el retiro del plan y reconoció lo que creció el futbol de la región bajo la conducción de la FIFA. No menciona la reelección.',
    articleId: 'oceania-sostiene-a-infantino-y-nueva-zelanda-rompe-filas',
  },
  {
    key: 'conmebol',
    name: 'Conmebol',
    votes: 10,
    stance: 'respalda',
    since: '2026-08-06',
    note: 'Criticó las acciones unilaterales de la FIFA sin retirarle el respaldo a Infantino.',
    articleId: 'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
  },
];

// The camps do not respect confederation borders, and that is the running
// read of this story (editorial directive, 2026-08-10). These are the
// federations that have said something their own bloc did not.
export const DEFECTORS: Defector[] = [
  {
    code: 'MEX',
    name: 'México',
    confederation: 'concacaf',
    stance: 'respalda',
    since: '2026-08-06',
    note: 'Respaldó el liderazgo de Infantino y fue la única de las 41 federaciones de la Concacaf ausente del comunicado regional.',
    articleId: 'mexico-respalda-a-infantino-el-mismo-dia-en-que-la-uefa-reitera-que-no-confia-en-el',
  },
  {
    code: 'QAT',
    name: 'Catar',
    confederation: 'afc',
    stance: 'respalda',
    since: '2026-08-10',
    note: 'Sostiene a Infantino dentro de una AFC que firmó en contra.',
    articleId: 'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
  },
  {
    code: 'ARE',
    name: 'Emiratos',
    confederation: 'afc',
    stance: 'respalda',
    since: '2026-08-10',
    note: 'Sostiene a Infantino dentro de una AFC que firmó en contra.',
    articleId: 'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
  },
  {
    code: 'NZL',
    name: 'Nueva Zelanda',
    confederation: 'ofc',
    stance: 'en-contra',
    since: '2026-08-14',
    note: 'Retiró su apoyo a la candidatura y pidió una revisión independiente, dos días después de que su confederación cerrara con Infantino.',
    articleId: 'oceania-sostiene-a-infantino-y-nueva-zelanda-rompe-filas',
  },
];

export const STANCE_LABEL: Record<Stance, string> = {
  respalda: 'Respaldan a Infantino',
  'en-contra': 'Piden una revisión independiente',
  'sin-pronunciarse': 'Sin pronunciarse',
};

export type Tally = { stance: Stance; votes: number; bodies: number; share: number };

/**
 * Votes and confederations per camp, in a fixed order so the bar never
 * reorders under the reader between builds.
 *
 * Counted at CONFEDERATION level: a defector is one federation inside a
 * bloc that voted the other way, and folding it into the tally would
 * assert a discipline nobody has tested. The board shows the blocs; the
 * defectors are listed beside it as the exceptions they are. This is the
 * same split the article map draws.
 */
export function tally(): Tally[] {
  const order: Stance[] = ['en-contra', 'respalda', 'sin-pronunciarse'];
  return order.map(stance => {
    const bodies = CONFEDERATIONS.filter(c => c.stance === stance);
    const votes = bodies.reduce((sum, c) => sum + c.votes, 0);
    return {
      stance,
      votes,
      bodies: bodies.length,
      share: Math.round((votes / ELECTION.totalVotes) * 1000) / 10,
    };
  });
}

/** The most recent dated movement on the board, for the module's "as of". */
export function lastMovement(): string {
  return [...CONFEDERATIONS, ...DEFECTORS]
    .map(entry => entry.since)
    .sort()
    .reverse()[0];
}

// The one invariant worth failing loudly on: the six confederations must
// account for FIFA's whole electorate exactly once. A stance edit that
// also fat-fingers a vote count would otherwise ship a bar that silently
// doesn't add up, which is the single thing this module exists to get
// right. Dev-only so a typo never takes production down over a legend.
if (process.env.NODE_ENV !== 'production') {
  const sum = CONFEDERATIONS.reduce((total, c) => total + c.votes, 0);
  if (sum !== ELECTION.totalVotes) {
    console.error(
      `[fifa-election] las confederaciones suman ${sum} votos, la FIFA tiene ${ELECTION.totalVotes}`,
    );
  }
  for (const defector of DEFECTORS) {
    const bloc = CONFEDERATIONS.find(c => c.key === defector.confederation);
    if (bloc && bloc.stance === defector.stance) {
      console.error(
        `[fifa-election] ${defector.name} coincide con ${bloc.name}: ya no es una excepción`,
      );
    }
  }
}
