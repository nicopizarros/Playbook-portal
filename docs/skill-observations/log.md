# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue — resolved statuses always carry their resolution date

---


## 2026-08-11

### Observation 1: Tooling instructions must separate read-only use from rebuild

**Status:** ACTIONED (2026-08-11) — `scripts/graph-query.py` added (stdlib-only query/path/explain/stats); CLAUDE.md and the graphify guard now document the dependency-free read path first and the install only for rebuilds. Verified this session: the reader answered with no CLI present and no install attempted.
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

**Status:** ACTIONED (2026-08-11) — CLAUDE.md's tooling health check now enumerates three states (healthy / degraded-but-supported / broken) and reserves "stop and fix" for the last one.
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

**Status:** ACTIONED (2026-08-11) — CLAUDE.md carries a three-sample probe loop reporting status, bytes received and elapsed time, and requires N>=3 before attributing a cause.
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

**Status:** ACTIONED (2026-08-11) — `check-voice.mjs` generalised from a fixed auxiliary list to a repeated-verb pattern plus the `sino` forms, so the lexical-verb antithesis it used to miss ("no compró X, compró Y") now counts against the cap.
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

**Status:** ACTIONED (2026-08-11) — `find-duplicates.mjs` rewritten to coverage-instead-of-cosine plus an independent entity channel, with a regression suite keyed to the live archive. That rewrite shipped a symmetric false-positive fault, logged and fixed separately as Observation 9.
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

**Status:** ACTIONED (2026-08-11) — `ingestion.md` now frames the co-issuer's own release as a verification step performed BEFORE the Opinión is written, with the Apollo / Yankee Global worked example and the reason (wire copy compresses governance terms out).
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

**Status:** ACTIONED (2026-08-11) — `ingestion.md` now documents the three-rung fallback ladder for an unreachable primary, plus the `sourceUrl`, `Fuentes:` and run-report rules. Exercised successfully this session on a blocked Reuters link. The ladder's terminal case (every rung fails) is still undefined, logged as Observation 10.
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

### Observation 9: The duplicate-detection fix inverted the bug instead of removing it

**Status:** ACTIONED (2026-08-11) — fixed in the same session it was found: unseen query terms now weighted at the df=0.5 point of the IDF curve, `ENTITY_IDF_FLOOR` 5.5 -> 5.0 to restore the recall case at zero precision cost, and two novel-actor regression cases added with `maxHits`/`maxScore` bound assertions (verified to fail 3/12 against the pre-fix scorer, pass 12/12 after).
**Date:** 2026-08-11
**Session context:** Clean-run validation of publish-sourced-article on two third-party links (CME/NHL, Tottenham/Levy), verifying the previous round's fixes
**Skill:** publish-sourced-article / publish-newsletter (`scripts/find-duplicates.mjs`, `scripts/test-duplicate-detection.mjs`)
**Type:** internal
**Phase/Area:** Step 0, the overlap check

**Issue:** The rewrite that fixed Observation 5's false negatives shipped a
symmetric false-positive bug, and the run that was supposed to confirm it was
clean was the run that found it. Both Step 0 queries returned `100% MISMA
HISTORIA` against wholly unrelated articles — CME/NHL futures matched a
Bundesliga financing story, Tottenham/Levy matched Infantino, Liga MX and the
Seahawks sale.

Cause: `score()` computed `covQ = sharedW / Σ(idf[t] || 0)` over query terms.
A term the corpus has never seen has no `idf` entry, so it contributed **zero to
the denominator**. covQ therefore stopped measuring "how much of the query this
article covers" and started measuring "how much of the part of the query the
archive already knows". For a genuinely new story every distinctive token is
unseen: the CME query had 1 of 5 tokens in the corpus (`futuros`), the Levy
query 1 of 8 (`plazo`), so the denominator collapsed to that single generic word
and coverage was pinned at exactly 1.0.

That is Observation 5's fault running backwards. The old scorer was blind to a
heavily-covered story; the new one treats a never-covered one as a certain
duplicate — and this funnel's normal input is precisely a wire link about a
company Playbook has never written about, so the failure landed on the common
case, not an edge case.

