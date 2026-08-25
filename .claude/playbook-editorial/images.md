# Images

**One copy, two skills.** The cover-image standard, the agency exclusion and
the crop check are identical for both funnels. What differs is **where you look
first** and **whether body images are carried over** — both marked below.

Every article gets a cover image, not just `priority: 5` ones (policy changed
2026-07-24 to raise every article to the same visual standard). **`imageUrl: ""`
is not acceptable for a published article.**

There are two separate image jobs and they never use the same source.

---

## 1. Cover image (`imageUrl` / `imageCredit`)

The hero photo at the top of the article and the feed-card thumbnail. It is
**never** one of the images embedded in the source article — those go in the
body, per §2.

### Where to look first — **differs by funnel**

- **`publish-newsletter`:** always search broadly from the start (§ "The broad
  search" below). A Substack post's own embedded images are body material, not
  cover material.
- **`publish-sourced-article`:** the default is the **primary source article's
  own lead/hero image**. Fetch the source page, identify its main image (not a
  thumbnail, not a masthead/avatar), and confirm it genuinely depicts the
  story's subject. Fall back to the broad search when that image is excluded by
  the agency rule, genuinely doesn't fit (a generic stock photo unrelated to
  the actual story), or doesn't exist.

### When the article body won't load, the image usually still will

