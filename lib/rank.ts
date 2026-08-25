// Shared ranking logic used by the homepage, archive, tema, hubs and the
// admin CMS, so "what counts as important" is defined in exactly one place.
//
// ---------------------------------------------------------------------------
// 2026-08-20: REPLACED the 1-5 star system with the 0-99 boleta.
// ---------------------------------------------------------------------------
// What was here before: `rankScore = priority * 1.5 - daysSince(date)`, where
// `priority` was an editor-set 1-5 star field. It worked, but it ran out of
// room. Measured against the real corpus the day this landed: 94 of 159
// published rows (59%) sat at 4 or 5 stars, and 31 of the 41 five-star rows
// were from the last three weeks alone. When six stories publish in a day and
// four of them are "5", the homepage order is decided by the date-string
// tiebreak -- i.e. by upload order, which is an accident, not a judgement.
//
// The replacement (publisher's spec, "Cómo decide Playbook qué va arriba",
// Agosto 2026) never asks how important a story is. It asks what the story
// CONTAINS, in eleven yes/no questions, and the number falls out. That is the
// whole defence against rating inflation: conviction cannot move the needle,
// only a verifiable fact can.
//
//   decena (tens digit)  what the story reports -> which level it belongs to.
//   unit  (ones digit)   how well it is made -> how it orders WITHIN that
//                        level. The positive unit values sum to exactly 9, by
//                        design, so a perfectly-made story fills its level to
//                        the brim and still never leaks into the next one.
//
// The modifiers move the DECENA, not the score: "México +2" is +20 points.
// Checked against all eight worked examples in the spec's 17-ago-2026 table
// (Lamour 87, Fox 85, Buss 73, Padres 67, Flag 55, Chelsea 53, LIV 45,
// Oceanía 33): 6 of 8 reconstruct exactly (scripts/verify-worked-examples.ts).
// The other two (Buss, Chelsea) land +2 high -- see the Unit type below for
// which question causes each, and why the higher reading was kept anyway.
//
// Two boletas, two clocks. A news story is worth the fact it reports; an
// investigation explains how the money behind an already-known fact works, and
// scored on the news boleta it would rate in the thirties and fall off on
// Monday. That would be a bug in the system, not a verdict on the piece. So
// editorial products run their own boleta on their own track at their own
// decay, and the two never compete for the same slot.

// ---------------------------------------------------------------- Tracks

export type Track = 'news' | 'editorial';

// The long-form/investigative products.
//
// `infinitas` IS NOT HERE, and the spec is self-contradictory about it. Its
// editorial-boleta header lists "La Lana, Infinitas, The Futbol Business
// Review", but its own worked example -- the 17-ago-2026 portada table --
// places an infinitas-sourced article ("Mexico asegura su lugar en LA28")
// at Portada 4, scored on the NEWS boleta at 55. The corpus breaks the tie:
// all 12 infinitas articles in the 2026-08-20 reclassification are news-shaped
// (a transfer with a fee, a production contract, a UCI ruling, a bronze medal),
// and not one of them fits any editorial decena -- there is no original
// investigation and no explanatory framework among them. Infinitas is a
// women's-sport NEWS vertical, not an investigative product.
//
// Scored the other way, those 12 would decay at 20/day and never compete for
// a news slot, which would park same-day women's-sport news below three-day-old
// men's news indefinitely. Reversing this is one string; the publisher should
// rule on it.
//
// `opinion` is deliberately absent too: it is neither news nor a Playbook
// investigation, it already has its own carousel
// (components/sections/OpinionSection.tsx) filtered by source, and the spec
// does not name it. It falls through to the news clock, which is the same
// treatment it had before this rewrite -- no silent change.
export const EDITORIAL_SOURCES: readonly string[] = ['la-lana', 'futbol-business-review'];

export function trackFor(source: string | null | undefined): Track {
  return EDITORIAL_SOURCES.includes(source || '') ? 'editorial' : 'news';
}

// Spec, rule 01: "Cada día que pasa, una nota pierde el equivalente a
// cincuenta puntos. La nota de 87 de hoy vale 37 mañana." Since 99 is the
// ceiling, two days of decay puts ANY news story below zero -- which is what
// makes "nothing stays on top more than two days" fall out of the arithmetic
// rather than needing a rule. TOP_SLOT_MAX_DAYS below states it anyway; see
// there for why the emergent version is not sufficient on its own.
export const NEWS_DECAY_PER_DAY = 50;

