// Client-safe figure parsing/formatting shared by every count-up device
// (ArticleMotion's inline strongs + pull-figures, the homepage's "La cifra
// del día"). Extracted from ArticleMotion (2026-08-05, second pass) so the
// number semantics can't drift between surfaces. Pure functions, no
// runtime imports — safe in client and server components alike.

// "US$9,612 millones" → prefix "US$", numeric "9,612", suffix " millones".
export function splitFigure(text: string): { pre: string; num: string; post: string } | null {
  const match = text.match(/^([\s\S]*?)(\d[\d.,]*)([\s\S]*)$/);
  if (!match) return null;
  return { pre: match[1], num: match[2], post: match[3] };
}

// es-MX numbers: a trailing [.,] + 1-2 digits is a decimal part ("42.8",
// "2.35"); every other separator is a thousands group ("9,612", "91,553").
export function parseNumeric(num: string): { value: number; decimals: number } | null {
  let intPart = num;
  let decPart = '';
  const dec = num.match(/^(.+)[.,](\d{1,2})$/);
  if (dec) {
    intPart = dec[1];
    decPart = dec[2];
  }
  const value = Number(decPart ? `${intPart.replace(/[.,]/g, '')}.${decPart}` : intPart.replace(/[.,]/g, ''));
  if (Number.isNaN(value)) return null;
  return { value, decimals: decPart.length };
}

export function formatNumeric(value: number, decimals: number): string {
  return value.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// One standalone figure, anchored (the whole string IS the figure) —
// mirrors lib/product-hubs.ts's FIGURE_PATTERNS for the strong-count-up
// check.
export const FIGURE_TEXT_RE =
  /^\s*(?:€|US\$|USD\s?|MX\$|\$)?\s?\d[\d.,]*\s?(?:%|mil\s+millones|millones|billones|mdd|mdp|bn|[MBK])?(?:\s?\/\s?a[nñ]o)?\s*$/i;

// A figure ANYWHERE inside prose — used by the inline highlighter. Money
// beats percentages beats scale-worded counts, same priority rationale as
// extractPullFigure; bare numbers without a currency/percent/scale marker
// are deliberately NOT matched (dates, jersey numbers, years would light
// up half the copy).
export const FIGURE_INLINE_RE =
  /(?:€|US\$|USD\s|MX\$|\$)\s?\d[\d.,]*(?:\s?(?:mil\s+millones|millones|billones|mdd|mdp|bn|[MBK]))?(?:\s?\/\s?a[nñ]o)?|\d[\d.,]*\s?%|\d[\d.,]*\s(?:mil\s+millones|millones)\b/g;
