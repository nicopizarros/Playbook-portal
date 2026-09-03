# Publishing mechanics — publish-sourced-article

**The approval gate is what defines this skill.** Everything below Step 8 only
runs on an explicit yes.

---

## Requirements before running

Same as `publish-newsletter`: `POSTGRES_URL` must point at the production Neon
database and be available to the shell (exported, or in a local `.env.local` —
see `.env.local.example`). The insert script uses Neon's HTTP driver because
this session's outbound network only supports HTTPS, not raw TCP. Don't try to
reconnect it to `lib/db/client.ts`'s `pg` Pool.

---

## Step 8: Human review, before anything touches the database

Never run Step 9 without an explicit yes in this session. No exceptions, no
"seems fine, publishing."

1. **Present the complete draft for every article in the batch** — every field
   (title, excerpt, teaser, full `bodyMarkdown`, tags, priority, featured,
   image + credit, sourceUrl), **not a summary**. Bring `check-voice.mjs`'s
   output into the review with it.
2. **Then explicitly ask whether to publish**, per article if there is more
   than one (use `AskUserQuestion`, or ask directly if that fits the
   conversation better). **Don't default to "yes" on silence or an ambiguous
   reply.**
3. **If changes are requested, revise and re-present the full draft** before
   asking again. Repeat until each article is either approved or dropped.
4. **Only articles that got an explicit approval move to Step 9.** Anything not
   approved is simply not published, no need to explain why.

A reviewer instruction overrides a default. When one does — the 2026-08-07
"split into two paragraphs on the opinion… it doesn't matter if it is too long"
is the worked example — `format-tiers.md` §3 covers the technical shape of what
you're agreeing to.

---

## Step 9: Publish

Only for the articles approved in Step 8.

1. Write a JSON array of the **approved** article objects to a scratch file
   (same `ArticleInput` shape as `publish-newsletter`; field rules in
   `fields-and-taxonomy.md`).
2. Run:

   ```
   npx tsx --env-file=.env.local scripts/publish-newsletter.ts <path-to-json-file>
   ```

   (drop `--env-file` if `POSTGRES_URL` is already exported).
3. **Same script as `publish-newsletter` uses.** It inserts with
   `status: 'published'`, live immediately, for **whatever is in the file** — so
   only approved articles belong in it.
4. Report back a short confirmation per article: title, id, and the live URL
   (`https://playbook-portal-phi.vercel.app/articulo?id=<id>`). If any came back
   `duplicate`, say so — that link was already published before.

Report the overlap-check outcomes in the same breath (`overlap-check.md`), and
say in one line anything you couldn't satisfy: no findable cover photo, no
other outlet covering the story, a fact that couldn't be confirmed.

### A same-second verification curl can show a false negative

