// Checks a draft against the house style the portal actually publishes in,
// before it goes live.
//
// Retuned 2026-08-06 (round 2, publisher directive). The first version of
// this script targeted a measurement of the Substack archive's
// editorial-viewpoint prose (La Lana, TFBR, the weekly essays: paragraphs of
// p25 16-19 / median 28-32 / p75 37-44, about one paragraph in five standing
// alone at ≤14 words). That measurement is real, and it describes the
// NEWSLETTER. The portal is a different product: its articles are written as
// four substantial blocks of roughly 80-100 words, one per movement. A draft
// written in short beats shipped once, read choppy on the article page, and
// the format was reversed. So the paragraph-length targets below are
// deliberately loose — they exist to catch a runaway block (two movements
// fused into one paragraph), not to push prose toward the newsletter's
// rhythm. See the rhythm section in either publish skill's Step 3.
//
// What stayed strict is what is house style regardless of block length: the
// em-dash ban and the one-negative-parallelism-per-piece cap.
//
// Usage: node scripts/check-voice.mjs <path-to-draft.json> [--strict]
// Input: the same JSON array scripts/publish-newsletter.ts takes.
//
// This is a mirror, not a gate: it exits 0 by default so it can never block a
// deliberate editorial choice. Pass --strict to exit 1 on any flag (useful if
// it ever gets wired into a check).

import { readFileSync } from 'node:fs';

const TARGETS = {
  medianParagraphWords: 110, // four-block format sits at 80-100; flag past the top
  p75ParagraphWords: 125, // a block longer than this is usually two movements
  medianSentenceWords: 30, // the format runs longer sentences than the newsletter
  minHammerParagraphs: 0, // the hammer line lands INSIDE the block now, not as its own paragraph
  longParagraphWords: 130, // a runaway block, not a substantial one
  maxLongShare: 0.25, // tolerate one in four; more means the blocks are fusing
  maxNegativeParallelism: 1, // unchanged: ~1 per piece, spent at the thesis
};

// Declared devices, image blocks and their captions are structural, not prose —
// counting them would drag every median toward zero and hide real blocks.
const STRUCTURAL =
  /^(!\[|Foto: Playbook$|Cifra clave:|Jugada:|Cronología:|Recibo:|Ecuación:|Salto:|Reparto:|Alineación:|Cotización:|Duelo:|Ruta del dinero:|## )/;

const NEGATIVE_PARALLELISM =
  /\bno (?:es|son|fue|viene|está|estaba|se trata de)\b[^.;]{2,70}[,;]\s*(?:es|son|sino|viene|está)\b/gi;

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
    blocks: prose.map((p, i) => ({ i, n: pWords[i], p })).filter(x => x.n > TARGETS.longParagraphWords),
    negatives: (md.match(NEGATIVE_PARALLELISM) || []).length,
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
      flags.push(`párrafo mediano ${m.medianParagraph}p (objetivo ≤${TARGETS.medianParagraphWords}, formato de cuatro bloques 80-100)`);
    if (m.p75Paragraph > TARGETS.p75ParagraphWords)
      flags.push(`p75 de párrafo ${m.p75Paragraph}p (objetivo ≤${TARGETS.p75ParagraphWords}, un bloque más largo suele ser dos movimientos)`);
    if (m.medianSentence > TARGETS.medianSentenceWords)
      flags.push(`oración mediana ${m.medianSentence}p (objetivo ≤${TARGETS.medianSentenceWords}, el formato corre oraciones largas)`);
    if (m.hammers < TARGETS.minHammerParagraphs)
      flags.push(`sin línea martillo de ≤14p (archivo: ~1 de cada 5 párrafos)`);
    if (m.negatives > TARGETS.maxNegativeParallelism)
      flags.push(`${m.negatives} construcciones "no es X, es Y" (objetivo ≤${TARGETS.maxNegativeParallelism})`);
    if (m.emDashes) flags.push(`${m.emDashes} párrafo(s) de prosa con guion largo`);
    // A long paragraph is normal in the archive; a page made of them is not.
    if (m.paragraphs && m.blocks.length / m.paragraphs > TARGETS.maxLongShare) {
      flags.push(
        `${m.blocks.length}/${m.paragraphs} párrafos pasan de ${TARGETS.longParagraphWords}p (bloques desbordados)`,
      );
      for (const b of m.blocks) flags.push(`  párrafo ${b.i + 1} de ${b.n}p: "${b.p.slice(0, 52)}…"`);
    }

    console.log(`\n${flags.length ? '⚑' : '✓'} ${(a.title || '(sin título)').slice(0, 70)}`);
    console.log(
      `   ${m.paragraphs} párrafos · mediana ${m.medianParagraph}p/${m.medianSentence}o · martillo ${m.hammers} (${m.hammerShare}%) · antítesis ${m.negatives}`,
    );
    for (const f of flags) console.log(`   ⚑ ${f}`);
    if (flags.length) flagged++;
  }

  console.log(`\n${articles.length - flagged}/${articles.length} artículos dentro del ritmo de Playbook.`);
  if (flagged && strict) process.exit(1);
}

main();
