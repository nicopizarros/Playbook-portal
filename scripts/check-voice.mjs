// Checks a draft against the house style the portal actually publishes in,
// before it goes live.
//
// Retuned 2026-08-11 (round 2 of the skill restructure) to the researched
// rhythm rule that REPLACED the old 80-100-word block directive: a paragraph
// is 2-3 sentences, roughly 40-80 words, opening sentence carrying the point.
// The range is Nielsen Norman Group's web-scannability finding (2-4 sentences
// / ~40-70 words for a scanning reader) adjusted up for Spanish's longer
// words and sentences and for Playbook's business-brief register. The single
// rule applies to every format tier; there is deliberately no per-tier range.
// See .claude/playbook-editorial/voice-and-style.md §2, shared by both
// publish skills, which is the only home for this rule.
//
// The counts below are a SANITY CHECK, not the gate. The gate is editorial:
// "is this paragraph doing two things? If yes, cut." A paragraph inside the
// range that does two things still gets cut; one slightly outside that does
// exactly one thing survives. So the thresholds sit above the top of the
// range — they exist to point at a paragraph whose seam is worth hunting for,
// not to push prose to a number.
//
// What is strict regardless of length: the em-dash ban and the
// one-antithesis-per-piece cap. As of 2026-08-11 that cap has NO exemption —
// "no solo X, sino Y" counts like any other member of the family (it is on
// the editorial guide's own watch-list of fórmulas bajo vigilancia), and the
// pattern below detects it.
//
// Usage: node scripts/check-voice.mjs <path-to-draft.json> [--strict]
// Input: the same JSON array scripts/publish-newsletter.ts takes.
//
// This is a mirror, not a gate: it exits 0 by default so it can never block a
// deliberate editorial choice. Pass --strict to exit 1 on any flag (useful if
// it ever gets wired into a check).

import { readFileSync } from 'node:fs';

const TARGETS = {
  medianParagraphWords: 85, // range tops out at 80; flag a median past it
  p75ParagraphWords: 95, // one long paragraph is fine, a quartile of them is drift
  medianSentenceWords: 32, // 2-3 sentences inside 40-80 words lands ~20-27
  medianParagraphSentences: 3, // the other half of the rule: 2-3 sentences
  minHammerParagraphs: 0, // the hammer line lands INSIDE the paragraph, not as its own
  longParagraphWords: 110, // past here a paragraph has usually fused two movements
  maxLongShare: 0.25, // tolerate one in four; more means the movements are fusing
  maxNegativeParallelism: 1, // ~1 per piece, spent at the thesis. No exemptions.
};

