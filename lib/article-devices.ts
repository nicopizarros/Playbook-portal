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
//   Resultados:  Fox, Q4 fiscal 2026 · Ingresos — US$4,210M (+28%) · …
//                → a filing's lines, each with its own change
//   Duelo:       UEFA vs FIFA · Ingresos — €20,163M vs US$10,083M
//                → butterfly bars, both sides anchored at the centre
//   Serie:       UEFA vs FIFA · 2022 — €4,052M vs US$5,769M · 2023 — …
//                → two lines on one axis, drawn on scroll (volatility)
//   Mapa:        Concacaf · Firmaron — resto · Sin firmar — MEX
//                → real geography, countries split into labelled camps
//
// Round 4 (2026-08-12) adds the two transfer-of-title devices, the one
// shape the collection could previously only tell in pieces. Unlike every
// device above them they are not styled by the product accent: the asset
// changing hands wears its OWN brand palette (lib/brand-colors.ts),
// contrast-corrected per theme and scoped to the device element so the
// page around it stays Playbook's.
//
//   Venta:       Lakers · Precio — US$12,500M · De — Walter · A — Kushner
//                → the deed: the asset, the two parties, the price
//   Cadena:      Lakers · 1979 — Buss — US$67.5M · 2026 — Kushner — US$12,500M
//                → the chain of title, each era held as long as it draws
//
// Round 6 (2026-08-20) adds one device for the shape a restructuring
// announcement has, where the news is which body the new structure leaves
// out:
//
//   Pirámide:    Liga MX (fuera) — cerrada · Liga Expansión MX — cúspide · …
//                → the league system, tier by tier, with the detached one
//                  drawn above a visibly broken connector
//
// Both body shapes go through the same builders: the HTML transform
// (markDevices) rewrites matching <p>s, and the plain-text path asks
// deviceFromParagraph for the same markup. All interpolated text is
// entity-escaped here — the builders are the one place device markup is
// assembled, so the escaping can't be forgotten at a call site.

import { splitFigure, parseNumeric, formatNumeric } from './figures';
// The Mapa device carries the whole world's geometry, so it lives in its
// own module (lib/article-map.ts) the way Cifra/Jugada live in
// product-hubs.ts — it is registered here and budgeted like every other.
// Venta and Cadena wear the asset's OWN colours instead of the product
// accent; the registry, the hex escape hatch and the contrast correction
// that makes an arbitrary palette safe on both themes all live there.
import { resolveBrand, brandStyleAttr } from './brand-colors';
import { parseMap, buildMap } from './article-map';
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

// Decode-then-escape lives in one shared module now (lib/html-entities.ts)
// because the double-escape bug it prevents (HANDOFF 2026-08-06: captured
// device text arrives with generateHTML's &apos; already in it, and a
// second escape turns it into a visible &amp;apos;) was fixed here on the
// Cronología path but kept recurring in the sibling device modules that
// each had their own esc() copy and no decode. The plain-text authoring
// path (deviceFromParagraph) never has entities to decode, so decoding is
// a safe no-op there.
import { escapeHtml as esc, decodeEntities } from './html-entities';

const ITEM_SEP = /\s+·\s+/;
// First key—value split inside an item (em/en dash or hyphen, spaced —
// same family the Cifra caption uses).
const KV_RE = /^(.*?)\s+[—–-]\s+([\s\S]+)$/;

// A term's leading figure, for count-ups: currency-prefixed money, a
// percentage, or a number with an optional scale word. The single-letter
// scales need the end-or-space lookahead: without it "3 minutos" split as
// figure "3 m" + label "inutos" (caught rendering the device audit,
// 2026-08-13) because /i lets [MBK] eat the first letter of any lowercase
// word.
const TERM_FIGURE_RE =
  /^((?:€|US\$|USD\s?|MX\$|\$)?\s?-?\d[\d.,]*\s?(?:%|mil\s+millones|millones|billones|mdd|mdp|bn|[MBK](?=\s|$))?)\s*([\s\S]*)$/i;

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

// Capacity raised 2026-08-13: 2–6 → 2–8 items (the CSS switches to the
// vertical-spine layout past six, so a long saga no longer has to amputate
// beats), dates 14 → 16 chars, events 70 → 90. The limits still exist for
// the same reason as ever — past them the device silently falls back to
// plain text — they're just wider now.
function parseTimeline(raw: string): Milestone[] | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 2 || items.length > 8) return null;
  const milestones: Milestone[] = [];
  for (const item of items) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const when = kv[1].trim();
    const what = kv[2].trim();
    if (!when || when.length > 16 || !what || what.length > 90) return null;
    milestones.push({ when, what });
  }
  return milestones;
}

