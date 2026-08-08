// La Lectura's device collection (round 3, 2026-08-05): seven authoring
// conventions the publish skills choose from BY STORY SHAPE, alongside the
// four that already live in lib/product-hubs.ts (Opinión callout, Ruta del
// dinero, Cifra clave, Jugada). Same contract as all of those: a plain
// paragraph an editor can type in TipTap, detected server-side, gracefully
// inert when absent or malformed, restylable per product via the
// --lect-accent custom properties (styles/lectura.css), animated as pure
// enhancement by components/article/ArticleMotion.tsx, and never cut open
// by the ad split (no device emits a top-level </p>).
//
//   Cronología:  2022 — PIF entra · 2024 — recorte · 2026 — salida
//                → scroll-drawn timeline (a saga in milestones)
//   Recibo:      Torneos — 10 · Bolsa — US$10M · Total — US$107M
//                → thermal-paper receipt, the Total counts up
//   Ecuación:    104 partidos × US$6M = US$624M
//                → display math, operands and result count up
//   Salto:       14 torneos → 10 torneos — el calendario 2027
//                → before/after delta with direction color
//   Reparto:     FIFA — 70% · Federaciones — 20% · Clubes — 10%
//                → proportion bar (the floor plan of the money)
//   Alineación:  Madonna · Shakira · Justin Bieber · BTS
//                → lineup chips that flap in one by one
//   Cotización:  Ollamani — MX$14.50 · -34.6% · en el año
//                → market tile with ▲/▼ delta
//   Duelo:       UEFA vs FIFA · Ingresos — €20,163M vs US$10,083M
//                → butterfly bars, both sides anchored at the centre
//   Serie:       UEFA vs FIFA · 2022 — €4,052M vs US$5,769M · 2023 — …
//                → two lines on one axis, drawn on scroll (volatility)
//
// Both body shapes go through the same builders: the HTML transform
// (markDevices) rewrites matching <p>s, and the plain-text path asks
// deviceFromParagraph for the same markup. All interpolated text is
// entity-escaped here — the builders are the one place device markup is
// assembled, so the escaping can't be forgotten at a call site.

import { splitFigure, parseNumeric } from './figures';
import {
  CIFRA_HTML_RE,
  JUGADA_HTML_RE,
  CIFRA_TEXT_PREFIX,
  JUGADA_TEXT_PREFIX,
  parseCifra,
  parseJugada,
  cifraMarkup,
  jugadaMarkup,
} from './product-hubs';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Named + numeric entity decode, the inverse of esc() above. Needed because
// the HTML path's raw device text is captured straight out of already-
// serialized body HTML (generateHTML escapes text nodes on the way in, so an
// author's plain "l'Avenir" is stored as "l&apos;Avenir"). Without decoding
// here first, esc() re-escapes that literal "&apos;" into "&amp;apos;" and
// the reader sees the entity name instead of the character (bug found
// 2026-08-06 authoring a Cronología with an apostrophe in it). The
// plain-text authoring path (deviceFromParagraph) never has entities to
// decode, so this is a safe no-op there.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, ent: string) => {
    if (ent[0] === '#') {
      const codePoint = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    const named = NAMED_ENTITIES[ent.toLowerCase()];
    return named ?? match;
  });
}

const ITEM_SEP = /\s+·\s+/;
// First key—value split inside an item (em/en dash or hyphen, spaced —
// same family the Cifra caption uses).
const KV_RE = /^(.*?)\s+[—–-]\s+([\s\S]+)$/;

// A term's leading figure, for count-ups: currency-prefixed money, a
// percentage, or a number with an optional scale word.
const TERM_FIGURE_RE =
  /^((?:€|US\$|USD\s?|MX\$|\$)?\s?-?\d[\d.,]*\s?(?:%|mil\s+millones|millones|billones|mdd|mdp|bn|[MBK])?)\s*([\s\S]*)$/i;

function stripTags(text: string): string {
  return decodeEntities(text.replace(/<[^>]+>/g, '').trim());
}

function isCountable(figure: string): boolean {
  const parts = splitFigure(figure);
  return !!(parts && parseNumeric(parts.num));
}

function countupSpan(figure: string, cls: string, attrs = ''): string {
  const countable = isCountable(figure) ? ' data-lect-countup' : '';
  return `<span class="${cls}"${countable}${attrs}>${esc(figure)}</span>`;
}

// ————————————————————————————————————————————————————————— Cronología
type Milestone = { when: string; what: string };

function parseTimeline(raw: string): Milestone[] | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 2 || items.length > 6) return null;
  const milestones: Milestone[] = [];
  for (const item of items) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const when = kv[1].trim();
    const what = kv[2].trim();
    if (!when || when.length > 14 || !what || what.length > 70) return null;
    milestones.push({ when, what });
  }
  return milestones;
}

