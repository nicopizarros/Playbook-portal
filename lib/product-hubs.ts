// Roadmap Agosto 2026, Fase 1 (último ítem, separado como mini-proyecto de
// diseño): carpetas internas por producto editorial, cada una con identidad
// propia derivada del arte de las tarjetas de "Productos editoriales" — no
// una plantilla re-pintada. Este módulo es la única fuente de verdad de qué
// productos tienen hub, en qué ruta viven y cómo se llama su concepto; las
// cuatro páginas bajo app/(public)/ y el template por-producto del artículo
// (app/(public)/articulo/page.tsx) leen de acá para no duplicar el mapeo.

import type { Article } from './data/articles';

export type ProductHub = {
  /** `source` value in the articles table ('' = none exists yet, see TFBR). */
  source: string;
  path: string;
  name: string;
  /** The design concept's internal name, used as the hub's editorial device. */
  concept: string;
};

// The Futbol Business Review has NO `source` of its own yet (HANDOFF: "se
// deja apuntando a Substack a propósito") — its hub exists with the full
// design system and an explicit "las ediciones viven en Substack" state, so
// the day editorial mints a `futbol-business-review` source the page simply
// starts listing articles with zero further code changes.
export const PRODUCT_HUBS: ProductHub[] = [
  // Named "Noticias" everywhere the reader looks (user feedback 2026-08-05
  // — the SOURCE_LABELS name, not the newsletter's internal brand);
  // /industry-shots 301s to /noticias in next.config.ts.
  { source: 'industry-shots', path: '/noticias', name: 'Noticias', concept: 'El Trago' },
  { source: 'la-lana', path: '/la-lana', name: 'La Lana del Deporte', concept: 'El Expediente' },
  { source: 'futbol-business-review', path: '/futbol-business-review', name: 'The Futbol Business Review', concept: 'La Sala de Juntas' },
  { source: 'infinitas', path: '/infinitas', name: 'Infinitas', concept: 'El Marcador' },
];

export function hubForSource(source: string): ProductHub | null {
  return PRODUCT_HUBS.find(h => h.source === source) ?? null;
}

// ---------------------------------------------------------------- La Lana
// "El Expediente": cases are numbered chronologically — the first
// investigation ever published is Expediente 001 and the numbering never
// reshuffles as new ones land. Computed from publication order rather than
// stored, so it needs no schema change and stays correct for the whole
// back catalog.
export function caseNumber(article: Article, all: Article[]): string {
  const chronological = all
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id));
  const index = chronological.findIndex(a => a.id === article.id);
  return String(index + 1).padStart(3, '0');
}

// An investigation reads as "open" while it's still fresh news (or an
// editor is deliberately featuring it); afterwards the stamp flips to
// ARCHIVADO. 45 days ≈ La Lana's weekly cadence × a quarter's worth of
// back-and-forth on one story — a design threshold, not business logic.
export const CASE_OPEN_DAYS = 45;

export function caseStatus(article: Article, now: Date = new Date()): 'abierto' | 'archivado' {
  if (article.featured) return 'abierto';
  const published = new Date(`${article.date}T00:00:00Z`);
  if (Number.isNaN(published.getTime())) return 'archivado';
  const days = (now.getTime() - published.getTime()) / 86400000;
  return days <= CASE_OPEN_DAYS ? 'abierto' : 'archivado';
}

// The hub hero pulls the story's single biggest number out large ("€3M/año")
// instead of leaving it buried in body text. Money figures beat
// percentages beat bare big numbers; first match of the strongest kind
// wins. Returns null when the copy simply has no figure — the hero then
// falls back to the case number, which is always available.
const FIGURE_PATTERNS: RegExp[] = [
  // Currency amounts: €3M, US$1,200 millones, $500 mdd, MX$80 mdp…
  /(?:€|US\$|USD\s?|MX\$|\$)\s?[\d][\d.,]*\s?(?:mil\s+millones|millones|billones|mdd|mdp|[MBK])?(?:\s?\/\s?a[nñ]o)?/i,
  // Percentages: 22%, 3.5 %
  /\d[\d.,]*\s?%/,
  // Big counts with a scale word: 91,553 asistentes / 2 millones…
  /\d[\d.,]*\s+(?:mil\s+millones|millones|mil)\b/i,
];

