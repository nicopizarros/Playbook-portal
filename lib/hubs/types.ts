// ---------------------------------------------------------------- Hubs
// A HUB IS NOT A FIFTH EDITORIAL PRODUCT. The four products (Noticias, La
// Lana del Deporte, The Futbol Business Review, Infinitas) in
// lib/product-hubs.ts are FORMATS Playbook owns and publishes: each has a
// `source` column value, its own voice, its own cadence, and articles are
// born into exactly one of them.
//
// A hub is a Playbook-owned COVERAGE DESTINATION organised around an
// external property we do not own (the LFA, the 2026 World Cup, NFL
// México). Its content is not authored into it — it is GATHERED from
// whatever the four products already published, by tag. One article
// belongs to exactly one product but can surface in several hubs, and a
// hub can exist before a single article carries its tag.
//
// Consequences encoded below:
//   • products key on `source`; hubs key on a TAG PREDICATE.
//   • products live at a bespoke top-level route each; hubs share one
//     dynamic route, /coberturas/[slug].
//   • products are bespoke pages; a hub is CONFIG + ASSETS. Adding hub
//     two must not require a new component. If it does, this file failed.
//
// Route namespace: /coberturas/[slug]. Every non-proper-noun route on this
// site is already Spanish (/archivo, /articulo, /tema, /autor, /cuenta,
// /privacidad, /terminos) and "cobertura" is the newsroom's own word for
// sustained coverage of a property. `Hub` stays the internal type name —
// the code speaks engineering, the URL speaks the reader's language.

// -------------------------------------------------------------- Provenance
// Section 5 rule, enforced by the type system rather than by discipline:
// ANY factual number rendered on a hub page must trace to a source. There
// is no way to construct a HubFigure without one — a figure with no
// provenance is a compile error, not a code-review catch.
//
// `url` is deliberately OPTIONAL but its absence is VISIBLE: a figure
// whose source has no public citation renders with a "por verificar"
// marker (components/hubs/HubFigureSource.tsx). That is the honest middle
// between silently publishing an unsourced number and refusing to model a
// fact the publisher knows to be true but has not yet cited. It also makes
// the citation backlog self-documenting: the page itself shows what still
// needs a link.
export type HubSource = {
  /** Who said it. "Comunicado LFA, 2026-08-18", "Bloomberg", … */
  label: string;
  /** Public citation. Absent → the figure renders as "por verificar". */
  url?: string;
  /** Optional qualifier: "cifra anunciada, no auditada", … */
  note?: string;
};

export type HubFigure = {
  /** Display value exactly as it should read: "US$100M", "12", "8". */
  value: string;
  /** What the number is. Sentence case, no filler. */
  label: string;
  source: HubSource;
};

// -------------------------------------------------------- La Cadena
// The signature device. American football is the only sport that carries a
// measuring apparatus onto the field to adjudicate whether progress
// crossed a threshold — the chain crew. That maps exactly onto how a
// business-intelligence reader should see this league: expansion is not a
// vibe, it is a measured distance to a stated line.
//
// Renders ONLY when there is a sourced target. No target → the module is
// absent from the page, not present-and-empty with placeholder numbers.
// The readout leads with DISTANCE REMAINING in the league's own units
// ("faltan 4 franquicias"), never a percentage — a percentage is the
// generic-progress-bar answer and says nothing a reader can act on.
export type HubChain = {
  /** "Expansión de franquicias" */
  title: string;
  /** Unit noun, singular/plural: ["franquicia", "franquicias"] */
  unit: [string, string];
  /** Where the property stands today. */
  current: HubFigure;
  /** The stated line to gain. */
  target: HubFigure;
  /** When the target is meant to be reached: "2027". */
  horizon: string;
};

// ------------------------------------------------------------- Plazas
// Franchise markets framed as COMMERCIAL markets, which is the Playbook
// framing — a plaza is inventory a sponsor buys, not a dot on a map.
// `status` drives the yard-line treatment: an established plaza sits
// behind the line, an announced expansion market sits past it.
export type HubPlaza = {
  city: string;
  /** State/entity, for disambiguation: "Nuevo León". */
  region?: string;
  /** Team name if one exists. Empty for an announced-but-unnamed market. */
  team?: string;
  venue?: string;
  /** What a sponsor is actually buying here. One line, no filler. */
  marketNote?: string;
  status: 'establecida' | 'anunciada';
  /** Every plaza carries its own provenance — same rule as HubFigure. */
  source: HubSource;
};