(2026-08-31, on the Messi retirement run.) `applyBodyDevices` runs at RENDER
time, not at publish time (`format-tiers.md` §6), so verifying a device
declaration means fetching the live article page after publishing, not just
trusting the insert succeeded. But the very first fetch immediately after
`publish-newsletter.ts` returns can catch a transient miss: on that run, two
devices (`Cronología`, `Precedentes`) both rendered as literal, unstyled
`<p>Cronología: …</p>` text on the first curl, which reads exactly like a
malformed declaration (`dynamic-element-library.md` §1's "renders as inert
plain text" failure mode) and is easy to chase as one. Re-fetching the same
URL roughly a minute later, nothing else changed, showed both devices
rendered correctly. Importing `applyBodyDevices` directly and running it
against the stored `body_html` also succeeded on the first try, which is
what actually proves the declaration itself was never the problem: a
same-second live-page fetch can lag the row's own write and briefly serve
the pre-transform HTML.

**Before concluding a device failed to parse, re-fetch the live URL once
more** (or reproduce the render locally by importing `applyBodyDevices` /
`extractSourcesFromHtml` against the stored `body_html`, which is unaffected
by any request-level lag) rather than immediately rewriting the declaration.
Only trust a "malformed" verdict that survives a second, later check.

### A fixed device can silently evict a second one

(2026-09-01, NFL Australia/México run.) A live-page check after publishing
caught `Alcance` rendering as literal `<p>Alcance: …</p>` text: two of its four
rows exceeded the 60-character value limit (`dynamic-element-library.md`'s
`Alcance` section), so the whole declaration failed to parse. Shortening those
two rows and re-running `update-article.ts` fixed `Alcance` — and made
`Cronología`, declared later in the same body, start rendering as *its own*
literal unstyled text, because `Alcance` had never been consuming a budget
slot while malformed. The device budget (`dynamic-element-library.md` §1) is
enforced at render time on whatever currently parses, not on what the author
intended, so **fixing one over-budget declaration can push a different,
previously-fine declaration out of the same fixed budget**, and the site will
show it exactly like a fresh mistake.

Two things follow. First, check every declared device's own character limits
(row/value/label lengths, item counts) against `dynamic-element-library.md`
**before** publishing, not just after — this is a five-minute count-the-string
check that would have caught the `Alcance` rows on the first pass. Second,
after fixing any device-rendering issue on a published article, **re-fetch the
live page again and re-check every declared device**, not just the one just
fixed — a body carrying more devices than its budget allows is one edit away
from a different device losing the slot it happened to hold. When a body
genuinely has more good devices than its budget, the fix is to cut one
deliberately (fold its facts into prose, as with `Cronología` here) rather than
leave it as a plain-text device declaration for a reader to see literally.

### Fixing a published body

Never hand-edit stored `body_html` — it is a cache of `body_json`. Run the
corrected `bodyMarkdown` back through the same pipeline:

```
npx tsx --env-file=.env.local scripts/update-article.ts <fix.json> --dry-run
```

This is also the tool for the overlap check's outcome B.

---

## Step 10: Capture feedback for next time, automatically

Step 8's review loop is exactly where the human corrects things this skill got
wrong: tone, redundancy with prior coverage, a field convention, a sourcing
judgment call. Left alone, those corrections vanish at the end of the session
and the next run makes the same mistake, the human re-explains it, and nothing
accumulates. **Close that loop every run, without being asked.**

1. After Step 9, look back over the revision requests from Step 8. Ask: is this
   a **durable, generalizable** lesson (would it help write the *next* article,
   on some other topic?) or is it specific to this one article (a fact, a word
   choice, a one-off structural call for this story)? Only the former is worth
   capturing. If there were no revision rounds, or every round was
   article-specific, skip silently.

2. **Fold it into the right file, not into `SKILL.md` by default.** The
   restructure exists so a lesson lands where it applies:
   - a voice, rhythm, opinion or language rule → `voice-and-style.md`
   - a length, product-architecture or render-contract rule → `format-tiers.md`
   - a device syntax, budget or when-to-use rule → `dynamic-element-library.md`
   - a dedupe judgment → `overlap-check.md`
   - a field, taxonomy or ranking rule → `fields-and-taxonomy.md`
   - an image sourcing or crop rule → `images.md`
   - a cross-referencing, wire-handling or `Fuentes:` sourcing lesson →
     `ingestion.md`
   - a gate, script or reporting lesson → this file

   **Those six shared files are symlinks — editing one changes both skills, which
   is the point.** A Playbook-wide voice rule no longer needs to be written into
   two documents and no longer drifts between them. Only edit a per-skill file
   when the lesson genuinely does not apply to the other funnel. **Read
   `references/_GOVERNANCE.md` before editing the shared tree** — it carries the
   placement rules, the no-duplication rule and the convergence check every
   change ships with.

3. Write it in the same dense-prose style as the rest of the document — explain
   the *why*, don't just add a bullet command — placed where it is most
   load-bearing, not appended at the end. **Date it and name the source of the
   directive**, the way every other entry does: these files get re-litigated,
   and an undated rule loses to a dated one.

   **`SKILL.md` is not one of the files a lesson can land in.** It is a router:
   a trigger, a decision flow, and pointers. If a lesson seems to have no home
   in the tree, it is a rule about an existing topic stated at the wrong
   altitude (`_GOVERNANCE.md` §2), not a reason to write prose here. This
   instruction is load-bearing: between 2026-08-18 and 2026-08-25 both
   `SKILL.md` files grew 6–8× because feedback was folded into them by default
   while this file was deleted, and the shared tree they stopped pointing at
   went unread for a week. If a step's `SKILL.md` row needs more than a
   sentence, the sentence belongs in the file it points at.

4. Run:
   ```
   scripts/sync-skill-feedback.sh "<one-line summary of the lesson>"
   ```
   to push straight to `main`. Do this **without asking for confirmation** — it
   only ever touches `.claude/skills/` and `.claude/playbook-editorial/`, never
   application code, so it doesn't carry the deploy risk a normal code change
   would. If it reports nothing to push (the edit matched what's already on
   main), that's fine, no need to mention it.

5. Mention in your final report, briefly, if you updated the skill. One
   sentence. This is about the skill quietly getting better every time it's
   used, not about making a production out of it.
