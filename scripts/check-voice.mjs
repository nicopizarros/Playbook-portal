// Measures a newsletter draft against Playbook's actual published rhythm
// before it goes live. The targets are not invented: they come from a
// 2026-08-06 pass over the BODY PROSE of the editorial-viewpoint pieces —
// La Lana, The Futbol Business Review, the weekly essays and the Infinitas
// deep dive — with headings, bullet lists and pull quotes excluded, and with
// Industry Shots left out entirely (it is a digest format and says nothing
// about how Playbook writes an argument; counting it, as a first pass did,
// makes Playbook look far choppier than it is).
//
// What that archive looks like: paragraphs of p25 16-19 / median 28-32 / p75
// 37-44 words, sentences of 13-21, about one paragraph in five standing alone
// at ≤14 words, and only 3-7% reaching 60. Drafts produced before this
// measurement were running 95-word paragraphs, 75-92% of them over 60.
//
// Usage: node scripts/check-voice.mjs <path-to-draft.json> [--strict]
// Input: the same JSON array scripts/publish-newsletter.ts takes.
//
// This is a mirror, not a gate: it exits 0 by default so it can never block a
// deliberate editorial choice. Pass --strict to exit 1 on any flag (useful if
// it ever gets wired into a check).
//
// Calibrated against the source itself: run over three real La Lana editions
// converted to draft shape, two pass clean and the third trips only on an em
// dash the source uses and the house style bans. That is the intended
// sensitivity — tight enough to catch the 95-word blocks this skill was
// producing, loose enough that Playbook's own writing clears it.

import { readFileSync } from 'node:fs';

const TARGETS = {
  medianParagraphWords: 35, // archive median 28-32; flag only past the top of the band
  p75ParagraphWords: 45, // archive p75 37-44
  medianSentenceWords: 20, // archive 13-21
  minHammerParagraphs: 1, // archive: ~1 paragraph in 5 is ≤14 words
  longParagraphWords: 60, // archive: only 3-7% of paragraphs reach this
  maxLongShare: 0.1, // so at most one in ten, not zero
  maxNegativeParallelism: 1, // archive: ~1 per piece, spent at the thesis
};

// Declared devices, image blocks and their captions are structural, not prose —
// counting them would drag every median toward zero and hide real blocks.
const STRUCTURAL =
  /^(!\[|Foto: Playbook$|Cifra clave:|Jugada:|Cronología:|Recibo:|Ecuación:|Salto:|Reparto:|Alineación:|Cotización:|Ruta del dinero:|## )/;

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
      flags.push(`párrafo mediano ${m.medianParagraph}p (objetivo ≤${TARGETS.medianParagraphWords}, archivo 28-32)`);
    if (m.p75Paragraph > TARGETS.p75ParagraphWords)
      flags.push(`p75 de párrafo ${m.p75Paragraph}p (objetivo ≤${TARGETS.p75ParagraphWords}, archivo 37-44)`);
    if (m.medianSentence > TARGETS.medianSentenceWords)
      flags.push(`oración mediana ${m.medianSentence}p (objetivo ≤${TARGETS.medianSentenceWords}, archivo 13-21)`);
    if (m.hammers < TARGETS.minHammerParagraphs)
      flags.push(`sin línea martillo de ≤14p (archivo: ~1 de cada 5 párrafos)`);
    if (m.negatives > TARGETS.maxNegativeParallelism)
      flags.push(`${m.negatives} construcciones "no es X, es Y" (objetivo ≤${TARGETS.maxNegativeParallelism})`);
    if (m.emDashes) flags.push(`${m.emDashes} párrafo(s) de prosa con guion largo`);
    // A long paragraph is normal in the archive; a page made of them is not.
    if (m.paragraphs && m.blocks.length / m.paragraphs > TARGETS.maxLongShare) {
      flags.push(
        `${m.blocks.length}/${m.paragraphs} párrafos pasan de ${TARGETS.longParagraphWords}p (archivo 3-7%)`,
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