function buildTimeline(milestones: Milestone[]): string {
  // The last milestone is where the saga stands NOW, and it reads
  // differently from history — data-current fills its dot with the accent
  // and bolds its event (2026-08-13; same convention Cadena already uses
  // for the current holder).
  const items = milestones
    .map(
      (m, i) =>
        `<li class="lect-tl-item"${i === milestones.length - 1 ? ' data-current="true"' : ''}><span class="lect-tl-when">${esc(m.when)}</span><span class="lect-tl-what">${esc(m.what)}</span></li>`,
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
  // A receipt that doesn't add up is the one thing a receipt must never be
  // (2026-08-13). When a Total row exists, every non-total line parses, and
  // they all share the Total's denomination, the sum is CHECKED — off by
  // more than 2.5% (rounding tolerance) rejects the device, fail-loud as
  // plain text, same principle as Venta's computed multiple: the device
  // must not lend a designed element's authority to arithmetic that is
  // wrong. Mixed or unparseable lines skip the check rather than guessing.
  const totalLine = lines.find(l => l.total);
  if (totalLine) {
    const total = denominatedOf(totalLine.value);
    const parts = lines.filter(l => !l.total).map(l => denominatedOf(l.value));
    if (total && parts.every((p): p is Denominated => p !== null && p.unit === total.unit)) {
      const sum = parts.reduce((acc, p) => acc + p.value, 0);
      if (total.value > 0 && Math.abs(sum - total.value) / total.value > 0.025) return null;
    }
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
  // The equation CHECKS ITSELF (2026-08-13). When every term and the result
  // parse as magnitudes, evaluate left to right (the device's semantics — a
  // narrative equation, not operator precedence) and reject on a mismatch
  // past 3% (rounding headroom). A device doing display math that is wrong
  // is worse than no device; fail loud as plain text, same rule as the
  // Recibo's total check. Any unparseable term skips the check — units like
  // "partidos × pausas × minutos" are labels, not scales, and the guard
  // only runs when the arithmetic is actually checkable.
  // A percentage term parses as its face value (20% → 20, not 0.20), so an
  // equation carrying one is not checkable by plain evaluation — skip.
  const anyPct = [...terms, result].some(t => /%/.test(t.figure));
  const mags = terms.map(t => magnitudeOf(t.figure));
  const resultMag = magnitudeOf(result.figure);
  if (!anyPct && mags.every((m): m is number => m !== null) && resultMag !== null && resultMag !== 0) {
    let acc = mags[0];
    let checkable = true;
    for (let i = 0; i < ops.length; i++) {
      const m = mags[i + 1];
      if (ops[i] === '×') acc *= m;
      else if (ops[i] === '+') acc += m;
      else if (ops[i] === '−') acc -= m;
      else if (ops[i] === '/') {
        if (m === 0) { checkable = false; break; }
        acc /= m;
      } else { checkable = false; break; }
    }
    if (checkable && Math.abs(acc - resultMag) / Math.abs(resultMag) > 0.03) return null;
  }
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
  // The move, COMPUTED rather than authored (2026-08-13, same rule as
  // Venta's multiple): when both figures share a denomination, the chip
  // prints the percent change so the reader never does the division — and a
  // derived number can't contradict the prose. Units disagreeing (a
  // currency change, not growth) or a zero base silently omit it.
  let moveChip = '';
  const from = denominatedOf(delta.from);
  const to = denominatedOf(delta.to);
  if (from && to && from.unit === to.unit && from.value > 0) {
    const pct = ((to.value - from.value) / from.value) * 100;
    const text = `${pct >= 0 ? '+' : '−'}${formatNumeric(Math.abs(pct), Math.abs(pct) >= 10 ? 0 : 1)}%`;
    moveChip = `<span class="lect-salto-pct" data-dir="${pct < 0 ? 'down' : 'up'}">${esc(text)}</span>`;
  }
  // data-lect-stagger (2026-08-13): from → arrow → to rise in sequence, so
  // the before is on the page before the after lands and starts counting —
  // the one device whose whole story is an ordering. Same shared primitive
  // as every other stagger; no-JS renders the finished row.
  return (
    `<div class="lect-device lect-salto" role="note" aria-label="Salto: de ${esc(delta.from)} a ${esc(delta.to)}"${delta.dir ? ` data-dir="${delta.dir}"` : ''}>` +
    `<span class="lect-device-label">El salto</span>` +
    `<div class="lect-salto-row" data-lect-stagger><span class="lect-salto-from">${esc(delta.from)}</span>` +
    `<span class="lect-salto-arrow" aria-hidden="true">${delta.dir === 'down' ? '↘' : delta.dir === 'up' ? '↗' : '→'}</span>` +
    `${countupSpan(delta.to, 'lect-salto-to')}${moveChip}</div>${caption}</div>`
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
  // The bar must not misstate the declared numbers (2026-08-13). buildShares
  // normalizes widths to the sum, so a declaration totalling 80 used to
  // silently draw 60/20 as 75/25 — the legend said one thing and the bar
  // another. Now: a sum in 97–103 is rounding and renders as declared; a
  // sum under 97 gets an explicit "Otros" remainder segment (the reader
  // sees the whole and the gap); a sum over 103 is arithmetic that cannot
  // be true of one whole and rejects, fail-loud as plain text.
  const sum = shares.reduce((acc, s) => acc + s.pct, 0);
  if (sum > 103) return null;
  if (sum < 97) {
    if (shares.length >= 5) return null;
    shares.push({ label: 'Otros', pct: Math.round((100 - sum) * 10) / 10 });
  }
  return shares;
}

function buildShares(shares: Share[]): string {
  const sum = shares.reduce((total, s) => total + s.pct, 0);
  // Five distinct shades for the five-segment cap (was i % 4, which handed
  // a fifth segment the same swatch as the first — two legend entries in
  // identical colors, found in the 2026-08-13 palette pass).
  const segments = shares
    .map(
      (s, i) =>
        `<span class="lect-rep-seg" data-lect-seg style="width:${((s.pct / sum) * 100).toFixed(2)}%" data-shade="${i % 5}"></span>`,
    )
    .join('');
  const legend = shares
    .map(
      (s, i) =>
        `<span class="lect-rep-key"><span class="lect-rep-swatch" data-shade="${i % 5}" aria-hidden="true"></span>${esc(s.label)} ${countupSpan(`${s.pct}%`, 'lect-rep-pct')}</span>`,
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
// Role tags (2026-08-13): an optional parenthetical per name —
// "Alineación: Apple TV (broadcaster) · Nike (kit) · Grupo Salinas (dueño)"
// — sets a small role line under each chip. A roster of unlike actors
// (sponsor, broadcaster, owner, promoter) used to need its roles narrated
// in prose; on the chip they read at a glance. Optional per name; a bare
// roster renders exactly as before.
//
// Brand chips (2026-08-15, publisher directive: "en alineación usa colores
// de los equipos"). A roster of CLUBS was the one lineup that read as
// undifferentiated — six identical chips for six identities that each own a
// colour. Each name is resolved against the same registry `Venta`, `Cadena`
// and `Perfil` use, so a chip the registry knows wears that asset's
// contrast-corrected ink and nothing else changes. A roster of PEOPLE
// resolves to nothing and renders exactly as it did before.
type LineupEntry = { name: string; role: string; brandStyle: string };

function parseLineup(raw: string): LineupEntry[] | null {
  const items = stripTags(raw).split(ITEM_SEP).map(n => n.trim());
  if (items.length < 2 || items.length > 8) return null;
  const entries: LineupEntry[] = [];
  for (const item of items) {
    const tail = item.match(/^([\s\S]+?)\s*\(\s*([^)]{1,20})\s*\)$/);
    const rawName = (tail ? tail[1] : item).trim();
    const role = tail ? tail[2].trim() : '';
    // Resolved BEFORE the length check, the same order `Perfil` uses, so the
    // `Nombre #HEX #HEX` escape hatch spends its characters on the palette
    // rather than against the name's 28-character budget.
    const { label, palette } = resolveBrand(rawName);
    if (!label || label.length > 28) return null;
    entries.push({ name: label, role, brandStyle: brandStyleAttr(palette) });
  }
  return entries;
}

function buildLineup(entries: LineupEntry[]): string {
  const chips = entries
    .map((entry, i) => {
      const style = entry.brandStyle ? ` style="${entry.brandStyle}"` : '';
      // Same rule as `Perfil`: .lect-brand ALWAYS defines --brand-* with the
      // house green as its fallback, so carrying it on an unregistered name
      // would paint every roster of people green instead of letting it fall
      // through to the product accent it wears today.
      const brandClass = entry.brandStyle ? ' lect-brand' : '';
      return (
        `<span class="lect-lineup-chip${brandClass}"${style}>` +
        `<span class="lect-lineup-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>` +
        `<span class="lect-lineup-name">${esc(entry.name)}</span>` +
        (entry.role ? `<span class="lect-lineup-role">${esc(entry.role)}</span>` : '') +
        `</span>`
      );
    })
    .join('');
  const spoken = entries.map(e => (e.role ? `${e.name} (${e.role})` : e.name)).join(', ');
  return (
    `<div class="lect-device lect-lineup" role="note" aria-label="Alineación: ${esc(spoken)}">` +
    `<span class="lect-device-label">La alineación</span>` +
    `<div class="lect-lineup-row">${chips}</div></div>`
  );
}

// ————————————————————————————————————————————————————————— Cotización
// Range track on the tile (2026-08-13): an optional `Rango — <lo> a <hi>`
// item — "Cotización: On Holding — US$31.29 · −6.9% · Rango — US$25.90 a
// US$55.87" — draws the 52-week-range bar every finance terminal puts
// under a quote: a thin track from lo to hi with the current value marked
// on it. WHERE in its year a price sits is the context a bare tile can't
// carry. Drawn only when lo < value < hi all parse in one denomination —
// a marker outside its own track would be the chart lying.
type QuoteRange = { lo: string; hi: string; pct: number };
type Quote = { name: string; value: string; delta: string; down: boolean; note: string; range: QuoteRange | null };

function parseQuote(raw: string): Quote | null {
  const text = stripTags(raw);
  const kv = text.match(KV_RE);
  if (!kv) return null;
  const name = kv[1].trim();
  const allItems = kv[2].split(ITEM_SEP).map(s => s.trim());
  let rangeRaw = '';
  const items = allItems.filter(item => {
    const ikv = item.match(KV_RE);
    if (ikv && normalizeLabel(ikv[1]) === 'rango') {
      rangeRaw = ikv[2].trim();
      return false;
    }
    return true;
  });
  if (!name || name.length > 36 || items.length < 2 || items.length > 3) return null;
  const [value, delta, note = ''] = items;
  if (!value || value.length > 20 || !/\d/.test(value)) return null;
  if (!delta || delta.length > 14 || !delta.includes('%')) return null;

  let range: QuoteRange | null = null;
  if (rangeRaw) {
    const pair = rangeRaw.match(/^([\s\S]+?)\s+a\s+([\s\S]+)$/i);
    if (!pair) return null;
    const lo = denominatedOf(pair[1].trim());
    const hi = denominatedOf(pair[2].trim());
    const val = denominatedOf(value);
    if (
      lo && hi && val &&
      lo.unit === hi.unit && lo.unit === val.unit &&
      hi.value > lo.value && val.value >= lo.value && val.value <= hi.value &&
      pair[1].trim().length <= 20 && pair[2].trim().length <= 20
    ) {
      range = {
        lo: pair[1].trim(),
        hi: pair[2].trim(),
        pct: ((val.value - lo.value) / (hi.value - lo.value)) * 100,
      };
    }
    // A declared range that doesn't hold its own value is malformed data,
    // not an optional decoration to drop silently.
    if (!range) return null;
  }
  return { name, value, delta, down: /^[−-]/.test(delta), note, range };
}

function buildQuote(quote: Quote): string {
  const note = quote.note ? `<span class="lect-quote-note">${esc(quote.note)}</span>` : '';
  const range = quote.range
    ? `<div class="lect-quote-range" aria-label="Rango: ${esc(quote.range.lo)} a ${esc(quote.range.hi)}">` +
      `<span class="lect-quote-range-lo">${esc(quote.range.lo)}</span>` +
      `<span class="lect-quote-range-track"><span class="lect-quote-range-mark" style="left:${quote.range.pct.toFixed(1)}%"></span></span>` +
      `<span class="lect-quote-range-hi">${esc(quote.range.hi)}</span></div>`
    : '';
  return (
    `<div class="lect-device lect-quote" role="note" aria-label="Cotización: ${esc(quote.name)} ${esc(quote.value)}, ${esc(quote.delta)}${quote.range ? `, rango ${esc(quote.range.lo)} a ${esc(quote.range.hi)}` : ''}" data-dir="${quote.down ? 'down' : 'up'}">` +
    `<span class="lect-device-label">La cotización</span>` +
    `<div class="lect-quote-row"><span class="lect-quote-name">${esc(quote.name)}</span>` +
    `${countupSpan(quote.value, 'lect-quote-value')}` +
    `<span class="lect-quote-delta"><span aria-hidden="true">${quote.down ? '▼' : '▲'}</span> ${esc(quote.delta)}</span>${note}</div>${range}</div>`
  );
}

// ——————————————————————————————— Cotización, track form (round 5)
// The tile above is one moment. This is the same device given a TIME AXIS
// and a second, independently-scaled track, for the story where a market
// price is dragging a person's or a fund's stated wealth around with it.
//
//   Cotización: On Holding vs Patrimonio de Federer · Umbral — US$1,000M
//     · sep 2021 — US$35.00 · 12 ago 2026 — US$31.29 vs US$952M
//
// Why it is not `Serie` (2026-08-12, publisher directive). `Serie` puts two
// series on ONE shared Y axis and its own rules say the values must be the
// same kind of measure, because that shared axis is what makes the shapes
// comparable. A share price of US$31.29 and a fortune of US$952M are not
// the same measure and never will be. Forcing them onto one axis flattens
// the smaller series into the baseline and the chart says nothing. So this
// device gives each track its OWN scale: the reader is being shown
// correlation in time, not magnitude against magnitude, and the two axes
// are the honest way to draw that.
//
// Three things the tile form cannot express and this one is built for:
//
//   1. **The threshold.** `Umbral — US$1,000M` draws a labelled line on the
//      second track's scale. A story about someone ceasing to be a
//      billionaire IS the crossing of that line, and a chart that makes the
//      reader infer it from two printed numbers has buried its own lede.
//   2. **Gaps in the second track.** A price has a quote every day; a
//      fortune is estimated occasionally. A point may carry track A alone,
//      and track B simply starts where its first real value is. This is a
//      correctness feature, not a convenience: the alternative is inventing
//      the intermediate net-worth values, which the collection forbids.
//   3. **The zoom.** The device renders the whole arc AND the final window,
//      as two complete, independently-projected layers, and
//      ArticleMotion pushes from one to the other on scroll. The reader
//      gets the context first and the decisive moment second, in that
//      order, without either layer ever being geometrically wrong.
//
// Both layers resolve to correct geometry at rest, so the transition can be
// interrupted or never run at all. The `lect-cot-detail` strip below the
// chart carries the closing numbers as text and is always visible, which is
// what makes the whole thing degrade to something readable with no JS.
const Q_X0 = 52;
const Q_X1 = 596;
const Q_Y0 = 30;
const Q_Y1 = 190;
// The zoom window, as a share of the series. A three-point declaration
// lands on its last two (the move itself); a 258-day ticker lands on its
// last three weeks, which is the crash WITH the days either side of it
// rather than the crash alone. A fixed count cannot do both.
const ZOOM_SHARE = 0.08;
const ZOOM_MIN = 2;
// Past this many points in a window the dots stop being markers and start
// being the line, so a dense series draws as a bare stroke.
const DOT_LIMIT = 14;

type TrackPoint = {
  label: string;
  a: string;
  b: string;
  magA: number;
  magB: number | null;
  /** True for a track B value this module derived rather than the author declaring it. */
  estimated?: boolean;
};
type Track = {
  a: string;
  b: string;
  points: TrackPoint[];
  threshold: string;
  thresholdMag: number | null;
  /** `Ligado — sí`: fill track B between its anchors from track A's movement. */
  linked: boolean;
};

function parseTrack(raw: string): Track | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 4) return null;
  const head = items[0].trim();
  // The framing item is what separates this form from the tile: the tile's
  // first item is `Nombre — valor`, so a dash here means the caller wanted
  // the tile and this parser must decline rather than half-match it.
  if (!head || head.length > 64 || KV_RE.test(head)) return null;
  const sides = head.match(VS_RE);
  const a = (sides ? sides[1] : head).trim();
  const b = sides ? sides[2].trim() : '';
  if (!a || a.length > 34 || b.length > 34) return null;

  let threshold = '';
  let thresholdMag: number | null = null;
  let linked = false;
  const points: TrackPoint[] = [];
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    // An item with no ` — ` is an UNLABELLED track A point. This is what
    // makes a real ticker declarable: a year of daily closes is 250-odd
    // points, only two of which are ever drawn with a label, so spending
    // `fecha — valor` on every interior one would quadruple the paragraph
    // to carry text the renderer throws away. Bare values inherit their
    // currency from the labelled endpoints.
    if (!kv) {
      const bare = item.trim();
      if (!bare || bare.length > 20 || !/^[^\s]*\d/.test(bare)) return null;
      const mag = magnitudeOf(bare);
      if (mag === null) return null;
      points.push({ label: '', a: bare, b: '', magA: mag, magB: null });
      continue;
    }
    const label = kv[1].trim();
    const value = kv[2].trim();
    if (!label || label.length > 16) return null;
    if (normalizeLabel(label) === 'ligado') {
      if (!/^(si|s[ií]|yes)$/i.test(normalizeLabel(value))) return null;
      linked = true;
      continue;
    }
    if (normalizeLabel(label) === 'umbral') {
      if (threshold) return null;
      if (value.length > 20 || !/\d/.test(value)) return null;
      threshold = value;
      thresholdMag = magnitudeOf(value);
      if (thresholdMag === null) return null;
      continue;
    }
    const pair = value.match(VS_RE);
    const aVal = (pair ? pair[1] : value).trim();
    const bVal = pair ? pair[2].trim() : '';
    if (!aVal || aVal.length > 20 || !/\d/.test(aVal)) return null;
    if (bVal && (bVal.length > 20 || !/\d/.test(bVal))) return null;
    // A second track value on a device that never named a second track is
    // a typo, not a silent extra series.
    if (bVal && !b) return null;
    const magA = magnitudeOf(aVal);
    if (magA === null) return null;
    points.push({ label, a: aVal, b: bVal, magA, magB: bVal ? magnitudeOf(bVal) : null });
  }
  if (points.length < 3 || points.length > 300) return null;
  // The axis is labelled from the ends, so both ends have to carry one.
  if (!points[0].label || !points[points.length - 1].label) return null;

  // Unlabelled points are authored bare ("37.74") because repeating the
  // currency 250 times is noise in the source. Give it back here, once, so
  // nothing downstream has to know the difference: a zoom window opening on
  // an interior point printed a naked "37.74" against the labelled points'
  // "US$30.91" (caught on the Federer ticker, 2026-08-12).
  const prefix = splitFigure(points[0].a)?.pre ?? '';
  if (prefix) {
    for (const pt of points) {
      if (!/^\s*[\d.,]/.test(pt.a)) continue;
      pt.a = `${prefix}${pt.a}`;
    }
  }
  // Track B has to be a line, so it needs at least two real values; and a
  // threshold with nothing to cross is decoration.
  const bValues = points.filter(p => p.magB !== null).length;
  if (b && bValues < 2) return null;
  if (threshold && !b && points.length < 2) return null;
  if (linked && bValues < 2) return null;
  const track: Track = { a, b, points, threshold, thresholdMag, linked };
  if (linked) linkTrackB(track);
  return track;
}

// Fill track B between its declared anchors by marking it to market.
//
// A fortune that is mostly one shareholding moves every day that stock
// moves, but nobody publishes it every day: the anchors here are four
// Forbes estimates across a year, and a straight line between them says
// the wealth sat still for seven months, which is the one thing we know is
// false. So between anchors track B follows track A's actual movement.
//
// The model is the obvious one. Net worth = k × price + everything else.
// `k` (how many millions the fortune moves per unit of share price) comes
// from the LAST anchor pair, the only place we have a wealth move and a
// price move over the same interval. The residual — every asset that is
// not this stock — is then interpolated linearly between anchors, which is
// what absorbs the drift a share price cannot explain.
//
// Two properties make this publishable rather than invented: the curve
// passes exactly through every declared value, so no sourced figure is
// disturbed; and every point it adds is flagged `estimated`, which is what
// keeps its dots off the chart and puts the disclosure under the key. It
// is a level-3 reading in the evidence ladder (Playbook explaining what
// the evidence implies), never a level-1 fact, and it is only ever drawn
// because the author asked for it with `Ligado — sí`.
function linkTrackB(track: Track): void {
  const { points } = track;
  const anchors = points.map((p, i) => ({ p, i })).filter(o => o.p.magB !== null);
  if (anchors.length < 2) return;

  const last = anchors[anchors.length - 1];
  const prev = anchors[anchors.length - 2];
  const dPrice = last.p.magA - prev.p.magA;
  const dWealth = (last.p.magB as number) - (prev.p.magB as number);
  // A flat price across the closing pair leaves the sensitivity undefined;
  // without it there is nothing to fluctuate and the straight line stands.
  if (!dPrice) return;
  const k = dWealth / dPrice;
  if (!Number.isFinite(k) || k === 0) return;

  for (let seg = 0; seg < anchors.length - 1; seg += 1) {
    const from = anchors[seg];
    const to = anchors[seg + 1];
    const residualFrom = (from.p.magB as number) - k * from.p.magA;
    const residualTo = (to.p.magB as number) - k * to.p.magA;
    const span = to.i - from.i;
    if (span < 2) continue;
    for (let i = from.i + 1; i < to.i; i += 1) {
      const t = (i - from.i) / span;
      const residual = residualFrom + (residualTo - residualFrom) * t;
      points[i].magB = k * points[i].magA + residual;
      points[i].estimated = true;
    }
  }
}

// One complete, self-consistent chart layer over points[from..to]. Called
// twice with different windows — the whole arc and the closing window — so
// each layer is correctly projected on its own and the transition between
// them never has to fake geometry.
function trackLayer(track: Track, from: number, to: number, cls: string): string {
  const { points, a, b } = track;
  const win = points.slice(from, to + 1);
  const span = win.length - 1;
  const x = (i: number) => (span === 0 ? (Q_X0 + Q_X1) / 2 : Q_X0 + (i * (Q_X1 - Q_X0)) / span);

  // Each track scales to ITS OWN visible range, padded, which is what makes
  // the zoom informative: a 19% fall that is a rounding error against the
  // full arc becomes the whole height of the closing window.
  const scaleFor = (vals: number[], extra: number | null) => {
    const all = extra !== null ? [...vals, extra] : vals;
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const pad = (hi - lo) * 0.18 || Math.abs(hi) * 0.1 || 1;
    const min = lo - pad;
    const max = hi + pad;
    return (v: number) => Q_Y1 - ((v - min) / (max - min || 1)) * (Q_Y1 - Q_Y0);
  };
  // Track B, when there IS a threshold, is scaled SYMMETRICALLY about it
  // rather than to its own extremes, which pins the threshold to the middle
  // of the box at every zoom level.
  //
  // This is not a cosmetic choice. Auto-scaling both tracks to their own
  // min/max means that in any two-point window each line runs corner to
  // corner, so A and B come out exactly collinear and the chart states
  // nothing at the moment it is most magnified — which is precisely the
  // window the zoom exists to show (caught on the Federer render,
  // 2026-08-12, where the two lines sat perfectly on top of each other).
  // Anchoring B on the threshold also makes the crossing legible by
  // construction: above the middle is still a billionaire, below it is not.
  const thresholdScale = (vals: number[], mark: number) => {
    const reach = Math.max(...vals.map(v => Math.abs(v - mark)), Math.abs(mark) * 0.004);
    const min = mark - reach * 1.35;
    const max = mark + reach * 1.35;
    return (v: number) => Q_Y1 - ((v - min) / (max - min)) * (Q_Y1 - Q_Y0);
  };

  const yA = scaleFor(win.map(p => p.magA), null);
  const bPts = win.map((p, i) => ({ p, i })).filter(o => o.p.magB !== null);
  const bVals = bPts.map(o => o.p.magB as number);
  const yB = !bPts.length
    ? () => Q_Y1
    : track.thresholdMag !== null
      ? thresholdScale(bVals, track.thresholdMag)
      : scaleFor(bVals, null);

  const lineA = win.map((p, i) => `${x(i).toFixed(1)},${yA(p.magA).toFixed(1)}`).join(' ');
  const areaA = `${lineA} ${x(span).toFixed(1)},${Q_Y1} ${x(0).toFixed(1)},${Q_Y1}`;
  const lineB = bPts.map(o => `${x(o.i).toFixed(1)},${yB(o.p.magB as number).toFixed(1)}`).join(' ');

  const grid = [0, 0.5, 1]
    .map(f => {
      const gy = (Q_Y1 - f * (Q_Y1 - Q_Y0)).toFixed(1);
      return `<line class="lect-cot-grid" x1="${Q_X0}" y1="${gy}" x2="${Q_X1}" y2="${gy}" />`;
    })
    .join('');

  // The threshold rides track B's scale (or A's when there is no B), so it
  // is drawn only when the window it belongs to actually contains it.
  // The rule is drawn under the data; its caption is drawn OVER it. Keeping
  // both in the same early group let the lines paint across the text, which
  // the linked track does constantly since it lives near the threshold.
  let threshold = '';
  let thresholdText = '';
  if (track.thresholdMag !== null && bPts.length) {
    const ty = yB(track.thresholdMag);
    if (ty >= Q_Y0 - 2 && ty <= Q_Y1 + 2) {
      threshold = `<line class="lect-cot-umbral" x1="${Q_X0}" y1="${ty.toFixed(1)}" x2="${Q_X1}" y2="${ty.toFixed(1)}" />`;
      thresholdText = `<text class="lect-cot-umbral-txt" x="${Q_X0}" y="${(ty - 7).toFixed(1)}" text-anchor="start">${esc(track.threshold)}</text>`;
    }
  }

  const dotsA = win.length > DOT_LIMIT
    ? ''
    : win
        .map((p, i) => `<circle class="lect-cot-dot" data-side="a" cx="${x(i).toFixed(1)}" cy="${yA(p.magA).toFixed(1)}" r="4" />`)
        .join('');
  // A dot is a claim that someone published this number, so modelled points
  // never get one: the line may be an estimate, the markers on it are not.
  const dotsB = bPts
    .filter(o => !o.p.estimated)
    .map(o => `<circle class="lect-cot-dot" data-side="b" cx="${x(o.i).toFixed(1)}" cy="${yB(o.p.magB as number).toFixed(1)}" r="4" />`)
    .join('');

  // Only the window's endpoints get printed values. Labelling every point
  // is what turned the first draft into a wall of numbers over the line it
  // was supposed to reveal.
  const edge = (i: number) => (i === 0 ? 'start' : i === span ? 'end' : 'middle');
  const ABOVE = -12;
  const BELOW = 20;
  const vals = win
    .map((p, i) => {
      if (i !== 0 && i !== span) return '';
      const label = (side: 'a' | 'b', y: number, text: string) =>
        `<text class="lect-cot-val" data-side="${side}" x="${x(i).toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${edge(i)}">${esc(text)}</text>`;
      // An estimated point carries a magnitude but no declared string, so it
      // draws no figure — the chart never prints a number nobody published.
      if (p.magB === null || !p.b) return label('a', yA(p.magA) + ABOVE, p.a);
      // Whichever track sits HIGHER at this point is labelled above its own
      // dot and the lower one below its own — decided per point, not per
      // track. Fixing "A above, B below" collides exactly where the two are
      // close, because A's label reaches up while B's reaches down into the
      // same gap: on the Federer ticker the closing US$30.91 and US$952M
      // overprinted despite their dots being 37px apart. Same rule, and the
      // same reason, as the Serie device.
      const ya = yA(p.magA);
      const yb = yB(p.magB);
      const aOnTop = ya <= yb;
      return (
        label('a', ya + (aOnTop ? ABOVE : BELOW), p.a) +
        label('b', yb + (aOnTop ? BELOW : ABOVE), p.b)
      );
    })
    .join('');

  // Only a point's OWN label is ever drawn. A zoom window normally opens on
  // an unlabelled interior point, and the first instinct — walk back to the
  // nearest labelled point — reaches all the way to index 0 on a dense
  // series, which stamped "1 ago 2025" on a window that starts three weeks
  // before the end. An axis is worse than useless when it lies, so an
  // unlabelled edge simply gets no tick; the detail strip under the chart
  // carries the closing date regardless.
  const ticks = [0, span]
    .filter((i, n, all) => all.indexOf(i) === n)
    .map(i =>
      win[i].label
        ? `<text class="lect-cot-tick" x="${x(i).toFixed(1)}" y="${Q_Y1 + 26}" text-anchor="${edge(i)}">${esc(win[i].label)}</text>`
        : '',
    )
    .join('');

  // Track B gets a paper-coloured under-stroke before its own. Over a dense
  // track A (258 closes drawn as a near-solid band) a 2.5px line simply
  // disappears into the texture — the pixels are there and the reader still
  // cannot follow it, which for the series carrying the story's threshold
  // is the same as not drawing it. The halo costs nothing on a sparse chart
  // and is what makes the quiet series survive a loud one.
  const bLayer = bPts.length > 1
    ? `<polyline class="lect-cot-halo" points="${lineB}" />` +
      `<polyline class="lect-cot-line" data-side="b" pathLength="1" points="${lineB}" />${dotsB}`
    : '';

  return (
    `<g class="${cls}">` +
    grid +
    threshold +
    `<polygon class="lect-cot-area" points="${areaA}" />` +
    `<polyline class="lect-cot-line" data-side="a" pathLength="1" points="${lineA}" />` +
    dotsA +
    bLayer +
    thresholdText +
    vals +
    ticks +
    `</g>`
  );
}

function buildTrack(track: Track): string {
  const { points, a, b } = track;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const tail = Math.max(ZOOM_MIN, Math.round(points.length * ZOOM_SHARE));
  const from = Math.max(0, points.length - tail);
  // The ticker wears its OWN brand, the same way a Venta deed wears the
  // club's: same registry, same contrast guard, same --pb-brand-*
  // properties scoped to the device. Track A is the company being quoted,
  // so it is track A's name that resolves.
  const { label: assetLabel, palette } = resolveBrand(a);
  const brandStyle = brandStyleAttr(palette);

  // The closing move on track A, computed rather than authored, same rule
  // Venta's multiple follows: a number the device derives cannot disagree
  // with the prose beside it.
  let move = '';
  let down = false;
  if (prev && prev.magA > 0) {
    const pct = ((last.magA - prev.magA) / prev.magA) * 100;
    down = pct < 0;
    move = `${formatNumeric(Math.abs(pct), Math.abs(pct) >= 10 ? 1 : 2)}%`;
  }

  const crossed =
    track.thresholdMag !== null && last.magB !== null && last.magB < track.thresholdMag;

  const detail = [
    `<span class="lect-cot-detail-when">${esc(last.label)}</span>`,
    `<span class="lect-cot-detail-item"><span class="lect-cot-detail-k">${esc(a)}</span>` +
      `${countupSpan(last.a, 'lect-cot-detail-v')}` +
      (move
        ? `<span class="lect-cot-move" data-dir="${down ? 'down' : 'up'}">` +
          `<span aria-hidden="true">${down ? '▼' : '▲'}</span> ${esc(move)}</span>`
        : '') +
      `</span>`,
    b && last.magB !== null
      ? `<span class="lect-cot-detail-item"><span class="lect-cot-detail-k">${esc(b)}</span>` +
        `${countupSpan(last.b, 'lect-cot-detail-v')}` +
        (crossed
          ? `<span class="lect-cot-broke">bajo ${esc(track.threshold)}</span>`
          : '') +
        `</span>`
      : '',
  ].join('');

  const key =
    `<span class="lect-cot-name" data-side="a">${esc(a)}</span>` +
    (b ? `<span class="lect-cot-name" data-side="b">${esc(b)}</span>` : '');

  // The disclosure is not optional and not a footnote: a reader looking at a
  // daily line for a figure that is published four times a year has to be
  // told which part of it is the estimate.
  const declared = points.filter(p => p.magB !== null && !p.estimated).length;
  const note = track.linked
    ? `<div class="lect-cot-note">${esc(b)}: ${declared} estimaciones publicadas. ` +
      `Entre ellas, Playbook proyecta el valor con el movimiento diario de ${esc(a)}.</div>`
    : '';

  const spoken =
    `Cotización de ${a}${b ? ` y ${b}` : ''}. ` +
    (track.linked ? `${b} tiene ${declared} estimaciones publicadas; el resto de la curva es una proyección. ` : '') +
    points.filter(p => p.label).map(p => `${p.label}: ${p.a}${p.b ? `, ${b} ${p.b}` : ''}`).join('; ') +
    (move ? `. Movimiento final ${down ? 'a la baja' : 'al alza'} de ${move}` : '') +
    (crossed ? `, por debajo del umbral de ${track.threshold}` : '') +
    '.';

  return (
    `<div class="lect-device lect-brand lect-cot" role="note" aria-label="${esc(spoken)}"` +
    `${brandStyle ? ` style="${brandStyle}"` : ''}>` +
    `<span class="lect-device-label">La cotización</span>` +
    `<div class="lect-cot-crest"><span class="lect-cot-asset">${esc(assetLabel)}</span></div>` +
    `<div class="lect-cot-key" aria-hidden="true">${key}</div>` +
    note +
    `<div class="lect-cot-stage">` +
    `<svg class="lect-cot-chart" viewBox="0 0 640 232" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
    trackLayer(track, 0, points.length - 1, 'lect-cot-wide') +
    trackLayer(track, from, points.length - 1, 'lect-cot-zoom') +
    `</svg></div>` +
    `<div class="lect-cot-detail">${detail}</div>` +
    `</div>`
  );
}

// ———————————————————————————————————————————————————————— Resultados
// One institution's reporting period, line by line, each with its own
// change against the comparable period. The shape a quarterly filing
// actually has, and the one gap left in the collection: Recibo lists
// labelled amounts but has no notion of a delta, Cotización carries a
// value AND a delta but only for a single tile, Salto moves one metric
// from before to after, and Duelo needs two different actors. An earnings
// release is none of those — it is four to six lines belonging to the
// same company, each moving by its own amount, and the story is usually
// in which lines disagree with each other.
//
//   Resultados: Fox Corporation, Q4 fiscal 2026 · Ingresos — US$4,210M (+28%)
//
// First item names the subject and period (no ` — ` in it, same way Duelo
// and Serie spend their first item on the framing). Every item after it is
// `etiqueta — valor`, with an OPTIONAL signed percentage in parentheses at
// the end. Two to six rows.
//
// The delta is optional per row on purpose: a filing routinely reports a
// line the prior period has no comparable for (a segment that did not
// exist, a first reported quarter), and forcing a number there is how a
// device starts inventing data. A row with no parenthetical simply shows
// its value.
//
// Direction colour follows Salto's convention (green up, red down) rather
// than trying to be clever about whether "up" is good for that particular
// line. An expense rising is drawn green here, exactly as a Salto on the
// same expense would be, and the label plus the surrounding prose carry
// the judgement. Consistency across the collection beats a per-device
// guess at sentiment: a reader who learns the ramp once should not have to
// re-learn it per device.
type ResultRow = { label: string; value: string; delta: string; down: boolean };
type Results = { heading: string; rows: ResultRow[] };

const DELTA_TAIL_RE = /^([\s\S]+?)\s*\(\s*([+\-−–][^)]*%)\s*\)$/;

function parseResults(raw: string): Results | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 3 || items.length > 7) return null;
  const heading = items[0].trim();
  if (!heading || heading.length > 52 || KV_RE.test(heading)) return null;
  const rows: ResultRow[] = [];
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    if (!label || label.length > 42) return null;
    const tail = kv[2].trim().match(DELTA_TAIL_RE);
    const value = (tail ? tail[1] : kv[2]).trim();
    const delta = tail ? tail[2].trim() : '';
    if (!value || value.length > 24 || !/\d/.test(value)) return null;
    if (delta && delta.length > 14) return null;
    rows.push({ label, value, delta, down: /^[−–-]/.test(delta) });
  }
  return { heading, rows };
}

function buildResults(results: Results): string {
  // Delta magnitude bars (2026-08-13). The statement's story is usually in
  // which lines DISAGREE — revenue up 28% while a segment falls 38% — and a
  // column of percentages makes the reader compare digits. A thin bar under
  // each delta, scaled to the panel's largest move and colored by
  // direction, makes the divergence scannable in one pass. Rows with no
  // delta simply carry no bar; grown by the shared [data-lect-seg]
  // choreography ArticleMotion already runs for the Reparto.
  const deltaMag = (d: string) => {
    const m = d.match(/(\d[\d.]*)\s*%/);
    return m ? Number(m[1]) : 0;
  };
  const maxDelta = Math.max(0, ...results.rows.map(r => deltaMag(r.delta)));
  const rows = results.rows
    .map(row => {
      const delta = row.delta
        ? `<span class="lect-res-delta" data-dir="${row.down ? 'down' : 'up'}">` +
          // The arrow already carries the sign; keeping the glyph too gives
          // "▼ −38%", which reads as a double negative next to a plain
          // "▲ 28%". Strip it so both directions are written the same way
          // and the column of signs stays scannable.
          `<span aria-hidden="true">${row.down ? '▼' : '▲'}</span> ${esc(row.delta.replace(/^[+\-−–]\s*/, ''))}</span>`
        : '<span class="lect-res-delta" data-dir="flat"></span>';
      const mag = deltaMag(row.delta);
      const bar =
        row.delta && maxDelta > 0
          ? `<span class="lect-res-deltabar" aria-hidden="true"><span class="lect-res-deltabar-fill" data-lect-seg data-dir="${row.down ? 'down' : 'up'}" style="width:${Math.max(3, (mag / maxDelta) * 100).toFixed(1)}%"></span></span>`
          : '';
      return (
        `<div class="lect-res-row"><span class="lect-res-label">${esc(row.label)}</span>` +
        `${countupSpan(row.value, 'lect-res-value')}${delta}${bar}</div>`
      );
    })
    .join('');
  return (
    `<div class="lect-device lect-res" role="note" aria-label="Resultados: ${esc(results.heading)}">` +
    `<span class="lect-device-label">Resultados</span>` +
    `<div class="lect-res-panel">` +
    `<span class="lect-res-head">${esc(results.heading)}</span>` +
    `<div class="lect-res-body" data-lect-stagger>${rows}</div></div></div>`
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
  /** Computed per-row ratio, larger side over smaller — "2.0×" — with the winning side. */
  ratio: { text: string; side: 'a' | 'b' } | null;
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
    // The row's finding, COMPUTED (2026-08-13, same family as Venta's
    // multiple): how many times bigger the winning side is, shown as a
    // small "2.0×" chip tinted with the winner's color. Only when both
    // sides are positive figures in the same denomination — a ratio across
    // currencies or against a negative is arithmetic noise — and only when
    // it says something (≥1.15×; two near-equal bars already read as
    // near-equal).
    let ratio: DuelRow['ratio'] = null;
    const da = denominatedOf(row.a);
    const db = denominatedOf(row.b);
    if (da && db && da.unit === db.unit && da.value > 0 && db.value > 0) {
      const r = Math.max(da.value, db.value) / Math.min(da.value, db.value);
      if (r >= 1.15 && Number.isFinite(r)) {
        ratio = {
          text: `${formatNumeric(r, r >= 10 ? 0 : 1)}×`,
          side: da.value >= db.value ? 'a' : 'b',
        };
      }
    }
    return {
      label: row.label,
      a: row.a,
      b: row.b,
      aPct: pct(row.magA),
      bPct: pct(row.magB),
      aNeg: NEGATIVE_RE.test(row.a),
      bNeg: NEGATIVE_RE.test(row.b),
      ratio,
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
        `<span class="lect-duelo-label">${esc(row.label)}` +
        (row.ratio
          ? ` <span class="lect-duelo-ratio" data-side="${row.ratio.side}">${esc(row.ratio.text)}</span>`
          : '') +
        `</span>` +
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
  //
  // Selective labels past five points (2026-08-13): a dense series printing
  // every value is a wall of numbers over the line it exists to reveal —
  // the same lesson the Cotización track learned. Up to five points, every
  // value prints (unchanged); past that, only the endpoints and each
  // series' own peak carry a figure. The dots still mark every point and
  // the aria-label still speaks all of them.
  const ABOVE = -13;
  const BELOW = 20;
  const peakA = points.reduce((best, p, i) => (p.magA > points[best].magA ? i : best), 0);
  const peakB = points.reduce((best, p, i) => (p.magB > points[best].magB ? i : best), 0);
  const labelled = (i: number) =>
    points.length <= 5 || i === 0 || i === points.length - 1 || i === peakA || i === peakB;
  const labels = points
    .map((p, i) => {
      if (!labelled(i)) return '';
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

// ————————————————————————————————————————————————— Venta / Cadena
// The two transfer-of-title devices (round 4, 2026-08-12, publisher
// directive). A sale is the one story shape the round-3 collection could
// only ever tell in pieces: `Jugada` names the two sides and drops the
// price, `Salto` moves the price and drops the sides, `Cifra clave` prints
// the number alone. None of them can say "this asset, from A to B, for
// this much" in one beat, which is the entire content of an acquisition
// story.
//
//   Venta:  Lakers · Precio — US$12,500M · De — Mark Walter · A — Kushner y Iger
//           → the deed: the asset's own colours, the two parties, the price
//   Cadena: Lakers · 1979 — Buss — US$67.5M · 2025 — Walter — US$10,000M
//           → the chain of title, each era's bar as long as it was held
//
// What makes them "made to measure" is that the ASSET is the subject, not
// a label on someone else's chart — so both wear the brand palette
// resolved by lib/brand-colors.ts, contrast-corrected for both themes and
// scoped to the device element. An asset with no registered palette (a
// rights package, a stadium, a league stake) is a first-class case and
// falls back to Playbook's own house palette, identically on every
// product; the devices are declared for any asset worth the beat, not for
// clubs only.
//
// Two ratios are COMPUTED rather than authored — Venta's multiple against
// the prior price, Cadena's multiple across the whole chain. Same argument
// the Mapa legend makes for counting its own codes: a figure the device
// derives can't contradict the prose the way a hand-typed one can. Both
// are omitted silently when the units disagree (€ against US$, or a
// figure that won't parse), because a wrong multiple is worse than none.

type Denominated = { value: number; unit: string };

// "US$12,500M" → { value: 12500, unit: "US$" }. The magnitude comes from
// the Duelo's scale table (magnitudeOf above) rather than a second one of
// its own, so what "M" or "mil millones" means can never diverge between a
// bar the reader sees and a multiple the reader is told. What this adds is
// the UNIT — the currency prefix, normalized — which is the guard: two
// figures only divide into an honest multiple when they are denominated
// the same way, and "€900M → US$1,200M" is a currency change, not growth.
function denominatedOf(figure: string): Denominated | null {
  const parts = splitFigure(figure);
  if (!parts) return null;
  const value = magnitudeOf(figure);
  if (value === null || value <= 0) return null;
  return { value, unit: parts.pre.replace(/\s+/g, '').toUpperCase() };
}

// The growth from `before` to `after`, as "185×" / "1.25×" — or '' when the
// two can't honestly be divided. Precision falls with size on purpose: a
// 185× move over half a century doesn't gain anything from two decimals,
// and a 1.25× flip loses the whole story without them.
function multipleBetween(before: string, after: string): { text: string; down: boolean } | null {
  const from = denominatedOf(before);
  const to = denominatedOf(after);
  if (!from || !to || from.unit !== to.unit) return null;
  const ratio = to.value / from.value;
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  const decimals = ratio >= 10 ? 0 : ratio >= 2 ? 1 : 2;
  return { text: `${formatNumeric(ratio, decimals)}×`, down: ratio < 1 };
}

type Sale = {
  asset: string;
  brandStyle: string;
  price: string;
  from: string;
  to: string;
  prior: string;
  priorNote: string;
  date: string;
  multiple: { text: string; down: boolean } | null;
};

// Accent- and case-insensitive row labels. `De`/`A` are the two the syntax
// can't do without; everything else is optional. An UNKNOWN label rejects
// the whole declaration rather than being ignored — devices fail loud, and
// a silently-dropped row in a deed is a fact the reader never learns was
// declared.
const SALE_LABELS: Record<string, keyof Pick<Sale, 'price' | 'from' | 'to' | 'prior' | 'date'>> = {
  precio: 'price',
  de: 'from',
  a: 'to',
  anterior: 'prior',
  fecha: 'date',
};

function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// A trailing parenthetical on a value: "US$10,000M (2025)" → value +
// "2025". Same shape as Resultados' DELTA_TAIL_RE, and reused for the same
// reason — the count-up needs the figure clean, and the note is context
// that belongs beside it rather than inside it.
const NOTE_TAIL_RE = /^([\s\S]+?)\s*\(\s*([^)]{1,24})\s*\)$/;

function parseSale(raw: string): Sale | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 4 || items.length > 6) return null;
  const asset = items[0].trim();
  // Same framing-item rule Duelo/Serie/Resultados carry: the first item
  // names the subject and must not itself look like a labelled row.
  if (!asset || asset.length > 48 || KV_RE.test(asset)) return null;

  const fields: Partial<Record<'price' | 'from' | 'to' | 'prior' | 'date', string>> = {};
  let priorNote = '';
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const key = SALE_LABELS[normalizeLabel(kv[1])];
    // Unknown label, or the same row declared twice.
    if (!key || fields[key] !== undefined) return null;
    let value = kv[2].trim();
    if (key === 'prior') {
      const tail = value.match(NOTE_TAIL_RE);
      if (tail) {
        value = tail[1].trim();
        priorNote = tail[2].trim();
      }
    }
    if (!value) return null;
    fields[key] = value;
  }

  const { price, from, to, prior = '', date = '' } = fields;
  if (!price || !from || !to) return null;
  if (price.length > 24 || !/\d/.test(price)) return null;
  if (from.length > 48 || to.length > 48) return null;
  if (prior && (prior.length > 24 || !/\d/.test(prior))) return null;
  if (date.length > 24) return null;

  const { label, palette } = resolveBrand(asset);
  if (!label || label.length > 32) return null;

  return {
    asset: label,
    brandStyle: brandStyleAttr(palette),
    price,
    from,
    to,
    prior,
    priorNote,
    date,
    multiple: prior ? multipleBetween(prior, price) : null,
  };
}

function buildSale(sale: Sale): string {
  const style = sale.brandStyle ? ` style="${sale.brandStyle}"` : '';
  const spoken = `Venta de ${sale.asset} en ${sale.price}, de ${sale.from} a ${sale.to}`;

  const footParts: string[] = [];
  if (sale.prior) {
    const note = sale.priorNote ? ` <span class="lect-venta-note">${esc(sale.priorNote)}</span>` : '';
    footParts.push(
      `<span class="lect-venta-prior"><span class="lect-venta-foot-label">Anterior</span> ` +
        `<span class="lect-venta-foot-value">${esc(sale.prior)}</span>${note}</span>`,
    );
  }
  if (sale.multiple) {
    // The multiple counts up (2026-08-13): "185×" ticking from zero as the
    // deed enters view is the story's punchline animating — countupSpan
    // keeps the "×" suffix and locks width, same as every other figure.
    footParts.push(
      `<span class="lect-venta-mult" data-dir="${sale.multiple.down ? 'down' : 'up'}">` +
        `${countupSpan(sale.multiple.text, 'lect-venta-mult-fig')}</span>`,
    );
  }
  if (sale.date) {
    footParts.push(`<span class="lect-venta-date">${esc(sale.date)}</span>`);
  }
  const foot = footParts.length ? `<div class="lect-venta-foot">${footParts.join('')}</div>` : '';

  return (
    `<div class="lect-device lect-brand lect-venta" role="note" aria-label="${esc(spoken)}"${style}>` +
    `<span class="lect-device-label">La venta</span>` +
    `<div class="lect-venta-deed">` +
    `<div class="lect-venta-crest"><span class="lect-venta-asset">${esc(sale.asset)}</span></div>` +
    `<div class="lect-venta-parties" data-lect-stagger>` +
    `<span class="lect-venta-party" data-side="from">` +
    `<span class="lect-venta-role">De</span>` +
    `<span class="lect-venta-name">${esc(sale.from)}</span></span>` +
    `<span class="lect-venta-arrow" aria-hidden="true">→</span>` +
    `<span class="lect-venta-party" data-side="to">` +
    `<span class="lect-venta-role">A</span>` +
    `<span class="lect-venta-name">${esc(sale.to)}</span></span>` +
    `</div>` +
    `<div class="lect-venta-price">` +
    `<span class="lect-venta-price-label">Precio</span>` +
    countupSpan(sale.price, 'lect-venta-figure') +
    `</div>` +
    foot +
    `</div></div>`
  );
}

type ChainLink = { when: string; who: string; price: string; year: number | null };
type Chain = {
  asset: string;
  brandStyle: string;
  links: ChainLink[];
  multiple: { text: string; down: boolean } | null;
};

// `1979 — Jerry Buss — US$67.5M` — three parts, so the em dash splits
// twice. KV_RE is non-greedy on its first capture, so the leftmost dash
// takes the date off and the remainder splits again on the next one; a
// link carrying a third dash is malformed and rejects the device.
function parseChain(raw: string): Chain | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 3 || items.length > 7) return null;
  const asset = items[0].trim();
  if (!asset || asset.length > 48 || KV_RE.test(asset)) return null;

  const links: ChainLink[] = [];
  for (const item of items.slice(1)) {
    const first = item.match(KV_RE);
    if (!first) return null;
    const when = first[1].trim();
    const rest = first[2].match(KV_RE);
    if (!rest) return null;
    const who = rest[1].trim();
    const price = rest[2].trim();
    if (!when || when.length > 14) return null;
    if (!who || who.length > 32 || KV_RE.test(who)) return null;
    if (!price || price.length > 20 || !/\d/.test(price) || KV_RE.test(price)) return null;
    const year = when.match(/\b(1\d{3}|2\d{3})\b/);
    links.push({ when, who, price, year: year ? Number(year[1]) : null });
  }

  // A chain has to run forwards. Out-of-order years are almost always a
  // transposed pair rather than a deliberate reverse-chronology, and the
  // hold bars below would draw negative widths for them.
  for (let i = 1; i < links.length; i += 1) {
    const prev = links[i - 1].year;
    const curr = links[i].year;
    if (prev !== null && curr !== null && curr < prev) return null;
  }

  const { label, palette } = resolveBrand(asset);
  if (!label || label.length > 32) return null;

  return {
    asset: label,
    brandStyle: brandStyleAttr(palette),
    links,
    multiple: multipleBetween(links[0].price, links[links.length - 1].price),
  };
}

function buildChain(chain: Chain): string {
  const style = chain.brandStyle ? ` style="${chain.brandStyle}"` : '';
  const { links } = chain;

  // The hold bar is the argument: a franchise held for 46 years and then
  // flipped twice in fourteen months should LOOK like that. Only drawn
  // when every link carries a real year — a chain dated "los ochenta" has
  // no spans to measure, and a bar drawn from a guess would be the one
  // part of the device the reader can't check.
  const years = links.map(l => l.year);
  const dated = years.every((y): y is number => y !== null);
  const spans = dated ? links.slice(0, -1).map((l, i) => (years[i + 1] as number) - (l.year as number)) : [];
  const widest = spans.length ? Math.max(...spans) : 0;

  const rows = links
    .map((link, i) => {
      const span = dated && i < spans.length ? spans[i] : null;
      // A same-year handover is a real span of zero; it still gets a
      // hairline so the rail reads as continuous rather than broken.
      const hold =
        span === null
          ? ''
          : `<span class="lect-cadena-hold">` +
            `<span class="lect-cadena-holdbar" data-lect-hold style="width:${
              widest > 0 ? Math.max(2, (span / widest) * 100).toFixed(1) : 100
            }%"></span>` +
            `<span class="lect-cadena-holdtxt">${span === 1 ? '1 año' : `${span} años`}</span></span>`;
      // Per-era appreciation (2026-08-13): what THIS handover paid over the
      // last one, computed via the same multipleBetween as the chain's
      // total — so the reader sees which owner captured the growth, not
      // just that the whole chain grew. Omitted on the first link and
      // whenever the denominations disagree.
      const step = i > 0 ? multipleBetween(links[i - 1].price, link.price) : null;
      const stepChip = step
        ? `<span class="lect-cadena-step" data-dir="${step.down ? 'down' : 'up'}">${esc(step.text)}</span>`
        : '';
      return (
        `<li class="lect-cadena-link"${i === links.length - 1 ? ' data-current="true"' : ''}>` +
        `<span class="lect-cadena-when">${esc(link.when)}</span>` +
        `<span class="lect-cadena-who">${esc(link.who)}</span>` +
        countupSpan(link.price, 'lect-cadena-price') +
        stepChip +
        hold +
        `</li>`
      );
    })
    .join('');

  const first = links[0];
  const last = links[links.length - 1];
  const foot = chain.multiple
    ? `<div class="lect-cadena-foot">` +
      `<span class="lect-cadena-foot-txt">De ${esc(first.price)} a ${esc(last.price)}</span>` +
      `<span class="lect-cadena-mult" data-dir="${chain.multiple.down ? 'down' : 'up'}">` +
      `${esc(chain.multiple.text)}</span></div>`
    : '';

  const spoken = `Cadena de propiedad de ${chain.asset}: ${links
    .map(l => `${l.when}, ${l.who}, ${l.price}`)
    .join('; ')}`;

  return (
    `<div class="lect-device lect-brand lect-cadena" role="note" aria-label="${esc(spoken)}"${style}>` +
    `<span class="lect-device-label">La cadena</span>` +
    `<div class="lect-cadena-panel">` +
    `<span class="lect-cadena-asset">${esc(chain.asset)}</span>` +
    `<ol class="lect-cadena-list" data-lect-stagger>${rows}</ol>` +
    foot +
    `</div></div>`
  );
}