function buildTimeline(milestones: Milestone[]): string {
  const items = milestones
    .map(
      m =>
        `<li class="lect-tl-item"><span class="lect-tl-when">${esc(m.when)}</span><span class="lect-tl-what">${esc(m.what)}</span></li>`,
    )
    .join('');
  return (
    `<div class="lect-device lect-timeline" role="note" aria-label="Cronología">` +
    `<span class="lect-device-label">Cronología</span>` +
    `<div class="lect-tl-line lect-draw" aria-hidden="true"></div>` +
    `<ol class="lect-tl-list" data-lect-stagger>${items}</ol></div>`
  );
}

// ——————————————————————————————————————————————————————————— Recibo
type ReceiptLine = { label: string; value: string; total: boolean };

function parseReceipt(raw: string): ReceiptLine[] | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 2 || items.length > 8) return null;
  const lines: ReceiptLine[] = [];
  for (const item of items) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    const value = kv[2].trim();
    if (!label || label.length > 42 || !value || value.length > 24) return null;
    lines.push({ label, value, total: /^total\b/i.test(label) });
  }
  return lines;
}

function buildReceipt(lines: ReceiptLine[]): string {
  const rows = lines
    .map(line =>
      line.total
        ? `<div class="lect-receipt-row lect-receipt-total"><span>${esc(line.label)}</span>${countupSpan(line.value, 'lect-receipt-value')}</div>`
        : `<div class="lect-receipt-row"><span>${esc(line.label)}</span>${countupSpan(line.value, 'lect-receipt-value')}</div>`,
    )
    .join('');
  return (
    `<div class="lect-device lect-receipt" role="note" aria-label="Recibo">` +
    `<span class="lect-receipt-head">Playbook · Recibo</span>` +
    `<div class="lect-receipt-body" data-lect-stagger>${rows}</div>` +
    `<span class="lect-receipt-foot">*** conserve su ticket ***</span></div>`
  );
}

// —————————————————————————————————————————————————————————— Ecuación
type Equation = { terms: { figure: string; label: string }[]; ops: string[]; result: { figure: string; label: string } };

function parseEqTerm(term: string): { figure: string; label: string } | null {
  const match = term.trim().match(TERM_FIGURE_RE);
  if (!match || !/\d/.test(match[1])) return null;
  const figure = match[1].trim();
  const label = match[2].trim();
  if (figure.length > 20 || label.length > 30) return null;
  return { figure, label };
}

function parseEquation(raw: string): Equation | null {
  const text = stripTags(raw);
  const eq = text.match(/^(.+?)\s=\s(.+)$/);
  if (!eq) return null;
  const parts = eq[1].split(/\s([×x+−/-])\s/);
  if (parts.length < 3 || parts.length > 7 || parts.length % 2 === 0) return null;
  const terms: { figure: string; label: string }[] = [];
  const ops: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const term = parseEqTerm(parts[i]);
      if (!term) return null;
      terms.push(term);
    } else {
      ops.push(parts[i] === 'x' ? '×' : parts[i] === '-' ? '−' : parts[i]);
    }
  }
  const result = parseEqTerm(eq[2]);
  if (!result) return null;
  return { terms, ops, result };
}

function eqTermMarkup(term: { figure: string; label: string }, cls: string): string {
  const label = term.label ? `<span class="lect-eq-unit">${esc(term.label)}</span>` : '';
  return `<span class="${cls}">${countupSpan(term.figure, 'lect-eq-num')}${label}</span>`;
}

function buildEquation(equation: Equation): string {
  const pieces: string[] = [];
  equation.terms.forEach((term, i) => {
    if (i > 0) pieces.push(`<span class="lect-eq-op" aria-hidden="true">${esc(equation.ops[i - 1])}</span>`);
    pieces.push(eqTermMarkup(term, 'lect-eq-term'));
  });
  pieces.push('<span class="lect-eq-op lect-eq-eq" aria-hidden="true">=</span>');
  pieces.push(eqTermMarkup(equation.result, 'lect-eq-term lect-eq-result'));
  return (
    `<div class="lect-device lect-eq" role="note" aria-label="La ecuación">` +
    `<span class="lect-device-label">La ecuación</span>` +
    `<div class="lect-eq-row" data-lect-stagger>${pieces.join('')}</div></div>`
  );
}

// ———————————————————————————————————————————————————————————— Salto
type Delta = { from: string; to: string; caption: string; dir: 'up' | 'down' | null };