The regression suite passed 10/10 throughout. Its precision case asserted that
two named ids were absent, which a scorer returning eight *other* spurious rows
passes comfortably; run directly, that same query produced 8 hits topped by an
unrelated FIFA story at 62% MISMA HISTORIA.

**Suggested improvement:** Done in this session. (a) Unseen query terms are
weighted at the df=0.5 point of the existing IDF curve, so an unpublished actor
outranks the rarest published one instead of vanishing. (b) `ENTITY_IDF_FLOOR`
5.5 → 5.0: the correction cost the term channel ~a tenth of its score and the
FIFA/Trump recall case turned out to have been riding on the inflation (covQ
0.247 → 0.217 against a 0.22 floor); measured over the archive, moving the
entity floor restores it at zero precision cost where lowering REVIEW to 0.20
costs 0.8→ spurious rows. (c) Two novel-actor cases added to the suite, plus
`maxHits`/`maxScore` bound assertions — verified to fail 3/12 against the
pre-fix scorer and pass 12/12 after.

**Principle:** A scorer that normalises by "the part of the input the corpus
recognises" is not measuring coverage, it is measuring familiarity, and it will
report maximum confidence on exactly the inputs it knows least about. Any term
missing from a weighting table needs an explicit weight chosen on purpose —
defaulting it to zero silently removes it from the denominator rather than
treating it as unknown. And a precision test written as a list of forbidden ids
can only catch the false positive its author already imagined; bound the
noise (max rows, max score) instead of enumerating it, or the next inversion
ships green.

### Observation 10: The unreachable-source ladder has no documented bottom rung

