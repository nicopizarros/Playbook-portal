# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue — resolved statuses always carry their resolution date

---


## 2026-08-11

### Observation 1: Tooling instructions must separate read-only use from rebuild

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Fresh web session; graphify CLI absent and PyPI egress flaky, blocking a 3-article publishing run
**Skill:** graphify (and project CLAUDE.md tooling rules)
**Type:** open-source
**Phase/Area:** Fast path / Step 1 "Ensure graphify is installed"

**Issue:** The graph artifacts (graph.json, GRAPH_REPORT.md) were committed and
fully readable, but every instruction routed codebase questions through the
`graphify` CLI. With the CLI missing, the documented remedy was "install it" —
so the session spent three failed install attempts (~10 min) before doing any
real work, for a task that only ever needed to *read* plain JSON.

**Suggested improvement:** Split tool guidance into read paths and write paths.
Read paths must have a dependency-free fallback over the committed artifacts;
only rebuild paths may require the binary. Added `scripts/graph-query.py`
(stdlib-only query/path/explain/stats) and made the fast path fall through to it.

**Principle:** When a tool produces committed artifacts, the artifacts — not the
tool — are the interface. Never gate reading behind installing the producer;
document the dependency-free read path first and the install only for writes.

### Observation 2: A health check needs a degraded state, not just pass/fail

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Same session; CLAUDE.md "Tooling health check" section
**Skill:** Project CLAUDE.md conventions (generalises to any skill with a preflight check)
**Type:** open-source
**Phase/Area:** Tooling health check

**Issue:** The check said: if a tool is inactive, "say so in your first reply and
stop to fix it — do not quietly work around it." Binary framing. Faced with a
missing CLI whose absence was harmless for the actual task, the rule mandated
stopping and fixing, which is exactly the wrong call when a supported degraded
mode exists. The rule optimised against silent degradation and accidentally
forbade *announced* degradation too.

**Suggested improvement:** Every health check should enumerate three states, not
two: healthy, degraded-but-supported (announce once, continue, with the fallback
named), and broken (stop and fix). Reserve "stop" for the genuinely broken state.

**Principle:** "Don't silently work around it" and "stop and fix it" are
different instructions. A preflight check that only encodes pass/fail converts
every soft failure into a hard block; name the degraded mode explicitly or the
agent will over-escalate.

### Observation 3: Sample a flaky network 3+ times before naming a cause

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Diagnosing why `uv tool install graphifyy` failed
**Skill:** New skill candidate: environment-diagnosis (network/tooling triage)
**Type:** open-source
**Phase/Area:** Network diagnosis

**Issue:** Single-sample probes produced a confident wrong conclusion twice.
First pass: "PyPI is unreachable" (it was reachable). Second pass: one direct
request hung and one proxied request succeeded, suggesting "the proxy works,
direct egress is blackholed" — a clean, plausible, false story. Three samples
per path showed both paths failing intermittently at roughly the same rate. The
real signature was HTTP 200 headers followed by a body stalling at 0 bytes.

**Suggested improvement:** For any network or flaky-tool diagnosis, require N>=3
samples per path before attributing a cause, and report the failure *signature*
(status + bytes received + elapsed), not just success/failure. Compare paths
only with equal sample counts.

**Principle:** Intermittent failures masquerade as deterministic ones under
single sampling, and the first coherent story is the most dangerous output of a
one-shot probe. Measure variance before assigning cause.

### Observation 4: check-voice's antithesis regex is narrower than the rule it enforces

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Validation run of publish-sourced-article on three third-party links
**Skill:** publish-sourced-article / publish-newsletter (shared voice-and-style.md + scripts/check-voice.mjs)
**Type:** internal
**Phase/Area:** Step 7 self-check — `node scripts/check-voice.mjs`

**Issue:** `voice-and-style.md` §2 states the negative-parallelism cap covers
"the whole family", listing "no es X, es Y", "no solo X, sino Y", "el golpe no
vino de A, vino de B" and "deja de ser A y se convierte en B". The checker's
regexes only match a closed list of copular/auxiliary verbs
(`es|son|fue|viene|está|estaba|se trata de`) plus the "no solo … sino" form. A
draft closing on "Disney no compró carreras, compró fechas fijas" is the same
shape with a lexical verb and the checker reported `antítesis 0`. The article
was within budget anyway, so nothing shipped wrong, but the count the reviewer
sees is not the count the rule defines, and a piece carrying two lexical-verb
antitheses would pass silently.

