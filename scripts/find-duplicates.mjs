// Checks a story against everything already published, before it gets drafted.
//
// Playbook runs two ingest funnels (publish-newsletter for the Substack
// editions, publish-sourced-article for third-party links) plus four products
// that legitimately cover overlapping ground. The DB's unique index on
// articles.sourceUrl only catches the same URL being run twice; it cannot see
// that a Reuters link and a Noticias item are the same story, or that
// Infinitas already published what a digest is about to repeat.
//
// Usage:
//   node scripts/find-duplicates.mjs "Netflix pagará US$200m por Brasil 2027"
//   node scripts/find-duplicates.mjs --draft <path-to-draft.json>
//   node scripts/test-duplicate-detection.mjs        # the regression cases
//
// Two independent channels decide what surfaces. The term channel scores
// IDF-weighted overlap over title + excerpt + teaser; the entity channel
// surfaces anything sharing enough rare proper nouns regardless of that score.
// Output is advisory: it names candidates and how close they are, the
// editorial call is the protocol's, not the script's.
//
// ---------------------------------------------------------------------------
// 2026-08-11: rewritten after the check cleared a story with 17 prior articles
// and a next-day predecessor. Three separate faults, all of which made the
// check worse exactly where it mattered most:
//
//   1. Cosine normalisation divided by sqrt(Σ query IDF), so every extra term
//      in the query grew the denominator whether or not it matched. A terse
//      "Trump defiende a Infantino" scored 25% while the full headline the
//      protocol tells you to paste scored 0. The documented usage was the
//      failing case.
//   2. IDF discounts terms that are common in the corpus, and on a running
//      story the identifying terms ARE common: "fifa" appears in 19 of 121
//      articles. The more Playbook had covered a story, the less able the
//      checker was to see it. That is the opposite of what a duplicate check
//      is for, and no threshold retune fixes it.
//   3. The token filter required 4+ characters, silently discarding every
//      three-letter league and confederation acronym (MLS, NFL, NBA, MLB,
//      AFC, PIF, WTA, ATP, COI) — some of the most identifying tokens in
//      sports-business copy.
//
// The fix for 1 is coverage instead of cosine, for 2 a separate entity channel
// that keys on rarity rather than being penalised by frequency, and for 3 a
// three-character floor with the Spanish three-letter function words added to
// the stop list.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const LIKELY = 0.45; // treat as the same story unless proven otherwise
// Deliberately noisy. Opening a candidate costs seconds; missing a duplicate
// costs a published article, so the floor sits well below "probably related".
const REVIEW = 0.22;

// How many candidates to print. A running story legitimately has many
// predecessors, so this is not 5 any more; when it truncates, it says so.
const MAX_HITS = 8;

// A term is DISTINCTIVE when it is rare enough to identify a story rather than
// describe the beat. The archive's df distribution is p50=1, p75=2, p90=3,
// p99=10, so a cut around 12% of the corpus separates the actors (infantino
// 12, uefa 8, concacaf 6, apollo 3, gasol 2) from the saga vocabulary around
// them (fifa 19, mexico 22, mundial 32).
const distinctiveCut = n => Math.max(4, Math.round(n * 0.12));

// Rarity ALONE cannot find entities in a corpus this small: measured against
// the live archive, "carta" (df 1), "respalda" (df 1) and "puja" (df 1) are
// rarer than "Infantino" (df 12). A rarity-only entity channel is really a
// rare-word channel, and it produced 4.7 spurious candidates per query in
// testing. Capitalisation is what separates an actor from an uncommon verb, so
// the channel keys on proper nouns and uses rarity only to filter them.
const CAPITALISED = /(?:^|[^\p{L}\p{N}])(\p{Lu}[\p{L}\p{N}]{2,})/gu;