// ————————————————————————————————————— The roadmap eight (2026-08-14)
// docs/device-roadmap.md §2, built in its recommended order. Same house
// contract as every device above: ` — `/` · ` grammar, framing first item
// where the syntax names a subject, fixed row vocabularies that REJECT
// unknown labels, computed figures never authored, fail-loud null on
// anything malformed. Each claims its exclusive pair (see
// EXCLUSIVE_PAIRS below) per the roadmap's sequencing note.

// —————————————————————————————————————————————————————— Contrato
// `Contrato: Apple TV ↔ MLS · Monto — US$250M por año · Plazo — 2023 a
//  2032 · Cláusula — salida mutua en 2028`
// A rights/sponsorship deal signed for a term — `Venta` transfers title, a
// contract RENTS it. The term draws as a filled bar with "hoy" marked on
// it (computed at render; every public route is force-dynamic so it stays
// fresh), and a per-year Monto also computes the term total in the foot —
// `US$2,500M / 10 años`, seasons counted inclusively like the industry
// counts them (2023 a 2032 = 10 seasons, the roadmap's own arithmetic).
type Contract = {
  left: string;
  right: string;
  arrow: '↔' | '→';
  amount: string;
  perYear: boolean;
  start: number;
  end: number;
  clause: string;
  total: string | null;
};