// ------------------------------------------------------ Season spine
// Built ONLY if the content supports it (section 4). A hub with no dated
// anchors omits this entirely rather than inventing a timeline.
export type HubSeasonBeat = {
  label: string;
  /** Free text — "Marzo 2027", "Por confirmar". Not a Date: these are
      announced intentions, and a real Date would imply precision the
      source does not have. */
  when: string;
  note?: string;
  source: HubSource;
};

// --------------------------------------------------------- Sponsorship
// One designed inventory slot. The PLACEHOLDER STATE MUST LOOK
// INTENTIONAL — this is the state a prospective sponsor sees in a deck,
// so it is designed as an offer, not as a gap.
export type HubSponsorSlot = {
  /** "Presentado por" — the label the sold state would wear. */
  kicker: string;
  /** The pitch shown while unsold. */
  pitch: string;
  contactUrl: string;
  /** Sold state: set all three and the slot renders the partner instead. */
  partner?: { name: string; logo?: string; url?: string };
};

// ---------------------------------------------------------- Identity
// Configuration plus assets, never bespoke code. `accent` is the ONE token
// file under styles/hubs/<slug>.tokens.css; `logo` is a swappable asset
// with a mandatory text fallback (see the legal note below).
export type HubIdentity = {
  /** Token file stem under styles/hubs/. Loaded via the hub's data-hub. */
  tokens: string;
  /** Wordmark text. ALWAYS rendered — the logo is decoration over it. */
  wordmark: string;
  /**
   * Nominative-reference logo slot. LEGAL GUARDRAIL: the hub's visual
   * identity is PLAYBOOK'S, built to sit adjacent to the property, never a
   * reproduction of its brand system. This is a single constrained lockup
   * slot for the property's mark used as nominative reference only. It is
   * optional and swappable, and `wordmark` above renders whether or not it
   * resolves — so an unlicensed or withdrawn mark degrades to type rather
   * than breaking the page. Do not lift team crests, do not clone the
   * property's palette, do not imply partnership or licensing.
   */
  logo?: { src: string; alt: string; width: number; height: number };
};

// ------------------------------------------------------------ The hub
export type Hub = {
  slug: string;
  /** Reader-facing name. */
  name: string;
  /** The property's full legal/commercial name, for the masthead rule. */
  fullName: string;
  /**
   * Whether the hub is advertised. `false` = UNLISTED: the route works and
   * renders, but it is absent from the header's Coberturas zone and from
   * the sitemap, so nothing links to it and nothing crawls it. This is the
   * launch state — the page can be reviewed at its real URL before it is
   * announced. Flipping it to `true` is the whole "go live" change.
   */
  listed: boolean;
  /** One line: why this property warrants a permanent destination. */
  thesis: string;
  /** SEO description. */
  description: string;
  identity: HubIdentity;
  /**
   * The tag predicate that defines this hub's article pool. A hub GATHERS;
   * it does not own a `source`. See lib/taxonomy.ts's `property` tier and
   * the boundary rule in .claude/playbook-editorial/fields-and-taxonomy.md.
   */
  tag: string;
  /** Products that cover this beat — cross-links, section 4. */
  relatedSources: string[];
  /**
   * Strings the backfill sweep searches for when looking for articles that
   * SHOULD carry this hub's tag (scripts/backfill-hub-tags.ts). Cast wide
   * on purpose — the sweep only ever proposes candidates, and the boundary
   * rule (references/fields-and-taxonomy.md) decides. A term that produces
   * only rejects is still doing its job: it proves the sweep looked.
   */
  backfillTerms: string[];
  chain?: HubChain;
  commercialState: HubFigure[];
  plazas: HubPlaza[];
  season: HubSeasonBeat[];
  sponsor: HubSponsorSlot;
  /** Shown when the coverage pool is empty. An invitation, not a dead end. */
  emptyState: { heading: string; body: string };
};
