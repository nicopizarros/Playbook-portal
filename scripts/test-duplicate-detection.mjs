// Regression tests for scripts/find-duplicates.mjs against the real archive.
//
// The overlap check is the only thing standing between a running story and a
// second article about the same event, and on 2026-08-11 it cleared a story
// that had 17 prior articles and a next-day predecessor. A scorer that fails
// silently needs a test that fails loudly, so this file pins the behaviour to
// named cases taken from what Playbook has actually published.
//
//   node scripts/test-duplicate-detection.mjs          # pass/fail summary
//   node scripts/test-duplicate-detection.mjs -v       # every case's ranking
//
// Needs POSTGRES_URL, because the cases are keyed to live article ids: the
// point is to test against the corpus the scorer will really see, including
// its term-frequency distribution, which is what broke last time.

import { neon } from '@neondatabase/serverless';
import { buildIndex, rank } from './find-duplicates.mjs';

// Each case is a query an editor could plausibly type at Step 0, plus the
// articles that must come back. `mustFind` is recall: missing one is the
// failure that publishes a duplicate. `mustNotFind` is precision: the check is
// deliberately noisy, but it still has to be worth reading.
const CASES = [
  {
    name: 'FIFA/Trump follow-up, headline-length query (the 2026-08-11 miss)',
    query:
      'Trump respalda a Infantino en plena crisis de gobernanza de FIFA tras la carta conjunta de UEFA, Concacaf y AFC',
    mustFind: [
      'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
      'mexico-respalda-a-infantino-el-mismo-dia-en-que-la-uefa-reitera-que-no-confia-en-el',
    ],
  },
  {
    name: 'FIFA/Trump follow-up, terse query',
    query: 'Trump defiende a Infantino',
    mustFind: ['mexico-respalda-a-infantino-el-mismo-dia-en-que-la-uefa-reitera-que-no-confia-en-el'],
  },
  {
    name: 'Single proper noun must not come back empty',
    query: 'Infantino',
    mustFind: ['concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional'],
  },
  {
    name: 'FFE privatisation plan, the event four articles cover',
    query: 'FIFA quiere vender una participación del Mundial a inversionistas privados',
    mustFind: [
      'infantino-propone-vender-el-20-del-mundial-en-un-plan-de-20-000-millones-de-dolares',
      'uefa-vota-unanime-boicotear-el-mundial-si-la-fifa-vende-participacion-a-inversionistas-privados',
    ],
  },
  {
    name: 'Liga F / Gasol, the follow-up the script was tuned on',
    query: 'La Liga F abre la puja por sus derechos de TV con Pau Gasol como socio',
    mustFind: ['pau-gasol-pone-55m-en-la-liga-f-y-una-cuarta-parte-de-los-clubes-dice-que-no'],
  },
  {
    name: 'Liga Femenil BBVA, the same event across two products',
    query: 'La Liga Femenil BBVA estrena identidad y formato rumbo al Apertura 2026',
    mustFind: ['que-esta-construyendo-la-liga-femenil-bbva-rumbo-al-apertura-2026'],
  },
  {
    name: 'Seahawks record sale, two articles four days apart',
    query: 'Los Seahawks se venden en una operación récord de la NFL',
    mustFind: ['seahawks-venta-record-nfl', 'seahawks-khosla-record-nfl'],
  },
  {
    name: 'Three-letter league acronym must be a usable term',
    query: 'La MLS nombra a Larry Berg como comisionado',
    mustFind: ['larry-berg-sera-el-proximo-comisionado-de-la-mls-en-relevo-de-don-garber'],
  },
  {
    name: 'Apollo in sport, same investor different property',
    query: 'Apollo Sports Capital inyecta capital en los Yankees',
    mustFind: ['bundesliga-negocia-mil-millones-de-euros-con-apollo-sports-capital'],
  },
  {
    name: 'Unrelated story stays clean (precision floor)',
    query: 'Wimbledon cambia el proveedor de pelotas para la edición 2027',
    mustNotFind: [
      'concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional',
      'el-mundial-le-deja-a-fifa-ingresos-record-de-us-15-000-millones',
    ],
    maxHits: 2,
  },

  // A story about actors the archive has never carried is this funnel's normal
  // input — a wire link is usually the first time Playbook touches the company.
  // Those queries have almost no tokens the corpus knows, which is exactly the
  // shape that broke on 2026-08-11: `score` left unseen terms out of its
  // denominator, so coverage was computed over the one generic word that did
  // match and came back pinned at 100% MISMA HISTORIA. Both queries below did
  // that against wholly unrelated articles (CME/NHL -> a Bundesliga financing;
  // Levy/Tottenham -> Infantino, Liga MX and the Seahawks sale).
  //
  // The reason it shipped is that the precision case above only asserted two
  // hand-picked ids were absent, which a scorer returning eight OTHER spurious
  // rows passes comfortably. `maxHits` and `maxScore` are the assertions that
  // can actually see it: bound the noise, don't enumerate it.
  {
    name: 'Novel actors, none in the archive, must not read as a duplicate',
    query: 'CME lanza futuros sobre el desempeño de equipos de la NHL',
    maxHits: 1,
    maxScore: 0.45,
  },
  {
    name: 'Novel actors, long query, must not read as a duplicate',
    query: 'Daniel Levy incumple el plazo de la emisión de acciones del Tottenham Hotspur',
    maxHits: 1,
    maxScore: 0.45,
  },
];

