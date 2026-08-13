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

### When the primary source won't load

Wire services and paywalled outlets are this funnel's normal raw material and
several of them hard-block automated fetching. On 2026-08-11 three links in one
run refused: reuters.com returned 401 on every attempt (DataDome), a Sportico
URL 307'd to a metering subdomain that doesn't resolve, and truthsocial.com
returned 403. Improvising a workaround per run makes the quality of the
substitution depend on who is running it, so it is written down here.

**Do not draft from memory of the headline, and do not quietly swap in whatever
does load.** Work down this ladder and stop at the first rung that gives you
the facts:

1. **A syndicated copy of the same wire on a reachable host.** A Reuters story
   runs verbatim on dozens of local radio and regional news sites; those serve
   automated fetches normally. This is the closest thing to the primary and
   usually carries the whole text.
2. **The issuer's own press release.** Often better than the wire (see the
   co-issuer step below), and the thing to reach for anyway.
3. **Two independent outlets agreeing on each figure.** Slowest, and the only
   option for a story with no release and no syndication. Every number in the
   article needs two sources agreeing, not one outlet plus an assumption.

Three rules hold regardless of which rung you land on:

- **`sourceUrl` stays the original link.** It is the DB's dedupe key and is
  never rendered (`fields-and-taxonomy.md`), so pointing it at a syndication
  would let the same story be published twice from the real URL later.
- **Never silently substitute a reachable outlet on the `Fuentes:` line.** That
  line credits who said it, not who reported it, and an editorial outlet does
  not become a primary source by being the only one that loaded.
- **Say so in the run report**, in one line: which primary was unreadable, what
  it was replaced with, and any fact that could not be confirmed at all.

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
  primary article didn't have. This becomes the research movement of the B
  brief (`format-tiers.md` §3), or feeds a section of a Deep Dive (§3b).
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

### Read each primary co-issuer's own posting — BEFORE drafting, not at field-filling time

**This is a verification step that happens to also produce the `Fuentes:` line,
and running it in that order is the point.** It used to be framed the other way
round, as sourcing for the credit line, which meant it naturally got done while
filling fields — after the body and the Opinión were already written. That is
too late, and on 2026-08-11 it cost a wrong conclusion.

Worked example from that run. Every wire and secondary outlet reported Apollo's
US$2,600M into Yankee Global Enterprises as a financing that left the family in
full control, so the draft's closing read was that the fund gets paid but never
gets a seat: *"no cede una silla en la mesa."* The co-issuers' joint press
release, found only by going to look for it, says the fund's chief executive
**joins the board in an additional seat**. The Opinión was not incomplete, it
was the opposite of the fact, and it was already written.

The reason this keeps happening is structural, not a lapse: **wire copy
compresses governance terms out of a story because they are not the headline
number.** Board seats, consent rights, veto thresholds, unlock schedules and
who signs what are exactly the terms a business read turns on, and exactly what
gets cut for length. The issuer's own document is where they live. So read the
release before you decide what the story means, not after.

Practically: find each co-issuer's own posting, not just the one that was
handed over. When a confederation, league or club publishes jointly, every
signatory usually posts the same document on its own site, and **those URLs are
what the line wants**. Company releases are often only on an investor-relations
subdomain rather than the marketing site, so check `ir.<company>.com` before
concluding there is no release.

Verify each one loads before using it. A site behind aggressive bot protection
may refuse an automated fetch while serving readers normally — say so rather
than silently dropping the co-issuer. If a joint release exists in only one
place, that is one entry, not two: **under-fill the line rather than padding it
with a homepage link or an editorial outlet.**

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