function parseDelta(raw: string): Delta | null {
  const text = stripTags(raw);
  const match = text.match(/^(.+?)\s*(?:→|->)\s*([^—–]+?)(?:\s+[—–]\s+(.+))?$/);
  if (!match) return null;
  const from = match[1].trim();
  const to = match[2].trim();
  if (!from || from.length > 26 || !to || to.length > 26 || !/\d/.test(from) || !/\d/.test(to)) return null;
  const a = splitFigure(from) && parseNumeric(splitFigure(from)!.num);
  const b = splitFigure(to) && parseNumeric(splitFigure(to)!.num);
  const dir = a && b && a.value !== b.value ? (b.value > a.value ? 'up' : 'down') : null;
  return { from, to, caption: (match[3] || '').trim(), dir };
}

function buildDelta(delta: Delta): string {
  const caption = delta.caption ? `<span class="lect-salto-caption">${esc(delta.caption)}</span>` : '';
  return (
    `<div class="lect-device lect-salto" role="note" aria-label="Salto: de ${esc(delta.from)} a ${esc(delta.to)}"${delta.dir ? ` data-dir="${delta.dir}"` : ''}>` +
    `<span class="lect-device-label">El salto</span>` +
    `<div class="lect-salto-row"><span class="lect-salto-from">${esc(delta.from)}</span>` +
    `<span class="lect-salto-arrow" aria-hidden="true">${delta.dir === 'down' ? '↘' : delta.dir === 'up' ? '↗' : '→'}</span>` +
    `${countupSpan(delta.to, 'lect-salto-to')}</div>${caption}</div>`
  );
}

// ——————————————————————————————————————————————————————————— Reparto
type Share = { label: string; pct: number };

function parseShares(raw: string): Share[] | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 2 || items.length > 5) return null;
  const shares: Share[] = [];
  for (const item of items) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    const pct = kv[2].match(/(\d[\d.]*)\s*%/);
    if (!label || label.length > 30 || !pct) return null;
    const value = Number(pct[1]);
    if (!value || Number.isNaN(value)) return null;
    shares.push({ label, pct: value });
  }
  return shares;
}

function buildShares(shares: Share[]): string {
  const sum = shares.reduce((total, s) => total + s.pct, 0);
  const segments = shares
    .map(
      (s, i) =>
        `<span class="lect-rep-seg" data-lect-seg style="width:${((s.pct / sum) * 100).toFixed(2)}%" data-shade="${i % 4}"></span>`,
    )
    .join('');
  const legend = shares
    .map(
      (s, i) =>
        `<span class="lect-rep-key"><span class="lect-rep-swatch" data-shade="${i % 4}" aria-hidden="true"></span>${esc(s.label)} ${countupSpan(`${s.pct}%`, 'lect-rep-pct')}</span>`,
    )
    .join('');
  return (
    `<div class="lect-device lect-reparto" role="note" aria-label="Reparto: ${esc(shares.map(s => `${s.label} ${s.pct}%`).join(', '))}">` +
    `<span class="lect-device-label">El reparto</span>` +
    `<div class="lect-rep-bar" aria-hidden="true">${segments}</div>` +
    `<div class="lect-rep-legend" data-lect-stagger aria-hidden="true">${legend}</div></div>`
  );
}

// ————————————————————————————————————————————————————————— Alineación
function parseLineup(raw: string): string[] | null {
  const names = stripTags(raw).split(ITEM_SEP).map(n => n.trim());
  if (names.length < 2 || names.length > 8) return null;
  if (names.some(n => !n || n.length > 28)) return null;
  return names;
}

function buildLineup(names: string[]): string {
  const chips = names
    .map(
      (name, i) =>
        `<span class="lect-lineup-chip"><span class="lect-lineup-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="lect-lineup-name">${esc(name)}</span></span>`,
    )
    .join('');
  return (
    `<div class="lect-device lect-lineup" role="note" aria-label="Alineación: ${esc(names.join(', '))}">` +
    `<span class="lect-device-label">La alineación</span>` +
    `<div class="lect-lineup-row">${chips}</div></div>`
  );
}

// ————————————————————————————————————————————————————————— Cotización
type Quote = { name: string; value: string; delta: string; down: boolean; note: string };

function parseQuote(raw: string): Quote | null {
  const text = stripTags(raw);
  const kv = text.match(KV_RE);
  if (!kv) return null;
  const name = kv[1].trim();
  const items = kv[2].split(ITEM_SEP).map(s => s.trim());
  if (!name || name.length > 36 || items.length < 2 || items.length > 3) return null;
  const [value, delta, note = ''] = items;
  if (!value || value.length > 20 || !/\d/.test(value)) return null;
  if (!delta || delta.length > 14 || !delta.includes('%')) return null;
  return { name, value, delta, down: /^[−-]/.test(delta), note };
}