const CONTRACT_LABELS: Record<string, 'amount' | 'term' | 'clause'> = {
  monto: 'amount',
  plazo: 'term',
  clausula: 'clause',
};

const PER_YEAR_RE = /\s*(?:por\s+año|al\s+año|anual(?:es)?)\s*$/i;

function parseContract(raw: string): Contract | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 3 || items.length > 4) return null;
  const pair = items[0].trim().match(/^(.{1,32}?)\s*(↔|<->|→|->)\s*(.{1,32})$/);
  if (!pair) return null;
  const left = pair[1].trim();
  const right = pair[3].trim();
  if (!left || !right) return null;

  const fields: Partial<Record<'amount' | 'term' | 'clause', string>> = {};
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const key = CONTRACT_LABELS[normalizeLabel(kv[1])];
    if (!key || fields[key] !== undefined) return null;
    const value = kv[2].trim();
    if (!value) return null;
    fields[key] = value;
  }
  const { amount = '', term = '', clause = '' } = fields;
  if (!amount || amount.length > 32 || !/\d/.test(amount) || !term || clause.length > 60) return null;

  const termMatch = term.match(/^(\d{4})\s*(?:a|–|—|-)\s*(\d{4})$/);
  if (!termMatch) return null;
  const start = Number(termMatch[1]);
  const end = Number(termMatch[2]);
  if (end <= start || end - start > 40) return null;

  const perYear = PER_YEAR_RE.test(amount);
  const figure = amount.replace(PER_YEAR_RE, '').trim();
  if (figure.length > 24) return null;

  // Per-year amount × inclusive seasons = the computed term total, only
  // when the figure honestly parses — never guessed.
  let total: string | null = null;
  if (perYear) {
    const parts = splitFigure(figure);
    const num = parts && parseNumeric(parts.num);
    if (parts && num) {
      const seasons = end - start + 1;
      total = `${parts.pre}${formatNumeric(num.value * seasons, num.decimals)}${parts.post} / ${seasons} años`;
    }
  }

  return { left, right, arrow: pair[2] === '→' || pair[2] === '->' ? '→' : '↔', amount: figure, perYear, start, end, clause, total };
}