**Suggested improvement:** Generalise the first regex to a repeated-verb form
(`no <verbo> X, <mismo verbo/otro> Y`) rather than a fixed auxiliary list, or
at minimum add the "deja de … y se convierte en" shape the doc already names.
If broadening it produces false positives, report the extra matches as a
separate advisory count rather than leaving them uncounted.

**Principle:** When a linter enforces a documented rule, drift between the
regex's coverage and the prose rule's stated scope is invisible in exactly the
direction that matters: the tool reports compliance the rule does not grant.
Test a checker against every variant its own documentation enumerates.

### Observation 5: find-duplicates.mjs scores longer, better-specified queries LOWER

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** publish-sourced-article validation run, article 2 (Trump backs Infantino, a FIFA-governance follow-up)
**Skill:** publish-sourced-article / publish-newsletter (shared `overlap-check.md`, `scripts/find-duplicates.mjs`)
**Type:** internal
**Phase/Area:** Step 0, the overlap check

**Issue:** The overlap check reported `sin coincidencias · vía libre` for a story
with **17 prior published articles**, including a direct predecessor published
the previous day. Reproduced against the live DB, same story, three phrasings:

| query | result |
|---|---|
| `Infantino` | vía libre (0 hits) |
| `Trump respalda a Infantino` | 1 hit, 28% (the 08-07 piece) |
| `Trump respalda a Infantino en plena crisis de gobernanza de FIFA tras la carta conjunta de UEFA, Concacaf y AFC` | vía libre (0 hits) |

Three compounding causes in `score()`:

1. **Cosine normalisation punishes query length.** `norm = sqrt(Σ queryIdf) *
   sqrt(Σ docIdf)`. Adding true, relevant terms that happen not to match a
   given document grows the denominator faster than the numerator. `overlap-check.md`
   instructs the operator to pass "the item's headline or one-line topic", so
   the documented usage is the failing case.
2. **A one-token query cannot clear the floor** either: numerator `idf[t]`
   against a denominator carrying `sqrt` of a whole title+excerpt+teaser.
3. **IDF saturation inverts the tool's purpose.** `idf = log(1 + N/df)`, so on
   a running story the identifying terms ("fifa", "infantino") are common in
   the corpus and contribute almost nothing. **The more Playbook has covered a
   story, the less able the duplicate checker is to see it** — exactly backwards.

The editorial call was still made correctly, but only because the run queried
the database directly after distrusting the "vía libre". A run that trusted the
tool would have drafted a follow-up as a fresh explainer.

**Suggested improvement:** Two changes, both small. (a) Normalise by the query
only (or use plain coverage: matched query IDF / total query IDF) so query
length stops being a penalty. (b) Add a cheap, un-scored **entity pre-pass**:
before scoring, surface every published article sharing a rare proper noun with
the query (capitalised token or a token absent from the STOP list appearing in
under ~20% of docs), listed as "revisar" regardless of cosine score. A running
story is identified by its actors, and actors are precisely what IDF discounts.
Until then, `overlap-check.md` should tell the operator to also run a direct
title/excerpt `ilike` query on the story's main proper nouns and treat the
script as advisory-only.

**Principle:** A duplicate detector weighted by term rarity degrades exactly
where duplicates are most likely, because a heavily-covered story makes its own
identifying terms common. Recall tools for running stories must key on entities,
not on rarity, and any scorer whose documented input format scores worse than an
ad-hoc one has an inverted interface.

### Observation 6: "fetch the page, never the snippet" caught a defamatory framing

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Same run, cross-referencing the FIFA/Trump story
**Skill:** publish-sourced-article (`references/ingestion.md`, Step 2)
**Type:** open-source
**Phase/Area:** Step 2, cross-reference

