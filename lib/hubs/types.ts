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

// ------------------------------------------------------------- Photography
// A hub is a DESTINATION, and a destination that is only type reads as a
// document. Photography is what makes it read as a section — which is the
// whole point of the 2026-08-19 mockup's own layout: it leads with an image
// in the masthead, in the lead story and in the access module, and lets the
// data modules stay typographic by contrast.
//
// CONFIG, NOT CODE. Every photographic slot below is optional and lives in
// lib/hubs/<slug>.ts. A hub that supplies none renders the same page with
// the type-only treatment — no component branches on a slug, and hub two
// gets photography by adding two lines to its config file.
//
// `credit` is not decoration: .claude/playbook-editorial/images.md requires
// every photo Playbook publishes to name its source, because that credit is
// what the takedown clause in /terminos rests on. It renders as a hairline
// caption over the image.
export type HubImage = {
  src: string;
  /** Real alt text. Empty string ONLY for art that carries no information. */
  alt: string;
  /** "Foto: LFA", "Cortesía Global Sports Capital", … */
  credit?: string;
};

export type HubFigure = {
  /** Display value exactly as it should read: "US$100M", "12", "8". */
  value: string;
  /** What the number is. Sentence case, no filler. */
  label: string;
  source: HubSource;
};

// ------------------------------------------------------- La afición
// The demand side of the board. `commercialState` says what has been
// committed TO the property; this says what the property has to sell —
// audience. They belong on the same plane and read as one argument, which
// is why this renders as a second band inside the same board rather than
// as a stats bar bolted to the end of the page.
//
// WHY THIS CARRIES ITS OWN `credit` INSTEAD OF LEANING ON HubSource.
// HubSource renders NOTHING without a public URL (publisher's call,
// 2026-08-18: uncited chips read as clutter). That default is right for
// Playbook's own uncited knowledge — the backlog lives in docs/TODO.md.
// It is WRONG for a licensed third-party dataset: crediting the owner of
// the study is a condition of using it, not a citation we are still
// chasing. A licence obligation cannot be allowed to silently render as
// nothing because the study has no public link. So `credit` is a plain
// string and ALWAYS renders.
//
// Per-figure `source` is still required on every figure (HubFigure's
// invariant is untouched). The band shows ONE credit when every figure
// agrees on its source label, and falls back to per-figure chips when they
// do not — so adding a figure from a different study can never end up
// silently sitting under the wrong attribution.
export type HubAudience = {
  /** Section kicker: "La afición". */
  kicker: string;
  heading: string;
  /** One line saying what the reader should take from these numbers. */
  sub?: string;
  /** Editable data source — add figures here, never to the markup. */
  figures: HubFigure[];
  /**
   * Rights/attribution line, rendered verbatim and unconditionally.
   * "Fuente: Global Intelligence – Fan Base © Global Sponsorship Group, 2026"
   */
  credit: string;
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
  /**
   * State key for the map (components/hubs/MexicoMap.tsx). Must match a key
   * in lib/hubs/mexico-map.ts — including the source data's historical
   * "Distrito Federal" for Ciudad de México.
   */
  state?: string;
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

// -------------------------------------------------------- Editorial framing
// Three modules that describe PLAYBOOK'S OWN COVERAGE PROMISE rather than a
// claim about the property, so — unlike HubFigure/HubPlaza/HubSeasonBeat —
// none of these carry a HubSource. "We follow capital and ownership" is an
// editorial commitment, not a fact that can be right or wrong.

/** "Temas que seguimos" — the beats Playbook commits to covering all year. */
export type HubPillar = {
  title: string;
  description: string;
};

/**
 * "Momentos clave" — the property's own recurring annual structure (its
 * season shape, not a specific dated event — that's HubSeasonBeat), with
 * the business story each phase opens up. Generic sports-calendar
 * structure (offseason, draft, playoffs…) needs no citation; a SPECIFIC
 * date or figure inside one still would, same as everywhere else on the hub.
 */
export type HubMoment = {
  label: string;
  description: string;
  /** Marks the 1-2 moments the hub treats as its biggest commercial beats. */
  highlight?: boolean;
};

/** "Desde adentro" — what the partnership gets a reader that a topic page
    can't: named access categories, not a specific claimed interview. */
export type HubAccessItem = {
  title: string;
  description: string;
};

// ---------------------------------------------------------- Identity
// Configuration plus assets, never bespoke code. `accent` is the ONE token
// file under styles/hubs/<slug>.tokens.css; `logo` is a swappable asset
// with a mandatory text fallback (see the legal note below).
export type HubIdentity = {
  /** Token file stem under styles/hubs/. Loaded via the hub's data-hub. */
  tokens: string;
  /**
   * Wordmark text, and the masthead's h1. ALWAYS rendered — the logo is
   * decoration over it, never a replacement.
   *
   * This became the h1 on 2026-08-24 (publisher's call, matching the
   * mockup). It used to be a small kicker above a tagline headline, which
   * meant the biggest type on a coverage destination was a strapline rather
   * than the name of the property the page is about. Naming the subject in
   * the h1 is also simply the conventional answer for a destination page.
   */
  wordmark: string;
  /**
   * Optional second half of the wordmark, rendered in the hub's accent.
   *
   * Exists because a property's commercial name and its bare name are
   * different strings and the split is meaningful: the LFA wears its title
   * sponsor ("LFA FINSUS"), and colouring the sponsor half is how the
   * league sets its own lockup. Absent, the h1 is just `wordmark` and
   * nothing else changes — a hub with no title sponsor sets nothing here.
   */
  wordmarkAccent?: string;
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
  /**
   * Full-bleed masthead artwork, behind the lockup and the h1.
   *
   * Same nominative-reference posture as `logo` and the same degradation
   * rule: absent, the masthead falls back to the token-driven wash in
   * styles/hubs/hub.css, so removing this line loses the photograph and
   * nothing else. The image must have a LOW-INFORMATION SIDE — the scrim
   * that keeps the headline legible eats roughly the left 55% of it — so a
   * centred subject is the wrong choice here even when it is the better
   * photograph.
   */
  heroArt?: HubImage;
};

// ------------------------------------------------------------ The hub
export type Hub = {
  slug: string;
  /** Reader-facing name. */
  name: string;
  /**
   * The property's full legal/commercial name. No longer in the masthead
   * (2026-08-24 — the mockup's hero has no room for it and the h1 now names
   * the property anyway), but still rendered as the description under each
   * hub in the header's Coberturas menu (components/layout/HeaderNav.tsx).
   */
  fullName: string;
  /**
   * Whether the hub is public. `false` = UNLISTED: absent from the header's
   * Coberturas zone and from the sitemap (nothing links to it, nothing
   * crawls it), `robots: noindex` on its own page, AND — 2026-08-19 —
   * access-restricted: app/(public)/coberturas/[slug]/page.tsx's
   * assertHubViewable() 404s anyone who isn't signed in with the `editor`
   * role, the same session check app/admin/(protected)/layout.tsx uses.
   * This started as pure obscurity (reachable by anyone with the URL) and
   * was hardened into a real boundary after the LFA hub got indexed while
   * briefly listed with its partnership already stated as fact — a
   * pre-announcement hub can now be built and reviewed by editors at its
   * real URL with nothing public-facing ever seeing it. Flipping it to
   * `true` is the whole "go live" change.
   */
  listed: boolean;
  /**
   * The masthead eyebrow, used ONLY when `partnership` is absent.
   *
   * A partnered hub builds its eyebrow from the relationship instead
   * ("Medio oficial de negocios · Playbook × LFA FINSUS"), which is the
   * more specific claim and outranks this. But `partnership` is optional by
   * design — most hubs cover a property Playbook has no agreement with —
   * and without this fallback those hubs would render a masthead with no
   * eyebrow at all. Short, ~6 words, set in caps by the stylesheet.
   */
  tagline: string;
  /**
   * Playbook's declared relationship to the property. When set it becomes
   * the masthead eyebrow, composed with the co-branding pair — the page
   * renders "{partnership} · Playbook × {wordmark}" — and it displaces
   * `tagline` above.
   *
   * OPTIONAL, and only ever set when the relationship is real and
   * contractual: this is a public claim about a commercial agreement, so an
   * aspirational value here would be a misrepresentation, not marketing.
   * Absent for any property we merely cover.
   */
  partnership?: string;
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
  /** "La afición". Optional — a hub with no audience data renders the board unchanged. */
  audience?: HubAudience;
  plazas: HubPlaza[];
  season: HubSeasonBeat[];
  /** "Temas que seguimos". Optional — omit rather than pad with generic beats. */
  pillars?: HubPillar[];
  /** "Momentos clave". Optional — the property's own annual shape, if it has one worth naming. */
  momentsClave?: HubMoment[];
  /** "Desde adentro". Optional — only what the partnership genuinely delivers today. */
  access?: HubAccessItem[];
  /**
   * The photograph beside "Desde adentro". A POSTER, not a claimed piece of
   * content: it carries the access promise visually, and deliberately wears
   * no play button and no "watch this" affordance, because no interview or
   * video exists yet. The mockup's own version of this module invented a
   * clip labelled "DEMO INTERNO"; shipping that would be the same
   * fabrication the provenance rule forbids for figures, applied to content
   * instead of a number.
   */
  accessPhoto?: HubImage;
  /** Shown when the coverage pool is empty. An invitation, not a dead end. */
  emptyState: { heading: string; body: string };
};