function buildContract(contract: Contract, now: Date = new Date()): string {
  const spanYears = contract.end + 1 - contract.start;
  const nowPos = now.getFullYear() + now.getMonth() / 12;
  const rawPct = ((nowPos - contract.start) / spanYears) * 100;
  const inTerm = rawPct >= 0 && rawPct <= 100;
  const hoy = inTerm
    ? `<span class="lect-contract-hoy" style="left:${Math.min(97, Math.max(3, rawPct)).toFixed(1)}%" aria-hidden="true"><i></i>hoy</span>`
    : '';
  const spoken =
    `Contrato ${contract.left} ${contract.arrow} ${contract.right}: ${contract.amount}` +
    `${contract.perYear ? ' por año' : ''}, de ${contract.start} a ${contract.end}` +
    (contract.total ? `, total ${contract.total}` : '');
  const footParts: string[] = [];
  if (contract.total) {
    footParts.push(`<span class="lect-contract-total">${countupSpan(contract.total, 'lect-contract-total-fig')}</span>`);
  }
  if (contract.clause) {
    footParts.push(
      `<span class="lect-contract-clause"><span class="lect-contract-foot-label">Cláusula</span> ${esc(contract.clause)}</span>`,
    );
  }
  const foot = footParts.length ? `<div class="lect-contract-foot">${footParts.join('')}</div>` : '';
  return (
    `<div class="lect-device lect-contract" role="note" aria-label="${esc(spoken)}">` +
    `<span class="lect-device-label">El contrato</span>` +
    `<div class="lect-contract-parties" data-lect-stagger>` +
    `<span class="lect-contract-side">${esc(contract.left)}</span>` +
    `<span class="lect-contract-arrow" aria-hidden="true">${contract.arrow}</span>` +
    `<span class="lect-contract-side">${esc(contract.right)}</span></div>` +
    `<div class="lect-contract-amount">${countupSpan(contract.amount, 'lect-contract-figure')}` +
    `${contract.perYear ? '<span class="lect-contract-per">por año</span>' : ''}</div>` +
    `<div class="lect-contract-term" data-lect-grow aria-hidden="true">` +
    `<span class="lect-contract-year">${contract.start}</span>` +
    `<span class="lect-contract-track"><span class="lect-contract-fill" data-lect-seg></span>${hoy}</span>` +
    `<span class="lect-contract-year">${contract.end}</span></div>` +
    foot +
    `</div>`
  );
}

// —————————————————————————————————————————————————————— Calendario
// `Calendario: nov 2026 — Voto de sedes · mar 2027 — Opt-out de TV ·
//  2028 — Expira el CBA`
// Cronología's counterpart: the dated road AHEAD. Each beat carries a
// computed "en N meses/años" derived from the ARTICLE's date — computed,
// never authored, so it reads as "as of this piece" and can't go stale
// wrong — and the first beat after the article date is highlighted as
// what's next. Without an article date in context, the chips are simply
// omitted (the list still stands on its own).
type AgendaBeat = { when: string; what: string; inMonths: number | null };

const AGENDA_MONTHS: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, sept: 8, oct: 9, nov: 10, dic: 11,
};

function parseBeatWhen(text: string): { year: number; month: number | null } | null {
  const clean = normalizeLabel(text).replace(/\.$/, '');
  const yearOnly = clean.match(/^(\d{4})$/);
  if (yearOnly) return { year: Number(yearOnly[1]), month: null };
  const monthYear = clean.match(/^(?:(\d{1,2})\s+)?([a-z]{3,5})\.?\s+(\d{4})$/);
  if (monthYear && AGENDA_MONTHS[monthYear[2]] !== undefined) {
    return { year: Number(monthYear[3]), month: AGENDA_MONTHS[monthYear[2]] };
  }
  return null;
}

function agendaChip(inMonths: number): string {
  if (inMonths <= 0) return '';
  if (inMonths >= 24) {
    const years = Math.round(inMonths / 12);
    return `en ${years} años`;
  }
  return inMonths === 1 ? 'en 1 mes' : `en ${inMonths} meses`;
}

function parseAgenda(raw: string, ctx?: DeviceContext): AgendaBeat[] | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 2 || items.length > 5) return null;
  const article = ctx?.articleDate?.match(/^(\d{4})-(\d{2})-\d{2}$/);
  const articleMonths = article ? Number(article[1]) * 12 + (Number(article[2]) - 1) : null;
  const beats: AgendaBeat[] = [];
  for (const item of items) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const when = kv[1].trim();
    const what = kv[2].trim();
    if (!when || when.length > 16 || !what || what.length > 72) return null;
    const parsedWhen = parseBeatWhen(when);
    if (!parsedWhen) return null;
    let inMonths: number | null = null;
    if (articleMonths !== null) {
      const beatMonths = parsedWhen.year * 12 + (parsedWhen.month ?? 6);
      inMonths = beatMonths - articleMonths;
    }
    beats.push({ when, what, inMonths });
  }
  return beats;
}

