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
