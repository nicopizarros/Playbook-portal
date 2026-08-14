// Fixed, three-tier tag taxonomy. Single source of truth, ported verbatim
// from legacy/js/taxonomy.js — used by both the admin CMS (Phase 4) and the
// public site (filter pills, /tema validation) so they can't drift apart.

export const SCOPE_OPTIONS = ['Nacional', 'Internacional'] as const;

export const SPORT_OPTIONS = [
  'Fútbol', 'Liga MX', 'NFL', 'NBA', 'Béisbol', 'Tenis', 'Golf', 'F1', 'Olímpico', 'Multi-deporte / Otros',
] as const;

export const VERTICAL_OPTIONS = [
  'Gobernanza y Regulación', 'Derechos de TV y Streaming', 'Fusiones y Adquisiciones',
  'Patrocinios', 'Infraestructura y Venues', 'Sedes y Eventos', 'Finanzas y Negocio',
  'Private Equity e Inversiones', 'Mercadotecnia Deportiva', 'Gestión de Talento',
  'Audiencias y Consumo', 'Fan Experience', 'Naming Rights',
] as const;

export type TaxonomyTier = 'scope' | 'sport' | 'vertical';

export const TAXONOMY: Record<TaxonomyTier, readonly string[]> = {
  scope: SCOPE_OPTIONS,
  sport: SPORT_OPTIONS,
  vertical: VERTICAL_OPTIONS,
};

// ---------------------------------------------------------------- Per-section topics
// The tag row at the foot of an article used to be identical everywhere:
// scope, then sport, then vertical, under the same generic heading, whether
// the reader had just finished a Liga MX transfer story or a women's-sport
// feature. Requested change (2026-07-24): make it specific to the section.
//
// What actually differs per section is which tier carries the meaning, so
// that's what this table encodes — a tier ORDER (the first entry leads the
// row) and the section's own wording for the disclosure. Tiers are only
// reordered, never dropped: every tag an editor sets stays visible and
// every /tema link stays crawlable, which is the whole reason the chips
// live in the DOM rather than behind a fetch.
//
// Keyed by `source`, the same field SOURCE_LABELS, the homepage 1+5 filter
// and the archive's "Sección" filter already key on, so a piece's section
// is set in exactly one place. Anything not listed here (or an article
// whose source is a value we don't recognise) falls back to DEFAULT_TOPICS,
// which is the historical scope → sport → vertical order.
export type SectionTopics = {
  /** Tier order, first leads the row. */
  order: readonly TaxonomyTier[];
  /** Disclosure label, e.g. "Temas de esta noticia". */
  label: string;
};

export const DEFAULT_TOPICS: SectionTopics = {
  order: ['scope', 'sport', 'vertical'],
  label: 'Temas del artículo',
};

export const SECTION_TOPICS: Record<string, SectionTopics> = {
  // Noticias is the daily business-news feed: the business vertical
  // (derechos de TV, patrocinios, M&A…) is the reason a reader clicks
  // through, the sport is context.
  noticias: { order: ['vertical', 'sport', 'scope'], label: 'Temas de esta noticia' },
  // La Lana del Deporte (renamed from La Lana del Mundial once its scope
  // widened past the 2026 World Cup to sports business generally) leads
  // with scope (Nacional/Internacional) over sport, since a given edition
  // can cover football, cycling, or any other discipline.
  'la-lana': { order: ['scope', 'vertical', 'sport'], label: 'Temas de La Lana del Deporte' },
  // Infinitas covers women's sport across disciplines: which sport it is
  // carries the most information here.
  infinitas: { order: ['sport', 'vertical', 'scope'], label: 'Temas de Infinitas' },
  // Opinión is argument-led; the business vertical is the axis an opinion
  // piece actually takes a position on.
  opinion: { order: ['vertical', 'scope', 'sport'], label: 'Temas de esta opinión' },
};

export function topicsForSection(source: string): SectionTopics {
  return SECTION_TOPICS[source] ?? DEFAULT_TOPICS;
}

// ------------------------------------------------- Controlled-vocabulary gate
// TODO #1 (news classification), decided 2026-08-14: tags stay a fixed
// controlled vocabulary — the three option lists above — and every write
// path validates against it, so a typo can no longer mint a tag that no
// filter, hub, or /tema page can reach. The drafting agent (publish
// skills) proposes; this vocabulary constrains; a rejection surfaces to
// whoever ran the publish, which is the arbitration order. `priority`
// stays deliberately editorial and out of scope for the classifier.
//
// canonicalizeTag folds case/accents/whitespace so "futbol", "Fútbol " and
// "FÚTBOL" all file under the canonical 'Fútbol' instead of being
// rejected; only values that don't fold to any option are invalid.

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const FOLDED_OPTIONS: Record<TaxonomyTier, Map<string, string>> = {
  scope: new Map(SCOPE_OPTIONS.map(o => [fold(o), o])),
  sport: new Map(SPORT_OPTIONS.map(o => [fold(o), o])),
  vertical: new Map(VERTICAL_OPTIONS.map(o => [fold(o), o])),
};

/** The canonical option this value folds to, or null if out of vocabulary. */
export function canonicalizeTag(tier: TaxonomyTier, value: string): string | null {
  return FOLDED_OPTIONS[tier].get(fold(value)) ?? null;
}

export type TagIssue = { tier: TaxonomyTier; value: string; suggestion: string | null };

export type ValidatedTags = {
  tags: Record<TaxonomyTier, string[]>;
  /** Values that could not be canonicalized — already excluded from `tags`. */
  issues: TagIssue[];
};

// Cheap nearest-option hint for rejection messages: the option sharing the
// longest common prefix with the folded input (≥4 chars), else null. Not a
// classifier — just enough for "Patrocinio → ¿Patrocinios?" in an error.
function nearestOption(tier: TaxonomyTier, value: string): string | null {
  const folded = fold(value);
  let best: string | null = null;
  let bestLen = 3;
  for (const [key, canonical] of FOLDED_OPTIONS[tier]) {
    let i = 0;
    while (i < key.length && i < folded.length && key[i] === folded[i]) i++;
    if (i > bestLen) {
      bestLen = i;
      best = canonical;
    }
  }
  return best;
}

export function validateTags(input: Record<TaxonomyTier, string[]>): ValidatedTags {
  const tags: Record<TaxonomyTier, string[]> = { scope: [], sport: [], vertical: [] };
  const issues: TagIssue[] = [];
  for (const tier of Object.keys(tags) as TaxonomyTier[]) {
    for (const value of input[tier] ?? []) {
      if (!value?.trim()) continue;
      const canonical = canonicalizeTag(tier, value);
      if (canonical) {
        if (!tags[tier].includes(canonical)) tags[tier].push(canonical);
      } else {
        issues.push({ tier, value, suggestion: nearestOption(tier, value) });
      }
    }
  }
  return { tags, issues };
}

export function formatTagIssues(issues: TagIssue[]): string {
  return issues
    .map(i => `${i.tier}: "${i.value}"${i.suggestion ? ` (¿"${i.suggestion}"?)` : ''}`)
    .join(', ');
}