function buildAgenda(beats: AgendaBeat[]): string {
  const nextIndex = beats.findIndex(beat => beat.inMonths !== null && beat.inMonths > 0);
  const rows = beats
    .map((beat, i) => {
      const chipText = beat.inMonths !== null ? agendaChip(beat.inMonths) : '';
      const chip = chipText ? `<span class="lect-agenda-chip">${esc(chipText)}</span>` : '';
      return (
        `<li class="lect-agenda-item"${i === nextIndex ? ' data-next="true"' : ''}>` +
        `<span class="lect-agenda-when">${esc(beat.when)}</span>` +
        `<span class="lect-agenda-what">${esc(beat.what)}${chip}</span></li>`
      );
    })
    .join('');
  return (
    `<div class="lect-device lect-agenda" role="note" aria-label="Calendario">` +
    `<span class="lect-device-label">El calendario</span>` +
    `<ol class="lect-agenda-list" data-lect-stagger>${rows}</ol></div>`
  );
}

// ——————————————————————————————————————————————————————— Votación
// `Votación: Mundial cada dos años · A favor — 166 · En contra — 22 ·
//  Abstención — 23 · Umbral — 138 (dos tercios)`
// The governance tally with the passing threshold drawn ON the bar —
// passed or failed is visible by construction, the same design argument
// as the Cotización track's Umbral. A declared Total must equal the sum
// of the camps exactly (votes are integers; a tally that doesn't add up
// rejects, fail-loud, same principle as the Recibo's sum guard).
type Vote = {
  motion: string;
  favor: number;
  contra: number;
  abst: number | null;
  threshold: number | null;
  thresholdNote: string;
  total: number;
};

const VOTE_LABELS: Record<string, 'favor' | 'contra' | 'abst' | 'threshold' | 'total'> = {
  'a favor': 'favor',
  favor: 'favor',
  'en contra': 'contra',
  contra: 'contra',
  abstencion: 'abst',
  abstenciones: 'abst',
  umbral: 'threshold',
  total: 'total',
};

function parseVote(raw: string): Vote | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 3 || items.length > 6) return null;
  const motion = items[0].trim();
  if (!motion || motion.length > 64 || KV_RE.test(motion)) return null;

  const counts: Partial<Record<'favor' | 'contra' | 'abst' | 'threshold' | 'total', number>> = {};
  let thresholdNote = '';
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const key = VOTE_LABELS[normalizeLabel(kv[1])];
    if (!key || counts[key] !== undefined) return null;
    let value = kv[2].trim();
    if (key === 'threshold') {
      const tail = value.match(NOTE_TAIL_RE);
      if (tail) {
        value = tail[1].trim();
        thresholdNote = tail[2].trim();
      }
    }
    const count = Number(value.replace(/[.,\s]/g, ''));
    if (!Number.isInteger(count) || count < 0 || count > 1000000) return null;
    counts[key] = count;
  }
  const { favor, contra, abst = null, threshold = null, total: declaredTotal } = counts;
  if (favor === undefined || contra === undefined) return null;
  const sum = favor + contra + (abst ?? 0);
  if (sum <= 0) return null;
  if (declaredTotal !== undefined && declaredTotal !== sum) return null;
  const total = declaredTotal ?? sum;
  if (threshold !== null && (threshold <= 0 || threshold > total)) return null;
  return { motion, favor, contra, abst, threshold, thresholdNote, total };
}

function buildVote(vote: Vote): string {
  const camps: { key: string; label: string; count: number }[] = [
    { key: 'favor', label: 'A favor', count: vote.favor },
    { key: 'contra', label: 'En contra', count: vote.contra },
  ];
  if (vote.abst !== null) camps.push({ key: 'abst', label: 'Abstención', count: vote.abst });

  const segments = camps
    .filter(camp => camp.count > 0)
    .map(
      camp =>
        `<span class="lect-voto-seg" data-lect-seg data-cast="${camp.key}" style="width:${((camp.count / vote.total) * 100).toFixed(2)}%"></span>`,
    )
    .join('');
  const tick =
    vote.threshold !== null
      ? `<span class="lect-voto-tick" style="left:${((vote.threshold / vote.total) * 100).toFixed(2)}%" aria-hidden="true"></span>`
      : '';
  const legend = camps
    .map(
      camp =>
        `<span class="lect-voto-key"><span class="lect-voto-swatch" data-cast="${camp.key}" aria-hidden="true"></span>${esc(camp.label)} ${countupSpan(String(camp.count), 'lect-voto-count')}</span>`,
    )
    .join('');
  // The verdict is COMPUTED from favor vs. threshold, never authored.
  const passed = vote.threshold !== null ? vote.favor >= vote.threshold : null;
  const verdict =
    passed !== null
      ? `<span class="lect-voto-verdict" data-passed="${passed}">${passed ? 'Aprobada' : 'No alcanzada'}</span>`
      : '';
  const note =
    vote.threshold !== null
      ? `<span class="lect-voto-note">Umbral: ${esc(String(vote.threshold))} de ${esc(String(vote.total))}` +
        `${vote.thresholdNote ? ` (${esc(vote.thresholdNote)})` : ''}${verdict}</span>`
      : '';
  const spoken =
    `Votación: ${vote.motion}. A favor ${vote.favor}, en contra ${vote.contra}` +
    (vote.abst !== null ? `, abstenciones ${vote.abst}` : '') +
    (vote.threshold !== null ? `, umbral ${vote.threshold}${passed ? ', aprobada' : ', no alcanzada'}` : '');
  return (
    `<div class="lect-device lect-voto" role="note" aria-label="${esc(spoken)}">` +
    `<span class="lect-device-label">La votación</span>` +
    `<span class="lect-voto-motion">${esc(vote.motion)}</span>` +
    `<div class="lect-voto-bar" data-lect-grow aria-hidden="true">${segments}${tick}</div>` +
    `<div class="lect-voto-legend" data-lect-stagger>${legend}</div>${note}</div>`
  );
}

// ———————————————————————————————————————————————————————— Ranking
// `Ranking: Valor de franquicia NFL · Cowboys — US$10,100M · Rams —
//  US$7,600M (+1) · Giants — US$7,300M (−1)`
// The league table: 3–6 actors on ONE metric, in the order the story
// means, bars scaled to the leader. Values must share a denomination —
// a table mixing currencies isn't a ranking, it's a mistake, and it
// rejects. The optional (±N) tail is movement since the last edition,
// rendered as a direction chip.
type RankRow = { label: string; value: string; pct: number; move: string | null; dir: 'up' | 'down' | 'same' | null };

const RANK_MOVE_RE = /^([\s\S]+?)\s*\(\s*([+−-]\s?\d{1,2}|=)\s*\)$/;

function parseRanking(raw: string): { title: string; rows: RankRow[] } | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 4 || items.length > 7) return null;
  const title = items[0].trim();
  if (!title || title.length > 48 || KV_RE.test(title)) return null;

  const parsed: { label: string; value: string; move: string | null; dir: RankRow['dir'] }[] = [];
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    let value = kv[2].trim();
    let move: string | null = null;
    let dir: RankRow['dir'] = null;
    const tail = value.match(RANK_MOVE_RE);
    if (tail) {
      value = tail[1].trim();
      const rawMove = tail[2].replace(/\s+/g, '');
      if (rawMove === '=') {
        move = '=';
        dir = 'same';
      } else {
        dir = rawMove.startsWith('+') ? 'up' : 'down';
        move = `${dir === 'up' ? '+' : '−'}${rawMove.slice(1)}`;
      }
    }
    if (!label || label.length > 28 || !value || value.length > 20) return null;
    parsed.push({ label, value, move, dir });
  }

  const figures = parsed.map(row => denominatedOf(row.value));
  if (!figures.every((f): f is Denominated => f !== null)) return null;
  if (new Set(figures.map(f => f.unit)).size !== 1) return null;
  const max = Math.max(...figures.map(f => f.value));
  if (max <= 0) return null;
  return {
    title,
    rows: parsed.map((row, i) => ({ ...row, pct: Math.max(2, (figures[i].value / max) * 100) })),
  };
}

function buildRanking(ranking: { title: string; rows: RankRow[] }): string {
  const rows = ranking.rows
    .map(
      (row, i) =>
        `<div class="lect-rank-row">` +
        `<span class="lect-rank-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>` +
        `<span class="lect-rank-main"><span class="lect-rank-line"><span class="lect-rank-label">${esc(row.label)}</span>` +
        (row.move ? `<span class="lect-rank-move" data-dir="${row.dir}">${esc(row.move)}</span>` : '') +
        `</span>` +
        `<span class="lect-rank-track" data-lect-grow aria-hidden="true"><span class="lect-rank-bar" data-lect-seg style="width:${row.pct.toFixed(2)}%"></span></span>` +
        `</span>${countupSpan(row.value, 'lect-rank-value')}</div>`,
    )
    .join('');
  const spoken = `Ranking, ${ranking.title}: ${ranking.rows.map((r, i) => `${i + 1} ${r.label} ${r.value}`).join(', ')}`;
  return (
    `<div class="lect-device lect-rank" role="note" aria-label="${esc(spoken)}">` +
    `<span class="lect-device-label">El ranking</span>` +
    `<span class="lect-rank-title">${esc(ranking.title)}</span>` +
    `<div class="lect-rank-rows" data-lect-stagger>${rows}</div></div>`
  );
}

// ———————————————————————————————————————————————————————— Cascada
// `Cascada: Ingresos — US$4,210M · Producción — −US$1,900M · Derechos —
//  −US$1,400M · Margen — US$910M`
// The waterfall: the PATH from the first anchor to the last, middle
// terms signed. Self-checking arithmetic exactly like the Recibo's total
// guard — first + Σ(middles) must land on the last anchor within the
// same 2.5% rounding tolerance, or the device rejects rather than lend a
// designed element's authority to numbers that don't add up.
type CascadeStep = { label: string; value: string; delta: number; offsetPct: number; widthPct: number; kind: 'anchor' | 'down' | 'up' };

function parseCascade(raw: string): CascadeStep[] | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 3 || items.length > 7) return null;
  const rows: { label: string; value: string; signed: number; display: string }[] = [];
  for (const item of items) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    const display = kv[2].trim();
    if (!label || label.length > 28 || !display || display.length > 24) return null;
    const negative = /^[−-]/.test(display);
    const positive = /^\+/.test(display);
    const bare = display.replace(/^[−+-]\s*/, '');
    const parsed = denominatedOf(bare);
    if (!parsed) return null;
    rows.push({ label, value: bare, signed: negative ? -parsed.value : parsed.value, display });
    if ((negative || positive) && (rows.length === 1 || rows.length === items.length)) return null;
  }
  const units = new Set(rows.map(r => denominatedOf(r.value)!.unit));
  if (units.size !== 1) return null;

  const first = rows[0];
  const last = rows[rows.length - 1];
  if (first.signed <= 0 || last.signed <= 0) return null;
  const middles = rows.slice(1, -1);
  // Middle terms carry their sign in the declaration; an unsigned middle
  // term is treated as the subtraction it almost always is only if... no —
  // ambiguity is exactly what fails loud. Unsigned middles reject.
  if (middles.some(row => !/^[−+-]/.test(row.display))) return null;
  const sum = first.signed + middles.reduce((acc, row) => acc + row.signed, 0);
  if (Math.abs(sum - last.signed) / first.signed > 0.025) return null;

  const scale = first.signed;
  let running = first.signed;
  const steps: CascadeStep[] = [
    { label: first.label, value: first.value, delta: first.signed, offsetPct: 0, widthPct: 100, kind: 'anchor' },
  ];
  for (const row of middles) {
    const from = running;
    running += row.signed;
    const lo = Math.min(from, running);
    const hi = Math.max(from, running);
    steps.push({
      label: row.label,
      value: row.display.replace(/^-/, '−'),
      delta: row.signed,
      offsetPct: Math.max(0, (lo / scale) * 100),
      widthPct: Math.max(1.2, ((hi - lo) / scale) * 100),
      kind: row.signed < 0 ? 'down' : 'up',
    });
  }
  steps.push({
    label: last.label,
    value: last.value,
    delta: last.signed,
    offsetPct: 0,
    widthPct: Math.max(1.2, (last.signed / scale) * 100),
    kind: 'anchor',
  });
  return steps;
}

function buildCascade(steps: CascadeStep[]): string {
  const rows = steps
    .map(
      step =>
        `<div class="lect-cascada-row" data-kind="${step.kind}">` +
        `<span class="lect-cascada-label">${esc(step.label)}</span>` +
        `<span class="lect-cascada-track" data-lect-grow aria-hidden="true">` +
        `<span class="lect-cascada-bar" data-lect-seg style="margin-left:${step.offsetPct.toFixed(2)}%;width:${step.widthPct.toFixed(2)}%"></span></span>` +
        countupSpan(step.value, 'lect-cascada-value') +
        `</div>`,
    )
    .join('');
  const spoken = `Cascada: ${steps.map(s => `${s.label} ${s.value}`).join(', ')}`;
  return (
    `<div class="lect-device lect-cascada" role="note" aria-label="${esc(spoken)}">` +
    `<span class="lect-device-label">La cascada</span>` +
    `<div class="lect-cascada-rows" data-lect-stagger>${rows}</div></div>`
  );
}

// ————————————————————————————————————————————————————————— Perfil
// `Perfil: Gianni Infantino · Cargo — Presidente de FIFA · Desde — 2016 ·
//  Mandato — hasta 2027 · Sueldo — CHF3.9M`
// One actor at the story's center, as a card: fixed row vocabulary
// (unknown label rejects, like Venta), figures counting up, brand palette
// via the same registry when the subject is an institution it knows.
type Profile = {
  name: string;
  brandStyle: string;
  rows: { label: string; value: string }[];
};