function buildQuote(quote: Quote): string {
  const note = quote.note ? `<span class="lect-quote-note">${esc(quote.note)}</span>` : '';
  return (
    `<div class="lect-device lect-quote" role="note" aria-label="Cotización: ${esc(quote.name)} ${esc(quote.value)}, ${esc(quote.delta)}" data-dir="${quote.down ? 'down' : 'up'}">` +
    `<span class="lect-device-label">La cotización</span>` +
    `<div class="lect-quote-row"><span class="lect-quote-name">${esc(quote.name)}</span>` +
    `${countupSpan(quote.value, 'lect-quote-value')}` +
    `<span class="lect-quote-delta"><span aria-hidden="true">${quote.down ? '▼' : '▲'}</span> ${esc(quote.delta)}</span>${note}</div></div>`
  );
}

// ————————————————————————————————————————————————————————————— Duelo
// Two institutions, the same metrics, side by side. The one shape the
// round-3 collection was missing: Reparto splits a single whole into
// slices and Salto moves one metric from A to B, but neither can put two
// separate actors against each other on several measures at once — the
// comparison an "X gana más que Y" story is actually made of.
//
//   Duelo: UEFA vs FIFA · Ingresos 2022-2025 — €20,163M vs US$10,083M
//
// First item names the two sides; every item after it is one metric row,
// `etiqueta — valorA vs valorB`. Bars are anchored at the centre line and
// grow outwards (a butterfly chart). A row whose two values aren't both
// numeric still renders — as a bare text row, no bars — so a
// "Sede — Nyon vs Zúrich" line can sit under the money without faking a
// magnitude for it.
//
// ONE SCALE FOR THE WHOLE DEVICE (2026-08-08, publisher directive, round
// 2). Every bar is a share of the single largest magnitude in the device,
// so the rows are readable against each other: a reserve that is a tenth
// of a year's revenue draws a tenth of the top bar, and an annual deficit
// draws the sliver it actually is. The first version scaled each row
// against its own larger side, which made every row peak at 100% and
// quietly turned four different magnitudes into four identical-looking
// pair comparisons. Per-row scaling survives only as the fallback for a
// device that mixes units (a % row next to money rows), where a shared
// scale would be arithmetic nonsense — see unitOf below.
//
// Negative values (a leading -, − or –) bar their MAGNITUDE, like every
// other row, but in the loss treatment: a longer bar on a "Resultado del
// año — −€46.2M vs −US$262.8M" row means a bigger loss, and it has to be
// impossible to read it as a bigger win. Colour is doing that work, so it
// is not optional decoration here — without it the device would state the
// opposite of the truth on any row where less is better.
type DuelRow = {
  label: string;
  a: string;
  b: string;
  aPct: number | null;
  bPct: number | null;
  aNeg: boolean;
  bNeg: boolean;
};
type Duel = { a: string; b: string; rows: DuelRow[] };

const VS_RE = /^([\s\S]+?)\s+(?:vs\.?|versus)\s+([\s\S]+)$/i;

// Scale words, relative to "millones". Both sides of a row normally carry
// the same unit; this only exists so a row mixing "mil millones" with
// "millones" still scales honestly instead of comparing 20 against 10,083.
const SCALES: [RegExp, number][] = [
  [/\bbillones\b/i, 1_000_000],
  [/\b(?:mil\s+millones|bn)\b/i, 1_000],
  [/\b(?:millones|mdd|mdp)\b|M\s*$/i, 1],
  [/K\s*$/i, 0.001],
];

// A minus sign before the figure, in any of the three characters an editor
// might actually type (hyphen, true minus, en dash). The currency symbol is
// allowed to sit between it and the digits: "−€46.2M".
const NEGATIVE_RE = /^\s*[-−–]\s*[^\d]{0,4}\d/;

function magnitudeOf(figure: string): number | null {
  const parts = splitFigure(figure);
  if (!parts) return null;
  const parsed = parseNumeric(parts.num);
  if (!parsed) return null;
  const scale = SCALES.find(([re]) => re.test(parts.post));
  return parsed.value * (scale ? scale[1] : 1);
}

// Percentages and absolute amounts cannot share a bar scale: 77% next to
// €5,014M would draw the percentage as a hairline and say nothing true.
// Currencies deliberately DO share one (€ against US$ is the documented,
// editor-declared comparison), so the only split that matters here is
// percentage vs amount.
function unitOf(figure: string): '%' | 'amount' {
  const parts = splitFigure(figure);
  return parts && /%/.test(parts.post) ? '%' : 'amount';
}

