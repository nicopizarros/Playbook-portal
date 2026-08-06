// Measures a newsletter draft against Playbook's actual published rhythm
// before it goes live. The targets are not invented: they come from a
// 2026-08-06 pass over the whole Substack archive (La Lana, The Futbol
// Business Review and Infinitas, ~48k words), which found Playbook writes in
// short beats — median 24-25 words per paragraph, 13-18 per sentence, and
// roughly a third of every piece a standalone paragraph of ≤14 words. Drafts
// produced before that measurement were running 90-97 word paragraphs.
//
// Usage: node scripts/check-voice.mjs <path-to-draft.json> [--strict]
// Input: the same JSON array scripts/publish-newsletter.ts takes.
//
// This is a mirror, not a gate: it exits 0 by default so it can never block a
// deliberate editorial choice. Pass --strict to exit 1 on any flag (useful if
// it ever gets wired into a check).
//
// Calibrated against the source itself: run over three real La Lana editions
// converted to draft shape, one passes clean and the other two trip a single
// soft flag each (a 34-word median, one 67-word paragraph). That is the
// intended sensitivity — tight enough to catch the 90-word blocks this skill
// was producing, loose enough that Playbook's own writing clears it.

import { readFileSync } from 'node:fs';

const TARGETS = {
  medianParagraphWords: 30, // archive: 24-25
  medianSentenceWords: 18, // archive: 13-18
  minHammerParagraphs: 2, // archive: 31-37% of all paragraphs are ≤14 words
  maxParagraphWords: 60, // archive: only 2-5% of paragraphs reach this
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
    blocks: prose.map((p, i) => ({ i, n: pWords[i], p })).filter(x => x.n > TARGETS.maxParagraphWords),
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
      flags.push(`párrafo mediano ${m.medianParagraph}p (objetivo ≤${TARGETS.medianParagraphWords}, archivo 24-25)`);
    if (m.medianSentence > TARGETS.medianSentenceWords)
      flags.push(`oración mediana ${m.medianSentence}p (objetivo ≤${TARGETS.medianSentenceWords}, archivo 13-18)`);
    if (m.hammers < TARGETS.minHammerParagraphs)
      flags.push(`solo ${m.hammers} línea(s) martillo de ≤14p (objetivo ≥${TARGETS.minHammerParagraphs})`);
    if (m.negatives > TARGETS.maxNegativeParallelism)
      flags.push(`${m.negatives} construcciones "no es X, es Y" (objetivo ≤${TARGETS.maxNegativeParallelism})`);
    if (m.emDashes) flags.push(`${m.emDashes} párrafo(s) de prosa con guion largo`);
    for (const b of m.blocks) flags.push(`párrafo ${b.i + 1} de ${b.n}p: "${b.p.slice(0, 58)}…"`);

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