const PROFILE_LABELS: Record<string, string> = {
  cargo: 'Cargo',
  desde: 'Desde',
  mandato: 'Mandato',
  sueldo: 'Sueldo',
  antes: 'Antes',
  edad: 'Edad',
  sede: 'Sede',
};

function parseProfile(raw: string): Profile | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 3 || items.length > 6) return null;
  const rawName = items[0].trim();
  if (!rawName || rawName.length > 48 || KV_RE.test(rawName)) return null;

  const rows: { label: string; value: string }[] = [];
  const seen = new Set<string>();
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const canonical = PROFILE_LABELS[normalizeLabel(kv[1])];
    const value = kv[2].trim();
    if (!canonical || seen.has(canonical) || !value || value.length > 40) return null;
    seen.add(canonical);
    rows.push({ label: canonical, value });
  }
  if (!seen.has('Cargo')) return null;

  const { label, palette } = resolveBrand(rawName);
  if (!label || label.length > 32) return null;
  return { name: label, brandStyle: brandStyleAttr(palette), rows };
}

function buildProfile(profile: Profile): string {
  const initials = profile.name
    .split(/\s+/)
    .filter(word => /^[\p{L}\d]/u.test(word))
    .slice(0, 2)
    .map(word => word[0] ?? '')
    .join('')
    .toUpperCase();
  const role = profile.rows.find(row => row.label === 'Cargo')!;
  const facts = profile.rows
    .filter(row => row.label !== 'Cargo')
    .map(
      row =>
        `<div class="lect-perfil-fact"><span class="lect-perfil-key">${esc(row.label)}</span>${countupSpan(row.value, 'lect-perfil-value')}</div>`,
    )
    .join('');
  const style = profile.brandStyle ? ` style="${profile.brandStyle}"` : '';
  // lect-brand only when the registry actually knows the subject: the
  // class always defines --brand-fill (registry green as its fallback),
  // so carrying it unbranded would paint a green card in every product
  // skin instead of falling back to the product accent.
  const brandClass = profile.brandStyle ? ' lect-brand' : '';
  const spoken = `Perfil: ${profile.name}, ${role.value}`;
  return (
    `<div class="lect-device${brandClass} lect-perfil" role="note" aria-label="${esc(spoken)}"${style}>` +
    `<span class="lect-device-label">El perfil</span>` +
    `<div class="lect-perfil-card"><span class="lect-perfil-mono" aria-hidden="true">${esc(initials)}</span>` +
    `<div class="lect-perfil-id"><span class="lect-perfil-name">${esc(profile.name)}</span>` +
    `<span class="lect-perfil-role">${esc(role.value)}</span></div>` +
    (facts ? `<div class="lect-perfil-facts" data-lect-stagger>${facts}</div>` : '') +
    `</div></div>`
  );
}

// —————————————————————————————————————————————————————— Escenarios
// `Escenarios: Los derechos de la Liga MX · Renueva con Televisa —
//  probable · Se parte en paquetes — posible · Streaming puro — lejano`
// The evidence ladder's level 4 made visual and explicitly owned: a fixed
// likelihood vocabulary instead of numbers (fake-precise percentages are
// exactly what the aritmética rule bans), and a standing "Lectura de
// Playbook" mark so a scenario can never be read as reporting — the
// Cotización track's `Ligado` disclosure argument, reapplied.
type Scenario = { outcome: string; likelihood: 'probable' | 'posible' | 'lejano' };

const LIKELIHOODS: Record<string, Scenario['likelihood']> = {
  probable: 'probable',
  posible: 'posible',
  lejano: 'lejano',
};

const LIKELIHOOD_STEPS: Record<Scenario['likelihood'], number> = { probable: 3, posible: 2, lejano: 1 };

function parseScenarios(raw: string): { subject: string; rows: Scenario[] } | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 3 || items.length > 5) return null;
  const subject = items[0].trim();
  if (!subject || subject.length > 64 || KV_RE.test(subject)) return null;
  const rows: Scenario[] = [];
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const outcome = kv[1].trim();
    const likelihood = LIKELIHOODS[normalizeLabel(kv[2])];
    if (!outcome || outcome.length > 52 || !likelihood) return null;
    rows.push({ outcome, likelihood });
  }
  return { subject, rows };
}

function buildScenarios(scenarios: { subject: string; rows: Scenario[] }): string {
  const rows = scenarios.rows
    .map(row => {
      const steps = LIKELIHOOD_STEPS[row.likelihood];
      const dots = [1, 2, 3]
        .map(i => `<i class="lect-esc-dot${i <= steps ? ' lect-esc-dot-on' : ''}"></i>`)
        .join('');
      return (
        `<div class="lect-esc-row" data-likelihood="${row.likelihood}">` +
        `<span class="lect-esc-outcome">${esc(row.outcome)}</span>` +
        `<span class="lect-esc-meter" aria-hidden="true">${dots}</span>` +
        `<span class="lect-esc-word">${row.likelihood}</span></div>`
      );
    })
    .join('');
  const spoken = `Escenarios, lectura de Playbook: ${scenarios.subject}. ${scenarios.rows.map(r => `${r.outcome}, ${r.likelihood}`).join('; ')}`;
  return (
    `<div class="lect-device lect-esc" role="note" aria-label="${esc(spoken)}">` +
    `<span class="lect-device-label">Escenarios · Lectura de Playbook</span>` +
    `<span class="lect-esc-subject">${esc(scenarios.subject)}</span>` +
    `<div class="lect-esc-rows" data-lect-stagger>${rows}</div></div>`
  );
}

// ———————————————————————————————————————————————————————— Tablero
// `Tablero: Mercado de verano 2026 · Gasto total — €9,870M ·
//  Operaciones — 412 · Récord — €180M (Mbappé)`
// The KPI strip for market-wide roundups: 2–4 stat tiles that belong
// together where `Cifra clave` is ONE number. Notes ride the same
// parenthetical tail as Venta's Anterior.
type Board = { title: string; tiles: { label: string; value: string; note: string }[] };

function parseBoard(raw: string): Board | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 3 || items.length > 5) return null;
  const title = items[0].trim();
  if (!title || title.length > 48 || KV_RE.test(title)) return null;
  const tiles: Board['tiles'] = [];
  for (const item of items.slice(1)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    let value = kv[2].trim();
    let note = '';
    const tail = value.match(NOTE_TAIL_RE);
    if (tail) {
      value = tail[1].trim();
      note = tail[2].trim();
    }
    if (!label || label.length > 26 || !value || value.length > 20 || !/\d/.test(value)) return null;
    tiles.push({ label, value, note });
  }
  return { title, tiles };
}

function buildBoard(board: Board): string {
  const tiles = board.tiles
    .map(
      tile =>
        `<div class="lect-tablero-tile"><span class="lect-tablero-key">${esc(tile.label)}</span>` +
        countupSpan(tile.value, 'lect-tablero-value') +
        (tile.note ? `<span class="lect-tablero-note">${esc(tile.note)}</span>` : '') +
        `</div>`,
    )
    .join('');
  const spoken = `Tablero, ${board.title}: ${board.tiles.map(t => `${t.label} ${t.value}`).join(', ')}`;
  return (
    `<div class="lect-device lect-tablero" role="note" aria-label="${esc(spoken)}">` +
    `<span class="lect-device-label">El tablero</span>` +
    `<span class="lect-tablero-title">${esc(board.title)}</span>` +
    `<div class="lect-tablero-tiles" data-lect-stagger>${tiles}</div></div>`
  );
}

// ———————————————————————————————————————————————————————— Pirámide
// `Pirámide: Liga MX (fuera) — 18 clubes, liga cerrada · Liga Expansión MX
//  — Cúspide de la nueva pirámide · Liga Premier — Tercer nivel ·
//  Liga TDP — Cuarto nivel · Sector Amateur — Base`
//
// A league system drawn as what it is: tiers stacked widest at the base,
// each one named. The shape the collection had no way to tell. `Ranking`
// orders N actors by a metric and scales its bars to the leader, which is
// a different claim — a pyramid's tiers are a HIERARCHY, not a
// measurement, and drawing them as a bar chart would invent a magnitude
// nobody published. `Reparto` splits one whole into shares. `Cronología`
// is time. None of them can say "these five divisions sit under each
// other in this order".
//
// The `(fuera)` tag is the reason this device exists rather than a plain
// list. A restructuring announcement's whole business content is usually
// which body is INSIDE the new structure and which one is not, and that
// distinction dies in prose: an official communiqué naming a national
// pyramid and a top division that does not belong to it reads, in
// paragraph form, like one continuous system. Marked here, the detached
// tier is drawn above the apex with the connector visibly broken and
// carries its own "fuera de la pirámide" chip, so the gap is the first
// thing the eye lands on. Same convention as `Alineación`'s role tag: a
// parenthetical after the name, optional, and a declaration without one
// renders as an ordinary pyramid.
//
// Colour is never doing that work alone — the chip, the aria-label and
// the broken connector all state it, because a reader who cannot see the
// dashed rule still has to learn the same fact.
type PyramidTier = { name: string; note: string };
type Pyramid = { tiers: PyramidTier[]; outside: PyramidTier | null };

// The apex is a truncated top, not a point: the top tier is a real league
// with a name to fit, and drawing it as a spike would be a shape decision
// overriding a legible one.
const PIR_TOP_WIDTH = 58;
const PIR_APEX_INSET = 11;
// The accent ramps down the stack instead of being switched on at the
// apex and off at the base. A fixed first/last rule left the bottom tier
// tinted at zero, which on the light theme is the page's own colour: the
// base stopped reading as part of the same object (caught in the render
// pass, 2026-08-20). Computing the ramp from the tier count also means it
// holds at any depth from two levels to six.
const PIR_TINT_TOP = 34;
const PIR_TINT_BASE = 9;

function parsePyramid(raw: string): Pyramid | null {
  const items = stripTags(raw).split(ITEM_SEP);
  if (items.length < 2 || items.length > 7) return null;
  const tiers: PyramidTier[] = [];
  let outside: PyramidTier | null = null;
  for (const item of items) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    let name = kv[1].trim();
    const note = kv[2].trim();
    const tag = name.match(/^([\s\S]+?)\s*\(\s*fuera\s*\)$/i);
    const detached = !!tag;
    if (tag) name = tag[1].trim();
    if (!name || name.length > 34 || !note || note.length > 60) return null;
    if (detached) {
      // Two bodies outside one pyramid is not a structure this device can
      // draw honestly, so it declines rather than picking one.
      if (outside) return null;
      outside = { name, note };
      continue;
    }
    tiers.push({ name, note });
  }
  // A pyramid needs at least two levels under each other; one tier plus an
  // outsider is a pairing, which is what `Jugada` is for.
  if (tiers.length < 2 || tiers.length > 6) return null;
  return { tiers, outside };
}

function buildPyramid(pyramid: Pyramid): string {
  const { tiers, outside } = pyramid;
  const span = tiers.length - 1;
  const widths = tiers.map((_, i) => PIR_TOP_WIDTH + ((100 - PIR_TOP_WIDTH) * i) / span);
  const rows = tiers
    .map((tier, i) => {
      // Each row's sides are cut so its top edge meets the row above it —
      // the silhouette is a real pyramid rather than a staircase, and the
      // inset is derived from the widths instead of being eyeballed per
      // tier. The label's own padding is driven off the same number
      // (styles/lectura.css), so text can never sit under a bevel.
      const inset = i === 0 ? PIR_APEX_INSET : ((1 - widths[i - 1] / widths[i]) / 2) * 100;
      const tint = PIR_TINT_TOP - ((PIR_TINT_TOP - PIR_TINT_BASE) * i) / span;
      return (
        `<li class="lect-pir-tier" data-lect-seg style="width:${widths[i].toFixed(1)}%;--pir-inset:${inset.toFixed(2)}%;--pir-tint:${tint.toFixed(1)}%">` +
        `<span class="lect-pir-name">${esc(tier.name)}</span>` +
        `<span class="lect-pir-note">${esc(tier.note)}</span></li>`
      );
    })
    .join('');
  const detached = outside
    ? `<div class="lect-pir-outside">` +
      `<span class="lect-pir-outside-chip">Fuera de la pirámide</span>` +
      `<span class="lect-pir-name">${esc(outside.name)}</span>` +
      `<span class="lect-pir-note">${esc(outside.note)}</span></div>` +
      `<div class="lect-pir-break" aria-hidden="true"><span></span><span></span></div>`
    : '';
  const spoken =
    (outside ? `${outside.name}, ${outside.note}, queda fuera de la pirámide. ` : '') +
    `Pirámide, de la cúspide a la base: ` +
    tiers.map(t => `${t.name}, ${t.note}`).join('; ') +
    '.';
  return (
    `<div class="lect-device lect-piramide" role="note" aria-label="${esc(spoken)}">` +
    `<span class="lect-device-label">La pirámide</span>` +
    detached +
    `<ol class="lect-pir-stack">${rows}</ol></div>`
  );
}

// ———————————————————————————————————————————————————— Dispatch tables
// Per-article context a device may need at render time. Today that is
// only the article's own date (Calendario computes each beat's "en N
// meses" from it — computed relative to PUBLICATION, so the chip can't go
// stale wrong). Optional everywhere: devices that don't read it ignore
// it, and a missing date just omits the computed chips.
export type DeviceContext = {
  articleDate?: string;
  /** 0-99 boleta score (lib/rank.ts). Feeds deviceBudgetFor's top-band bonus. */
  score?: number | null;
};

