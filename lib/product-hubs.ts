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

// The Playbook-opinion paragraph gets its own visually distinct callout,
// separated clearly from reporting (a credibility move: the fact/opinion
// line becomes explicit). Authoring convention, same spirit as the money
// trail: a paragraph starting with "La opinión de Playbook:" is wrapped in
// an <aside> the CSS styles as the bottle-cap callout. String-level
// transform on already-sanitized editor HTML (same trust boundary as the
// dangerouslySetInnerHTML call sites in articulo/page.tsx) — the wrapper
// adds only our own static markup.
const OPINION_HTML_RE = /<p([^>]*)>(\s*(?:<strong>)?\s*La opini[oó]n de Playbook:?\s*(?:<\/strong>)?:?\s*)([\s\S]*?)<\/p>/i;
export const OPINION_TEXT_PREFIX = /^\s*La opini[oó]n de Playbook:?\s*/i;

export function markOpinionCallout(html: string): string {
  return html.replace(
    OPINION_HTML_RE,
    (_m, attrs: string, _label: string, rest: string) =>
      `<aside class="shot-opinion"><span class="shot-opinion-kicker">La opinión de Playbook</span><p${attrs}>${rest}</p></aside>`,
  );
}
