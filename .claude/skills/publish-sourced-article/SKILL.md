---
name: publish-sourced-article
description: Turn a link from a third-party (non-Playbook) news source into a Playbook article, cross-referencing other outlets covering the same story for verification and enrichment, and pulling the cover photo from the referenced article when possible. Unlike publish-newsletter, this always pauses for explicit human approval in this Claude Code session before publishing. Use when asked to draft, process, or write up a link from an outlet other than Playbook's own Substack (ESPN, Reuters, a press release, any competitor or wire link).
---

# Publish Sourced Article: third-party link to Playbook article, with human approval

The human-reviewed counterpart to `publish-newsletter`. That skill handles
Playbook's own Substack editions — trusted first-party content, zero review,
straight to `status: 'published'`. This one handles links to **someone else's**
article, an outlet Playbook doesn't own or control, so it **never publishes
without an explicit yes** from the human in this session.

## When this runs

- Any link from an outlet that isn't Playbook's Substack: ESPN, Reuters, a
  press release, a competitor, a wire.
- A Playbook Substack link is the **other** skill: `publish-newsletter`.
- An inbound partner or sponsor press kit is a third skill:
  `publish-partner-announcement`.
- One link becomes one article. Several unrelated links in one run means
  several separate articles.

## What differs from `publish-newsletter`

Same field shape, same taxonomy, same voice, same production database and
insert script. Four differences, all of them here:

1. **Cross-referencing is mandatory** — at least one or two other outlets on
   the same story, different domains from the primary link.
2. **Every article ends with a `Fuentes:` line** crediting primary sources.
3. **Cover image starts with the referenced article itself**, and **no in-body
   images** are carried over.
4. **A human approval gate** before anything reaches the database.

## Decision flow

| | Step | Read |
|---|---|---|
| **0** | **Overlap check — before drafting a word.** This funnel is the one most likely to arrive at a story Playbook already published. | `references/overlap-check.md` |
| **1** | **Ingest.** Fetch the link, confirm date and core facts from the page. When it won't load, work the ladder — including asking the human for the article text — rather than improvising. | `references/ingestion.md` |
| **2** | **Cross-reference (mandatory).** Verify, enrich, stay independent. **Read each primary co-issuer's own release before drafting** — it carries the governance terms wire copy cuts, and it produces the `Fuentes:` line as a by-product. Research the regional angle here too. | `references/ingestion.md` |
| **2b** | **Sensitivity check.** If the story touches an ally, prospect, source or strategic relationship: relevance × sensitivity, the two tests, protocolo amarillo. Surface the call in the draft presentation. | `references/postura-editorial.md` |
| **3** | **Route the format — A / B / C / D — before drafting a word**, then apply that format's architecture. Depth decides the format; graphics are a consequence. A story carrying mechanism + money + precedent is a Deep Dive, not a long brief. | `references/format-tiers.md` §1 |
| **4** | **Apply the voice.** Movimiento + mecanismo + incentivo + consecuencia; find the palanca; one thing per paragraph; one clause in the headline. | `references/voice-and-style.md` |
| **5** | **Apply the element library.** Walk every device, respect the budget, check each declaration rendered. | `references/dynamic-element-library.md` |
| **6** | **Fill the fields and source the image.** Set the **0–99 `boleta`** on every article — omitting it silently ranks the piece on the retired star scale. `tagsProperty` decides whether the piece lands on a hub; read its boundary rule before setting it. | `references/fields-and-taxonomy.md` → "Ranking", `references/images.md` |
| **7** | **Self-check** against the twelve-point publication checklist and run `check-voice.mjs`. | `references/voice-and-style.md` §12 |
| **8** | **Human review — the gate.** Present the complete draft, ask, revise, repeat. | `references/publishing-mechanics.md` |
| **9** | **Publish only what was approved. Report, capture feedback.** | `references/publishing-mechanics.md` |

Steps 3–5 are one pass, not three: the tier decides the length, the voice
decides the prose, the library decides the visual beats, and they are written
together.

**Never publish without an explicit yes in this session.** No exceptions, no
"seems fine, publishing."

## Shared vs. own

`references/voice-and-style.md`, `format-tiers.md`,
`dynamic-element-library.md`, `overlap-check.md`, `fields-and-taxonomy.md`,
`images.md` and `postura-editorial.md` are **symlinks into
`.claude/playbook-editorial/`, shared with `publish-newsletter` and
`publish-partner-announcement`**. One copy, every funnel — output from the
skills should be indistinguishable once published, aside from whatever
ingestion path produced it. Edit them there and every skill changes; never fork
a copy into this folder.

`references/ingestion.md` and `references/publishing-mechanics.md` are this
skill's own. `references/_GOVERNANCE.md` covers how to edit the shared tree;
read it only when changing a rule, not when drafting.

**This file is a router, not a rulebook.** Everything it points at is the rule;
nothing here restates one. A lesson from a run goes into the file that owns the
topic (`references/publishing-mechanics.md`, "Capture feedback"), never into
this file — that default is what turned this router into a 520-line monolith
between 2026-08-18 and 2026-08-25, with the shared tree resolving on disk and
named by nothing.