type Device = {
  /** Stable type name — the budget's no-repeat key and the exclusion key. */
  name: string;
  /** Prefix as the editor types it (accent-tolerant). */
  prefix: RegExp;
  html: RegExp;
  render(raw: string, ctx?: DeviceContext): string | null;
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
    name: 'cronologia',
    prefix: deviceTextRe('Cronolog[íi]a'),
    html: deviceHtmlRe('Cronolog[íi]a'),
    render: raw => {
      const parsed = parseTimeline(raw);
      return parsed ? buildTimeline(parsed) : null;
    },
  },
  {
    name: 'recibo',
    prefix: deviceTextRe('Recibo'),
    html: deviceHtmlRe('Recibo'),
    render: raw => {
      const parsed = parseReceipt(raw);
      return parsed ? buildReceipt(parsed) : null;
    },
  },
  {
    name: 'ecuacion',
    prefix: deviceTextRe('Ecuaci[óo]n'),
    html: deviceHtmlRe('Ecuaci[óo]n'),
    render: raw => {
      const parsed = parseEquation(raw);
      return parsed ? buildEquation(parsed) : null;
    },
  },
  {
    name: 'salto',
    prefix: deviceTextRe('Salto'),
    html: deviceHtmlRe('Salto'),
    render: raw => {
      const parsed = parseDelta(raw);
      return parsed ? buildDelta(parsed) : null;
    },
  },
  {
    name: 'reparto',
    prefix: deviceTextRe('Reparto'),
    html: deviceHtmlRe('Reparto'),
    render: raw => {
      const parsed = parseShares(raw);
      return parsed ? buildShares(parsed) : null;
    },
  },
  {
    name: 'alineacion',
    prefix: deviceTextRe('Alineaci[óo]n'),
    html: deviceHtmlRe('Alineaci[óo]n'),
    render: raw => {
      const parsed = parseLineup(raw);
      return parsed ? buildLineup(parsed) : null;
    },
  },
  {
    name: 'cotizacion',
    prefix: deviceTextRe('Cotizaci[óo]n'),
    html: deviceHtmlRe('Cotizaci[óo]n'),
    // Track form first, tile second. The two are told apart by their FIRST
    // item: the tile opens `Nombre — valor` and the track opens with a bare
    // framing item, so parseTrack declines anything shaped like a tile
    // instead of half-matching it. Order matters only for speed, not for
    // correctness — but keeping the richer form first means a malformed
    // track never silently renders as a tile built from its first two
    // fields, which would be a wrong chart rather than a visible mistake.
    render: raw => {
      const track = parseTrack(raw);
      if (track) return buildTrack(track);
      const parsed = parseQuote(raw);
      return parsed ? buildQuote(parsed) : null;
    },
  },
  {
    name: 'resultados',
    prefix: deviceTextRe('Resultados'),
    html: deviceHtmlRe('Resultados'),
    render: raw => {
      const parsed = parseResults(raw);
      return parsed ? buildResults(parsed) : null;
    },
  },
  {
    name: 'duelo',
    prefix: deviceTextRe('Duelo'),
    html: deviceHtmlRe('Duelo'),
    render: raw => {
      const parsed = parseDuel(raw);
      return parsed ? buildDuel(parsed) : null;
    },
  },
  {
    name: 'serie',
    prefix: deviceTextRe('Serie'),
    html: deviceHtmlRe('Serie'),
    render: raw => {
      const parsed = parseSeries(raw);
      return parsed ? buildSeries(parsed) || null : null;
    },
  },
  {
    name: 'mapa',
    prefix: deviceTextRe('Mapa'),
    html: deviceHtmlRe('Mapa'),
    render: raw => {
      const parsed = parseMap(raw);
      return parsed ? buildMap(parsed) : null;
    },
  },
  {
    name: 'venta',
    prefix: deviceTextRe('Venta'),
    html: deviceHtmlRe('Venta'),
    render: raw => {
      const parsed = parseSale(raw);
      return parsed ? buildSale(parsed) : null;
    },
  },
  {
    name: 'cadena',
    prefix: deviceTextRe('Cadena'),
    html: deviceHtmlRe('Cadena'),
    render: raw => {
      const parsed = parseChain(raw);
      return parsed ? buildChain(parsed) : null;
    },
  },
  // The roadmap eight (docs/device-roadmap.md §2, built 2026-08-14), in
  // its recommended order.
  {
    name: 'contrato',
    prefix: deviceTextRe('Contrato'),
    html: deviceHtmlRe('Contrato'),
    render: raw => {
      const parsed = parseContract(raw);
      return parsed ? buildContract(parsed) : null;
    },
  },
  {
    name: 'calendario',
    prefix: deviceTextRe('Calendario'),
    html: deviceHtmlRe('Calendario'),
    render: (raw, ctx) => {
      const parsed = parseAgenda(raw, ctx);
      return parsed ? buildAgenda(parsed) : null;
    },
  },
  {
    name: 'votacion',
    prefix: deviceTextRe('Votaci[óo]n'),
    html: deviceHtmlRe('Votaci[óo]n'),
    render: raw => {
      const parsed = parseVote(raw);
      return parsed ? buildVote(parsed) : null;
    },
  },
  {
    name: 'ranking',
    prefix: deviceTextRe('Ranking'),
    html: deviceHtmlRe('Ranking'),
    render: raw => {
      const parsed = parseRanking(raw);
      return parsed ? buildRanking(parsed) : null;
    },
  },
  {
    name: 'cascada',
    prefix: deviceTextRe('Cascada'),
    html: deviceHtmlRe('Cascada'),
    render: raw => {
      const parsed = parseCascade(raw);
      return parsed ? buildCascade(parsed) : null;
    },
  },
  {
    name: 'perfil',
    prefix: deviceTextRe('Perfil'),
    html: deviceHtmlRe('Perfil'),
    render: raw => {
      const parsed = parseProfile(raw);
      return parsed ? buildProfile(parsed) : null;
    },
  },
  {
    name: 'escenarios',
    prefix: deviceTextRe('Escenarios'),
    html: deviceHtmlRe('Escenarios'),
    render: raw => {
      const parsed = parseScenarios(raw);
      return parsed ? buildScenarios(parsed) : null;
    },
  },
  {
    name: 'tablero',
    prefix: deviceTextRe('Tablero'),
    html: deviceHtmlRe('Tablero'),
    render: raw => {
      const parsed = parseBoard(raw);
      return parsed ? buildBoard(parsed) : null;
    },
  },
  // Built to measure 2026-08-20 for the FMF's Nuevo Modelo Deportivo, the
  // first story the collection met that was ABOUT a league system's shape.
  {
    name: 'piramide',
    prefix: deviceTextRe('Pir[áa]mide'),
    html: deviceHtmlRe('Pir[áa]mide'),
    render: raw => {
      const parsed = parsePyramid(raw);
      return parsed ? buildPyramid(parsed) : null;
    },
  },
];

// The Cifra clave and Jugada conventions live in lib/product-hubs.ts (they
// predate this module) but count against the same budget, so the matcher
// list here covers all twenty-four designed devices (the fifteen through
// the 2026-08-13 audit, the roadmap eight, and `Pirámide`).
const ALL_DEVICES: Device[] = [
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
  ...DEVICES,
];

// —————————————————————————————————————————— Mutually exclusive pairs
// Two devices that would tell the reader the same thing twice. The budget
// already refuses a repeated TYPE; these are different types that overlap
// in content, and the no-repeat rule alone can't see that.
//
// `venta` ↔ `jugada`: a sale story reaches for "Jugada: Walter → Kushner"
// by reflex, and the deed says the same pairing WITH the price attached.
// `cadena` ↔ `cronologia`: both are the story on a dated spine, and a
// chain of title that also runs a timeline is two timelines.
//
// Symmetric and first-declared-wins, which is the same rule the budget
// itself follows: whichever the editor placed first in document order
// takes the slot and locks its partner out.
// The roadmap eight claimed their pairs up front (docs/device-roadmap.md
// §3) — each is the same "two devices telling the reader the same thing
// twice" argument as the original two: a Contrato reaches for the same
// pairing a Jugada would; Calendario and Cronología are both the story on
// a dated spine; a Votación is a Reparto with a threshold; a Ranking is a
// Duelo grown past two actors; a Cascada is the Recibo's parts with the
// path drawn; a Tablero is three Cifras that belong together.
const EXCLUSIVE_PAIRS: [string, string][] = [
  ['venta', 'jugada'],
  ['cadena', 'cronologia'],
  ['contrato', 'jugada'],
  ['calendario', 'cronologia'],
  ['votacion', 'reparto'],
  ['ranking', 'duelo'],
  ['cascada', 'recibo'],
  ['tablero', 'cifra'],
  // `piramide` ↔ `ranking`: both draw an ordered stack of named rows, and a
  // story that declares its league system AND ranks those same divisions
  // has printed the hierarchy twice. The pyramid wins on a structure
  // story, the ranking on a metric one, and first-declared decides.
  ['piramide', 'ranking'],
];

function exclusiveSiblings(name: string): string[] {
  const out: string[] = [];
  for (const [a, b] of EXCLUSIVE_PAIRS) {
    if (a === name) out.push(b);
    else if (b === name) out.push(a);
  }
  return out;
}

// The budget as a stateful object, so the HTML path (applyBodyDevices) and
// the plain-text path (articulo/page.tsx's plainBlocksFor) can't drift.
// Both used to keep their own `budget` counter and `usedTypes` set, which
// was fine while the only rules were "no repeats" and "stop at N" — the
// exclusion table above is the third rule, and a third copy of it in a
// second file is how the two paths start disagreeing about what shipped.
export function createDeviceLedger(
  readingTime: number | null,
  priority?: number | null,
  score?: number | null,
) {
  let budget = deviceBudgetFor(readingTime, priority, score);
  const used = new Set<string>();
  return {
    /** Claim a slot for this device type. False = leave it as plain text. */
    take(name: string): boolean {
      if (budget <= 0 || used.has(name)) return false;
      used.add(name);
      for (const sibling of exclusiveSiblings(name)) used.add(sibling);
      budget -= 1;
      return true;
    },
  };
}

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
// 2026-08-25: the bonus now reads the 0-99 boleta score (>= 70, the same line
// /noticias and /archivo use for their top band), with the legacy `priority`
// leg KEPT as a compatibility shim rather than replaced.
//
// That is deliberate, and it is the one place in this migration where swapping
// the field outright is wrong. Unlike ranking, this budget is not a view of the
// article -- it is a contract with the article's BODY, and it is re-derived at
// render time (app/(public)/articulo/page.tsx). An author who had two slots
// wrote two devices. Take a slot away afterwards and the extra declaration does
// not quietly vanish: it ships as a visible plain-text line, because devices
// fail loud by design.
//
// Measured before changing this, over all 177 published articles: a pure
// score >= 70 rule broke SEVEN live pages and gained exactly zero, because the
// reclassification re-graded some old 5-star rows below 70 after their bodies
// were already written against the larger budget. What they would have lost is
// not decoration -- a Cronología of the ascenso/descenso timeline, a Tablero of
// Amazon's connected-device audience, the Calendario of the FIFA election. So
// the `priority === 5` leg stays until the `priority` column is dropped, which
// is the pass that must also reconcile those bodies. Dropping it earlier trades
// real reported content for a tidier predicate.
export function deviceBudgetFor(
  readingTime: number | null,
  priority?: number | null,
  score?: number | null,
): number {
  const minutes = readingTime || 1;
  const base = minutes <= 2 ? 1 : minutes <= 5 ? 2 : 3;
  const topBand = (typeof score === 'number' && score >= 70) || priority === 5;
  return topBand ? base + 1 : base;
}

// HTML bodies: ONE document-order pass over all nine device patterns —
// per-type passes would spend the budget in type order instead of the
// order the editor placed things. First declared wins; a device TYPE
// repeats never (the second Recibo stays text even under budget); excess
// declarations stay as readable plain paragraphs, so an over-budget
// article degrades visibly-but-gracefully instead of silently. Same
// trust boundary and ad-split safety as every transform before it.
export function applyBodyDevices(
  html: string,
  readingTime: number | null,
  priority?: number | null,
  ctx?: DeviceContext,
): string {
  type Match = { start: number; end: number; markup: string; name: string };
  const found: Match[] = [];
  for (const device of ALL_DEVICES) {
    device.html.lastIndex = 0;
    for (const match of html.matchAll(device.html)) {
      const markup = device.render(match[1], ctx);
      if (markup && match.index !== undefined) {
        found.push({ start: match.index, end: match.index + match[0].length, markup, name: device.name });
      }
    }
  }
  found.sort((a, b) => a.start - b.start);

  const ledger = createDeviceLedger(readingTime, priority, ctx?.score);
  const selected: Match[] = [];
  let cursor = -1;
  for (const match of found) {
    // Strictly-less-than: a device paragraph that starts EXACTLY where the
    // previous one ends is adjacent, not overlapping — <= here skipped
    // every second device in a run of back-to-back declarations (measured
    // on the sampler article before shipping).
    if (match.start < cursor) continue; // overlapping match — first wins
    cursor = match.end;
    if (!ledger.take(match.name)) continue;
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
export function deviceFromParagraph(paragraph: string, ctx?: DeviceContext): { markup: string; name: string } | null {
  for (const device of ALL_DEVICES) {
    if (device.prefix.test(paragraph)) {
      const markup = device.render(paragraph.replace(device.prefix, ''), ctx);
      if (markup) return { markup, name: device.name };
    }
  }
  return null;
}
