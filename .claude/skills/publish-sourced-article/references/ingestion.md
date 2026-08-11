# Ingestion — third-party links

This is the only part of the pipeline that is specific to this funnel.
Everything downstream (voice, tiers, devices, fields, images) is shared with
`publish-newsletter`.

---

## Step 1: Read the primary source

Fetch every URL given (WebFetch). Unlike a Noticias digest, **each link here is
one standalone story: one link, one article.** If given several unrelated links
in one run, draft each as its own separate article.

Confirm the publish date and the core facts (who, what, the key numbers)
**directly from the page**. Don't guess or carry over stale context.

**Then run the overlap check before drafting a word** (`overlap-check.md`).
This funnel is the one most likely to arrive at a story Playbook already
published — a wire link about something a Noticias edition briefed two days ago
is the normal case, not the edge case. It also doubles as the follow-up
detector: when it surfaces an earlier piece on the same running story, this
becomes a follow-up rather than a fresh explainer that re-establishes
everything from scratch, which changes how it gets written
(`voice-and-style.md` §10).

---

## Step 2: Cross-reference other coverage (mandatory)

Before drafting, for every article, search for and read **at least one or two
*other* outlets' coverage of the same story, on different domains from the
primary link.** This is mandatory, not optional, and it is the core of this
skill:

- **Verification** — don't take the primary source's framing or numbers at face
  value. Confirm the key facts independently where another outlet covered them.
- **Enrichment** — surface a data point, comparison or piece of history the
  primary article didn't have. This becomes movement 2 of the four-movement structure
  (`format-tiers.md` §3).
- **Independence** — a Playbook piece built from a single competitor's article
  reads as a close paraphrase of that one competitor. Pulling in a second or
  third angle is what makes it a Playbook piece instead.

Rules: fetch the actual pages (never rely on a search snippet), prefer
reputable outlets (wire services, established sports-business or general press,
official newsrooms) over blogs or forums, and never fabricate a fact or a
source.

If, after genuinely trying, no other outlet has covered the story (a truly
exclusive or very fresh item), **say so explicitly** rather than inventing a
second source, and draft from the primary article alone.

### Find each primary co-issuer's own posting

The `Fuentes:` line credits **who said it, not who reported it**
(`format-tiers.md` §6 for the full rule and the rendering). Practical
consequence for this step: find each co-issuer's own posting, not just the one
that was handed over. When a confederation, league or club publishes jointly,
every signatory usually posts the same document on its own site, and **those
URLs are what the line wants**.

Verify each one loads before using it. A site behind aggressive bot protection
may refuse an automated fetch while serving readers normally — say so rather
than silently dropping the co-issuer.

The editorial outlets read above do their job by being read. They do **not** go
on the line, unless one of them broke the story exclusively.

### Research the Mexico/LATAM angle here, not at drafting time

A foreign outlet's article will almost never carry the regional hook the
Opinión needs, so it has to be **found**. The full rule, the falsification
searches to run, and the 2026-08-05 worked example where inference ran exactly
backwards live in **`voice-and-style.md` §9**.

And per the same section: **a forced Mexico angle is worse than no Mexico
angle** (publisher, 2026-08-11, on a batch of four foreign business stories).
When the honest answer is that the region has no real stake, close the Opinión
on a global industry read. In that batch the F1 quarter kept its angle; Fox's
advertising quarter, a Kansas City naming-rights reversal, and a prediction
market buying ATP streaming all closed on the industry read instead. Both
outcomes are correct. "Cuando sea relevante" is a real permission not to.

---

## Handling wire copy

Two things about this funnel's raw material that don't come up in the other
one.

**Wire pacing does not survive translation intact.** A Reuters or AP paragraph
is built to be lifted whole, so translating one faithfully imports its
breaking-news cadence along with its facts — short declarative sentences
building tension toward what happens next. Playbook's register is a calm
business brief even when the story is dramatic (`voice-and-style.md` §7).
Rebuild the paragraph in that register instead of carrying the source's shape
across. This is easiest to get wrong in the **fact block**; watch for it there
specifically.

**Look for asymmetries in how parties reacted**, rather than flattening a story
into "everyone opposed X." When the cross-referenced sources support it, a
story often has one party objecting to the **substance** of something (a
principled rejection) and another objecting mainly to being left out of the
**process** (a procedural complaint that doesn't necessarily mean opposing the
substance). Drawing that distinction out, when it is genuinely there in the
sources, is the kind of analytical read that makes a piece Playbook's own take
rather than a translated summary of the wire copy.

**A rewrite, not a paraphrase.** Write every block in Playbook's own words,
grounded in multiple sources. Never a close paraphrase or translation of any
single outlet's article. The mechanical style rules that matter most here — the
em-dash ban, the one-negative-parallelism cap, no arithmetic showmanship,
metric units, background facts explained rather than name-dropped — matter more
in this funnel than in the other one, because a third-party article is being
rewritten rather than expanded, and a rewrite that keeps reaching for the same
rhetorical shapes is exactly what reads as a machine paraphrase of someone
else's piece.

---

## What this funnel usually publishes

**Product routing is fixed:** `"Noticias"` / `"industry-shots"`, not
`publish-newsletter`'s per-product pairs. A third-party wire pickup reads as a
news brief, not as a Playbook-branded opinion piece, and the kicker and
`tag-mini` chip should say "Noticias" the same way they do on a Noticias item —
both visually (`styles/components.css`'s `.tag-mini.industry-shots`) and in the
taxonomy-row ordering it drives. There is no separate "wire story" entry in
`KNOWN_SOURCES` / `SOURCE_LABELS` to reach for; reusing `industry-shots` is the
pragmatic way to get the "Noticias" label without adding a taxonomy value for
it.

**When the link is an earnings release or a filing, the device is
`Resultados:`.** Added 2026-08-11 on publisher feedback that a quarterly report
deserved better than a lone `Cifra clave`. This funnel gets company results more
than any other — a Liberty Media quarter, a Fox 10-K, an Ollamani report — and
until that device existed nothing in the collection was shaped like a
statement. Full syntax in `dynamic-element-library.md`; the rule that bites
hardest is that the prose must not recite the grid the panel already prints.
