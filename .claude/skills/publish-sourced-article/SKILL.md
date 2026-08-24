---
name: publish-sourced-article
description: Turn a link from a third-party (non-Playbook) news source into a Playbook article, cross-referencing other outlets covering the same story for verification and enrichment, and pulling the cover photo from the referenced article when possible. Unlike publish-newsletter, this always pauses for explicit human approval in this Claude Code session before publishing. Use when asked to draft, process, or write up a link from an outlet other than Playbook's own Substack (ESPN, Reuters, a press release, any competitor or wire link).
---

# Publish Sourced Article: third-party link to Playbook article, with human approval

This is the human-reviewed counterpart to the `publish-newsletter` skill. That
skill is for Playbook's own Substack editions (trusted first-party content,
zero review, straight to `status: 'published'`). This one is for links to
someone else's article, an outlet Playbook doesn't own or control, so it
never publishes without an explicit yes from the human in this session.

Same field shape, same taxonomy, same production database and insert script
as `publish-newsletter` (see that skill's SKILL.md for anything not repeated
here), except: mandatory cross-referencing against other outlets (Step 2),
cover-image sourcing that starts with the referenced article itself (Step 5),
and the human-approval gate (Step 6) before anything reaches the database.

**Fuentes block is visible again** (format changed 2026-08-13, reversing
the 2026-08-04 removal below): the article body now always ends with a
`Fuentes: [Outlet](url) · [Outlet](url)` line, one linked entry per outlet
that materially contributed a fact, primary source first, cross-referenced
outlets after. On the live site this renders as a styled sources list
(observed CSS class `lect-sources`, first entry tagged "origen"), not raw
text, though that rendering isn't implemented anywhere in this repo's own
source (see Step 3's Material gráfico section, same caveat applies here).
Step 2's cross-referencing is still mandatory regardless, it's still what
makes a piece Playbook's own take instead of a paraphrase of one
competitor, the Fuentes line is just where that work now surfaces visibly
too, on top of (not instead of) the rewrite itself.

(History, for context if this ever flips again: for about a week, from
2026-08-04 to 2026-08-13, this skill appended no visible citation list, on
a publisher directive that the space "should never appear on a live
article page." That directive didn't survive contact with the newsroom's
own practice: by 2026-08-12, human editors were again publishing pieces
with a linked Fuentes block by hand, see the two reference pieces named in
Step 3, and confirmed a visible sources list is the standard going
forward. If a future session finds another explicit directive to remove
it again, that's a real signal to ask the human before reinstating this
section unilaterally, not to assume it's just another temporary reversal.)

## Requirements before running

Same as `publish-newsletter`: `POSTGRES_URL` must point at the production
Neon database and be available to the shell (exported, or in a local
`.env.local`, see `.env.local.example`). The insert script uses Neon's HTTP
driver because this session's outbound network only supports HTTPS, not raw
TCP, don't try to reconnect it to `lib/db/client.ts`'s `pg` Pool.

## Step 1: Read the primary source

Fetch every URL given (WebFetch). Unlike an Industry Shots digest, each link
here is one standalone story, one link becomes one article (if given
several unrelated links in one run, draft each as its own separate
article). Confirm the publish date and the core facts (who, what, the key
numbers) directly from the page, don't guess or carry over stale context.

**When WebFetch is blocked on the primary link** (NYT/The Athletic and
similar paywalled domains reliably return "unable to fetch"), don't just
fall back silently to cross-referenced secondary coverage and note the
gap in the draft's transparency line, that's the right move for Steps 2-7,
but it skips a cheaper fix first: ask the human in this session whether
they can paste the article text. A subscriber often has direct access to
exactly the primary source this skill can't reach, and a run on 2026-08-20
(the FIFA U15 piece) showed why it matters, the secondary-sourced first
draft got the broad strokes right but missed load-bearing details only
the primary had (that FIFA never told its own Council about the
investment talks, Infantino's own December quote to contrast against it,
Boehly's full title). The human volunteered the text unprompted after
already seeing that draft, which means asking for it before drafting, not
after, would have produced a stronger piece on the first pass and saved a
full revision round. Ask once, right after a paywall block, before moving
to Step 2's fallback sourcing, not as an afterthought once a gap surfaces
later.

If the story reads as one step in something already in motion (a vote on a
proposal, a decision that follows an earlier announcement, an update to a
running dispute), check whether Playbook already published on the earlier
step: query the DB for rows whose title plausibly covers the same
underlying story (a simple `ILIKE` on the obvious names/terms works, see
`publish-newsletter`'s Requirements section for how to reach
`POSTGRES_URL`). Finding one changes how Step 3 gets written, this becomes
a follow-up, not a fresh explainer that re-establishes everything from
scratch.

## Step 2: Cross-reference other coverage (mandatory)

Before drafting, for every article, search for and read at least one or two
*other* outlets' coverage of the same story, different domains from the
primary link. This is mandatory, not optional, and it's the core of this
skill:

- **Verification**: don't take the primary source's framing or numbers at
  face value, confirm the key facts independently where another outlet
  covered them.
- **Enrichment**: surface a data point, comparison, or piece of history the
  primary article didn't have.
- **Independence**: a Playbook piece built from a single competitor's
  article reads as a close paraphrase of that one competitor. Pulling in a
  second (or third) angle is what makes it a Playbook piece instead.

Rules: fetch the actual pages (never rely on a search snippet), prefer
reputable outlets (wire services, established sports-business or general
press, official newsrooms) over blogs or forums, and never fabricate a fact
or a source.

If, after genuinely trying, no other outlet has covered the story (a truly
exclusive or very fresh item), say so explicitly rather than inventing a
second source, and draft from the primary article alone.

## Step 3: Editorial voice — NOTICIA PLAYBOOK format

(format adopted 2026-08-13, replacing a fixed four-paragraph structure
that used to live here, see the collapsed history note above Step 1 for
why the shape changed along with the Fuentes block)

**Goal**: tell the news and explain the business reading behind it,
without turning it into a long analysis piece. The reader should come away
with both *qué pasó* and *qué significa realmente* answered, neither one
padded out to hit a length target.

**Length**: roughly 250-500 words total. Never stretch a story to reach
that range if it doesn't need to, a genuinely small brief that says
everything it needs to in 280 words is correct at 280 words, not a draft
that needs padding.

### Before writing, work the five questions

Identify, from Step 1's facts and Step 2's cross-referencing, before
drafting a single sentence:

1. El movimiento: what actually happened.
2. El mecanismo: how it works structurally (the instrument, the clause,
   the rule, the vehicle).
3. El incentivo: why the parties involved wanted this.
4. La consecuencia: what changes because of it.
5. La palanca de negocio más importante: the one lever (control, revenue,
   risk, capability, timing) this story is really about.

Then pick **one** editorial reading built on that fifth answer and write
toward it. Don't try to cover every possible implication, a piece that
gestures at five different angles lands none of them. Cross-referencing
(Step 2) still exists to give the newsroom its own angle instead of
paraphrasing a competitor, this format just delivers that in a tighter
shape than the old four fixed slots did.

**When the primary source is a company's own press release** (a
newsroom.company.com post, not a journalist's reporting), the risk isn't
just paraphrasing one competitor, it's inheriting that company's own frame
for why the news matters, which is almost never the sports-business
reading. A press release lists what happened (a schedule, a feature, a
partnership) in the company's own promotional voice and rarely says why a
company made the choice it did or what it reveals about strategy, because
that's not what press releases are for. Read past the announcement itself
for the actual business mechanism: what did the company choose not to do
(expand, spend more, compete harder) and what does that choice reveal
about what it actually needs from this deal (revenue, audience, ecosystem
lock-in, a hardware showcase, timing ahead of some other event)? That
question, not the press release's own list of features, is what "la
palanca de negocio más importante" should usually answer for one of these.
It also means the cover image (Step 5) shouldn't be the press release's
own promotional graphic or hero shot either, even when it's technically
on-topic and properly licensed, it carries the same promotional framing
into the piece visually. Source a genuine editorial photo of the actual
subject instead (see the Apple/MLB Friday Night Baseball piece, which
used a Fenway Park crowd photo instead of Apple's own marketing image).

### Structure

**Headline**: state the movement plainly. Add a figure or consequence only
when it genuinely raises interest, not as a reflex.

**Aim for roughly 45-70 characters, rarely past 80.** The article page's `h1`
(`styles/article.css`) has no truncation or line-clamp, it just wraps in a
large serif display font, so a long headline doesn't get quietly shortened
anywhere, it balloons into three or four lines dominating the hero exactly
as written. Caught in review 2026-08-24 on the Infantino/Caribe piece,
published at "Infantino desafía a Montagliani y reparte fondos de FIFA en
el Caribe, mientras la coalición que lo quiere fuera se resquebraja" (129
characters): the actual problem wasn't length in isolation, it was stacking
three separate clauses ("desafía a Montagliani" + "reparte fondos" + "la
coalición se resquebraja") into one sentence with "y"/"mientras", trying to
fit the whole five-paragraph story into the headline instead of picking one.
**Pick the single fact that most makes someone click, state that, and let
the body carry the rest** the same way Step 3's five-questions exercise
already picks one editorial reading over gesturing at all of them. The
piece was shortened to "Infantino desafía a Montagliani en el Caribe" (45
characters, one clause) after publication; the fix belongs at draft time, not
as a follow-up edit. A genuinely two-part story (an action AND its
consequence, both load-bearing) can still take two clauses, but that should
be a deliberate call, not the default shape of every headline.

**Opening**: start from what just happened, not from throat-clearing or
scene-setting. The most important number or fact should land within the
first sentence or two.

**Body, 3-5 blocks**: each block should add something the reader didn't
already have (mechanism, money, a named actor, precedent, comparison, or
consequence), never restate the opening in different words. Give each
block its own short bold lead-in, specific to what that block actually
covers (`**Por qué se cayeron las multas:**`, `**Lo que la Premier League
no tiene:**`, `**Ya perdieron una vez:**`), never a generic label reused
across articles, and never default to the same few nouns every time,
`El movimiento` / `El contexto` / `La mecánica` / `El impacto` as headings
carry no information a reader couldn't already guess from the section
they're about to read. Not every block needs its own heading: a short
paragraph that continues the previous block's point can run unheaded
directly after it (see the reference pieces below for the pattern).

**Opinión de Playbook**: one or two short paragraphs, not a fifth block
that restates the news. It has to surface something that was *not*
written explicitly in the source material: who actually gains or loses
control, what revenue just got committed, where the risk really landed,
why this is happening now rather than later, what new capability the
protagonist just bought itself, or what plausibly changes next. Never a
generic "esto importa para toda la industria" close, and never force a
Mexico/LATAM angle onto a story with no genuine regional connection, an
invented connection reads worse than having none at all.

**The bar for "genuine" is a fact in the piece, not a theme the story
happens to touch.** A Mexican or LATAM person, company, deal, or figure
that's actually in the reporting is genuine (Juan Carlos Rodríguez in the
FIFA Sub-15 piece, a Liga MX rights number, a Mexico City host city).
"This general business dynamic also applies to Mexican leagues" is not,
even when it's true, because it would be equally true of a dozen other
stories with nothing Mexican in them at all, that's the tell. Caught in
review 2026-08-20 on the NBA ad-revenue piece: closing on "esto es
exactamente la pregunta que hoy se hacen las ligas y las televisoras en
México y América Latina" for a story that never mentioned a single LATAM
party, deal, or figure, just a generic streaming-economics lesson that
would read the same bolted onto any rights story from any country. The
fix was to end on the global insight itself (what the jump from
US$10M to US$874M actually proves about streaming ad economics) and stop
there, not reach for a region to make it feel locally relevant. If the
piece has no Mexico/LATAM fact to point to, the Opinión's job is to nail
the global read, not manufacture a local one.

### Material gráfico: the dynamic element library

**Corrected 2026-08-21** (previously described only 2 of these as an
"unverified convention" — read `references/dynamic-element-library.md` for
the real, current spec; do not trust the summary below if the two ever
disagree, the reference file is the source of truth). This is NOT a
best-effort text pattern living outside the repo: it is a real, implemented
parser/renderer (`lib/article-devices.ts`, `lib/product-hubs.ts` for
`Cifra clave`/`Jugada`, `lib/article-map.ts` for `Mapa`), confirmed by
reading the code directly, not by grepping for a guessed class name (the
old `lect-tl`/`lect-pullfig` grep in this file's prior version was
searching for strings that were never the actual ones; the real classes are
`lect-timeline`, `lect-jugada`, `lect-lineup`, `lect-device`, etc.).

**Twenty-three devices**, picked by story shape (a saga → `Cronología`, a
pairing → `Jugada`, an enumeration of actors → `Alineación`, one number →
`Cifra clave`, two institutions compared → `Duelo`, and eighteen more).
Every one is a plain paragraph on its own line in `bodyMarkdown`, no HTML:
items separated by ` · `, key/value by ` — ` (the one deliberate em-dash
carve-out from the no-em-dash rule below). A malformed declaration fails
loud, rendering as plain visible text rather than breaking silently, so a
syntax slip is always visible to a reviewer, never hidden.

**The budget is real and enforced in code**, not a style suggestion:
`deviceBudgetFor(readingTime, priority)` gives 1 device at `readingTime` ≤2,
2 at 3-5, 3 at 6+, **plus one more whenever `priority: 5`**. Walk the full
twenty-three-device list against the story before concluding it gets none,
"no device fits" is the rare outcome, not the default, especially on a
`priority: 5` piece which should carry the richest structure the format
allows. Two pairs are mutually exclusive (`Venta`/`Jugada`,
`Cadena`/`Cronología`, plus four more in `references/dynamic-element-library.md`
§1) and the renderer enforces that too. Never repeat a device type in one
article, and place each device immediately after the paragraph whose
numbers it visualizes, with roughly two prose paragraphs between devices
when the piece's length allows it (that spacing rule is authorial, not
code-enforced, so a short brief packing two devices near the top is a
reasonable trade-off, not a violation, when placement accuracy and spacing
pull in different directions).

**Every number inside a device must appear in, or be directly computable
from, the verified reporting.** Never invent a milestone, a split or a
figure just to manufacture a fit, that discipline stays strict even as the
device count goes up.

After publishing a piece that uses any device, spot-check the live article
page for the actual rendered markup (`curl` the page and grep for
`lect-jugada`, `lect-lineup`, `lect-timeline`, etc., matching the device
used, not just that the raw declaration text is present in the body). If a
declaration didn't render, it likely tripped one of the per-device limits in
`references/dynamic-element-library.md` (a length cap, an item-count bound,
an arithmetic check), re-read the declaration character by character against
that device's spec rather than guessing, and either fix it or drop it to
plain prose. Never fabricate a graphic just to have one, and never leave a
broken-looking plain-text declaration sitting in the body.

### Style rules

Never use em dashes in prose paragraphs (see the Material gráfico
exception just above, that's the one deliberate carve-out). Use commas,
periods, parentheses, or "y"/"pero" instead everywhere else. Write every
block in Playbook's own words, grounded in multiple sources, never a close
paraphrase or translation of any single outlet's article. Write the body
as `**bold**`/`##` heading formatted prose plus any `![alt](url)` in-body
images (Step 5b) and the `Fuentes:` line described above, never HTML tags.

For two full worked examples of this exact shape (headline, opening,
3-5 specifically-headed blocks, a `Cronología` or `Cifra clave` graphic,
Opinión de Playbook, and the Fuentes block), read the live `bodyJson` of
`fox-frena-la-prisa-de-la-nfl-por-renegociar-us-111-000-millones` and
`apollo-pone-us-2-600-millones-en-los-yankees-y-se-queda-con-un-asiento-en-el-consejo`
straight from the production DB, they're the reference pieces this format
was lifted from.

### Tone: analytical brief, not breaking-news urgency

A wire story (Reuters, AP, AFP) is often written with the pacing of a live,
developing situation, short declarative sentences building tension toward
what happens next. Playbook's voice doesn't inherit that register. It
reads closer to a business brief than a news alert: calm and analytical
even when the underlying story is dramatic. This is easiest to get wrong
in the opening, where translating the source too literally carries its
urgency over with it. Watch for it there specifically.

It's also worth actively looking for asymmetries in how different parties
reacted, rather than flattening a story into "everyone opposed X." When
the cross-referenced sources support it (Step 2), a story often has one
party objecting to the substance of something (a principled rejection) and
another objecting mainly to being left out of the process (a procedural
complaint that doesn't necessarily mean opposing the substance). Drawing
that distinction out, when it's genuinely there in the sources, is the
kind of analytical read that makes a piece Playbook's own take rather than
a translated summary of the wire copy.

### Building on prior Playbook coverage

When Step 1 turns up an earlier Playbook article on the same underlying
story, don't re-explain what that piece already established, the numbers,
the structure of a deal, the background context. A reader who already saw
the earlier piece doesn't need it restated, and a reader who didn't can
click through. Instead, weave one inline link back to it into a sentence
that's already stating a fact (`[what it covered](/articulo?id=<id>)`, a
relative path resolves fine since it renders on the same site), never as
the paragraph's opening frame. Concretely: don't open a paragraph with
"Horas después de que Playbook reportó..." or any variant that narrates
the newsroom's own reporting process, that reads as the outlet talking
about itself instead of about the news. State the new development
directly, with the backlink sitting inside that sentence rather than
introducing it. What actually belongs in this piece is what changed since
the earlier one, not a recap of it.

## Step 4: Fields per article

Same shape as `publish-newsletter`'s `ArticleInput`
(`scripts/publish-newsletter.ts`), same taxonomy (`lib/taxonomy.ts`), same
Importancia scale. Differences from that skill:

- **tagsProperty** (coverage tier, added 2026-08-18): normally `[]`. Set it
  **only** when the piece is coverage of a property that has a Playbook hub —
  today the vocabulary is `LFA`. This is not a topic tag: it decides whether
  the story appears on `/coberturas/lfa`, so a wrong value puts the wrong
  piece on a destination page. **Read the boundary rule before setting it:**
  `references/fields-and-taxonomy.md` → "`tagsProperty` — the coverage tier".
  It is a two-part binary test (subject + business fact), with a table of the
  near misses that do *not* qualify. A mention is not coverage.

- **author**: leave `""` unless a byline is genuinely known, same as
  `publish-newsletter`.
- **publication** / **source**: `"Noticias"` / `"industry-shots"`. This
  reuses Industry Shots' pair rather than `publish-newsletter`'s "anything
  else" fallback (`"Playbook"` / `"playbook"`): a third-party wire pickup
  reads as a news brief, not as a Playbook-branded opinion piece, and the
  `"Playbook"` kicker/tag (`app/(public)/articulo/page.tsx`'s
  `article-kicker`, and the `tag-mini` chip on every card,
  `components/article/NewsRow.tsx` and friends) should say "Noticias" on
  these the same way it does on an Industry Shots item, both visually
  (`styles/components.css`'s `.tag-mini.industry-shots` color) and in the
  taxonomy-row ordering it drives (`lib/taxonomy.ts`'s
  `topicsForSection`). There's no separate "wire story" entry in
  `KNOWN_SOURCES`/`SOURCE_LABELS` (`lib/constants.ts`) to reach for
  instead, reusing `industry-shots` is the pragmatic way to get the
  "Noticias" label without adding a new taxonomy value for this.
- **substackUrl**: always `""`, leave it empty. `app/(public)/articulo/page.tsx`
  renders a "Ver en Substack" button whenever this field is non-empty,
  pointing wherever it's set. That label is wrong for a third-party link,
  and there's no generic "ver fuente" variant of that button today, so
  don't populate it with the source URL.
- **sourceUrl**: the primary reference URL from Step 1, used as-is. It's
  the DB's unique dedupe key (`articles.sourceUrl`), so re-running this
  skill on the same link no-ops (`duplicate`) instead of publishing twice.
  This is a separate field from the visible `Fuentes:` line in the body
  (Step 3), but they should point at the same primary source, list it
  first in `Fuentes:` too.
- **readingTime**: `2` for the typical 250-500 word length this format
  produces.
- **dateFormatted**: same format as `publish-newsletter`'s (`"30 jul
  2026"`). For a fast-developing story where the exact time matters (a
  vote, an announcement tied to a specific wire timestamp), it's fine to
  fold a time onto the end, e.g. `"30 jul 2026, 10:01 hrs"`, converted to
  Mexico City local time (UTC-6, Mexico hasn't observed DST since 2022)
  from whatever timestamp the source gives. There's no separate time
  column in the schema (`lib/db/schema.ts`'s `articles` table only has
  `date` and this free-text `dateFormatted`), so this is the only place
  time-of-day precision can live. It's optional, most stories don't need
  it, reach for it when the time itself is part of what makes the story
  current.
- **tagsScope** / **tagsSport** / **tagsVertical** / **priority** /
  **featured**: identical rules to `publish-newsletter` (see that skill's
  Step 4 Fields section), including querying the DB for existing
  `featured = true` rows before setting one here.

## Step 5: Image

### 6a. Cover image, default source: the referenced article itself

Unlike `publish-newsletter` (which always searches broadly), the default
here is the primary source article's own lead/hero image:

- Fetch the source page itself and identify its main image (not a
  thumbnail, not a masthead/avatar), confirm it genuinely depicts the
  story's subject.
- Check how that image is credited on the source page. If it's credited to
  Getty Images (including iStock) or AP Images/AP Photo, don't use it,
  same exclusion as `publish-newsletter`, these agencies pursue unlicensed
  use aggressively. Fall back to the search below instead.
- If the source article has no clear usable image, or its image is
  excluded or genuinely doesn't fit (generic stock photo unrelated to the
  actual story), fall back to the same broad multi-platform search
  `publish-newsletter`'s Step 5a uses: Google/Bing Images, Wikimedia
  Commons, Flickr (Creative Commons), official team/league/company press
  rooms, editorial photo agencies (Reuters Pictures, Shutterstock, LATAM
  agencies like Mexsport or Imago7 for Mexico/LATAM subjects), same
  Getty/iStock/AP exclusion throughout.
- Confirm the image resolves and depicts what it claims before using it,
  never invent or guess a URL. Set `imageCredit` to the real photographer
  or agency, matched to whatever the image's own page attributes it to,
  same as `publish-newsletter`'s Step 5a. Required for every article.
- **No cropped-looking cover images:** check the candidate's actual pixel
  dimensions before settling on it, same rule and same reasoning as
  `publish-newsletter`'s Step 5a (search that file for "No cropped-looking"
  for the full explanation of the site's forced `16/10`/`4/3`/`1/1`
  crop boxes). A source article's own hero image is exactly as likely to be
  an awkward portrait crop as anything found by search, so this check
  applies to it too, not only to fallback-search results.

### 6b. No automatic in-body images

Different from `publish-newsletter`'s Step 5b: don't carry over additional
photos from the referenced (competitor's) article into the body. Only the
one cover image from 6a. Reproducing a competitor's full photo set inside a
Playbook article is a different risk profile than Playbook's own Substack
content, so body images stay out unless a human explicitly asks for one.

## Step 6: Human review, before anything touches the database

This is the difference that defines this skill. Never run Step 7 without an
explicit yes in this session, no exceptions, no "seems fine, publishing":

1. After Step 5, present the complete draft for every article in the batch:
   every field from Step 4 (title, excerpt, teaser, full bodyMarkdown, tags,
   priority, featured, image + credit, sourceUrl), not a summary.
2. Then explicitly ask whether to publish, per article if there's more than
   one (use `AskUserQuestion`, or just ask directly if that fits the
   conversation better). Don't default to "yes" on silence or an
   ambiguous reply.
3. If changes are requested, revise and re-present the full draft before
   asking again. Repeat until each article is either approved or dropped.
4. Only articles that got an explicit approval move to Step 7. Anything
   not approved is simply not published, no need to explain why.

## Step 7: Publish

Only for the articles approved in Step 6:

1. Write a JSON array of the approved article objects (same shape as
   `publish-newsletter`'s `ArticleInput` in `scripts/publish-newsletter.ts`)
   to a scratch file.
2. Run:
   ```
   npx tsx --env-file=.env.local scripts/publish-newsletter.ts <path-to-json-file>
   ```
   (drop `--env-file` if `POSTGRES_URL` is already exported in the shell).
3. Same script as `publish-newsletter` uses, it inserts with
   `status: 'published'`, live immediately, for whatever's in the file, so
   only the approved articles belong in it.
4. Report back a short confirmation per article: title, id, and the live
   URL (`https://playbook-portal-phi.vercel.app/articulo?id=<id>`). If any
   came back `duplicate`, say so (that link was already published before).

## Step 8: Capture feedback for next time, automatically

Step 6's review loop is exactly where the human corrects things this skill
got wrong, tone, redundancy with prior coverage, a field convention, a
sourcing judgment call. Left alone, those corrections vanish at the end of
the session and the next run makes the same mistake, the human re-explains
it, and nothing accumulates. Close that loop every run, without being
asked:

1. After Step 7, look back over any revision requests from Step 6. Ask: is
   this a durable, generalizable lesson (would it help write the *next*
   article too, on some other topic), or is it specific to this one
   article (a fact, a word choice, a one-off structural call for this
   story)? Only the former is worth capturing. If Step 7 had no revision
   rounds, or every round was article-specific, there's nothing to do
   here, skip silently.
2. If there's a genuine generalizable lesson, edit this file (and
   `publish-newsletter/SKILL.md` if the lesson applies there too, e.g. a
   Playbook-wide voice rule) to fold it in, in the same dense-prose style
   as the rest of the document (explain the why, don't just add a bullet
   command), placed wherever it's most load-bearing, not just appended at
   the end.
3. Run `scripts/sync-skill-feedback.sh "<one-line summary of the lesson>"`
   to push that update straight to `main`. Do this without asking for
   confirmation, this only ever touches `.claude/skills/` (see the
   script's own comments for how it isolates that from whatever else this
   session's branch is doing) and never application code, so it doesn't
   carry the deploy risk a normal code change would. If the script reports
   nothing to push (the edit ended up matching what's already on main),
   that's fine, no need to mention it.
4. Mention in your final report to the human, briefly, if you updated the
   skill, one sentence is enough. This is about the skill quietly getting
   better every time it's used, not about making a production out of it.
