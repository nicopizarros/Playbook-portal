---
name: publish-partner-announcement
description: Turn an inbound partner/sponsor press kit (boletín .docx or .pdf, a Drive folder or loose logo and photo files, a target publish time) into Playbook drafts across channels — copy, taxonomy, an asset spec for the breaking-news graphic, and a channel plan. Never posts or schedules by itself. Use when a property or brand sends an announcement they want covered: a sponsorship, a licensing deal, a naming-rights or partner reveal.
---

# Publish partner announcement

The recurring inbound flow, not the outbound one. A property sends a press
kit the same day it wants coverage: a boletín, a folder of marks, a press
image, and a time. This skill turns that into **drafts a person approves**.

**It never posts and never schedules.** Every output is a draft. The
scheduling step emits a plan; a human confirms and publishes.

**Relaying a press release is not Playbook's product.** If there is no
commercial angle, say so and recommend a shorter format — that is a valid
and expected outcome, not a failure.

## Inputs it accepts

A press release (`.docx`, `.pdf`, or pasted text) · a Drive folder or asset
bundle URL · loose image files · the property/partner involved · a target
publish time. Missing inputs are recorded as missing, never invented.

## Steps, in order

| # | Step | Reference |
|---|---|---|
| 1 | Intake and extract — separate FACT from PR framing | `references/intake-extract.md` |
| 2 | Angle — what it means commercially, or recommend a shorter format | `references/angle.md` |
| 3 | Copy per channel, in the house voice | `references/voice-and-style.md` |
| 4 | Tagging, including the property tier and its boundary rule | `references/fields-and-taxonomy.md` |
| 5 | Assets — provenance log + graphic spec | `references/asset-spec.md` |
| 6 | Scheduling — emit the plan, never execute it | `references/channel-plan.md` |
| 7 | Portal crosswalk — hand off, do not duplicate | below |

## The rule that governs every step

> **No figure, term length, or exclusivity claim leaves this skill unless
> it appears in the supplied document.**

A press release is an interested party's account. Everything it asserts is
a CLAIM until corroborated. Label the two apart in every output — see
`references/intake-extract.md`'s confirmed/framing split. Playbook's voice
does not carry a partner's adjectives.

## Step 7 — Portal crosswalk

Decide whether the announcement also warrants a **portal article**:

- **Yes** when there is a real commercial mechanism a reader can act on —
  money, term, exclusivity, distribution, a market shift.
- **No** when it is a logo swap or a category partner with no disclosed
  terms. Social and newsletter can carry it; the portal does not have to.

If yes, **hand off to `publish-sourced-article`** — that skill owns
cross-referencing, cover-image sourcing and the human-approval gate. Do not
reimplement any of it here. A press release is a third-party source, so
that skill's mandatory cross-reference step (Step 2) is exactly what stops
Playbook republishing a partner's framing as reporting.

## Guardrails

- Third-party marks are used only within what the press kit grants. **Log
  the provenance of every asset touched** (`references/asset-spec.md`).
- The property's own promotional graphic is **not** a cover image. It is a
  designed ad for the deal. Same rule `publish-sourced-article` already
  carries for company press releases.
- Every output is a draft for human approval. No exceptions.

## Running without the local toolchain

Assume a coworker on a web session. `.docx` is a zip — read
`word/document.xml` and strip tags if no converter exists. Drive folders
may need the user to share the file; if you cannot read an asset, record it
as unread rather than guessing what it shows.