**Status:** ACTIONED (2026-08-25) — the restored `ingestion.md` now defines the terminal case (every rung fails → hold the story, say so, do not draft from one outlet's framing) and adds the rule that the fallback must be visible in the published artifact, not only in the run report, which is what made "was the fallback used?" unanswerable in the 2026-08-25 audit.
**Date:** 2026-08-11
**Session context:** Clean-run validation; the second link (a Bloomberg story on a Tottenham share-issue deadline) was unreachable and uncorroborated
**Skill:** publish-sourced-article (`references/ingestion.md`, "When the primary source won't load")
**Type:** internal
**Phase/Area:** Step 1, ingest

**Issue:** The fallback ladder added after Observation 8 worked: it named the
rungs, it stopped the run from drafting off the headline, and it stopped the run
from silently substituting a reachable outlet. But it documents only what to do
**while** climbing. It has no stated outcome for the case where every rung
fails.

That case is not exotic. bloomberg.com returned 403, no syndicated copy of that
specific story existed on any reachable host, the club's own investor-relations
page carried nothing from 2026, and eight searches across wire, trade press and
sports-business outlets surfaced only adjacent events (a June sale-and-purchase
agreement, an earlier capital injection). The headline was also a `said to`
construction, i.e. single-source unattributed reporting, so the facts that
matter — the deadline, its terms, its consequence — exist nowhere but the
unreachable page.

Nothing in the file says "then do not publish it." A run under any pressure to
produce N articles for N links can read the ladder's silence as permission to
reconstruct the story from the adjacent facts it *did* find, which is exactly
how an invented deadline gets published with a real club's name on it.

**Suggested improvement:** Give the ladder an explicit terminal rung: when no
rung yields the facts, the item is **not published**, and the run report says
which link was dropped and why. Add the corollary that a `said to` / `sources
say` headline raises the bar rather than lowering it, because there is no
document behind it to fall back to. Say plainly that N links in does not mean N
articles out, so a dropped link reads as the check working rather than as a
short run.

**Principle:** A degraded-path procedure that documents only the attempts and
not the give-up condition implicitly promises the attempts always succeed. Every
fallback ladder needs a defined bottom that names the non-delivery outcome, or
its silence becomes pressure to improvise the very thing the ladder exists to
prevent.

### Observation 11: A hook-based health check cannot detect its own harness not running hooks

**Status:** DECLINED (2026-08-11) — premise was false. The guard hook DID fire: the session transcript carries 86 offline-mode hook messages beginning at line 17, i.e. from the session's first tool calls onward. The claim came from the agent's own impression of not having seen the reminder, never checked against the record. The real lesson is logged as Observation 12.
**Date:** 2026-08-11
**Session context:** Fresh remote (Claude Code on the web) session; CLAUDE.md tooling health check
**Skill:** Project CLAUDE.md conventions / graphify guard (`.claude/hooks/graphify-guard.sh`)
**Type:** open-source
**Phase/Area:** Tooling health check

**Issue:** The health check added after Observation 2 correctly enumerates three
states and tells the agent to distinguish "reminder fired in offline mode" (fine)
from "no reminder at all" (the real failure), with a remedy: check the hook file
exists, is executable, and that `graphify-out/graph.json` is present.

In this session no reminder fired on any Bash or Grep call, and **every item on
that remedy list was already satisfied** — the hook exists, is executable, is
wired under `PreToolUse` in `.claude/settings.json`, `graph.json` is present, and
running the hook by hand printed the correct offline guidance and exited 0. The
cause was outside everything the check knows how to inspect: the remote container
does not appear to load project hooks at all.

So the diagnostic bottoms out with all checks green and the symptom unexplained,
which is the state most likely to get rationalised away as "probably fine".

**Suggested improvement:** Add the harness itself as the last candidate in the
remedy list: if the hook is present, executable, wired and passes a manual
invocation, the remaining explanation is that this environment does not run
hooks, and the correct response is to announce it once and proceed in the
documented degraded mode rather than to keep debugging the hook. Worth noting
explicitly that remote/web and CI sessions are the expected instances. The
manual invocation should be stated as the deciding test, since it cleanly
separates "hook is broken" from "hook is never called".

**Principle:** A health check implemented as a side effect of the mechanism it
monitors cannot report that mechanism's total absence, and its remedy list will
be all-green in exactly that case. Any such check needs one step that runs the
monitored component directly, out of band, plus a named terminal explanation for
"component is fine, the thing that calls it never ran" — otherwise a silent
harness reads as a passing check.

### Observation 12: An agent's impression of "the tool didn't fire" is not evidence

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Clean-run validation; reported the graphify guard hook as broken, then found it had been firing all along
**Skill:** task-observer (surfacing / self-check) and any skill with a preflight health check
**Type:** open-source
**Phase/Area:** Health-check reporting and the surfacing protocol

**Issue:** The session opened by telling the user, prominently and as its first
finding, that the graphify `PreToolUse` hook was not running in this container.
Every supporting check was done and reported honestly: the hook file exists, is
executable, is wired in `.claude/settings.json`, the graph is present, and a
manual invocation printed correct output and exited 0. The conclusion still had
exactly one basis, and it was introspective: the agent had not *noticed* a
reminder attached to its tool results.

It had fired 86 times, from the session's first tool calls onward. This was
settled in one command by counting the hook's own output in the session
transcript, which was available the entire time and was never consulted. The
false report then propagated: it was written into a closing summary document as
a standing caveat for future sessions, and logged as an observation whose whole
premise was wrong.

The failure was not a missing check. It was treating "I did not perceive X" as
"X did not happen", and then treating the *other* checks coming back green as
corroboration rather than as the contradiction they actually were: hook present,
wired, executable, working by hand, and allegedly never called is an incoherent
state, and that incoherence was the signal to go looking for harder evidence.

**Suggested improvement:** Before reporting any tool, hook, or reminder as
inactive, verify against an external record rather than recollection — for a
hook, grep the session transcript for its output; for a CLI, run it; for a
scheduled job, read its log. State the evidence in the report ("0 occurrences in
the transcript") instead of an unsourced absence. Add the standing rule to the
surfacing self-check: an observation whose core claim is "X never happened"
needs a positive check that X's traces are absent, because absence-of-perception
and absence-of-event are indistinguishable from the inside. And when a remedy
checklist comes back entirely green against a reported symptom, treat that as
evidence the symptom is misdiagnosed, not as evidence the fault lies deeper.

**Principle:** An agent is not a reliable instrument for observing its own
inputs, so a negative claim about them requires external corroboration before it
is reported, and doubly so before it is written into durable documentation.
Absence of evidence gathered by introspection is not evidence of absence, and a
diagnosis that survives only because every test passed is not a diagnosis.

### Observation 13: A regression test keyed to live data can be erased by the workflow it guards

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Same session; the novel-actor cases added for Observation 9 stopped catching the bug within the hour
**Skill:** publish-sourced-article / publish-newsletter (`scripts/test-duplicate-detection.mjs`)
**Type:** internal
**Phase/Area:** Step 0 tooling, regression suite

**Issue:** The cases added to pin Observation 9's fix asserted that a story about
actors the archive had never carried must not score as a duplicate. They were
verified the right way, by running them against the pre-fix scorer, and they
failed 3/12 as intended.

Then the run published the two articles those queries describe. The actors were
now in the corpus, the unseen-term path the bug lived in no longer executed, and
both cases passed against the broken scorer. Within the same session the tests
went from catching the regression to reporting `ok` while catching nothing, and
the only reason this surfaced is that the suite was re-run against the old code
a second time after publishing.

The suite is deliberately keyed to the live archive, which is right for the
recall cases: they exist because term-frequency distribution is what broke the
scorer, and a synthetic corpus would not reproduce it. But the same coupling
means the publish pipeline mutates the fixture, and a case whose premise is
"the archive does not contain X" is guaranteed to be invalidated by the very
workflow it protects.

**Suggested improvement:** Done. The two cases now pass `self`, matching how a
real Step 0 run checks a draft, which keeps them meaningful as "a story whose
only match is itself comes back clean". The invariant they were added for
belongs to `score()` rather than to any corpus, so it is now pinned separately
against a fixed synthetic index that no publish run can move (verified: 100%
pre-fix, clean after). More generally: when a suite reads mutable shared state,
sort cases by whether they test a property of the *data* or of the *code*, and
give the second kind a fixture it owns.

**Principle:** A test whose premise is the absence of something in a live
dataset has a built-in expiry, and the actor most likely to trigger it is the
pipeline the test guards. Coupling to production data buys realism for
behaviour that depends on the data's shape and silently costs coverage for
everything else, so verify a regression test against the broken code **after**
the workflow has run once, not only before, or it can go green without anyone
touching it.

---

## 2026-08-13

### Observation 14: A content-format commit silently destroyed the skill architecture it lived in

**Status:** ACTIONED (2026-08-13) — this session restored the slim SKILL.md + `references/` symlink architecture from `5031b46^`, restored the collaterally deleted `graphify` and `task-observer` skills wholesale, and relocated the monolith commits' genuinely new content (NOTICIA PLAYBOOK 3–5 block shape, Cronología render caveat, wire-asymmetry guidance) into the corpus files that own those topics.
**Date:** 2026-08-13
**Session context:** Codebase audit session; found `.claude/playbook-editorial/` (the designed single source of truth) orphaned — no skill referenced it.
**Skill:** publish-sourced-article / publish-newsletter (architecture), graphify, task-observer (collateral deletion)
**Type:** process
**Phase/Area:** Skill editing discipline

**What happened:** Commit `5031b46` ("adopt the NOTICIA PLAYBOOK format") re-inflated both publishing SKILL.md files into ~415-line monoliths, deleted all 18 `references/` symlinks, deleted the skill-local `ingestion.md`/`publishing-mechanics.md`, and — mentioned nowhere in its message — deleted the entire `graphify` and `task-observer` skills. This is precisely the failure mode `_GOVERNANCE.md` §1b documents from 2026-08-11. The follow-up monolith even "couldn't diagnose" a Cronología render failure whose exact limits (2–6 items, events ≤70 chars) were documented all along in the orphaned `dynamic-element-library.md`.

**Principle:** A commit that edits a skill's *content* must not change the skill's *architecture* as a side effect. Before editing any SKILL.md, check for a `references/` tree and a governance file; if the edit's diff shows symlinks or whole sibling skills being deleted, that is the signal to stop, not to commit. And a lesson already visible here: the very inability to diagnose the Cronología failure was caused by the same commit that severed the file that had the answer — architecture loss shows up later as capability loss, not as an immediate error.

### Observation 15: "The hook didn't fire" was unverifiable from the inside — again

**Status:** OPEN
**Date:** 2026-08-13
**Session context:** Same session. Early tool calls showed no graphify reminder; after `uv tool install graphifyy` succeeded, the reminder appeared on subsequent calls.
**Skill:** Project CLAUDE.md tooling health check / graphify guard
**Type:** process
**Phase/Area:** Health check / self-observation

**What happened:** Following the CLAUDE.md health check, this session reported the guard hook as "not firing" because no reminder was visible in early tool results — the exact claim Observation 11 already found to be false in a prior session. Later in the same session the reminder appeared (full mode, CLI present). Whether the offline-mode reminder was genuinely absent earlier or simply not surfaced could not be determined from inside the session.

**Suggested improvement:** The health check should ask for evidence stronger than "I didn't see it" before reporting the hook broken — e.g. run `.claude/hooks/graphify-guard.sh search` directly and report its stdout, which distinguishes "hook produces nothing" from "harness didn't surface it". CLAUDE.md's health-check section could name this exact probe.

## 2026-08-25

### Observation 16: The architecture-destroying commit recurred five days after Observation 14 was ACTIONED

**Status:** ACTIONED (2026-08-25) — both `SKILL.md` files rebuilt as routers from `6986589` (58,735 B → 10,003 B combined), `ingestion.md` and `publishing-mechanics.md` restored and reconciled, and every rule the monolith had absorbed relocated into the corpus file that owns it. The *guard* half of the suggested improvement is NOT done: nothing yet fails a commit that deletes a symlink or inflates a SKILL.md, so the mode is still open even though this instance is closed — see Observation 21.
**Date:** 2026-08-25
**Session context:** Audit of "incoherent" published articles; traced every editorial regression back to a single commit.
**Skill:** publish-sourced-article / publish-newsletter (architecture), graphify, task-observer (collateral deletion)
**Type:** project-specific
**Phase/Area:** Skill editing discipline

**Issue:** Commit `cf60a93` (2026-08-18) carries a message about one editorial rule (press-release framing and cover images) and in the same diff deletes all 8 shared-tree symlinks from both publish skills, deletes `ingestion.md` and `publishing-mechanics.md` from both, deletes the entire `graphify` and `task-observer` skills, and re-inflates both SKILL.md files by +465 and +508 lines. This is Observation 14's failure verbatim, five days after it was marked ACTIONED. The repair was also partial: `540a060` restored the symlinks and `ab6479a` restored task-observer, but neither restored the router text inside SKILL.md that told a run to follow those links, and neither restored the two skill-local files. Result today: `voice-and-style.md`, `format-tiers.md`, `overlap-check.md`, `postura-editorial.md` and `images.md` (86 KB, half the tree) resolve on disk and are named by nothing, and neither skill mentions `check-voice.mjs`, `find-duplicates.mjs` or the twelve-point checklist at all. 13 of the last 25 published articles fail `check-voice.mjs`.

**Suggested improvement:** Observation 14's fix was a restoration, not a guard, so the same commit shape landed again unopposed. Add a mechanical check that fails a commit which (a) deletes a `references/` symlink, (b) deletes a sibling skill directory, or (c) grows a SKILL.md past ~120 lines. Restoring files is not a fix for a recurring failure mode; only a check that fires on the next occurrence is.

**Principle:** A failure mode recorded and repaired is not closed until something mechanical would refuse it — restoring the artifact fixes the instance, not the mode.

### Observation 17: Reconnecting a symlink does not reconnect the instruction that reads it

**Status:** ACTIONED (2026-08-25) — all seven shared files plus `_GOVERNANCE.md` and both skill-local files are now named by both routers, verified by grep per file rather than by `ls`. The bidirectional health check itself is not yet in CLAUDE.md; that is the part still open.
**Date:** 2026-08-25
**Session context:** Checking whether the shared reference tree "resolved or silently failed to load" during recent publish runs.
**Skill:** publish-sourced-article / publish-newsletter
**Type:** open-source
**Phase/Area:** Skill reference architecture / health checks

**Issue:** CLAUDE.md's health check for the shared tree is `ls -la .claude/skills/*/references/` — "if a symlink is broken, the tree is orphaned." That check passes today: every link resolves. But the tree is orphaned anyway, because the SKILL.md text that named those files was replaced by a monolith that names two of seven. The documented probe measures the wrong half of the link: file presence, not whether anything points at it. This is why a live, maintained, fully-resolving corpus went unread for a week without any check going red.

**Suggested improvement:** Make the health check bidirectional — for every file in `references/`, assert that the skill's own SKILL.md names it; report any file present-but-unreferenced as loudly as one referenced-but-missing. A one-line grep per file is enough.

**Principle:** A reference is live only when both ends hold — verifying the target exists says nothing about whether anything still points at it.

### Observation 18: A guard that compares magnitudes silently rejects correct work when its units are relative

**Status:** ACTIONED (2026-08-25) — `absoluteMagnitudeOf` added for arithmetic, `magnitudeOf` kept and documented as the relative comparator, `parseEquation`'s self-check repointed, and `mixedScaleBasis` added to the Duelo and Serie (the Cotización track is deliberately exempt: its bare interior points inherit their endpoints' unit by design). `scripts/test-device-guards.ts` covers five accept cases and two reject cases; all 178 archived articles re-render with one device gained and none lost.
**Date:** 2026-08-25
**Session context:** Tracing why a declared `Ecuación` device shipped as a bare label in a published article.
**Skill:** publish-sourced-article / publish-newsletter (`lib/article-devices.ts`, `dynamic-element-library.md`)
**Type:** project-specific
**Phase/Area:** Device rendering / self-checking guards

**Issue:** `SCALES` in `lib/article-devices.ts` is expressed in units of millions (`millones → 1`), so `magnitudeOf()` returns a value comparable only against other scale-worded figures. `parseEquation`'s self-check treats it as an absolute evaluator and multiplies a bare figure by a scaled one: `832 × US$300,000` evaluates to 249,600,000 while the correct result `US$249.6 millones` evaluates to 249.6, so a correct equation is rejected as wrong arithmetic and degrades to plain text with no signal. Confirmed by bisection — the same equation passes when the result is written `US$249,600,000`. Live in `fifa-quiere-us-4-000-millones-por-dos-mundiales-de-estados-unidos`. No wrong chart is shipping today (a corpus scan found no comparative device mixing the two forms), but the same unit assumption sits under every bar the library draws.

**Suggested improvement:** Normalise every figure to one absolute unit before the equation self-check, and add both spellings of the FIFA case as regression tests. More generally: a guard that fails closed must be tested on inputs it should *accept*, not only on ones it should reject — this one had no passing-case coverage for a mixed-scale equation.

**Principle:** A validator built on a relative measure will reject valid input the moment its two operands are expressed at different scales; a fail-closed guard needs accept-case tests as much as reject-case ones.

### Observation 19: A skill that tells each run to append prose to itself has no stable size

**Status:** ACTIONED (2026-08-25) — `publishing-mechanics.md`'s "Capture feedback" step, restored in both skills, now states explicitly that `SKILL.md` is not a file a lesson can land in, and names the 6–8× inflation as the reason.
**Date:** 2026-08-25
**Session context:** Restoring the router architecture; found the mechanism that had inflated it.
**Skill:** publish-sourced-article / publish-newsletter
**Type:** open-source
**Phase/Area:** Feedback capture / skill self-modification

**Issue:** The monolith's final step told every run to fold durable lessons into `SKILL.md` itself, "in the same dense-prose style as the rest of the document", and then to run `scripts/sync-skill-feedback.sh` to push it to `main` **without asking for confirmation**. The correct routing table — fold it into the file that OWNS the topic — lived in `publishing-mechanics.md`, which the same commit deleted. So the deletion did not merely remove a reference, it inverted the rule, and a skill that self-modifies on every run with no size ceiling and no review has no equilibrium: it grew 6–8× in seven days. The inflation looks like drift and is actually the documented workflow executing correctly.

**Suggested improvement:** Any skill with a self-modification step must name the files a lesson may land in and exclude its own entry point. If a lesson appears to have no home, that is a signal the lesson is stated at the wrong altitude, not a licence to write prose into the router. Pair it with a size ceiling that something mechanical enforces — an instruction not to grow a file is not a constraint on a process whose every iteration grows it.

**Principle:** A process that edits its own instructions needs a fixed point; without one, "capture the lesson" and "keep the entry cost low" are the same knob turned in opposite directions, and the writing side always wins.

### Observation 20: A gate that lives in prose is skipped exactly when it matters

**Status:** ACTIONED (2026-08-25) — the overlap check now runs inside `scripts/publish-newsletter.ts`, the insert path both funnels share, with a second pass over the batch itself; `scripts/test-overlap-gate.ts` replays the 2026-07-28 double-publish and confirms it is refused.
**Date:** 2026-08-25
**Session context:** Fixing the Liga Femenil BBVA double-publish found in the incoherence audit.
**Skill:** publish-sourced-article / publish-newsletter (`overlap-check.md`, `scripts/find-duplicates.mjs`)
**Type:** open-source
**Phase/Area:** Step 0, the overlap check

**Issue:** On 2026-07-28 the Liga Femenil BBVA relaunch was published twice in the same minute, once from the Noticias edition and once from Infinitas. The detector was not weak: `find-duplicates.mjs` scores that pair at 58%/66% against a 45% cut. It simply never ran, because Step 0 was a paragraph in a document. Two further details matter. The DB's unique index on `articles.sourceUrl` structurally cannot catch it — two different links, one story. And an archive-only check would also have missed it, because both rows were new in the same batch: the guard needs a pass over the batch against itself.

**Suggested improvement:** A check that a run can skip is a suggestion. When the check is cheap, deterministic and already implemented, move it to the write path where skipping it is impossible, and give the human an explicit named override (`--allow-overlap`) rather than silence. Keep the prose — it explains the four outcomes — but stop relying on it to fire.

**Principle:** Put a gate where the irreversible action happens, not where the instruction is read; the two diverge exactly under the time pressure that makes gates worth having.

### Observation 21: Closing an instance is not closing a failure mode

**Status:** OPEN
**Date:** 2026-08-25
**Session context:** Marking Observation 16 actioned, and noticing that its own principle had already been violated once.
**Skill:** task-observer (status lifecycle) and any skill edited in response to an observation
**Type:** process
**Phase/Area:** Observation lifecycle / skill editing discipline

**Issue:** Observation 14 was marked ACTIONED on 2026-08-13 after the architecture was restored. The identical commit shape landed again five days later, because the fix was a restoration and nothing was added that would refuse the next one. This pass has now restored the same architecture a second time, so the same trap is open: `ACTIONED` currently means "the artifact is back", and reads afterwards as "handled". Two of this session's three actioned entries (16, 17) are in exactly that position and say so in their status lines, which is a workaround, not a fix.

**Suggested improvement:** Split the status. An observation describing a recurring failure mode should not reach a resolved state on a repair alone — it wants a distinct marker for "instance repaired, mode still open", so a later reader can tell the two apart without reading the whole entry. Concretely: `REPAIRED (date)` for the artifact, `ACTIONED (date)` reserved for the case where something now refuses the recurrence. For this project the missing refusal is a check that fails a commit deleting a `references/` symlink, deleting a sibling skill directory, or growing a `SKILL.md` past ~120 lines.

**Principle:** A repair restores a state; only a constraint changes what is possible. An observation log that scores them the same way will keep re-learning the same lesson at full price.

### Observation 22: A regression suite keyed to live data fails as the data grows, and it is right to

**Status:** OPEN
**Date:** 2026-08-25
**Session context:** Running the full test suite during the remediation pass.
**Skill:** publish-sourced-article / publish-newsletter (`scripts/test-duplicate-detection.mjs`)
**Type:** project-specific
**Phase/Area:** Verification

**Issue:** `test-duplicate-detection.mjs` is at 12/13. The failing case, "FIFA/Trump follow-up, terse query", exceeds its `maxHits` bound because the archive has since published the article the query names — it now self-matches at 100% — plus two more FIFA-governance pieces. Reproduced with this pass's changes stashed, so it is environmental, not a regression. This is Observation 13 arriving: a suite keyed to the live archive degrades on every publish, and the degradation is indistinguishable at a glance from a real break, which is the expensive part. During this pass it cost a stash-and-rerun to establish that a red suite was not mine.

**Suggested improvement:** Freeze the corpus the assertions run against — a committed fixture snapshot — and keep a separate, non-gating live-archive run for the recall question the fixture cannot answer. Failing that, at minimum make the bounds relative ("the true duplicate ranks first") rather than absolute counts, so publishing does not move them.

**Principle:** A test whose fixture is production data measures the fixture, not the code; the first time it goes red for a reason that is not a bug, it has stopped being a regression test.