// Declared devices, image blocks and their captions are structural, not prose —
// counting them would drag every median toward zero and hide real paragraphs.
// Keep this list in step with lib/article-devices.ts. The eight devices
// built on 2026-08-14 (Contrato, Calendario, Votación, Ranking, Cascada,
// Perfil, Escenarios, Tablero) were missing here until 2026-08-15, so a
// piece declaring one had its device line counted as a paragraph: it
// dragged the median, and the ` — ` that is the devices' own key/value
// syntax was reported as an em dash in prose. Both are false alarms that
// cost a rewrite of text that was already correct.
const STRUCTURAL =
  /^(!\[|Foto: Playbook$|Cifra clave:|Jugada:|Cronología:|Recibo:|Ecuación:|Salto:|Reparto:|Alineación:|Cotización:|Resultados:|Duelo:|Serie:|Mapa:|Venta:|Cadena:|Contrato:|Calendario:|Votación:|Ranking:|Cascada:|Perfil:|Escenarios:|Tablero:|Fuentes:|Ruta del dinero:|## )/;

// The negative-parallelism family, counted against one budget.
//
// voice-and-style.md §2 says "the whole family counts against the one cap" and
// enumerates four shapes. Until 2026-08-11 this file only detected two of them:
// the first pattern hard-coded a list of copular and auxiliary verbs
// (es|son|fue|viene|está|estaba|se trata de), so any member built on a lexical
// verb slipped through uncounted. All three articles published that day closed
// on one — "Disney no compró carreras, compró fechas fijas", "Trump no defendió
// una gestión, cambió la pregunta", "El tope no dejó fuera al capital privado,
// le cambió el instrumento" — and the checker reported `antítesis 0` on every
// one. Each was within budget, so nothing shipped wrong, but the number the
// reviewer reads was not the number the rule defines, and a piece carrying two
// would have passed silently.
//
// Spanish has no POS tagger here, so the general shape is matched structurally:
// a negated clause whose verb is followed by a comma and a second clause that
// also opens on a verb. VERB below is deliberately conservative — unambiguous
// finite endings (-ó, -ió, -aron, -ieron, -aba, -ía, -ará, -aría) plus the
// common irregulars — because a false positive here costs a rewrite the rule
// does not actually demand.
const CLITIC = '(?:me|te|se|le|les|lo|la|los|las|nos)\\s+';
// JS \b is ASCII-only, so it does NOT fire after an accented letter: "compró "
// is non-word followed by non-word, i.e. no boundary at all. Every lexical
// preterite in Spanish ends in a vowel with an accent, so a trailing \b here
// would silently fail on exactly the forms this is meant to catch. Use an
// explicit "no more letters follow" lookahead instead.
const NOT_LETTER = '(?![a-zñáéíóúü])';
const VERB =
  '(?:' +
  // unambiguous finite morphology
  '[a-zñáéíóú]{2,}?(?:ó|ió|aron|ieron|aba|abas|aban|ábamos|ía|ías|ían|íamos|ará|erá|irá|arán|erán|irán|aría|ería|iría)' +
  // high-frequency irregulars and present forms that carry this construction
  '|es|son|era|eran|fue|fueron|será|serán|está|están|estaba|estaban|hay|tiene|tienen' +
  '|va|van|viene|vienen|vino|vinieron|deja|dejan|hace|hacen|sigue|siguen|puede|pueden' +
  '|quiere|quieren|busca|buscan|gana|ganan|pierde|pierden|cambia|cambian|compra|compran' +
  '|vende|venden|mueve|mueven|pone|ponen|dice|dicen|sabe|saben|vale|valen|toca|tocan' +
  ')';

const NEGATIVE_PARALLELISM = [
  // 1. "no es X, es Y" / "el golpe no vino de A, vino de B" / "no compró X,
  //    compró Y" / "no defendió X, cambió Y". Optional "sino (que)" or "pero"
  //    on the second clause, optional clitic before either verb.
  new RegExp(
    `\\bno\\s+(?:${CLITIC})?${VERB}${NOT_LETTER}[^.;:!?]{2,80},\\s*(?:sino\\s+(?:que\\s+)?|pero\\s+)?(?:${CLITIC})?${VERB}${NOT_LETTER}`,
    'gi',
  ),
  // 2. "no es X, SINO Y" — second clause led by sino with no finite verb of
  //    its own ("no es una regla, sino un contrato").
  new RegExp(`\\bno\\s+(?:${CLITIC})?${VERB}${NOT_LETTER}[^.;:!?]{2,80},?\\s*sino\\b`, 'gi'),
  // 3. "no solo X, sino Y" — un-exempted 2026-08-11. The comma is optional in
  //    practice ("no solo cambia el precio sino quién lo fija").
  /\bno s[oó]l(?:o|amente)\b[^.;:!?]{2,80}[,;]?\s*sino\b/gi,
  // 4. "deja de ser A y se convierte en B" — named in the guide, never detected.
  /\bdeja(?:n)? de (?:ser|estar)\b[^.;:!?]{2,80}\by se (?:convierte|convierten|vuelve|vuelven|transforma|transforman)\b/gi,
];

// The patterns overlap by design (shape 1 and shape 2 both fire on "no es X,
// sino Y"), so count distinct spans rather than raw matches or the same
// sentence is charged twice against a budget of one.
export function findNegatives(md) {
  const spans = [];
  for (const re of NEGATIVE_PARALLELISM) {
    re.lastIndex = 0;
    for (const m of md.matchAll(re)) spans.push([m.index, m.index + m[0].length, m[0]]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] < last[1]) {
      last[1] = Math.max(last[1], s[1]);
      if (s[2].length > last[2].length) last[2] = s[2];
    } else merged.push(s.slice());
  }
  return merged.map(s => s[2]);
}

const countNegatives = md => findNegatives(md).length;

const words = s => s.split(/\s+/).filter(Boolean).length;
const median = a => {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const pct = (a, p) => {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  return s[Math.floor((s.length * p) / 100)];
};

function analyse(article) {
  const md = article.bodyMarkdown || '';
  const paragraphs = md
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p && !STRUCTURAL.test(p));
  // the bold lead-in is UI, not part of the sentence the reader parses
  const prose = paragraphs.map(p => p.replace(/^\*\*[^*]+:\*\*\s*/, ''));
  const pWords = prose.map(words);
  const sentences = prose
    .join(' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => words(s) > 3);

  return {
    paragraphs: prose.length,
    medianParagraph: median(pWords),
    medianSentence: median(sentences.map(words)),
    hammers: pWords.filter(n => n >= 4 && n <= 14).length,
    hammerShare: prose.length ? Math.round((100 * pWords.filter(n => n <= 14).length) / prose.length) : 0,
    p75Paragraph: pct(pWords, 75),
    longOnes: prose.map((p, i) => ({ i, n: pWords[i], p })).filter(x => x.n > TARGETS.longParagraphWords),
    medianParagraphSentences: median(
      prose.map(p => p.split(/(?<=[.!?])\s+/).filter(x => words(x) > 3).length),
    ),
    negatives: countNegatives(md),
    emDashes: prose.filter(p => p.includes('—')).length,
  };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: node scripts/check-voice.mjs <draft.json> [--strict]');
    process.exit(2);
  }
  const strict = process.argv.includes('--strict');
  const articles = JSON.parse(readFileSync(path, 'utf8'));
  let flagged = 0;

  for (const a of articles) {
    const m = analyse(a);
    const flags = [];
    if (m.medianParagraph > TARGETS.medianParagraphWords)
      flags.push(`párrafo mediano ${m.medianParagraph}p (rango 40-80, se marca pasando ${TARGETS.medianParagraphWords})`);
    if (m.p75Paragraph > TARGETS.p75ParagraphWords)
      flags.push(`p75 de párrafo ${m.p75Paragraph}p (objetivo ≤${TARGETS.p75ParagraphWords}, un cuartil largo es deriva, no excepción)`);
    if (m.medianSentence > TARGETS.medianSentenceWords)
      flags.push(`oración mediana ${m.medianSentence}p (objetivo ≤${TARGETS.medianSentenceWords})`);
    if (m.medianParagraphSentences > TARGETS.medianParagraphSentences)
      flags.push(`${m.medianParagraphSentences} oraciones por párrafo (regla: 2-3)`);
    if (m.hammers < TARGETS.minHammerParagraphs)
      flags.push(`sin línea martillo de ≤14p (archivo: ~1 de cada 5 párrafos)`);
    if (m.negatives > TARGETS.maxNegativeParallelism)
      flags.push(`${m.negatives} antítesis, familia completa incl. "no solo X, sino Y" (objetivo ≤${TARGETS.maxNegativeParallelism})`);
    if (m.emDashes) flags.push(`${m.emDashes} párrafo(s) de prosa con guion largo`);
    // A long paragraph is normal in the archive; a page made of them is not.
    if (m.paragraphs && m.longOnes.length / m.paragraphs > TARGETS.maxLongShare) {
      flags.push(
        `${m.longOnes.length}/${m.paragraphs} párrafos pasan de ${TARGETS.longParagraphWords}p (busca la costura)`,
      );
      for (const b of m.longOnes) flags.push(`  párrafo ${b.i + 1} de ${b.n}p: "${b.p.slice(0, 52)}…"`);
    }

    console.log(`\n${flags.length ? '⚑' : '✓'} ${(a.title || '(sin título)').slice(0, 70)}`);
    console.log(
      `   ${m.paragraphs} párrafos · mediana ${m.medianParagraph}p/${m.medianParagraphSentences}or por párrafo/${m.medianSentence}o · antítesis ${m.negatives}`,
    );
    for (const f of flags) console.log(`   ⚑ ${f}`);
    if (flags.length) flagged++;
  }

  console.log(`\n${articles.length - flagged}/${articles.length} artículos dentro del ritmo de Playbook.`);
  if (flagged && strict) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