// A bar this short is a sliver rather than a shape, but on one shared scale
// that sliver is the honest rendering of a value dwarfed by the largest row,
// so it floors low instead of inflating to a readable minimum.
const MIN_BAR_PCT = 2;

function parseDuel(raw: string): Duel | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 2 || items.length > 5) return null;

  const sides = items[0].match(VS_RE);
  if (!sides) return null;
  const a = sides[1].trim();
  const b = sides[2].trim();
  if (!a || a.length > 26 || !b || b.length > 26) return null;

  // Pass 1 — parse and measure. Nothing is scaled until every row is known,
  // because the scale is a property of the device, not of a row.
  type Parsed = { label: string; a: string; b: string; magA: number | null; magB: number | null };
  const parsed: Parsed[] = [];
  const units = new Set<'%' | 'amount'>();
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    const values = kv[2].match(VS_RE);
    if (!label || label.length > 40 || !values) return null;
    const valueA = values[1].trim();
    const valueB = values[2].trim();
    if (!valueA || valueA.length > 24 || !valueB || valueB.length > 24) return null;

    const magA = magnitudeOf(valueA);
    const magB = magnitudeOf(valueB);
    // Both sides numeric or neither — one bar alone would read as a
    // comparison against zero, which is not what a missing number means.
    const numeric = magA !== null && magB !== null;
    if (numeric) {
      units.add(unitOf(valueA));
      units.add(unitOf(valueB));
    }
    parsed.push({ label, a: valueA, b: valueB, magA: numeric ? magA : null, magB: numeric ? magB : null });
  }

  // Pass 2 — one scale for the device when the units allow it, per-row only
  // as the mixed-unit fallback.
  const shared = units.size <= 1;
  const globalMax = Math.max(0, ...parsed.flatMap(r => [r.magA ?? 0, r.magB ?? 0]));
  const rows: DuelRow[] = parsed.map(row => {
    const max = shared ? globalMax : Math.max(row.magA ?? 0, row.magB ?? 0);
    const pct = (mag: number | null) =>
      max > 0 && mag !== null ? Math.max(MIN_BAR_PCT, Math.min(100, (mag / max) * 100)) : null;
    return {
      label: row.label,
      a: row.a,
      b: row.b,
      aPct: pct(row.magA),
      bPct: pct(row.magB),
      aNeg: NEGATIVE_RE.test(row.a),
      bNeg: NEGATIVE_RE.test(row.b),
    };
  });
  return { a, b, rows };
}

// The bar is sized as a share of its own lane, never of the whole half —
// a bar measured against the half would overflow it by exactly the width
// of the figure sitting next to it.
function duelHalf(side: 'a' | 'b', value: string, pct: number | null, negative: boolean): string {
  // The lane is emitted even for a bar-less text row, so the figure keeps
  // the same edge it has in every other row instead of drifting to the
  // centre (and, on the stacked phone layout, to the wrong side entirely).
  const neg = negative ? ' data-neg="true"' : '';
  const bar =
    pct === null
      ? ''
      : `<span class="lect-duelo-bar" data-lect-duelo-bar data-side="${side}"${neg} style="width:${pct.toFixed(2)}%"></span>`;
  const lane = `<span class="lect-duelo-lane">${bar}</span>`;
  const figure = countupSpan(value, 'lect-duelo-val', neg);
  return `<span class="lect-duelo-half" data-side="${side}">${side === 'a' ? figure + lane : lane + figure}</span>`;
}

function buildDuel(duel: Duel): string {
  const rows = duel.rows
    .map(
      row =>
        `<span class="lect-duelo-row">` +
        `<span class="lect-duelo-label">${esc(row.label)}</span>` +
        `<span class="lect-duelo-track">${duelHalf('a', row.a, row.aPct, row.aNeg)}${duelHalf('b', row.b, row.bPct, row.bNeg)}</span>` +
        `</span>`,
    )
    .join('');
  const described = duel.rows.map(row => `${row.label}: ${duel.a} ${row.a}, ${duel.b} ${row.b}`).join('; ');
  return (
    `<div class="lect-device lect-duelo" role="note" aria-label="Duelo entre ${esc(duel.a)} y ${esc(duel.b)}. ${esc(described)}">` +
    `<span class="lect-device-label">El duelo</span>` +
    `<div class="lect-duelo-head" aria-hidden="true">` +
    `<span class="lect-duelo-name" data-side="a">${esc(duel.a)}</span>` +
    `<span class="lect-duelo-name" data-side="b">${esc(duel.b)}</span></div>` +
    `<div class="lect-duelo-rows" data-lect-stagger aria-hidden="true">${rows}</div></div>`
  );
}