export function extractPullFigure(...texts: (string | null | undefined)[]): string | null {
  const haystack = texts.filter(Boolean).join(' ');
  for (const pattern of FIGURE_PATTERNS) {
    const match = haystack.match(pattern);
    if (match) {
      const figure = match[0].replace(/\s+/g, ' ').trim();
      // A figure that long stops being a visual hook and becomes a
      // sentence; let the fallback handle it instead.
      if (figure.length <= 18) return figure;
    }
  }
  return null;
}

// Authoring convention for the money-trail component (see
// components/products/MoneyTrail.tsx): a paragraph in the article body that
// reads "Ruta del dinero: México → Europa → Islas Caimán" becomes the
// animated route line, drawn as the reader scrolls. Plain text the editor
// can type in TipTap — no schema change, no special field. The paragraph is
// lifted OUT of the flowing text and replaced by the component, so it never
// renders twice.
const TRAIL_HTML_RE = /<p[^>]*>\s*(?:<strong>)?\s*Ruta del dinero:?\s*(?:<\/strong>)?\s*([\s\S]*?)<\/p>/i;
const TRAIL_TEXT_PREFIX = /^\s*Ruta del dinero:?\s*/i;

function splitStops(raw: string): string[] {
  return raw
    .replace(/<[^>]+>/g, '')
    .split(/→|->|⇒/)
    .map(s => s.trim())
    .filter(Boolean);
}

export type MoneyTrailExtraction = { stops: string[]; before: string; after: string };

export function extractMoneyTrailFromHtml(html: string): MoneyTrailExtraction | null {
  const match = html.match(TRAIL_HTML_RE);
  if (!match || match.index === undefined) return null;
  const stops = splitStops(match[1]);
  // One stop is not a route; leave the paragraph alone rather than render
  // a line with nowhere to go.
  if (stops.length < 2) return null;
  return {
    stops,
    before: html.slice(0, match.index),
    after: html.slice(match.index + match[0].length),
  };
}

// Hub masthead: the route should be REAL, not decorative (user feedback
// 2026-08-05 — arbitrary cities with no label read as noise). This pulls
// the "Ruta del dinero" out of an article's body (native TipTap HTML,
// HTML teaser, or plain-text teaser alike) so the hub can show the latest
// expediente's actual money route, labeled as such. Returns null when the
// story declares none — the hub then falls back to the CMS-configured
// route and caption.
export function extractTrailStops(bodyHtml: string | null, teaser: string | null): string[] | null {
  for (const html of [bodyHtml, teaser]) {
    if (html && /<[a-z][\s\S]*>/i.test(html)) {
      const found = extractMoneyTrailFromHtml(html);
      if (found) return found.stops;
    }
  }
  if (teaser && !/<[a-z][\s\S]*>/i.test(teaser)) {
    const paragraphs = teaser.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    const found = extractMoneyTrailFromParagraphs(paragraphs);
    if (found) return found.stops;
  }
  return null;
}

export function extractMoneyTrailFromParagraphs(paragraphs: string[]): { stops: string[]; index: number } | null {
  for (let i = 0; i < paragraphs.length; i++) {
    if (TRAIL_TEXT_PREFIX.test(paragraphs[i])) {
      const stops = splitStops(paragraphs[i].replace(TRAIL_TEXT_PREFIX, ''));
      if (stops.length >= 2) return { stops, index: i };
    }
  }
  return null;
}

// ---------------------------------------------------------- Industry Shots
// "El Trago": the shot-bottle metaphor made functional. One shot ≈ 3
// minutes of reading — the same unit the hub list and the article's
// progress glass both use, so the number the reader scans is the number
// they experience.
export const MINUTES_PER_SHOT = 3;

export function shotsFor(readingTime: number | null): number {
  return Math.max(1, Math.round((readingTime || MINUTES_PER_SHOT) / MINUTES_PER_SHOT));
}

export function shotLabel(readingTime: number | null): string {
  const shots = shotsFor(readingTime);
  return `${shots} shot${shots > 1 ? 's' : ''} ≈ ${readingTime || MINUTES_PER_SHOT} min`;
}

// Cadence badge: the product publishes Martes/Jueves; every entry shows its
// actual weekday so the cadence is visible (and an off-cadence special
// simply shows its real day instead of lying).
export function weekdayFor(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  const day = parsed.toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'UTC' });
  return day.charAt(0).toUpperCase() + day.slice(1);
}