const verbose = process.argv.includes('-v') || process.argv.includes('--verbose');

const sql = neon(process.env.POSTGRES_URL);
const rows = await sql`
  select id, title, excerpt, teaser, date, source, publication, substack_url, source_url
  from articles where status = 'published'
`;
const index = buildIndex(rows);

let failed = 0;
for (const c of CASES) {
  const hits = rank(c.query, index);
  const ids = hits.map(h => h.d.id);
  const missing = (c.mustFind || []).filter(id => !ids.includes(id));
  const leaked = (c.mustNotFind || []).filter(id => ids.includes(id));
  // Bounds, not enumerations. A named id can only catch the spurious row you
  // already thought of; the failure that shipped was eight rows nobody listed.
  const tooMany = c.maxHits !== undefined && hits.length > c.maxHits ? hits.length : 0;
  const tooHigh =
    c.maxScore !== undefined && hits.length && hits[0].s >= c.maxScore ? hits[0] : null;
  const ok = !missing.length && !leaked.length && !tooMany && !tooHigh;
  if (!ok) failed++;

  console.log(`${ok ? '  ok  ' : 'FAIL  '}${c.name}`);
  if (verbose || !ok) {
    console.log(`        query: ${c.query}`);
    if (!hits.length) console.log('        (no hits)');
    for (const { d, s, why } of hits.slice(0, 6)) {
      const want = (c.mustFind || []).includes(d.id) ? ' <- expected' : '';
      console.log(`        ${(s * 100).toFixed(0).padStart(3)}%  ${d.date}  ${d.id.slice(0, 62)}${want}`);
      if (why) console.log(`              ${why}`);
    }
    for (const id of missing) console.log(`        MISSING: ${id}`);
    for (const id of leaked) console.log(`        LEAKED:  ${id}`);
    if (tooMany) console.log(`        TOO NOISY: ${tooMany} filas, máximo ${c.maxHits}`);
    if (tooHigh)
      console.log(
        `        TOO HIGH: ${(tooHigh.s * 100).toFixed(0)}% en ${tooHigh.d.id.slice(0, 52)} (máximo ${(c.maxScore * 100).toFixed(0)}%)`,
      );
  }
}

console.log(`\n${CASES.length - failed}/${CASES.length} casos pasan`);
process.exit(failed ? 1 : 0);
