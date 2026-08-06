// Checks a story against everything already published, before it gets drafted.
//
// Playbook runs two ingest funnels (publish-newsletter for the Substack
// editions, publish-sourced-article for third-party links) plus four products
// that legitimately cover overlapping ground. The DB's unique index on
// articles.sourceUrl only catches the same URL being run twice; it cannot see
// that a Reuters link and an Industry Shots item are the same story, or that
// Infinitas already published what a digest is about to repeat.
//
// Usage:
//   node scripts/find-duplicates.mjs "Netflix pagará US$200m por Brasil 2027"
//   node scripts/find-duplicates.mjs --draft <path-to-draft.json>
//
// Scores every published article against the candidate with IDF-weighted term
// overlap over title + excerpt + teaser, plus an explicit boost when a money
// figure or percentage matches, since two pieces quoting the same number are
// usually the same story. Output is advisory: it names candidates and how
// close they are, the editorial call is the protocol's, not the script's.

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const LIKELY = 0.45; // treat as the same story unless proven otherwise
// Deliberately noisy: a genuine follow-up (the Liga F rights auction against
// the Gasol investment) scores 23, so the floor sits below it and some
// unrelated pairs come with it. Opening a candidate costs seconds; missing a
// duplicate costs a published article.
const REVIEW = 0.22;

// Spanish function words plus the vocabulary every sports-business headline
// carries, which would otherwise match everything against everything.
const STOP = new Set(
  `para por con sin sobre entre desde hasta como que del los las une una unos unas
   este esta estos estas ese esa eso aquel cuando donde cual cuales quien quienes
   mas menos muy ya todo toda todos todas otro otra otros otras solo solamente
   ser estar tiene tienen hacer hace segun tras ante bajo cabe contra hacia
   millones millon mil miles usd mxn eur dolares euros pesos por-ciento
   playbook deporte deportivo deportiva negocio negocios mercado futbol
   liga club clubes equipo equipos temporada nuevo nueva anos ano`
    .split(/\s+/)
    .filter(Boolean),
);

const strip = s =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function tokens(text) {
  return [
    ...new Set(
      strip(text)
        .replace(/[^a-z0-9%$€ ]+/g, ' ')
        .split(/\s+/)
        .filter(t => t.length >= 4 && !STOP.has(t) && !/^\d+$/.test(t)),
    ),
  ];
}

// "US$205 millones", "€55M", "90%", "US$3,000 millones" -> a comparable key.
function figures(text) {
  const out = new Set();
  const t = strip(text).replace(/[,\s](?=\d{3}\b)/g, '');
  for (const m of t.matchAll(/(?:us\$|mx\$|€|\$)\s?([\d.]+)\s?(m|bn|millones|mil millones)?/g)) {
    const n = parseFloat(m[1]);
    if (!Number.isNaN(n)) out.add(`money:${n}${/bn|mil millones/.test(m[2] || '') ? 'bn' : ''}`);
  }
  for (const m of t.matchAll(/([\d.]+)\s?%/g)) out.add(`pct:${parseFloat(m[1])}`);
  return [...out];
}

function score(queryTerms, queryFigs, docTerms, docFigs, idf) {
  const shared = queryTerms.filter(t => docTerms.includes(t));
  if (!shared.length && !queryFigs.some(f => docFigs.includes(f))) return 0;
  const num = shared.reduce((s, t) => s + (idf[t] || 0), 0);
  const norm =
    Math.sqrt(queryTerms.reduce((s, t) => s + (idf[t] || 0), 0)) *
    Math.sqrt(docTerms.reduce((s, t) => s + (idf[t] || 0), 0));
  let sc = norm ? num / norm : 0;
  const figHit = queryFigs.filter(f => docFigs.includes(f)).length;
  if (figHit) sc = Math.min(1, sc + 0.18 * figHit); // same number, very likely same story
  return sc;
}

async function main() {
  const draftFlag = process.argv.indexOf('--draft');
  const queries = [];
  if (draftFlag > -1) {
    const arts = JSON.parse(readFileSync(process.argv[draftFlag + 1], 'utf8'));
    for (const a of arts) queries.push({ label: a.title, text: `${a.title} ${a.excerpt || ''}`, self: a.sourceUrl });
  } else {
    const q = process.argv.slice(2).join(' ').trim();
    if (!q) {
      console.error('usage: node scripts/find-duplicates.mjs "<titular o tema>" | --draft <draft.json>');
      process.exit(2);
    }
    queries.push({ label: q, text: q });
  }

  const sql = neon(process.env.POSTGRES_URL);
  const rows = await sql`
    select id, title, excerpt, teaser, date, source, publication, substack_url, source_url
    from articles where status = 'published'
  `;

  const docs = rows.map(r => ({
    ...r,
    terms: tokens(`${r.title} ${r.excerpt || ''} ${r.teaser || ''}`),
    figs: figures(`${r.title} ${r.excerpt || ''} ${r.teaser || ''}`),
  }));

  const df = {};
  for (const d of docs) for (const t of d.terms) df[t] = (df[t] || 0) + 1;
  const idf = {};
  for (const t of Object.keys(df)) idf[t] = Math.log(1 + docs.length / df[t]);

  for (const q of queries) {
    const qt = tokens(q.text);
    const qf = figures(q.text);
    const hits = docs
      .filter(d => !q.self || d.source_url !== q.self) // never match a draft against itself
      .map(d => ({ d, s: score(qt, qf, d.terms, d.figs, idf) }))
      .filter(h => h.s >= REVIEW)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5);

    console.log(`\n── ${q.label.slice(0, 78)}`);
    if (!hits.length) {
      console.log('   sin coincidencias · vía libre');
      continue;
    }
    for (const { d, s } of hits) {
      const verdict = s >= LIKELY ? 'MISMA HISTORIA' : 'revisar';
      console.log(
        `   ${(s * 100).toFixed(0).padStart(3)}%  ${verdict.padEnd(14)} ${d.date}  ${d.source.padEnd(22)} ${d.title.slice(0, 58)}`,
      );
      console.log(`        /articulo?id=${d.id}`);
    }
    console.log('   → aplica el protocolo de solapamiento (Paso 0 de la skill) antes de redactar.');
  }
}

main();