// ------------------------------------------------- Shared: pull-figure beat
// Authoring convention for La Lectura (article redesign, 2026-08-05): a
// paragraph that reads "Cifra clave: US$2.4B — lo que repartió la FIFA"
// becomes a full-bleed pull-figure — the number set huge between rules,
// counting up as it enters view (see components/article/ArticleMotion.tsx),
// with the text after the dash as its caption. Same contract as the other
// two conventions: plain text an editor can type in TipTap, detected
// server-side, gracefully inert when absent or malformed (a value with no
// digits, or too long to be a visual hook, leaves the paragraph untouched).
// Applies to every product source; the caption is optional.
const CIFRA_HTML_RE = /<p[^>]*>\s*(?:<strong>)?\s*Cifra clave:?\s*(?:<\/strong>)?:?\s*([\s\S]*?)<\/p>/gi;
export const CIFRA_TEXT_PREFIX = /^\s*(?:\*\*)?\s*Cifra clave:?\s*(?:\*\*)?:?\s*/i;

export type CifraFigure = { value: string; caption: string };

// The value has to work as a display number: it needs a digit, and past
// ~24 characters it stops being a hook and becomes a sentence — same
// length rationale as extractPullFigure above.
export function parseCifra(raw: string): CifraFigure | null {
  const text = raw.replace(/<[^>]+>/g, '').trim();
  const [valuePart, ...captionParts] = text.split(/\s+[—–-]\s+/);
  const value = valuePart.trim();
  if (!value || value.length > 24 || !/\d/.test(value)) return null;
  return { value, caption: captionParts.join(' — ').trim() };
}

// The declared beat, read OUT of an article's body (native HTML, HTML
// teaser or plain-text teaser alike) — same access pattern as
// extractTrailStops. Used by the homepage's "La cifra del día": an
// editor-declared Cifra clave is the story's OWN number and always beats
// anything scraped from title/excerpt (calibration from user feedback,
// 2026-08-05: the LIV Golf story surfaced the PIF's historical 6,000
// millones from the excerpt while the story's actual figure — the
// rumored US$250M — sat declared in the body).
export function extractCifraFromBody(bodyHtml: string | null, teaser: string | null): CifraFigure | null {
  for (const html of [bodyHtml, teaser]) {
    if (html && /<[a-z][\s\S]*>/i.test(html)) {
      CIFRA_HTML_RE.lastIndex = 0;
      const match = CIFRA_HTML_RE.exec(html);
      if (match) {
        const parsed = parseCifra(match[1]);
        if (parsed) return parsed;
      }
    }
  }
  if (teaser && !/<[a-z][\s\S]*>/i.test(teaser)) {
    for (const paragraph of teaser.split(/\n{2,}/)) {
      if (CIFRA_TEXT_PREFIX.test(paragraph.trim())) {
        const parsed = parseCifra(paragraph.trim().replace(CIFRA_TEXT_PREFIX, ''));
        if (parsed) return parsed;
      }
    }
  }
  return null;
}

// HTML bodies: string-level transform on already-sanitized editor HTML
// (same trust boundary as markOpinionCallout below). Runs BEFORE the ad
// split — splitAfterParagraph only counts top-level </p>, and the figure
// contains none, so the split can never cut a beat open.
export function markCifraFigures(html: string): string {
  return html.replace(CIFRA_HTML_RE, (match, inner: string) => {
    const parsed = parseCifra(inner);
    if (!parsed) return match;
    const caption = parsed.caption
      ? `<figcaption class="lect-pullfig-caption">${parsed.caption}</figcaption>`
      : '';
    return `<figure class="lect-pullfig"><span class="lect-pullfig-value" data-lect-countup>${parsed.value}</span>${caption}</figure>`;
  });
}

// ------------------------------------------------ Shared: the Jugada strip
// Authoring convention (La Lectura round 2, 2026-08-05): a paragraph that
// reads "Jugada: Volkswagen ↔ Bayern" becomes the connection strip — the
// two-party relationship at the heart of the story set as a split-flap
// pairing, the same board language La Lana's masthead already speaks.
// Corpus-driven: mining the catalog showed the stories with no figure to
// pull are almost all two-party deal stories (Chelsea ↔ Strava, ATP ↔ WTA,
// COI ↔ Rusia…) — the connection IS their headline asset. "↔" for two-way
// relationships, "→" for a one-way flow, one per article. Same contract as
// every convention here: plain TipTap text, detected server-side, inert
// when absent or malformed.
const JUGADA_HTML_RE = /<p[^>]*>\s*(?:<strong>)?\s*(?:La\s+)?Jugada:?\s*(?:<\/strong>)?:?\s*([\s\S]*?)<\/p>/gi;
export const JUGADA_TEXT_PREFIX = /^\s*(?:\*\*)?\s*(?:La\s+)?Jugada:?\s*(?:\*\*)?:?\s*/i;