// ————————————————————————————————————————————————————————————— Serie
// Two series tracked across the same points in time, drawn as a line
// chart. Duelo answers "who is bigger on each measure"; this answers
// "what has each one's shape been", which is the only way to show
// volatility — a body whose income collapses and recovers and a body
// whose income barely moves can post identical totals.
//
//   Serie: UEFA vs FIFA · 2022 — €4,052M vs US$5,769M · 2023 — …
//
// Same grammar as Duelo on purpose (first item names the sides, every
// item after it is `punto — valorA vs valorB`), so an editor who knows
// one knows the other; here the rows are points in time rather than
// metrics. Both series share one Y axis, which is the whole point, so
// every value has to be the same KIND of measure — and if two currencies
// share the axis, the piece has to have earned that the way it does for
// a Duelo.
type SeriesPoint = { label: string; a: string; b: string; magA: number; magB: number };
type Series = { a: string; b: string; points: SeriesPoint[] };

function parseSeries(raw: string): Series | null {
  const items = stripTags(raw).split(ITEM_SEP);
  // Three points is the minimum that can show a shape rather than a
  // slope; past eight the labels collide at reading-column widths.
  if (items.length < 4 || items.length > 9) return null;

  const sides = items[0].match(VS_RE);
  if (!sides) return null;
  const a = sides[1].trim();
  const b = sides[2].trim();
  if (!a || a.length > 26 || !b || b.length > 26) return null;

  const points: SeriesPoint[] = [];
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    const values = kv[2].match(VS_RE);
    if (!label || label.length > 12 || !values) return null;
    const valueA = values[1].trim();
    const valueB = values[2].trim();
    const magA = magnitudeOf(valueA);
    const magB = magnitudeOf(valueB);
    // A chart cannot carry a missing point the way a Duelo row can carry
    // a text value — one gap and every x position after it lies.
    if (magA === null || magB === null || valueA.length > 24 || valueB.length > 24) return null;
    points.push({ label, a: valueA, b: valueB, magA, magB });
  }
  return { a, b, points };
}

// Geometry of the plot box inside the 640×260 viewBox: room on the left
// for nothing (the axis is unlabelled — the point values are printed on
// the line itself) and room at the foot for the period labels.
const S_X0 = 16;
const S_X1 = 624;
const S_Y0 = 30;
const S_Y1 = 196;

function buildSeries(series: Series): string {
  const { points } = series;
  const max = Math.max(...points.flatMap(p => [p.magA, p.magB]));
  if (max <= 0) return '';
  const x = (i: number) => S_X0 + (i * (S_X1 - S_X0)) / (points.length - 1);
  const y = (mag: number) => S_Y1 - (mag / max) * (S_Y1 - S_Y0);

  const line = (pick: (p: SeriesPoint) => number) => points.map((p, i) => `${x(i).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(' ');
  const area = (pick: (p: SeriesPoint) => number) => `${line(pick)} ${x(points.length - 1).toFixed(1)},${S_Y1} ${x(0).toFixed(1)},${S_Y1}`;

  const grid = [0, 0.5, 1]
    .map(f => {
      const gy = (S_Y1 - f * (S_Y1 - S_Y0)).toFixed(1);
      return `<line class="lect-serie-grid" x1="${S_X0}" y1="${gy}" x2="${S_X1}" y2="${gy}" />`;
    })
    .join('');

  const dots = (side: 'a' | 'b', pick: (p: SeriesPoint) => number) =>
    points
      .map((p, i) => `<circle class="lect-serie-dot" data-side="${side}" cx="${x(i).toFixed(1)}" cy="${y(pick(p)).toFixed(1)}" r="4" />`)
      .join('');

  // At every point the HIGHER series is labelled above its dot and the
  // lower one below, decided per point rather than per series: a fixed
  // "A above, B below" collides at exactly the points where the lines
  // cross, which are the points a volatility chart exists to show.
  const ABOVE = -13;
  const BELOW = 20;
  const labels = points
    .map((p, i) => {
      const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle';
      const aOnTop = p.magA >= p.magB;
      const one = (side: 'a' | 'b', mag: number, text: string, dy: number) =>
        `<text class="lect-serie-val" data-side="${side}" x="${x(i).toFixed(1)}" y="${(y(mag) + dy).toFixed(1)}" text-anchor="${anchor}">${esc(text)}</text>`;
      return (
        one('a', p.magA, p.a, aOnTop ? ABOVE : BELOW) + one('b', p.magB, p.b, aOnTop ? BELOW : ABOVE)
      );
    })
    .join('');

  const periods = points
    .map((p, i) => {
      const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle';
      return `<text class="lect-serie-period" x="${x(i).toFixed(1)}" y="${S_Y1 + 26}" text-anchor="${anchor}">${esc(p.label)}</text>`;
    })
    .join('');

  const described = points.map(p => `${p.label}: ${series.a} ${p.a}, ${series.b} ${p.b}`).join('; ');

  return (
    `<div class="lect-device lect-serie" role="note" aria-label="Serie de ${esc(series.a)} y ${esc(series.b)}. ${esc(described)}">` +
    `<span class="lect-device-label">La serie</span>` +
    `<div class="lect-serie-key" aria-hidden="true">` +
    `<span class="lect-serie-name" data-side="a">${esc(series.a)}</span>` +
    `<span class="lect-serie-name" data-side="b">${esc(series.b)}</span></div>` +
    `<svg class="lect-serie-chart" viewBox="0 0 640 260" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
    grid +
    `<polygon class="lect-serie-area" data-side="a" points="${area(p => p.magA)}" />` +
    `<polygon class="lect-serie-area" data-side="b" points="${area(p => p.magB)}" />` +
    `<polyline class="lect-serie-line" data-side="a" pathLength="1" points="${line(p => p.magA)}" />` +
    `<polyline class="lect-serie-line" data-side="b" pathLength="1" points="${line(p => p.magB)}" />` +
    dots('a', p => p.magA) +
    dots('b', p => p.magB) +
    labels +
    periods +
    `</svg></div>`
  );
}

