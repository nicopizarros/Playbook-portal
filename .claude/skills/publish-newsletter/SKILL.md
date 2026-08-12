---
name: publish-newsletter
description: Turn one or more Playbook Substack newsletter links into articles and publish them live to the Playbook site, with zero human review. Use when asked to process, draft, or publish a Substack link (Noticias, La Lana del Deporte, Infinitas) into Playbook.
---

# Publish Newsletter: Substack link to live article, no human in the loop

Playbook's automated editorial pipeline for its **own** Substack editions.
Given one or more Substack URLs, it fetches them, drafts each individual news
item as a full Playbook article, and inserts it into the production database as
`status: 'published'`. **It goes live immediately** — no draft step, no review,
nobody copy-pastes anything.

## When this runs

- A Playbook Substack link (Noticias, La Lana del Deporte, Infinitas, TFBR).
- A third-party link is the **other** skill: `publish-sourced-article`, which
  cross-references other outlets and pauses for human approval.
- "Draft this" without publishing intent means run steps 1–5 and show the
  drafts, then stop before publishing.

## Decision flow

| | Step | Read |
|---|---|---|
| **0** | **Overlap check — before drafting a word.** Every item, not every edition. Four outcomes; three of them mean no second article. | `references/overlap-check.md` |
| **1** | **Ingest.** Fetch each edition, split it into items, pull the date, the item order and every embedded image URL. | `references/ingestion.md` |
| **2** | **Research.** Mandatory outside fact per Noticias/Infinitas item, plus the regional angle. Not for La Lana. | `references/ingestion.md` |
| **3** | **Classify the format tier**, then apply the product's architecture. | `references/format-tiers.md` |
| **4** | **Apply the voice.** Movimiento + mecanismo + incentivo + consecuencia; find the palanca; one thing per paragraph. | `references/voice-and-style.md` |
| **5** | **Apply the element library.** Walk all fifteen devices, respect the budget. | `references/dynamic-element-library.md` |
| **6** | **Fill the fields and source the images.** | `references/fields-and-taxonomy.md`, `references/images.md` |
| **7** | **Self-check** against the ten-point publication checklist and run `check-voice.mjs`. | `references/voice-and-style.md` §12 |
| **8** | **Publish, report, capture feedback.** | `references/publishing-mechanics.md` |

Steps 3–5 are one pass, not three: the tier decides the length, the voice
decides the prose, the library decides the visual beats, and they are written
together.

**Do not ask for approval before step 8.** Publishing without a review gate is
the point of this flow. Do flag anything genuinely uncertain (a fact that
couldn't be confirmed, no findable cover photo) rather than guessing silently.

## Shared vs. own

`references/voice-and-style.md`, `format-tiers.md`,
`dynamic-element-library.md`, `overlap-check.md`, `fields-and-taxonomy.md` and
`images.md` are **symlinks into `.claude/playbook-editorial/`, shared with
`publish-sourced-article`**. One copy, both funnels — output from the two skills
should be indistinguishable once published. Edit them there and both skills
change; never fork a copy into this folder.

`references/ingestion.md` and `references/publishing-mechanics.md` are this
skill's own. `references/_GOVERNANCE.md` covers how to edit the shared tree; read it only when changing a rule, not when drafting.