// Spec: "Una noticia pierde cincuenta puntos por día. Una investigación pierde
// veinte." 20/day gives a 76-point investigation a Friday-to-Monday life, which
// is the window in which people actually read it.
export const EDITORIAL_DECAY_PER_DAY = 20;

export function decayPerDayFor(source: string | null | undefined): number {
  return trackFor(source) === 'editorial' ? EDITORIAL_DECAY_PER_DAY : NEWS_DECAY_PER_DAY;
}

// ---------------------------------------------------------------- The boleta
// These types exist so a score is never a bare number an editor has to trust.
// Every score is reconstructible from the answers, and the answers are what
// gets stored (articles.score_boleta) alongside the number (articles.score).
// Spec's fourth promise: "Se puede auditar. Cualquier calificación se puede
// abrir y revisar pregunta por pregunta. Si el orden de un día se ve mal, la
// discusión es sobre una respuesta concreta, no sobre un criterio."

// A. What the story reports -- pick exactly one. This is the editorial
// decision, and the only one.
export type NewsReports =
  | 'structural' // structural, regulatory, governance or ownership change
  | 'transaction-with-figure' // a transaction with a disclosed figure
  | 'commercial-no-figure' // a commercial move, no figure
  | 'recap'; // recap or context, no new development

export const NEWS_DECENA_BASE: Record<NewsReports, number> = {
  structural: 6,
  'transaction-with-figure': 5,
  'commercial-no-figure': 3,
  recap: 1,
};

// The editorial-product boleta. Shorter on purpose: an investigation is not
// judged on whether the fact is confirmed (it is explaining a known one) nor
// on whether it is breaking.
export type EditorialReports =
  | 'original-investigation' // original reporting with its own documents or figures
  | 'framework' // a model or frame that explains how the business works
  | 'commentary'; // commentary on an already-known story

export const EDITORIAL_DECENA_BASE: Record<EditorialReports, number> = {
  'original-investigation': 7,
  framework: 5,
  commentary: 3,
};

// C. Execution quality -- the ones digit. Shared by both boletas: the spec's
// editorial unit ("Datos propios, gráficos, entidad de cobertura habitual,
// unidad 0 a 9") names three of these five ingredients and the same 0-9 range,
// so reusing one unit definition keeps a 7 on La Lana meaning the same thing
// as a 7 on a news story. Flagged in the 2026-08-20 handover as an
// interpretation, not a quote: the spec does not enumerate the editorial unit.
// CALIBRATED 2026-08-20 against the spec's own 17-ago portada table. The first
// pass wrote these three questions loosely and they stopped discriminating:
// chartable fired on 78% of the corpus and hardFigure on 55%, which turns a
// question worth +2 into +2 for everybody and defeats the whole point of the
// unit digit. Tightened below to the wording that reproduces 6 of the spec's 8
// worked scores exactly, and its published running order exactly.
export type Unit = {
  // +2 A money magnitude attached to THE FACT BEING REPORTED — the price, fee,
  // award, loss, revenue or valuation of the thing that happened. Money
  // belonging to background, a precedent, a comparison, or a third party's
  // market size does NOT count. (This is what separates the spec's Padres 67,
  // where US$3,900M is the sale, from its LIV Golf 45, which the spec itself
  // calls "sin cifra revelada" despite quoting a US$40M purse.)
  hardFigure: boolean;
  // +2 At least three values comparable on ONE axis — in practice one of this
  // codebase's series devices (Cronología, Reparto, Duelo, Recibo, Cotización,
  // Resultados, Comparativo). Scattered figures of different kinds are not
  // chartable, and neither are the single-value or non-numeric devices
  // (Cifra clave, Salto, Jugada, Alineación, Tablero, Mapa). Mechanically
  // checkable on the body, which is the point.
  chartable: boolean;
  // +2 Carries an explicit "Opinión de Playbook" block.
  //
  // KNOWN WEAK QUESTION, flagged for the publisher. It fires on 92 of 97
  // articles because the block is house style, so as a discriminator it is
  // nearly dead — it is +2 for almost everything. Defining it by judgement
  // instead ("does the piece draw a conclusion beyond the reported facts?")
  // makes it fire on 96 of 97, which is worse. The rubric problem is real and
  // is not fixable by wording: either the block stops being universal, or the
  // question should be replaced by something that actually separates pieces.
  ownAnalysis: boolean;
  // +2 Named consequences in more than one national market, or across more
  // than one property/league. Parties of different nationalities are not
  // enough: the spec scores its Chelsea example (UK club, US funds, one asset)
  // as false and its Lamour example (FIFA + the US federation) as true.
  multiMarket: boolean;
  // +1 Names a brand/entity Playbook covers habitually.
  habitualEntity: boolean;
};