// Capitalised, corpus-rare, and still not identifying: these are the generic
// halves of multi-word names. Measured against the live archive, df cannot
// separate them from real actors — "new" (2), "york" (3), "milan" (2) and
// "city" (6) sit alongside "gasol" (2), "seahawks" (2), "apollo" (3) and
// "concacaf" (6). Frequency is the wrong axis; what these share is that they
// are never the half of a name that identifies anything. Without this list a
// Yankees story matched a FIFA story on "New York" and a PSG story on
// "City, Milan".
const ENTITY_STOP = new Set(
  `new york city global sports sport capital group management enterprises holdings
   media network networks league leagues cup world worldwide international national
   united states america american nueva ciudad estados unidos europa europe north
   south east west san santa football soccer club association federation federacion
   the and for inc llc corp company partners ventures fund funds`
    .split(/\s+/)
    .filter(Boolean),
);

function properNouns(raw) {
  const out = new Set();
  for (const m of String(raw).matchAll(CAPITALISED)) {
    const t = strip(m[1]).replace(/[^a-z0-9]/g, '');
    if (t.length >= 3 && !STOP.has(t) && !ENTITY_STOP.has(t)) out.add(t);
  }
  return out;
}

// Two distinctive terms in common is the surface threshold, but two merely
// semi-rare ones should not be enough. Requiring their combined IDF to clear
// this keeps "uefa + concacaf" (5.83) in and a pair of df-10 coincidences
// (4.8) out.
//
// 5.5 -> 5.0 on 2026-08-11, when `score` stopped letting unseen query terms
// fall out of its denominator. That correction cost the term channel about a
// tenth of its score on long queries, and the FIFA/Trump recall case turned out
// to have been riding on the inflation: covQ 0.247 -> 0.217 against a 0.22
// floor. The right channel for it was always this one — "infantino" (df 12) and
// "uefa" (df 8) are the saga vocabulary the entity channel exists to rescue —
// and their combined 5.19 sat just under the floor. Measured over the archive,
// 5.0 restores that case with no change at all in spurious rows on novel-story
// queries (0.6 avg, 2 max, identical to 5.5), where lowering REVIEW to 0.20
// buys the same recall at 0.8. Prefer moving the channel that should have
// fired over loosening the one that shouldn't.
const ENTITY_IDF_FLOOR = 5.0;

// Spanish function words plus the vocabulary every sports-business headline
// carries, which would otherwise match everything against everything. The
// three-letter entries matter now that the token floor is 3.
const STOP = new Set(
  `para por con sin sobre entre desde hasta como que del los las une una unos unas
   este esta estos estas ese esa eso aquel cuando donde cual cuales quien quienes
   mas menos muy ya todo toda todos todas otro otra otros otras solo solamente
   ser estar tiene tienen hacer hace segun tras ante bajo cabe contra hacia
   millones millon mil miles usd mxn eur dolares euros pesos por-ciento
   playbook deporte deportivo deportiva negocio negocios mercado futbol
   liga club clubes equipo equipos temporada nuevo nueva anos ano
   son fue han hay sus nos les via aun asi sea era eran casi cada tan sino pero
   dos tres ver dar dio deja dice ante`
    .split(/\s+/)
    .filter(Boolean),
);

const strip = s =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function tokens(text) {
  return [
    ...new Set(
      strip(text)
        .replace(/[^a-z0-9%$€ ]+/g, ' ')
        .split(/\s+/)
        // 3, not 4: MLS / NFL / NBA / MLB / AFC / PIF / WTA / ATP / COI are
        // among the most identifying tokens a sports-business headline has.
        .filter(t => t.length >= 3 && !STOP.has(t) && !/^\d+$/.test(t)),
    ),
  ];
}

