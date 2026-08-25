// Replays the 2026-07-28 Liga Femenil BBVA double-publish against the gate in
// scripts/publish-newsletter.ts, plus the cases the gate must NOT block.
// Read-only: it calls findOverlaps directly and never inserts.
//
//   npx tsx --env-file=.env.local scripts/test-overlap-gate.ts
import { neon } from '@neondatabase/serverless';
import { findOverlaps } from './publish-newsletter';

const sql = neon(process.env.POSTGRES_URL!);

async function load(ids: string[]) {
  const rows = (await sql`
    select id, title, excerpt, teaser, date, source_url from articles where id = any(${ids})
  `) as Record<string, string>[];
  return ids.map(id => {
    const r = rows.find(x => x.id === id);
    if (!r) throw new Error(`fixture missing: ${id}`);
    // Shaped as an ArticleInput would arrive at publish time, with a sourceUrl
    // the archive has never seen so pass 1 cannot match the row against itself.
    return {
      title: r.title,
      excerpt: r.excerpt,
      teaser: r.teaser,
      bodyMarkdown: '',
      date: r.date,
      dateFormatted: r.date,
      sourceUrl: `https://example.test/replay/${id}`,
    } as never;
  });
}

async function main() {
  let failed = 0;
  const check = (name: string, ok: boolean, detail: string) => {
    if (!ok) failed++;
    console.log(`${ok ? '  ok  ' : 'FAIL  '}${name}\n        ${detail}`);
  };

  // 1. The real double-publish, replayed as one batch of two new articles.
  const pair = await load([
    'que-esta-construyendo-la-liga-femenil-bbva-rumbo-al-apertura-2026',
    'liga-femenil-bbva-estrena-identidad-y-formato-rumbo-al-apertura-2026',
  ]);
  // Replayed as of the day itself: neither row is in the archive yet, so only
  // pass 2 (batch against itself) can catch this. That is the case the unique
  // index on sourceUrl structurally cannot see.
  const LIGA_IDS = [
    'que-esta-construyendo-la-liga-femenil-bbva-rumbo-al-apertura-2026',
    'liga-femenil-bbva-estrena-identidad-y-formato-rumbo-al-apertura-2026',
  ];
  const both = await findOverlaps(pair, LIGA_IDS);
  check(
    'the Liga Femenil pair is refused when published together (batch pass only)',
    both.size >= 1,
    both.size ? [...both.values()][0] : 'NOT BLOCKED — the gate would have let it through again',
  );

  // 2. One of them alone, against an archive that already carries the other.
  const [one] = await load(['que-esta-construyendo-la-liga-femenil-bbva-rumbo-al-apertura-2026']);
  const solo = await findOverlaps([one]);
  check(
    'a story the archive already published is refused on its own',
    solo.size === 1,
    solo.size ? [...solo.values()][0] : 'NOT BLOCKED',
  );

  // 3. Two genuinely unrelated articles must pass — a gate that blocks
  //    everything is not a gate, and this is the accept case.
  const unrelated = await load([
    'jed-york-dueno-de-los-49ers-es-arrestado-en-ohio',
    'el-maracana-albergara-el-inaugural-y-la-final-del-mundial-femenil-2027',
  ]);
  // Give them titles the archive has never seen, so only their mutual
  // (non-)similarity is under test.
  const fresh = unrelated.map((a, i) => ({
    ...(a as unknown as Record<string, unknown>),
    title: i ? 'La NHL abre oficinas en Sao Paulo' : 'Un fondo noruego compra el 5% del Ajax',
    excerpt: i ? 'La liga instala su primera sede sudamericana.' : 'La operación valora al club en €400 millones.',
    teaser: '',
  })) as never[];
  const none = await findOverlaps(fresh);
  check('two unrelated new articles publish freely', none.size === 0, `${none.size} blocked (want 0)`);

  console.log(`\n${3 - failed}/3 overlap-gate cases pass`);
  process.exit(failed ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