export const UNIT_WEIGHTS: Record<keyof Unit, number> = {
  hardFigure: 2,
  chartable: 2,
  ownAnalysis: 2,
  multiMarket: 2,
  habitualEntity: 1,
};

// Sums to exactly 9. Asserted rather than assumed: if someone adds a sixth
// unit question or re-weights one, the invariant that makes the whole system
// work ("a well-made story fills its level but never jumps one") breaks
// silently, and the homepage starts lying about levels. Better to fail here.
export const UNIT_MAX = Object.values(UNIT_WEIGHTS).reduce((a, b) => a + b, 0);
if (UNIT_MAX !== 9) {
  throw new Error(`Boleta invariant broken: positive unit values must sum to 9, got ${UNIT_MAX}`);
}

export type NewsBoleta = Unit & {
  kind: 'news';
  reports: NewsReports;
  globallyRelevant: boolean; // +1 major property, nine-figure sum, industry precedent
  mexico: boolean; // +2 a México story
  regional: boolean; // +1 LATAM, or international with a named regional effect
  newDevelopment: boolean; // +1 new development inside a major story we already follow
  confirmed: boolean; // false => -2 decenas, and barred from the top slot
  ambiguous?: string[]; // question keys the scorer could not answer from the text
  notes?: string;
};

export type EditorialBoleta = Unit & {
  kind: 'editorial';
  reports: EditorialReports;
  mexicoOrLatam: boolean; // +1 subject is México or LATAM
  ambiguous?: string[];
  notes?: string;
};

export type Boleta = NewsBoleta | EditorialBoleta;

export type ScoreBreakdown = {
  decena: number;
  unit: number;
  score: number;
  // Human-readable, one line per question that moved the number. This is what
  // an editor sees when they open a score to argue with it.
  trace: string[];
};

function unitOf(b: Unit, trace: string[]): number {
  let unit = 0;
  for (const key of Object.keys(UNIT_WEIGHTS) as (keyof Unit)[]) {
    if (b[key]) {
      unit += UNIT_WEIGHTS[key];
      trace.push(`unit ${key} +${UNIT_WEIGHTS[key]}`);
    }
  }
  return unit;
}

/**
 * The scorer. Pure, total, and the ONLY place a 0-99 score is produced --
 * scripts/reclassify-rank.ts and any future publish-time form both call this,
 * so a score can never be hand-typed into the database.
 */
export function scoreFromBoleta(b: Boleta): ScoreBreakdown {
  const trace: string[] = [];
  let decena: number;

  if (b.kind === 'news') {
    decena = NEWS_DECENA_BASE[b.reports];
    trace.push(`decena base ${decena} (${b.reports})`);
    if (b.globallyRelevant) (decena += 1), trace.push('globally relevant +1');
    if (b.mexico) (decena += 2), trace.push('México +2');
    if (b.regional) (decena += 1), trace.push('LATAM / named regional effect +1');
    if (b.newDevelopment) (decena += 1), trace.push('new development in a story we follow +1');
    // Spec rule 03: "Una operación en negociación pierde dos niveles
    // completos. Sigue siendo visible, porque es información valiosa, pero no
    // puede encabezar la portada." The -2 is the score half; the bar from the
    // top slot is enforced separately in selectHero(), because a big enough
    // raw score could otherwise still win and the rule is absolute.
    if (!b.confirmed) (decena -= 2), trace.push('not confirmed -2');
  } else {
    decena = EDITORIAL_DECENA_BASE[b.reports];
    trace.push(`decena base ${decena} (${b.reports})`);
    if (b.mexicoOrLatam) (decena += 1), trace.push('México / LATAM subject +1');
  }

  // The scale is 0-99 and the decena is one digit. Clamping rather than
  // letting a stacked modifier overflow into a phantom "decena 10": the spec
  // is explicit that the nineties are the ceiling and that reaching them
  // requires a structural, globally-weighted México story, "unas cuantas veces
  // al año".
  const clamped = Math.max(0, Math.min(9, decena));
  if (clamped !== decena) trace.push(`decena clamped ${decena} -> ${clamped}`);

  const unit = unitOf(b, trace);
  return { decena: clamped, unit, score: clamped * 10 + unit, trace };
}