// ———————————————————————————————————————————————————— Dispatch tables
type Device = {
  /** Prefix as the editor types it (accent-tolerant). */
  prefix: RegExp;
  html: RegExp;
  render(raw: string): string | null;
};

function deviceHtmlRe(name: string): RegExp {
  return new RegExp(
    `<p[^>]*>\\s*(?:<strong>)?\\s*(?:La\\s+|El\\s+)?${name}:?\\s*(?:<\\/strong>)?:?\\s*([\\s\\S]*?)<\\/p>`,
    'gi',
  );
}

function deviceTextRe(name: string): RegExp {
  return new RegExp(`^\\s*(?:\\*\\*)?\\s*(?:La\\s+|El\\s+)?${name}:?\\s*(?:\\*\\*)?:?\\s*`, 'i');
}

const DEVICES: Device[] = [
  {
    prefix: deviceTextRe('Cronolog[íi]a'),
    html: deviceHtmlRe('Cronolog[íi]a'),
    render: raw => {
      const parsed = parseTimeline(raw);
      return parsed ? buildTimeline(parsed) : null;
    },
  },
  {
    prefix: deviceTextRe('Recibo'),
    html: deviceHtmlRe('Recibo'),
    render: raw => {
      const parsed = parseReceipt(raw);
      return parsed ? buildReceipt(parsed) : null;
    },
  },
  {
    prefix: deviceTextRe('Ecuaci[óo]n'),
    html: deviceHtmlRe('Ecuaci[óo]n'),
    render: raw => {
      const parsed = parseEquation(raw);
      return parsed ? buildEquation(parsed) : null;
    },
  },
  {
    prefix: deviceTextRe('Salto'),
    html: deviceHtmlRe('Salto'),
    render: raw => {
      const parsed = parseDelta(raw);
      return parsed ? buildDelta(parsed) : null;
    },
  },
  {
    prefix: deviceTextRe('Reparto'),
    html: deviceHtmlRe('Reparto'),
    render: raw => {
      const parsed = parseShares(raw);
      return parsed ? buildShares(parsed) : null;
    },
  },
  {
    prefix: deviceTextRe('Alineaci[óo]n'),
    html: deviceHtmlRe('Alineaci[óo]n'),
    render: raw => {
      const parsed = parseLineup(raw);
      return parsed ? buildLineup(parsed) : null;
    },
  },
  {
    prefix: deviceTextRe('Cotizaci[óo]n'),
    html: deviceHtmlRe('Cotizaci[óo]n'),
    render: raw => {
      const parsed = parseQuote(raw);
      return parsed ? buildQuote(parsed) : null;
    },
  },
  {
    prefix: deviceTextRe('Duelo'),
    html: deviceHtmlRe('Duelo'),
    render: raw => {
      const parsed = parseDuel(raw);
      return parsed ? buildDuel(parsed) : null;
    },
  },
  {
    prefix: deviceTextRe('Serie'),
    html: deviceHtmlRe('Serie'),
    render: raw => {
      const parsed = parseSeries(raw);
      return parsed ? buildSeries(parsed) || null : null;
    },
  },
];