// "US$205 millones", "€55M", "90%", "US$3,000 millones" -> a comparable key.
export function figures(text) {
  const out = new Set();
  const t = strip(text).replace(/[,\s](?=\d{3}\b)/g, '');
  for (const m of t.matchAll(/(?:us\$|mx\$|€|\$)\s?([\d.]+)\s?(m|bn|millones|mil millones)?/g)) {
    const n = parseFloat(m[1]);
    if (!Number.isNaN(n)) out.add(`money:${n}${/bn|mil millones/.test(m[2] || '') ? 'bn' : ''}`);
  }
  for (const m of t.matchAll(/([\d.]+)\s?%/g)) out.add(`pct:${parseFloat(m[1])}`);
  return [...out];
}

// Coverage, not cosine. `covQ` answers "how much of what I asked about does
// this article contain", `covD` the reverse. Taking the larger means a short
// query about a long article and a long query about a short one both score,
// and neither side is punished for being wordy — which is the bug this
// replaced.
//
// A term the corpus has never seen still counts, and counts for MORE than any
// term it has. This is not a detail: scoring `idf[t] || 0` drops unseen terms
// out of the denominator, so covQ stops measuring "how much of the query this
// article covers" and starts measuring "how much of the part of the query the
// archive already knows about". For a genuinely new story every distinctive
// token is unseen, the denominator collapses to whatever generic word survives,
// and coverage is pinned at 1.0 — a guaranteed MISMA HISTORIA off one shared
// word. Measured 2026-08-11: "CME lanza futuros sobre el desempeño de equipos
// de la NHL" had 1 of 5 tokens in the corpus (`futuros`) and returned 100%
// against a Bundesliga financing story; "Daniel Levy incumple el plazo…" had
// 1 of 8 (`plazo`) and returned 100% against three unrelated articles. That is
// the 2026-08-11 rewrite's own fault #2 running backwards: it made a
// heavily-covered story visible by making a never-covered one indistinguishable
// from a duplicate. Treating df=0 as df=0.5 puts an unpublished actor above the
// rarest published one, which is the honest reading — nobody has written about
// it, so it cannot be what makes this a repeat.
function score(queryTerms, queryFigs, docTerms, docFigs, idf, unseenIdf) {
  const docSet = new Set(docTerms);
  const shared = queryTerms.filter(t => docSet.has(t));
  const figHit = queryFigs.filter(f => docFigs.includes(f)).length;
  if (!shared.length && !figHit) return { s: 0, shared: [] };

  // Doc terms are in the corpus by construction, so only the query side can
  // carry an unseen term; shared terms are always known.
  const weight = ts => ts.reduce((sum, t) => sum + (idf[t] || 0), 0);
  const queryWeight = queryTerms.reduce((sum, t) => sum + (idf[t] ?? unseenIdf), 0);
  const sharedW = weight(shared);
  const covQ = sharedW / (queryWeight || 1);
  const covD = sharedW / (weight(docTerms) || 1);

  let s = Math.max(covQ, covD);
  if (figHit) s = Math.min(1, s + 0.18 * figHit); // same number, very likely same story
  return { s, shared };
}

export function buildIndex(rows) {
  const docs = rows.map(r => ({
    ...r,
    terms: tokens(`${r.title} ${r.excerpt || ''} ${r.teaser || ''}`),
    figs: figures(`${r.title} ${r.excerpt || ''} ${r.teaser || ''}`),
  }));

  const df = {};
  for (const d of docs) for (const t of d.terms) df[t] = (df[t] || 0) + 1;
  const idf = {};
  for (const t of Object.keys(df)) idf[t] = Math.log(1 + docs.length / df[t]);

  // The weight a query term gets when the corpus has never seen it. Same curve
  // as above evaluated at df=0.5, so it sits just above the rarest published
  // term (df=1) rather than at zero. See `score`.
  const unseenIdf = Math.log(1 + docs.length / 0.5);

  return { docs, df, idf, unseenIdf, cut: distinctiveCut(docs.length) };
}

