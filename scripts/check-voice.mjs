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
const STRUCTURAL =
  /^(!\[|Foto: Playbook$|Cifra clave:|Jugada:|Cronología:|Recibo:|Ecuación:|Salto:|Reparto:|Alineación:|Cotización:|Resultados:|Duelo:|Serie:|Mapa:|Fuentes:|Ruta del dinero:|## )/;

// Two members of the same family, counted against one budget.
//   1. "no es X, es Y" and its conjugated variants.
//   2. "no solo X, sino Y" — un-exempted 2026-08-11. The comma is optional in
//      practice ("no solo cambia el precio sino quién lo fija"), so it is not
//      required here the way it is in the first pattern.
const NEGATIVE_PARALLELISM = [
  /\bno (?:es|son|fue|viene|está|estaba|se trata de)\b[^.;]{2,70}[,;]\s*(?:es|son|sino|viene|está)\b/gi,
  /\bno s[oó]l(?:o|amente)\b[^.;]{2,70}[,;]?\s*sino\b/gi,
];

const countNegatives = md =>
  NEGATIVE_PARALLELISM.reduce((n, re) => n + (md.match(re) || []).length, 0);

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

main();
