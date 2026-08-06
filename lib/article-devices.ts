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

function countupSpan(figure: string, cls: string): string {
  const countable = isCountable(figure) ? ' data-lect-countup' : '';
  return `<span class="${cls}"${countable}>${esc(figure)}</span>`;
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
];

// The Cifra clave and Jugada conventions live in lib/product-hubs.ts (they
// predate this module) but count against the same budget, so the matcher
// list here covers all nine designed devices.
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