export function rank(text, index, { self } = {}) {
  const { docs, df, idf, unseenIdf, cut } = index;
  const qt = tokens(text);
  const qf = figures(text);

  // Proper nouns the corpus knows, rare enough to name a story rather than the
  // beat. If the operator typed everything lowercase there are no proper nouns
  // to find, so fall back to the rarest terms only — degraded, but not blind.
  const caps = properNouns(text);
  const qEntities = caps.size
    ? qt.filter(t => caps.has(t) && (df[t] || 0) > 0 && df[t] <= cut)
    : qt.filter(t => (df[t] || 0) > 0 && df[t] <= 3);
  const terse = qt.length <= 3;

  const hits = [];
  for (const d of docs) {
    if (self && d.source_url === self) continue; // never match a draft against itself

    const { s, shared } = score(qt, qf, d.terms, d.figs, idf, unseenIdf);
    const docSet = new Set(d.terms);
    const ents = qEntities.filter(t => docSet.has(t));
    const entW = ents.reduce((sum, t) => sum + (idf[t] || 0), 0);

    // The entity channel runs independently of the term score. It exists
    // because a heavily-covered story dilutes its own identifying terms, so
    // the article most likely to be a duplicate is the one the term score
    // understates. A one- or two-word query IS an entity query, and a single
    // shared actor rare enough to be unambiguous (Apollo, Gasol, Seahawks)
    // is worth a look on its own: measured over the archive, allowing it
    // takes queries that surface nothing from 42/121 down to 16/121 for about
    // 1.3 extra rows per query, and the file's whole premise is that opening
    // a candidate costs seconds while missing a duplicate costs an article.
    const soloRare = ents.filter(t => (df[t] || 0) <= 4);
    const byEntity = terse
      ? ents.length >= 1 && entW >= 2.2
      : (ents.length >= 2 && entW >= ENTITY_IDF_FLOOR) || soloRare.length >= 1;

    if (s < REVIEW && !byEntity) continue;

    // Say which signal fired, and how weak it is. A row surfaced on one shared
    // name is a different thing from a row surfaced on four, and an operator
    // who cannot tell them apart learns to skim past both.
    const why = !ents.length || s >= LIKELY
      ? ''
      : ents.length === 1
        ? `una sola entidad en común: ${ents[0]}`
        : `entidades en común: ${ents.slice(0, 6).join(', ')}`;
    hits.push({ d, s: Math.max(s, byEntity ? REVIEW : 0), why, byEntity, shared });
  }

  hits.sort((a, b) => b.s - a.s || String(b.d.date).localeCompare(String(a.d.date)));
  const out = hits.slice(0, MAX_HITS);
  out.truncated = hits.length - out.length;
  return out;
}

async function main() {
  const draftFlag = process.argv.indexOf('--draft');
  const queries = [];
  if (draftFlag > -1) {
    const arts = JSON.parse(readFileSync(process.argv[draftFlag + 1], 'utf8'));
    for (const a of arts)
      queries.push({ label: a.title, text: `${a.title} ${a.excerpt || ''}`, self: a.sourceUrl });
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
  const index = buildIndex(rows);

  for (const q of queries) {
    const hits = rank(q.text, index, { self: q.self });

    console.log(`\n── ${q.label.slice(0, 78)}`);
    if (!hits.length) {
      console.log('   sin coincidencias · vía libre');
      continue;
    }
    for (const { d, s, why } of hits) {
      const verdict = s >= LIKELY ? 'MISMA HISTORIA' : 'revisar';
      console.log(
        `   ${(s * 100).toFixed(0).padStart(3)}%  ${verdict.padEnd(14)} ${d.date}  ${d.source.padEnd(22)} ${d.title.slice(0, 58)}`,
      );
      console.log(`        /articulo/${d.id}`);
      if (why) console.log(`        ${why}`);
    }
    // Never let a cap read as "that was everything".
    if (hits.truncated > 0) console.log(`   (+${hits.truncated} más por debajo del corte)`);
    console.log('   → aplica el protocolo de solapamiento (Paso 0 de la skill) antes de redactar.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
