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
  //
  // Both carry `self`, the way a real Step 0 run on a draft does. Without it
  // these cases decay the moment their own story is published: they were
  // written before the two articles went live, passed, and started failing at
  // 71% against the very articles the queries describe. That is the scorer
  // being right, so the fix belongs in the case, not the threshold. Excluding
  // the story itself keeps what is actually under test — that a piece whose
  // only match in the archive is itself comes back clean — and does not weaken
  // the regression, because the rows the pre-fix scorer invented (a Bundesliga
  // financing, Pau Gasol, Liga MX, the Seahawks sale) are not the self row.
  {
    name: 'Novel actors, none in the archive, must not read as a duplicate',
    query: 'CME lanza futuros sobre el desempeño de equipos de la NHL',
    self: 'https://www.reuters.com/sports/cme-takes-nhl-team-performance-into-futures-market-2026-08-11/',
    maxHits: 1,
    maxScore: 0.45,
  },
  {
    name: 'Novel actors, long query, must not read as a duplicate',
    query: 'Daniel Levy incumple el plazo de la emisión de acciones del Tottenham Hotspur',
    self: 'https://www.bloomberg.com/news/articles/2026-08-11/tottenham-hotspur-s-levy-said-to-miss-deadline-for-share-issue?srnd=phx-business-of-sports',
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
  const hits = rank(c.query, index, { self: c.self });
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

// ---------------------------------------------------------------------------
// One case that does NOT read the live archive, because every case above does.
//
// The archive-backed novel-actor cases decay by construction: they assert that
// a story about actors the corpus has never carried scores low, and publishing
// that story puts the actors in the corpus. Measured immediately after the
// CME/NHL and Tottenham pieces went live, both cases stopped failing against
// the pre-fix scorer, i.e. they had quietly lost the regression they were added
// for while still reporting ok.
//
// The invariant belongs to `score()`, not to the corpus, so it is pinned here
// against a fixed synthetic index that no publish run can move: a query whose
// distinctive terms are all absent must not come back as a duplicate off the
// one generic word it happens to share.
const SYNTHETIC = [
  { id: 'a', title: 'La Bundesliga negocia mil millones de euros con un fondo',
    excerpt: 'El acuerdo daria al fondo una participacion en los derechos comerciales.', teaser: '' },
  { id: 'b', title: 'La liga femenil estrena identidad y formato',
    excerpt: 'El torneo cambia de nombre y suma patrocinadores para el siguiente ciclo.', teaser: '' },
  { id: 'c', title: 'El plazo para presentar ofertas por los derechos vence el viernes',
    excerpt: 'Tres cadenas siguen en la puja por el paquete completo.', teaser: '' },
];
const synthIndex = buildIndex(SYNTHETIC.map(r => ({ ...r, date: '2026-01-01', source: 'x', publication: 'X', substack_url: '', source_url: `https://example.test/${r.id}` })));
// Every distinctive token here (zzyrix, kappler, vondel) is absent from that
// corpus; only "plazo" and "derechos" are shared, and sharing a generic word
// with an article is not evidence of being the same story.
const synthQuery = 'Zzyrix Kappler incumple el plazo de la emision de derechos del Vondel United';
const synthHits = rank(synthQuery, synthIndex);
const synthTop = synthHits.length ? synthHits[0].s : 0;
const synthOk = synthTop < 0.45;
if (!synthOk) failed++;
console.log(`${synthOk ? '  ok  ' : 'FAIL  '}Unseen query terms must count in the denominator (sin archivo)`);
if (!synthOk || verbose) {
  console.log(`        query: ${synthQuery}`);
  console.log(`        top score ${(synthTop * 100).toFixed(0)}% (máximo 45%), ${synthHits.length} filas`);
}
const TOTAL = CASES.length + 1;

console.log(`\n${TOTAL - failed}/${TOTAL} casos pasan`);
process.exit(failed ? 1 : 0);
