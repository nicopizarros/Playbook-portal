---
name: hub-builder
description: Build a new Playbook coverage hub (/coberturas/<slug>) for an external property — a league, tournament or franchise Playbook does not own. Runs the full workflow: intake gate, taxonomy tag and boundary rule, two-pass identity design with a self-critique gate, module inventory, registration and QA. Use when asked to create a hub, a coverage destination, or a permanent section for a property (LFA, Mundial 2026, NFL México…).
---

# Hub builder

A **hub is not a fifth editorial product.** The four products (Noticias, La
Lana del Deporte, The Futbol Business Review, Infinitas) are FORMATS
Playbook authors — each owns a `source` column value and articles are born
into exactly one. A **hub is a coverage DESTINATION** organised around a
property we do not own. It has no `source`; it GATHERS by tag. One article
belongs to one product but can surface in several hubs, and a hub can exist
before a single article carries its tag.

Get that distinction wrong and everything downstream is wrong. See
`lib/hubs/types.ts` — the reasoning is encoded there.

**The whole system is config + assets.** A hub is one config file, one
token file, one asset folder. If a step here makes you want to write a new
component or a new route, STOP: the abstraction has failed and the fix is
to generalise `lib/hubs/` + `styles/hubs/hub.css`, never to hand-build the
hub. `scripts/scaffold-hub.ts` is the standing test of that claim.

## Run the steps in order. Do not skip the gates.

| # | Step | Reference |
|---|---|---|
| 1 | Intake gate — does this warrant a hub at all? | `references/intake.md` |
| 2 | Taxonomy: tag, boundary rule, backfill, register | `references/fields-and-taxonomy.md` §`tagsProperty` |
| 3 | Identity: two-pass design + self-critique gate | `references/identity-design.md` |
| 4 | Architecture: module inventory, reject what content can't support | `references/module-inventory.md` |
| 5 | Registration: routes, nav, sitemap, analytics | `references/registration.md` |
| 6 | QA: run the checklist yourself before reporting done | `references/qa-checklist.md` |

## Step 1 — Intake (gate)

Answer in the report before touching code. If any answer is weak, say so
and recommend a tag-only treatment instead of a hub — a destination page
with nothing behind it is worse than no page.

- What property, and what is its full commercial name? (Check for a title
  sponsor: the LFA trades as **LFA FINSUS**, and that naming-rights fact is
  itself Playbook-relevant.)
- Why does it warrant a PERMANENT destination rather than a tag?
- What is the commercial thesis in one sentence — the business reason a
  sports-business reader opens this page instead of a scores site?
- What is explicitly OUT of scope? Write the near misses down now; they
  become step 2's boundary table.

## Step 2 — Taxonomy

The tag lives in the **`property` tier** (`lib/taxonomy.ts`
`PROPERTY_OPTIONS`), not in `sport`. That tier already mixes sports with
leagues (`NFL`, `Liga MX`), so a league tag would have *looked* consistent
there — reject it anyway: a hub tag drives a ROUTE, must stay stable, and
its membership is a binary editorial judgment, not a description.

1. Add the value to `PROPERTY_OPTIONS` (the scaffold does this).
2. **Write the boundary rule** into
   `references/fields-and-taxonomy.md` — the SHARED file, never a
   skill-local copy (taxonomy-lock, see `references/_GOVERNANCE.md`). It
   must be a binary test plus a table of near misses that do NOT qualify.
   The publishing skills apply it unsupervised, so "use judgment" is not an
   acceptable rule.
3. Backfill: `npx tsx scripts/backfill-hub-tags.ts <slug>`. The sweep
   PROPOSES by string match; the boundary rule DECIDES. Apply only explicit
   ids. **Report both counts** — retagged and rejected-at-boundary. A sweep
   that rejects everything still did its job.
4. Report the resulting pool size **before** designing the coverage stream.
   If it is thin or zero, say the number plainly and design the empty state
   as an invitation. **Never pad a hub with loosely related articles.**

## Step 3 — Identity

Full method in `references/identity-design.md`. It is two passes with a
gate between them, and **you may not write hub CSS until pass two is
done.** Non-negotiable summary:

- Ground the identity in the property's own material and commercial world,
  not in stock sports-design vocabulary.
- **Do not clone the property's brand system.** Legal guardrail: the
  identity is Playbook's, adjacent to the property. No team crests, no
  copied palette, no badge or copy implying partnership. The property's
  mark is nominative reference only, in the one constrained lockup slot,
  and it must be a swappable asset with a text fallback that always renders.
- **Contained accent.** The reading surface stays the site's own `--paper`
  in both themes. The dark plane is capped at the signature module and one
  table header. A tint washing a section is the Infinitas mistake; a
  page-level near-black with one accent is an AI-design default. Both are
  banned.
- Spend the boldness in ONE place. Name the signature — the single element
  the hub is remembered by — and keep everything else disciplined.

## Step 4 — Architecture

`references/module-inventory.md`. Build, merge, or **reject** each module
with reasoning. Standings and box scores are not Playbook's product and
must never be the spine. **Reject any module the content cannot support**
rather than padding it — a season spine with one beat is not a timeline,
and the code already hides it below two.

## Step 5 — Registration

`references/registration.md`. Route, nav hub zone, sitemap, analytics.

## Step 6 — QA

`references/qa-checklist.md`. Run it yourself and report the results —
including failures — before saying the hub is done.

## Running without the local toolchain

Assume a coworker on a web session with no local setup. Everything here
works read-only from the committed repo:

- `POSTGRES_URL` from `.env.local` reaches Neon over **HTTPS**; the raw
  TCP pool (`lib/db/client.ts`) does not work in sandboxes. Both scripts
  this skill uses already use the HTTP driver.
- Graphify may be CLI-less; `python3 scripts/graph-query.py query "…"`
  reads the committed graph with no install and no network.
- If you cannot run the dev server, say the screenshots are missing rather
  than describing a page you did not see.