export type Jugada = { left: string; right: string; arrow: '↔' | '→' };

// Each side has to work as a flap cell: non-empty and short. Longer sides
// (or no arrow at all) leave the paragraph untouched.
export function parseJugada(raw: string): Jugada | null {
  const text = raw.replace(/<[^>]+>/g, '').trim();
  const match = text.match(/^(.{1,32}?)\s*(↔|<->|→|->|⇒)\s*(.{1,32})$/);
  if (!match) return null;
  const left = match[1].trim();
  const right = match[3].trim();
  if (!left || !right) return null;
  return { left, right, arrow: match[2] === '↔' || match[2] === '<->' ? '↔' : '→' };
}

export function jugadaMarkup(jugada: Jugada): string {
  const conn = `${jugada.left} ${jugada.arrow} ${jugada.right}`;
  return (
    `<div class="lect-jugada" role="note" aria-label="La jugada: ${conn}">` +
    `<span class="lect-jugada-label">La jugada</span>` +
    `<span class="lect-jugada-conn" aria-hidden="true">` +
    `<span class="lect-jugada-side">${jugada.left}</span>` +
    `<span class="lect-jugada-arrow">${jugada.arrow}</span>` +
    `<span class="lect-jugada-side">${jugada.right}</span>` +
    `</span></div>`
  );
}

// HTML bodies: same trust boundary and same ad-split safety as
// markCifraFigures (the strip contains no top-level </p>).
export function markJugada(html: string): string {
  return html.replace(JUGADA_HTML_RE, (match, inner: string) => {
    const parsed = parseJugada(inner);
    return parsed ? jugadaMarkup(parsed) : match;
  });
}

// --------------------------------------------- Shared: lead-in scan marks
// Both publish skills already mandate that every paragraph opens with a
// short bold lead-in ending in a colon ("**La sanción:** …") — house
// style with zero styling until now. This tags those lead-ins so the CSS
// can set them as product-accented scan marks: the reader skims the
// lead-ins like a briefing's margin notes. Colon-anchored and
// figure-excluded (a paragraph that OPENS with a bold figure is the
// count-up device's territory, not a label). Runs LAST in the transform
// chain: the opinion/cifra/jugada paragraphs are already consumed by
// their own devices by then.
const LEADIN_HTML_RE = /<p([^>]*)><strong>\s*([^<]{2,42}?):\s*<\/strong>/g;

export function markLeadIns(html: string): string {
  return html.replace(LEADIN_HTML_RE, (match, attrs: string, label: string) => {
    // A label that is itself just a figure stays a plain strong.
    if (/^[\d\s.,%€$]+$/.test(label) || /^(?:US\$|MX\$|USD)/i.test(label)) return match;
    return `<p${attrs}><strong class="lect-leadin">${label}:</strong>`;
  });
}

// The Playbook-opinion paragraph gets its own visually distinct callout,
// separated clearly from reporting (a credibility move: the fact/opinion
// line becomes explicit). This is NOT a new authoring convention — it
// matches what the publish-newsletter pipeline has always written: every
// product article ends with a "**Opinión de Playbook:**" paragraph (bold
// lead-in, no leading "La" — checked against the real corpus, 10 live
// articles all use that exact shape), so the whole existing catalog gets
// the callout with zero re-editing. The regex tolerates the "La opinión…"
// variant too. Applies to every product source (Noticias, La Lana,
// Infinitas, TFBR all share the four-paragraph standard); per-product CSS
// tints the fence. String-level transform on already-sanitized editor
// HTML (same trust boundary as the dangerouslySetInnerHTML call sites in
// articulo/page.tsx) — the wrapper adds only our own static markup.
const OPINION_HTML_RE = /<p([^>]*)>(\s*(?:<strong>)?\s*(?:La\s+)?[Oo]pini[oó]n de Playbook:?\s*(?:<\/strong>)?:?\s*)([\s\S]*?)<\/p>/;
export const OPINION_TEXT_PREFIX = /^\s*(?:\*\*)?\s*(?:La\s+)?[Oo]pini[oó]n de Playbook:?\s*(?:\*\*)?:?\s*/;

export function markOpinionCallout(html: string): string {
  return html.replace(
    OPINION_HTML_RE,
    (_m, attrs: string, _label: string, rest: string) =>
      `<aside class="shot-opinion"><span class="shot-opinion-kicker">Opinión de Playbook</span><p${attrs}>${rest}</p></aside>`,
  );
}