// The Cifra clave and Jugada conventions live in lib/product-hubs.ts (they
// predate this module) but count against the same budget, so the matcher
// list here covers all ten designed devices.
type NamedDevice = { name: string; html: RegExp; prefix: RegExp; render(raw: string): string | null };

const ALL_DEVICES: NamedDevice[] = [
  {
    name: 'cifra',
    html: CIFRA_HTML_RE,
    prefix: CIFRA_TEXT_PREFIX,
    render: raw => {
      const parsed = parseCifra(raw);
      return parsed ? cifraMarkup(parsed) : null;
    },
  },
  {
    name: 'jugada',
    html: JUGADA_HTML_RE,
    prefix: JUGADA_TEXT_PREFIX,
    render: raw => {
      const parsed = parseJugada(raw);
      return parsed ? jugadaMarkup(parsed) : null;
    },
  },
  ...DEVICES.map((device, i) => ({ name: `device-${i}`, ...device })),
];

// ————————————————————————————————————————————— The per-article budget
// Density decision (user request, 2026-08-06): designed devices scale
// with reading length — a 1-minute shot carries ONE visual stop, a
// mid-length piece two, a long La Lana read three. More reads as a
// slideshow, not an article. The Opinión callout (standard structure),
// the automatic devices (lead-in marks, inline highlights, bold
// count-ups) and La Lana's money trail (the product's narrative identity
// device, already limited to one per article) are exempt — the budget
// governs the OPTIONAL designed beats only.
//
// Priority-aware (round 2, user request, 2026-08-06): length alone
// under-budgets a `priority: 5` story that happens to be short — the
// standard four-paragraph Noticias format keeps `readingTime` at 2
// regardless of how important the story is, so a hero-track piece and a
// routine one got the same single device. `priority: 5` is the site's own
// signal for "most likely to lead the homepage" (see lib/rank.ts), so it
// earns one extra device slot at every length tier instead of relying on
// length to say so. Featured status isn't part of this: `featured` decays
// within a day (rank.ts's FEATURED_BOOST_DAYS) and is about today's
// homepage placement, not the story's lasting importance the way
// `priority` is meant to be.
export function deviceBudgetFor(readingTime: number | null, priority?: number | null): number {
  const minutes = readingTime || 1;
  const base = minutes <= 2 ? 1 : minutes <= 5 ? 2 : 3;
  return priority === 5 ? base + 1 : base;
}

// HTML bodies: ONE document-order pass over all nine device patterns —
// per-type passes would spend the budget in type order instead of the
// order the editor placed things. First declared wins; a device TYPE
// repeats never (the second Recibo stays text even under budget); excess
// declarations stay as readable plain paragraphs, so an over-budget
// article degrades visibly-but-gracefully instead of silently. Same
// trust boundary and ad-split safety as every transform before it.
export function applyBodyDevices(html: string, readingTime: number | null, priority?: number | null): string {
  type Match = { start: number; end: number; markup: string; name: string };
  const found: Match[] = [];
  for (const device of ALL_DEVICES) {
    device.html.lastIndex = 0;
    for (const match of html.matchAll(device.html)) {
      const markup = device.render(match[1]);
      if (markup && match.index !== undefined) {
        found.push({ start: match.index, end: match.index + match[0].length, markup, name: device.name });
      }
    }
  }
  found.sort((a, b) => a.start - b.start);

  let budget = deviceBudgetFor(readingTime, priority);
  const usedTypes = new Set<string>();
  const selected: Match[] = [];
  let cursor = -1;
  for (const match of found) {
    // Strictly-less-than: a device paragraph that starts EXACTLY where the
    // previous one ends is adjacent, not overlapping — <= here skipped
    // every second device in a run of back-to-back declarations (measured
    // on the sampler article before shipping).
    if (match.start < cursor) continue; // overlapping match — first wins
    cursor = match.end;
    if (budget <= 0 || usedTypes.has(match.name)) continue;
    usedTypes.add(match.name);
    budget -= 1;
    selected.push(match);
  }

  let out = '';
  let pos = 0;
  for (const match of selected) {
    out += html.slice(pos, match.start) + match.markup;
    pos = match.end;
  }
  return out + html.slice(pos);
}

// Plain-text bodies: same nine devices, same budget semantics, applied
// paragraph by paragraph in document order by plainBlocksFor (which owns
// the iteration). Returns the markup plus the device's type name so the
// caller can enforce the no-repeated-type rule.
export function deviceFromParagraph(paragraph: string): { markup: string; name: string } | null {
  for (const device of ALL_DEVICES) {
    if (device.prefix.test(paragraph)) {
      const markup = device.render(paragraph.replace(device.prefix, ''));
      if (markup) return { markup, name: device.name };
    }
  }
  return null;
}
