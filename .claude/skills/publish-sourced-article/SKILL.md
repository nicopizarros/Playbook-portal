---
name: publish-sourced-article
description: Turn a link from a third-party (non-Playbook) news source into a Playbook article, cross-referencing other outlets covering the same story, citing every source at the bottom of the piece, and pulling the cover photo from the referenced article when possible. Unlike publish-newsletter, this always pauses for explicit human approval in this Claude Code session before publishing. Use when asked to draft, process, or write up a link from an outlet other than Playbook's own Substack (ESPN, Reuters, a press release, any competitor or wire link).
---

# Publish Sourced Article: third-party link to Playbook article, with human approval

This is the human-reviewed counterpart to the `publish-newsletter` skill. That
skill is for Playbook's own Substack editions (trusted first-party content,
zero review, straight to `status: 'published'`). This one is for links to
someone else's article, an outlet Playbook doesn't own or control, so it
never publishes without an explicit yes from the human in this session, and
every article always carries a visible source list at the bottom.

Same field shape, same taxonomy, same production database and insert script
as `publish-newsletter` (see that skill's SKILL.md for anything not repeated
here), except: mandatory cross-referencing against other outlets (Step 2),
mandatory Fuentes citation block (Step 4), cover-image sourcing that starts
with the referenced article itself (Step 6), and the human-approval gate
(Step 7) before anything reaches the database.

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
or a source. Keep track of every outlet actually fetched and used, in the
order used, this list feeds Step 4's Fuentes section and Step 5's
`sourceUrl`.

If, after genuinely trying, no other outlet has covered the story (a truly
exclusive or very fresh item), say so explicitly rather than inventing a
second source, and draft from the primary article alone, still citing it
in Step 4.

## Step 3: Editorial voice

Same four-paragraph structure and tone as `publish-newsletter`'s Industry
Shots format (see that skill's Step 3 for the exact voice rules: direct,
analytical, authoritative, Mexico/LATAM angle, never an em dash "—"):

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
article page otherwise. Word-count range: roughly 300-500 words across the
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

## Step 4: Sources section (Fuentes, required)

Every article ends with a visible citation block, right after the Opinión
paragraph, as its own two blocks in `bodyMarkdown` (a blank line between
each, this matters, see below):

```
**Opinión de Playbook:** ...(the paragraph itself)...

**Fuentes:**

- [Outlet: article title or short description](https://the-real-url)
- [Outlet: article title or short description](https://the-real-url)
```

- One bullet per source actually fetched and used to write the piece, the
  primary link from Step 1 plus every cross-referenced article from Step 2.
  Never list a source you didn't actually read.
- `**Fuentes:**` must be its own block, separated by a blank line from the
  bullet list that follows: `scripts/publish-newsletter.ts`'s converter
  only recognizes a block as a list when *every* line in it starts with
  `- `, so `**Fuentes:**` and the list have to be two separate
  blank-line-separated blocks, not one.
- Use real `[text](url)` markdown links, the converter turns these into
  actual `link`-marked text (`target="_blank"`), not literal bracket text.
  Use the outlet's real name and the actual URL, never invent one.

## Step 5: Fields per article

Same shape as `publish-newsletter`'s `ArticleInput`
(`scripts/publish-newsletter.ts`), same taxonomy (`lib/taxonomy.ts`), same
Importancia scale. Differences from that skill:

- **author**: leave `""` unless a byline is genuinely known, same as
  `publish-newsletter`.
- **publication** / **source**: `"Playbook"` / `"playbook"`, the "anything
  else" pair in `publish-newsletter`'s mapping, this content isn't from one
  of the three Substack newsletters.
- **substackUrl**: always `""`, leave it empty. `app/(public)/articulo/page.tsx`
  renders a "Ver en Substack" button whenever this field is non-empty,
  pointing wherever it's set. That label is wrong for a third-party link,
  and there's no generic "ver fuente" variant of that button today, so
  don't populate it with the source URL. Step 4's Fuentes block is the
  citation mechanism for this skill, not this field.
- **sourceUrl**: the primary reference URL from Step 1, used as-is. It's
  the DB's unique dedupe key (`articles.sourceUrl`), so re-running this
  skill on the same link no-ops (`duplicate`) instead of publishing twice.
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
  Step 5 Fields section), including querying the DB for existing
  `featured = true` rows before setting one here.

## Step 6: Image

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

### 6b. No automatic in-body images

Different from `publish-newsletter`'s Step 5b: don't carry over additional
photos from the referenced (competitor's) article into the body. Only the
one cover image from 6a. Reproducing a competitor's full photo set inside a
Playbook article is a different risk profile than Playbook's own Substack
content, so body images stay out unless a human explicitly asks for one.

## Step 7: Human review, before anything touches the database

This is the difference that defines this skill. Never run Step 8 without an
explicit yes in this session, no exceptions, no "seems fine, publishing":

1. After Step 6, present the complete draft for every article in the batch:
   every field from Step 5 (title, excerpt, teaser, full bodyMarkdown
   including the Fuentes block, tags, priority, featured, image + credit,
   sourceUrl), not a summary.
2. Then explicitly ask whether to publish, per article if there's more than
   one (use `AskUserQuestion`, or just ask directly if that fits the
   conversation better). Don't default to "yes" on silence or an
   ambiguous reply.
3. If changes are requested, revise and re-present the full draft before
   asking again. Repeat until each article is either approved or dropped.
4. Only articles that got an explicit approval move to Step 8. Anything
   not approved is simply not published, no need to explain why.

## Step 8: Publish

Only for the articles approved in Step 7:

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
