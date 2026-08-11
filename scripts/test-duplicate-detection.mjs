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
  const ok = !missing.length && !leaked.length;
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
  }
}

console.log(`\n${CASES.length - failed}/${CASES.length} casos pasan`);
process.exit(failed ? 1 : 0);