(2026-08-12, on the Lakers sale, where the ESPN primary returned an empty body
and Sportico 307'd to a metering subdomain.) An outlet that blocks automated
fetches of its *prose* is almost always still serving its `og:image` /
`twitter:image` meta tags, because those exist to be read by crawlers it wants
— every social preview depends on them. So a story whose text had to be
rebuilt from cross-referenced outlets is **not** automatically a broad-search
story for the cover.

Before falling back, curl the page and read the meta tags out of the HTML head:

```
curl -sSL -A "<a normal browser UA>" "<url>" | grep -oiE '<meta[^>]+(og:image|twitter:image)[^>]*>'
```

It returns the full-resolution asset path plus `og:image:width`/`height`, which
is the crop check below already answered. Run it on the **cross-referenced**
outlets too, not just the primary: a sports-business outlet's own composite of
the deal's principals is usually a better cover than anything a generic search
turns up, and the width/height tags let you reject a bad ratio without
downloading. Strip any `?w=` query the tag carries to get the original.

Credit the outlet whose image it is (`"Foto: Sportico"`), and prefer
**self-hosting** it per the crop-check section below rather than hotlinking a
commercial competitor's CDN — the credit is what the site's takedown clause
rests on, and a copy under `public/assets/img/` cannot break when they move a
path. Self-hosted covers only resolve once the asset is on `main`, so push it
before the article references it.

### A Wikimedia candidate is verifiable even when the file won't download

(2026-08-18, on the Buss trust fight.) `upload.wikimedia.org` rate-limits shared
egress IPs, so a session in a cloud container hits `HTTP 429 Too many requests`
after two or three downloads while readers' browsers keep loading the same file
normally. Left there, the crop check below and the "confirm what it depicts"
rule become steps that quietly get skipped on exactly the images Playbook uses
most.

**Prefer a `/thumb/` URL over the original as the published `imageUrl`**
(2026-08-25). A Commons original is routinely 5–7 MB, which is a bad cover for a
1200px frame, and the site renders `imageUrl` in a plain `<img>` (arbitrary host,
`img-src https:` in the CSP) so nothing downsizes it for you. **The thumbnailer
only accepts a fixed set of widths**: `1280px-` works, while `1000px-`,
`1024px-` and `800px-` all return `HTTP 400` with the body "Use thumbnail sizes
listed on…", which reads like a broken URL and is easy to misdiagnose as the
429 rate limit below. Build it as
`…/commons/thumb/<h1>/<h2>/<File>.jpg/1280px-<File>.jpg`, keeping the two hash
segments and the percent-encoding from the API's own `url`, and confirm it
returns `200 image/jpeg` before publishing.

The Commons **API** answers both questions without the binary and is not part
of the same limit:

```
https://commons.wikimedia.org/w/api.php?action=query&generator=search\
  &gsrsearch=<subject>&gsrnamespace=6&gsrlimit=20\
  &prop=imageinfo&iiprop=url|size|extmetadata&format=json
```

Each result carries `width`, `height`, `ImageDescription`, `Artist` and
`LicenseShortName` — the ratio, the subject and the credit line, decided before
a single byte of image is fetched. Use it to shortlist, and retry the download
of **only the finalist** with `curl --retry 3 --retry-delay 20
--retry-all-errors` and a User-Agent naming the site and a contact address; the
limit is short-lived and one patient retry usually clears it. If it does not,
the API record is enough to publish on, and the run report says the photo was
verified from its file record rather than on screen.

### The broad search

**Always, always, always search for the best and most related cover photo,
trying different search angles and different sources before giving up.** Never
publish with no cover image and never settle for a generic or unrelated one
when a genuinely on-topic photo is findable: not a generic stadium if the story
is about data privacy, not a generic pitch if the story is about a business
deal. Match the actual subject — the company, the sport, the venue, the person.

Playbook doesn't restrict sourcing to free-license libraries. **Cast a wide net
across distinct platforms, not just varied queries on the same one:**

- general image search (Google Images, Bing Images)
- Wikimedia Commons
- Flickr (Creative Commons)
- official team/league/company press rooms and media galleries
- editorial photo agencies (Reuters Pictures, Shutterstock, and LATAM sports
  agencies such as Mexsport or Imago7 when the subject is Mexican/LATAM)

Not just Unsplash/Pexels-style free libraries.

**Search in English first** even when the article is in Spanish —
English-language queries tend to surface far better and more specific editorial
photography. But for a Mexico/LATAM-specific subject, also try Spanish-language
sources and local agencies directly; they sometimes have the only photo that
actually shows the right person, team, or venue.

If the first angle or platform only turns up generic results, keep trying
others (the company/person name, the venue, the specific event, sport + business
angle, a different search engine or agency entirely) before settling.

### A press release's own graphic is not a cover

(2026-08-18, the Apple/MLB Friday Night Baseball run.) When the primary source
is a company's own newsroom post, its hero shot or launch graphic is usually
on-topic and properly licensed, and it is still the wrong cover: it carries the
release's promotional framing into the piece visually, the same frame
`voice-and-style.md` §1 tells the prose to read past. Source a genuine editorial
photo of the actual subject instead — that run used a Fenway Park crowd photo
rather than Apple's marketing image. This is a framing exclusion, not a rights
one, so it applies on top of the agency exclusion below rather than instead of
it.

### The agency exclusion

**Never pull the image from an agency known to pursue unlicensed use
aggressively.** Getty Images foremost, including **iStock** (Getty-owned), and
treat **AP Images / AP Photo** the same way. If a search turns up exactly the
right photo but it's hosted on one of these, keep searching for another source
or angle rather than using it.

### When a photo carries no credit at all

(2026-08-07.) Distinct from being excluded and from being missing: a source
page's HTML/JSON metadata simply has no `credit`/`copyright`/`fuente` field
anywhere, so there is nothing to exclude and nothing confirmed safe either.

**Don't treat that silence as a green light, and don't treat it as an automatic
fallback trigger either.** First check whether other outlets covering the same
photo-op independently agree on a source (an award ceremony, a press
conference, a signing): if two or three unrelated outlets all caption the same
scene as a federation/league/company handout ("Cortesía FMF", "@FMF") rather
than a wire agency, that convergence is real evidence the photo is a press
handout, not a Getty/AP pickup running uncredited. **One outlet's silence is
inconclusive; independent agreement across several is enough to use it with
that credit.** If no other coverage of the same scene turns up, that is the
genuine "no clear usable image" case — fall back to the broad search instead of
guessing.

### Verify and credit

**Confirm the image actually exists and is genuinely on-topic before using it:**
fetch the photo's own page (not just a search-result thumbnail) and confirm what
it depicts. **Never invent or guess an image URL or ID.**

Set `imageCredit` to identify the real source, whatever it is — `"Foto:
[Fotógrafo] / Unsplash"`, `"Foto: [Agencia]"`, `"Foto: [Club/Liga/
Organización]"` — matched to whatever the photo's own page attributes it to. It
renders as a small caption under the lead photo, so **every article must have
one**. This is what backs the takedown-contact clause in the site's Términos y
Condiciones (`app/(public)/terminos/page.tsx`): a correct, specific credit is
what lets a rights holder actually identify their photo if they ever reach out.

If a cover photo genuinely cannot be sourced after trying multiple angles and
platforms, **say so explicitly in the run report** rather than guessing.

### No cropped-looking cover images

(Team directive, 2026-08-04.) The site never shows a cover photo at its native
aspect ratio. `.lead-photo` / `.article-photo` (homepage hero and every article
page, `styles/hero.css`, `styles/article.css`) force `aspect-ratio: 16/10` with
`object-fit: cover`, and the archive grid forces `4/3` or `1/1`
(`.archive-grid-photo`). A tall portrait or square photo gets centered and the
excess top/bottom sliced off automatically, with no control over which part
survives. This is exactly what cut a subject's face in half on a prior run and,
on a later run, silently cropped four separate cover photos down to the wrong
slice before anyone noticed.

**Before finalizing any `imageUrl`, check the candidate's actual pixel
dimensions** (fetch the file, don't guess from the thumbnail) and compute its
ratio:

- **~1.4:1 to ~1.8:1** survives a 16:10 crop with only minor, harmless trimming.
  Prefer photos already in that range.
- **Below ~1.3:1** (portrait or square, which includes most single-subject
  action shots and headshots) loses most of its vertical content. Either find a
  different, naturally wide-format photo of the same subject (a wide
  match/celebration/podium shot instead of a tight vertical portrait), or
  pre-crop it yourself to 16:10 around the part that matters (the face, the
  branding, the key detail) using an image tool before publishing.

A self-cropped image needs the same hosting path as any other custom asset:
commit it to `public/assets/img/`, push, and use the resulting
`https://playbook-portal-phi.vercel.app/assets/img/...` URL — Wikimedia and
Unsplash only serve their own original crops.

**Never publish a cover photo without doing this ratio check first**, regardless
of how good the photo looks in isolation. A source article's own hero image is
exactly as likely to be an awkward portrait crop as anything found by search, so
this applies to the sourced funnel's default too.

---

## 2. In-body images — **differs by funnel**

### `publish-newsletter`: carry them all over

Any image embedded in the source Substack post next to a specific news item
**always** gets carried into that article's body, integrated inline with the
text, never just used as the cover. Skip only pure page chrome (the
publication's masthead logo, the author's avatar headshot); everything else
that is part of the post's actual content (photos, banners, infographics,
charts) gets carried over.

- **Preserve the exact order** the images appear in, relative to each other and
  to the surrounding text/sections.
- **Place each image at the corresponding point in the body** — an infographic
  that illustrated one specific section goes inside that section, not bunched at
  the top or bottom.
- Insert it as its own block, on its own blank-line-separated line, using
  `![alt text](url)`, where `url` is the **real image src straight off the
  Substack page** (the `substackcdn.com` /
  `substack-post-media.s3.amazonaws.com` URL), not a re-description or a
  substitute. Fetch the URL first to confirm it resolves to an image.
- Immediately follow each image block with its own short caption paragraph
  reading exactly **`Foto: Playbook`**, regardless of what byline or watermark
  the original newsletter shows.
- The markdown-to-TipTap converter turns each `![alt](url)` block into an inline
  `image` node in the same position, so this only works through that exact
  syntax — not a raw `<img>` tag and not a description of the image.

`Foto: Playbook` captions are one of the four kinds of paragraph that carry no
bold lead-in.

### `publish-sourced-article`: none

**Don't carry additional photos from the referenced (competitor's) article into
the body.** Only the one cover image. Reproducing a competitor's full photo set
inside a Playbook article is a different risk profile than Playbook's own
Substack content, so body images stay out unless a human explicitly asks for
one.
