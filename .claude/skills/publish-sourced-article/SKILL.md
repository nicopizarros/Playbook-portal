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

**No visible Fuentes/citation block** (changed 2026-08-04, publisher
directive): earlier versions of this skill appended a visible "Fuentes"
list of linked outlets at the bottom of every article's body. The human
reviewer decided that space should never appear on a live article page,
so it's gone for good, not just for one draft. Step 2's cross-referencing
is still mandatory, it's still what makes a piece Playbook's own take
instead of a paraphrase of one competitor, it just no longer surfaces as
a citation list in `bodyMarkdown`. The only place a source URL still shows
up anywhere is the internal `sourceUrl` field (Step 4), which is a DB
dedupe key, never rendered on the page.

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

**The Mexico/LATAM angle is part of this research pass, not something to
reason out at drafting time.** A foreign outlet's article will almost never
carry the regional hook Step 3's Opinión paragraph needs, so it has to be
found, and the failure mode is inferring it from the story's own logic
rather than checking it. On 2026-08-05 a draft argued that a shrinking
league would probably drop its Mexican stop; the league had in fact already
announced that venue's next edition months earlier, so the honest read was
the reverse (a shorter calendar makes a surviving venue more important, not
less). Before the Opinión gets written, search the things that could
falsify it: whether the league/competition actually plays in Mexico and at
which venue, whether the next edition is already confirmed, who the local
commercial partner is, and which Mexican or LATAM athletes are involved and
on which team. Naming a real club, promoter, and player roster is also what
makes the closing paragraph something the reader can't get from the
original outlet.

## Step 3: Editorial voice

Same four-paragraph structure and tone as `publish-newsletter`'s Industry
Shots format (see that skill's Step 3 for the exact voice rules: direct,
analytical, authoritative, Mexico/LATAM angle, never an em dash "—", at
most one negative-parallelism construction per piece, no computed
percentages or ratios used as rhetoric, metric units throughout, and
background facts explained rather than name-dropped). Those last four
matter more here than in `publish-newsletter`: a third-party article is
being rewritten rather than expanded, and a rewrite that keeps reaching
for the same rhetorical shapes is exactly what reads as a machine
paraphrase of someone else's piece.

1. Fact paragraph: what happened, who, the key numbers, source context.
2. Cross-referenced context paragraph (Step 2): the data point, comparison,
   or angle the primary article didn't have, in Playbook's own voice, never
   a citation dump.
3. Detail paragraph: more of the story, background, mechanics, other named
   parties.
4. Opinión de Playbook: what it means for the industry, Mexico/LATAM angle
   when relevant. Always present, grounded in what's actually in the piece.

Always four paragraphs, no exceptions. Every paragraph, not only the
Opinión one, opens with a short bold lead-in (2-5 words, ending in a
colon, specific to what that paragraph covers, not a generic repeated
label across articles), same readability rule as `publish-newsletter`'s
Step 3, four paragraphs of unbroken prose read as one dense block on the
article page otherwise. The Opinión paragraph's lead-in must be exactly
`**Opinión de Playbook:**` — as of 2026-08-05 it is a UI contract, not
just house style: the article page detects it and renders that paragraph
as the fenced opinion callout (see `publish-newsletter`'s "The product
hub pages read the body" section, which also covers the La Lana
money-trail/board conventions if a run ever publishes into those
sources). That skill's "Dynamic-elements checklist" applies here too —
for this skill's industry-shots output that means: honest `priority`
(it decides whether /noticias renders the story as a feature band, a
card, or a compact row), the story's OWN biggest figure verbatim and
symbol-prefixed ("US$250 millones", never "250 millones de dólares") in
title/excerpt when it's a numbers story — a context figure (what someone
ELSE once spent) must not be the only number there, or the homepage's
"La cifra del día" scrapes the wrong one — a real cover image, and — when
the story is number-driven — an optional `Cifra clave: <figure> — <caption>`
paragraph (that skill's pull-figure convention, 2026-08-05: renders as a
full-bleed counting figure on the article page AND is preferred by "La
cifra del día" over any scrape; value ≤24 chars with a digit, rumored
figures attributed in the caption, at most one per article in practice). When the story is instead a
two-party relationship (a deal, partnership, acquisition), the
`Jugada: A ↔ B` convention applies (split-flap connection strip; `→` for
one-way flows, sides ≤32 chars, one max, only pairings the piece
documents). Lead-ins render as scan marks, so keep each one specific to
its paragraph; figures in house shapes highlight automatically, and the
single most important one should be bold (bold counts up). The full
device collection (Cronología / Recibo / Ecuación / Salto / Reparto /
Alineación / Cotización — syntax and when-to-use in
`publish-newsletter`'s "device collection" section) applies to this
skill's output too, under the same code-enforced budget: ≤2 min read →
1 designed device, 3-5 min → 2, 6+ min → 3, never a repeated type,
chosen by story shape, every number sourced from the verified reporting. Word-count range: roughly 300-500 words across the
four. Write every paragraph in Playbook's own words, this is a rewrite
grounded in multiple sources, never a close paraphrase or translation of
any single outlet's article.

### Tone: analytical brief, not breaking-news urgency

A wire story (Reuters, AP, AFP) is often written with the pacing of a live,
developing situation, short declarative sentences building tension toward
what happens next. Playbook's voice doesn't inherit that register. It
reads closer to a business brief than a news alert: calm and analytical
even when the underlying story is dramatic. This is easiest to get wrong
in the Fact paragraph, where translating the source too literally carries
its urgency over with it. Watch for it there specifically.

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
  This is an internal field only, never rendered on the article page, it's
  not a substitute for the Fuentes block that used to exist here.
- **readingTime**: `2` (the standard four-paragraph length).
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