**Issue:** A search snippet surfaced that the failed FIFA Forward Enterprise
plan's lead prospective investor was Joshua Kushner, "whose brother Jared is
Trump's son-in-law" — arriving in the same result set as Trump's public defence
of the executive behind that plan. The obvious framing wrote itself, and it
would have been an insinuation of self-dealing. Fetching the actual source page
produced the disqualifying fact the snippet omitted: that outlet states plainly
that Kushner "does not have political ties to the Trump Administration" and
that his most recent political donation was to the Obama Foundation. The
connection is real and worth stating; the implication is not supportable.

**Suggested improvement:** `ingestion.md` already says "fetch the actual pages
(never rely on a search snippet)". Add the *reason* with this worked example:
snippets preserve the association and drop the qualification, and association
plus omitted qualification is how an evidence-level-2 fact becomes an
evidence-level-1 accusation. Name the specific danger case — a snippet that
connects two named people through a third party.

**Principle:** Search snippets are optimised to show why a result matched, which
systematically preserves the association that matched the query and discards the
sentence that qualifies it. Any inference drawn from a snippet about the
relationship between two named parties is unsafe until the page is read.

### Observation 7: The co-issuer's own posting carried a fact that changed the analysis

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Validation run, article 3 (Apollo's US$2,600M into Yankee Global Enterprises)
**Skill:** publish-sourced-article (`references/ingestion.md`, "Find each primary co-issuer's own posting")
**Type:** open-source
**Phase/Area:** Step 2, cross-reference

**Issue:** The wire copy and every secondary outlet reported the deal as a
financing that left the owning family in full control. On that basis the draft's
closing read was that the fund "no cede una silla en la mesa" — it gets paid but
never gets a seat. The co-issuers' own joint press release, found only by going
looking for it, states that the fund's chief executive joins the holding
company's board in an additional seat. The analytical conclusion was not merely
incomplete, it was **the opposite of the fact**, and it was already written.

**Suggested improvement:** `ingestion.md` frames finding each co-issuer's posting
as a sourcing task, needed to populate the `Fuentes:` line. Reframe it as a
**verification** task performed **before the Opinión is written**, with this
example: wire summaries compress governance terms (board seats, consent rights,
veto thresholds) out of the story because they are not the headline number,
and governance terms are exactly what a business read turns on. Move the step
ahead of drafting in the decision flow rather than leaving it adjacent to the
credit line.

**Principle:** A press release is not just an attribution target, it is the only
source that reliably contains the deal's structural terms. Wire copy optimises
for the number; the issuer's own document is where the control provisions live,
and control provisions are what an analytical read is usually about.

### Observation 8: The funnel needs a documented path for an unreachable primary source

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Same run; the third link was a reuters.com article
**Skill:** publish-sourced-article (`references/ingestion.md` Step 1, `publishing-mechanics.md` reporting)
**Type:** internal
**Phase/Area:** Step 1, ingest

**Issue:** `ingestion.md` Step 1 says to confirm the date and core facts
"directly from the page". reuters.com returned HTTP 401 to every automated
fetch (DataDome bot protection), and the harness's own fetcher refuses the
domain outright. The skill has no stated procedure for this, even though wire
services are named as this funnel's typical input and several of them are
hard-blocked. Two other paywalled or protected hosts came up in the same run
(a 307 to a metering subdomain that does not resolve, and truthsocial.com at
403), so this is the common case, not an edge case. The run improvised: confirm
every fact against reachable syndications of the same wire copy plus the
issuer's press release, keep the given URL as `sourceUrl` because it is the
internal dedupe key and never rendered, and declare the substitution in the run
report.

**Suggested improvement:** Write that improvisation into `ingestion.md` as the
named procedure, with the ordered fallback: (1) a syndicated copy of the same
wire on a reachable host, (2) the issuer's own release, (3) two independent
outlets agreeing on each figure. Add that `sourceUrl` stays the original link
regardless, since it is a dedupe key rather than a citation, and that the
`Fuentes:` line must not silently substitute a reachable outlet for an
unreachable primary. Require one line in the run report naming which facts
could not be read from the primary.

**Principle:** When a skill's required input is routinely unavailable, the
workaround gets reinvented every run and its quality depends on who is running
it. Document the degraded path with the same specificity as the happy path, and
require the substitution to be declared rather than absorbed.