// ---------------------------------------------------------------- Ranking

export type Rankable = {
  // The 0-99 boleta score. Null for rows not yet reclassified -- see
  // bridgeScore() for what happens to those.
  score?: number | null;
  // LEGACY 1-5 star field. Still read (only) by bridgeScore() and by the
  // archive's visual tiering. Scheduled for removal in the follow-up pass once
  // the publisher has signed off on the before/after comparison; it is kept
  // here deliberately so that pass is a clean, reviewable deletion.
  priority: number;
  date: string;
  featured: boolean;
  source?: string | null;
  // Mirrors the boleta's `confirmed` answer, hoisted onto the row so the
  // top-slot bar can be enforced without re-reading the whole boleta on every
  // sort. Undefined (not-yet-reclassified) is treated as confirmed: the old
  // corpus has no such thing as an unconfirmed flag, and defaulting the other
  // way would silently bar every legacy row from the hero slot.
  confirmed?: boolean | null;
};

export function daysSince(dateStr: string, now: Date): number {
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return 0;
  return (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
}

// TRANSITIONAL. 62 of 159 published rows are older than three weeks and were
// never five-star, so they were out of the reclassification pass's scope and
// carry score = null. They still have to sort somewhere sane -- they are the
// archive. Mapping star -> mid-band (3★ -> 35) puts them on the same 0-99
// ruler without pretending they were graded: a bridged row lands in the middle
// of the band its star implies, so it can never beat a real boleta score at
// the same level on the unit digit, and can never lose to one either.
//
// Delete this together with the `priority` column. Any row still relying on it
// at that point is a row nobody has graded, which is the thing the deletion
// pass is meant to surface.
export function bridgeScore(priority: number): number {
  const star = Number.isFinite(priority) ? Math.max(1, Math.min(5, priority)) : 3;
  return Math.max(0, Math.min(99, star * 10 + 5));
}

export function baseScore(article: Rankable): number {
  return typeof article.score === 'number' ? article.score : bridgeScore(article.priority);
}

/**
 * The score as of `now` -- the spec's "la nota de 87 de hoy vale 37 mañana".
 * Comparable only WITHIN a track, since the two tracks decay at different
 * rates; use effectiveAgeDays() to compare across them.
 */
export function decayedScore(article: Rankable, now: Date): number {
  return baseScore(article) - decayPerDayFor(article.source) * daysSince(article.date, now);
}

/**
 * The same ordering, expressed in days instead of points: "how stale is this,
 * discounted by how good it is". A news 87 published today reads as -1.74 days;
 * an editorial 76 reads as -3.8, because 20 points buys a day instead of 50.
 *
 * Dividing by the track's own decay is what makes a MIXED list (a /tema page, a
 * hub stream) orderable at all. Ranking mixed lists on raw decayedScore would
 * be a category error: after a month a La Lana edition sits at -524 and a news
 * story at -1450, so every investigation would float above every news story on
 * arithmetic alone. In days, both are simply "a month old", which is true.
 *
 * Within a single track this is a strictly monotone transform of decayedScore,
 * so it changes nothing about news-vs-news or editorial-vs-editorial order.
 */
export function effectiveAgeDays(article: Rankable, now: Date): number {
  return daysSince(article.date, now) - baseScore(article) / decayPerDayFor(article.source);
}

// `now` is a parameter (defaulting to the real clock) purely so this stays a
// pure, easily testable function -- every real call site omits it.
export function rankArticles<T extends Rankable>(articles: T[], now: Date = new Date()): T[] {
  return (articles || []).slice().sort((a, b) => {
    const diff = effectiveAgeDays(a, now) - effectiveAgeDays(b, now);
    if (diff !== 0) return diff;
    return (b.date || '').localeCompare(a.date || '');
  });
}

/** The two tracks, each already ranked. Editorial never competes for a news slot. */
export function splitTracks<T extends Rankable>(
  articles: T[],
  now: Date = new Date(),
): { news: T[]; editorial: T[] } {
  const news: T[] = [];
  const editorial: T[] = [];
  for (const a of articles || []) (trackFor(a.source) === 'editorial' ? editorial : news).push(a);
  return { news: rankArticles(news, now), editorial: rankArticles(editorial, now) };
}

// ---------------------------------------------------------------- Placement

// Spec rule 01, "Nada se queda arriba más de dos días". The 50/day decay
// already produces this for any story competing against same-day publishing --
// but ONLY then. On a quiet stretch (this site has published nothing for four
// days at a stretch this year) every candidate decays in lockstep, the order is
// preserved by design ("El día que no publicamos, la portada conserva el orden
// del día anterior"), and the day-3 story keeps the top slot because nothing
// newer exists to take it. That is correct for the order and wrong for the top
// slot. So the cutover is stated, not inferred: past two days the story yields
// to the best younger candidate IF one exists, and only holds the slot when
// there is genuinely nothing else.
export const TOP_SLOT_MAX_DAYS = 2;

// Spec rule 02: the full-width band goes to the week's highest score, "siempre
// que pase de 70 puntos" -- strictly above 70, so a 70 does not qualify and a
// 73 does. One per week, un-inflatable by construction: it is a max over the
// week, not a threshold count.
export const HERO_BAND_MIN_SCORE = 70;

// `featured` is NOT in the 2026-08 spec, which is emphatic that the boleta
// decides ("Se acaba la decisión diaria"). Removing the editor's override
// outright was out of scope for the rewrite and would have silently disarmed a
// checkbox that is still in the admin UI, so it survives as a boost -- but it
// is worth exactly one unit digit, never more.
//
// Sized at 9 on purpose, and NOT at one day of decay (50). Tried that first,
// and it reproduced the very bug this rewrite exists to kill: on 2026-08-20 a
// 50-point boost put an 85 (featured, and still ticked from the day before)
// above a 95 that the boleta had just ranked first. An override worth a whole
// decena is the daily hand-decision wearing a checkbox.
//
// Nine is the same bound the unit digit already obeys (UNIT_MAX): a featured
// story can win its own level and can never leave it. That is the spec's own
// invariant, applied to the one lever the spec forgot to mention.
//
// It still cannot override rule 03 or rule 01; both are applied after it.
// FLAGGED for the publisher: if the spec means what it says, this goes to zero
// and the checkbox comes out of the CMS.
export const FEATURED_BOOST = UNIT_MAX;
export const FEATURED_BOOST_DAYS = 1;

export function featuredBoost(article: Rankable, now: Date): number {
  if (!article.featured) return 0;
  const age = daysSince(article.date, now);
  return Math.max(0, FEATURED_BOOST * (1 - age / FEATURED_BOOST_DAYS));
}

function isConfirmed(article: Rankable): boolean {
  return article.confirmed !== false;
}

/**
 * The top slot. Three rules, applied in the spec's own order of authority:
 *
 *   rule 03  an unconfirmed story can never take the slot from a confirmed one,
 *            at any score. The -2 decenas is the soft half of this; the bar is
 *            the hard half, and it is a filter, not a penalty.
 *   rule 01  a story older than TOP_SLOT_MAX_DAYS yields to any younger
 *            candidate. Only if there is no younger candidate does it hold.
 *   featured a same-day editorial override, worth one day, applied last and
 *            only among candidates that already survived both rules above.
 *
 * Editorial products are excluded outright rather than losing on points: the
 * hero slot is a news slot, and "La Lana nunca pelea un lugar contra una nota
 * de última hora" is the whole reason the tracks are separate.
 */
export function selectHero<T extends Rankable>(articles: T[], now: Date = new Date()): T | null {
  const news = rankArticles((articles || []).filter(a => trackFor(a.source) === 'news'), now);
  if (!news.length) return null;

  // Rule 03: prefer confirmed. Unconfirmed stories are eligible only if the
  // day has nothing confirmed at all -- they stay visible, per the spec, they
  // just cannot lead over something that actually happened.
  const confirmed = news.filter(isConfirmed);
  let pool = confirmed.length ? confirmed : news;

  // Rule 01: past two days, yield to any fresher candidate.
  const fresh = pool.filter(a => daysSince(a.date, now) <= TOP_SLOT_MAX_DAYS);
  if (fresh.length) pool = fresh;

  let best = pool[0];
  let bestScore = decayedScore(best, now) + featuredBoost(best, now);
  for (const a of pool) {
    const s = decayedScore(a, now) + featuredBoost(a, now);
    if (s > bestScore) {
      bestScore = s;
      best = a;
    }
  }
  return best;
}

/**
 * Rule 02 -- the full-width band, at most one per week. Returns the week's
 * highest RAW score (undecayed: the band is a judgement about the week, not
 * about this morning) if it clears 70, else null, meaning no band runs that
 * week. Weeks are Monday-anchored, matching how the newsroom already talks
 * about "la franja de la semana".
 */
export function weekKey(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  // getUTCDay: 0=Sunday. Shift so Monday starts the week.
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function selectHeroBand<T extends Rankable>(articles: T[], now: Date = new Date()): T | null {
  const week = weekKey(now.toISOString().slice(0, 10));
  let best: T | null = null;
  for (const a of articles || []) {
    if (trackFor(a.source) !== 'news') continue;
    if (weekKey(a.date) !== week) continue;
    if (!isConfirmed(a)) continue;
    if (best === null || baseScore(a) > baseScore(best)) best = a;
  }
  if (!best || baseScore(best) <= HERO_BAND_MIN_SCORE) return null;
  return best;
}

// ---------------------------------------------------------------- Legacy
// RETAINED DELIBERATELY, for exactly one caller: the archive's visual tiering
// (app/(public)/archivo/page.tsx), which passes ARCHIVE_TIER_DAY_WEIGHT=30 --
// "one star is about a month" -- because the archive's job is a five-tier
// visual spread across weeks-to-months-old material, not same-day competition.
// Its five tier thresholds are expressed in multiples of that weight and of the
// 1-5 star range, so repointing them at a 0-99 ruler is a real change with a
// real risk of collapsing every archive row into one tier (which is exactly
// what happened when the homepage's own weight was reused there; see that
// file's comment). That port belongs with the `priority` column's removal, not
// here. Nothing else may call this.
export const PRIORITY_DAY_WEIGHT = 1.5;

export function rankScore(article: Rankable, now: Date, dayWeight: number = PRIORITY_DAY_WEIGHT): number {
  const priority = typeof article.priority === 'number' ? article.priority : 0;
  return priority * dayWeight - daysSince(article.date, now);
}

// ------------------------------------------------- Shelf surfaces (archive)
//
// 2026-08-25: the port the comment above deferred, unblocked by grading the
// last 76 ungraded rows rather than by removing the `priority` column.
//
// The deferral was right and the reason was DATA, not timing. Measured with 76
// of 177 rows still ungraded, every threshold either inflated the top tier (91
// of 177 at tier 5) or pushed 47 rows to the bottom, because an ungraded row
// only has bridgeScore(priority) to offer and the bridge ruler and the boleta
// ruler have different distributions. With all 178 rows graded the same
// thresholds spread cleanly, so the collapse the old comment warned about is
// a symptom of a half-graded corpus, not of the 0-99 ruler.
//
// This is deliberately NOT effectiveAgeDays(). News decays 50/day, so across a
// months-long list that function is pure recency and quality stops separating
// anything -- the exact failure the archive hit when it reused the homepage's
// weight. Here the score LEADS and aging only differentiates within a level:
// `daysPerLevel` is what one decena of aging costs, so a tier step is worth one
// level OR that many days, whichever the story has less of. Same trade the star
// version made, on the ruler that is now real.
export function shelfScore(article: Rankable, now: Date, daysPerLevel: number = 30): number {
  return baseScore(article) - (daysSince(article.date, now) * 10) / daysPerLevel;
}
